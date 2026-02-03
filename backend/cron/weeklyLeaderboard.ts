import { authService } from '../middleware/auth.js';
import { getCurrentWeekStart } from '../services/leaderboard.js';
import { giveBadge } from '../services/badges.js';

export default {
    name: 'Weekly Leaderboard Finalizer',
    schedule: '0 0 * * 1',
    handler: async () => {
        const pool = authService.getPool();

        const lastWeekStart = getCurrentWeekStart();
        lastWeekStart.setDate(lastWeekStart.getDate() - 7);

        console.log(`[CRON] Awarding badges for week starting: ${lastWeekStart.toISOString()}`);

        try {
            const topUsersResult = await pool.query(
                `SELECT user_id 
         FROM weekly_leaderboard 
         WHERE week_start = $1 
         ORDER BY points DESC 
         LIMIT 10`,
                [lastWeekStart]
            );

            for (let i = 0; i < topUsersResult.rows.length; i++) {
                const row = topUsersResult.rows[i];
                await giveBadge(pool, row.user_id, 'WEEKLY_TOP_10');

                // Award gems for top 3
                let gemReward = 0;
                if (i === 0) gemReward = 500;      // 1st place
                else if (i === 1) gemReward = 200; // 2nd place
                else if (i === 2) gemReward = 100; // 3rd place

                if (gemReward > 0) {
                    await pool.query(
                        `UPDATE users SET gems = gems + $1 WHERE id = $2`,
                        [gemReward, row.user_id]
                    );
                    console.log(`[CRON] Awarded ${gemReward} gems to user ${row.user_id} for rank ${i + 1}`);
                }
            }

            console.log(`[CRON] Successfully finalized leaderboard for ${topUsersResult.rowCount} users.`);
        } catch (error) {
            console.error('[CRON] Failed to finalize weekly leaderboard:', error);
        }
    }
};
