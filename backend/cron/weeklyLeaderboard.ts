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

            for (const row of topUsersResult.rows) {
                await giveBadge(pool, row.user_id, 'WEEKLY_TOP_10');
            }

            console.log(`[CRON] Successfully awarded WEEKLY_TOP_10 badges to ${topUsersResult.rowCount} users.`);
        } catch (error) {
            console.error('[CRON] Failed to finalize weekly leaderboard:', error);
        }
    }
};
