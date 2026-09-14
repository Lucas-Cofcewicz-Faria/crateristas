import { randomBytes } from 'node:crypto';
import { getDb } from '@/lib/db';
import { createInviteToken, hashEnrollmentToken, verifyInviteToken } from './invite-token';

export const ENROLLMENT_COOKIE = 'crateristas-enrollment';
export const ENROLLMENT_MAX_AGE = 7 * 24 * 60 * 60;

function inviteSecret(): string {
  return process.env.NEON_AUTH_COOKIE_SECRET ?? '';
}

export async function readSharedInvite(): Promise<{ active: boolean; token: string | null }> {
  const [row] = await getDb().query('SELECT version, active FROM membership_invite WHERE singleton = TRUE');
  if (!row?.active) return { active: false, token: null };
  return { active: true, token: createInviteToken(String(row.version), inviteSecret()) };
}

export async function validateSharedInvite(token: string): Promise<string | null> {
  if (!/^[a-f0-9-]{36}\.[A-Za-z0-9_-]{43}$/.test(token)) return null;
  const [row] = await getDb().query('SELECT version, active FROM membership_invite WHERE singleton = TRUE');
  if (!row?.active) return null;
  const version = String(row.version);
  return verifyInviteToken(token, version, inviteSecret()) ? version : null;
}

export async function changeSharedInvite(actorId: string, command: 'replace' | 'disable'): Promise<void> {
  // Authorization also guards this primitive, not only its Server Action caller.
  const rows = await getDb().query(`UPDATE membership_invite
    SET version = gen_random_uuid(), active = $2, updated_by = $1, updated_at = NOW()
    WHERE singleton = TRUE AND EXISTS (SELECT 1 FROM members WHERE id = $1 AND role = 'admin' AND removed_at IS NULL)
    RETURNING singleton`, [actorId, command === 'replace']);
  if (!rows.length) throw new Error('Apenas o administrador pode gerenciar convites.');
}

export async function beginEnrollment(token: string, email: string, name: string): Promise<string> {
  const version = await validateSharedInvite(token);
  if (!version) throw new Error('Convite desativado ou substituído. Peça o link atual ao administrador.');
  const receipt = randomBytes(32).toString('base64url');
  // Lock singleton across the transaction. Limits are shared across server instances,
  // and rotation/revocation cannot race the grant creation.
  const sql = getDb();
  const [, rows] = await sql.transaction((tx) => [
    tx.query('SELECT singleton FROM membership_invite WHERE singleton = TRUE FOR UPDATE'),
    tx.query(`INSERT INTO membership_enrollments (token_hash, email, display_name, invite_version)
      SELECT $1, $2, $3, i.version FROM membership_invite i
      WHERE i.active AND i.version = $4
        AND NOT EXISTS (SELECT 1 FROM members WHERE lower(email) = $2)
        AND (SELECT COUNT(*) FROM membership_enrollments WHERE created_at > NOW() - INTERVAL '1 hour') < 50
      ON CONFLICT (email) DO UPDATE SET token_hash = EXCLUDED.token_hash,
        display_name = EXCLUDED.display_name, invite_version = EXCLUDED.invite_version,
        created_at = NOW(), consumed_by = NULL, consumed_at = NULL
      WHERE membership_enrollments.created_at < NOW() - INTERVAL '1 minute'
      RETURNING token_hash`, [hashEnrollmentToken(receipt), email, name, version]),
  ]);
  if (!rows.length) throw new Error('Não foi possível iniciar o cadastro. Se já tem conta, entre; caso contrário, aguarde um minuto e tente novamente.');
  return receipt;
}

export async function isInvitedEmail(email: string): Promise<boolean> {
  const rows = await getDb().query(`SELECT 1 FROM membership_enrollments e
    JOIN membership_invite i ON i.version = e.invite_version AND i.active
    WHERE e.email = $1 AND e.consumed_at IS NULL
      AND NOT EXISTS (SELECT 1 FROM members m WHERE lower(m.email) = $1 AND m.removed_at IS NOT NULL)
      AND e.created_at > NOW() - INTERVAL '5 minutes'`, [email]);
  return rows.length > 0;
}

export async function finishEnrollment(receipt: string, user: { id: string; email: string }): Promise<boolean> {
  if (!/^[A-Za-z0-9_-]{43}$/.test(receipt)) return false;
  const sql = getDb();
  const [, rows] = await sql.transaction((tx) => [
    tx.query('SELECT singleton FROM membership_invite WHERE singleton = TRUE FOR UPDATE'),
    tx.query(`WITH authorized_enrollment AS MATERIALIZED (
      SELECT e.* FROM membership_enrollments e JOIN membership_invite i
        ON i.version = e.invite_version AND i.active
      WHERE e.token_hash = $1 AND e.email = $2
        AND e.created_at > NOW() - INTERVAL '7 days'
        AND (e.consumed_by IS NULL OR e.consumed_by = $3)
        AND NOT EXISTS (SELECT 1 FROM members m
          WHERE (m.auth_user_id = $3 OR lower(m.email) = $2) AND m.removed_at IS NOT NULL)
      FOR UPDATE OF e
    ), enrolled AS (
      INSERT INTO members (auth_user_id, email, slug, display_name, role)
      SELECT $3, g.email, 'craterista-' || gen_random_uuid()::text, g.display_name, 'member' FROM authorized_enrollment g
      ON CONFLICT (auth_user_id) DO NOTHING
      RETURNING auth_user_id
    ), consumed AS (
      UPDATE membership_enrollments SET consumed_by = $3, consumed_at = NOW()
      WHERE token_hash IN (SELECT token_hash FROM authorized_enrollment)
        AND (EXISTS (SELECT 1 FROM enrolled) OR EXISTS (SELECT 1 FROM members WHERE auth_user_id = $3 AND lower(email) = $2 AND removed_at IS NULL))
      RETURNING token_hash
    ) SELECT token_hash FROM consumed`, [hashEnrollmentToken(receipt), user.email.trim().toLowerCase(), user.id]),
  ]);
  return rows.length > 0;
}
