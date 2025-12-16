import { Pool } from "pg";

export async function giveBadge(
  pool: Pool,
  userId: string,
  badgeCode: string
) {
  const badge = await pool.query(
    "SELECT id FROM badges WHERE code = $1",
    [badgeCode]
  );

  if (badge.rowCount === 0) return;

  await pool.query(
    `INSERT INTO user_badges (user_id, badge_id)
     VALUES ($1, $2)
     ON CONFLICT DO NOTHING`,
    [userId, badge.rows[0].id]
  );
}
