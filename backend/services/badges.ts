import { Pool } from 'pg';
import { Rating } from 'ts-fsrs';

export async function giveBadge(
  pool: Pool,
  userId: string,
  badgeCode: string
) {
  const badge = await pool.query(
    'SELECT id, name FROM badges WHERE code = $1',
    [badgeCode]
  );

  if (badge.rowCount === 0) return;

  const badgeId = badge.rows[0].id;
  const badgeName = badge.rows[0].name;

  const result = await pool.query(
    `INSERT INTO user_badges (user_id, badge_id)
     VALUES ($1, $2)
     ON CONFLICT DO NOTHING
     RETURNING earned_at`,
    [userId, badgeId]
  );

  if (result.rowCount && result.rowCount > 0) {
    await pool.query(
      `INSERT INTO notifications (user_id, message, type, badge_id)
       VALUES ($1, $2, 'badge_earned', $3)`,
      [userId, `Congratulations! You've earned the ${badgeName} badge!`, badgeId]
    );
  }
}

export async function checkBadgesOnReview(
  pool: Pool,
  userId: string,
  rating: number,
  isCorrect: boolean
) {
  if (!isCorrect) return;

  const statsQuery = await pool.query(
    `SELECT 
       COUNT(*) as total_reviews,
       COUNT(DISTINCT counter_id) as distinct_counters
     FROM reviews 
     WHERE user_id = $1 AND rating >= ${Rating.Hard} 
    `,
    [userId]
  );

  const { total_reviews, distinct_counters } = statsQuery.rows[0];
  const total = Number(total_reviews);
  const distinct = Number(distinct_counters);

  if (total >= 1) {
    await giveBadge(pool, userId, 'FIRST_BLOOD');
  }

  if (total >= 100) {
    await giveBadge(pool, userId, 'CENTURION');
  }

  if (distinct >= 5) {
    await giveBadge(pool, userId, 'COUNTER_COLLECTOR');
  }

  if (rating === Rating.Easy) {
    const historyQuery = await pool.query(
      `SELECT rating 
       FROM reviews 
       WHERE user_id = $1 
       ORDER BY completed_at DESC 
       LIMIT 10`,
      [userId]
    );

    if (historyQuery.rows.length === 10) {
      const allEasy = historyQuery.rows.every(row => row.rating === Rating.Easy);
      if (allEasy) {
        await giveBadge(pool, userId, 'ACCURACY_MASTER');
      }
    }
  }
}
