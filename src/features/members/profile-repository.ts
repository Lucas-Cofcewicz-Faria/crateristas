import 'server-only';
import { getDb } from '@/lib/db';

/** The actor comes from the session, never from the submitted form. */
export async function updateOwnProfile(actorId: string, bio: string, changePhoto: boolean, avatarUrl: string | null) {
  const rows = await getDb().query(`WITH previous AS MATERIALIZED (
      SELECT id, avatar_url FROM members WHERE id = $1 AND removed_at IS NULL FOR UPDATE
    )
    UPDATE members m SET bio = $2,
      avatar_url = CASE WHEN $3::boolean THEN $4::text ELSE m.avatar_url END
    FROM previous WHERE m.id = previous.id
    RETURNING m.slug, m.avatar_url, previous.avatar_url AS old_avatar_url`, [actorId, bio, changePhoto, avatarUrl]);
  return rows[0] ? {
    avatarUrl: rows[0].avatar_url ? String(rows[0].avatar_url) : null,
    oldAvatarUrl: rows[0].old_avatar_url ? String(rows[0].old_avatar_url) : null,
  } : null;
}

export async function updateMemberTitle(actorId: string, memberId: string, title: string | null): Promise<boolean> {
  const rows = await getDb().query(`UPDATE members target SET society_title = $3
    WHERE target.id = $2 AND target.removed_at IS NULL
      AND EXISTS (SELECT 1 FROM members actor
        WHERE actor.id = $1 AND actor.role = 'admin' AND actor.removed_at IS NULL)
    RETURNING target.slug`, [actorId, memberId, title]);
  return rows.length > 0;
}
