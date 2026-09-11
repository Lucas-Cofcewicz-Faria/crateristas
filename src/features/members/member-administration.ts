import 'server-only';
import { getDb } from '@/lib/db';
import type { ManagedMember } from './member-management-state';

/** Private projection; authorization is enforced here as well as by the page. */
export async function listManagedMembers(actorId: string): Promise<ManagedMember[]> {
  const rows = await getDb().query(`SELECT m.id, m.display_name, m.avatar_url, m.role,
      m.removed_at, COUNT(s.id)::int AS scorecard_count
    FROM members m LEFT JOIN scorecards s ON s.member_id = m.id
    WHERE EXISTS (SELECT 1 FROM members actor
      WHERE actor.id = $1 AND actor.role = 'admin' AND actor.removed_at IS NULL)
    GROUP BY m.id ORDER BY m.removed_at NULLS FIRST, m.member_number`, [actorId]);
  return rows.map((row) => ({
    id: String(row.id), displayName: String(row.display_name),
    avatarUrl: row.avatar_url ? String(row.avatar_url) : null,
    role: row.role === 'admin' ? 'admin' : 'member',
    removedAt: row.removed_at ? String(row.removed_at) : null,
    scorecardCount: Number(row.scorecard_count),
  }));
}

export async function removeMember(actorId: string, memberId: string): Promise<boolean> {
  const sql = getDb();
  const [, rows] = await sql.transaction((tx) => [
    // Serialize with enrollment completion: an old receipt cannot race removal.
    tx.query('SELECT singleton FROM membership_invite WHERE singleton = TRUE FOR UPDATE'),
    tx.query(`UPDATE members target SET removed_at = NOW(), removed_by = $1
      WHERE target.id = $2 AND target.id <> $1
        AND target.role = 'member' AND target.removed_at IS NULL
        AND EXISTS (SELECT 1 FROM members actor
          WHERE actor.id = $1 AND actor.role = 'admin' AND actor.removed_at IS NULL)
      RETURNING target.id`, [actorId, memberId]),
  ]);
  return rows.length > 0;
}
