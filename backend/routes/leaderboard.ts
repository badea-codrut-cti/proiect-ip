import express, { Response } from "express";
import { sessionMiddleware, AuthRequest } from "../middleware/auth.js";
import { authService } from "../middleware/auth.js";
import { getCurrentWeekStart } from "../services/leaderboard.js";

const router = express.Router();

router.get("/weekly", sessionMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const pool = authService.getPool();
    const weekStart = getCurrentWeekStart();

    // Get top 20 users
    const topUsersResult = await pool.query(
      `SELECT u.id, u.username, u.display_name, wl.points,
              pp.name as profile_picture_name,
              RANK() OVER (ORDER BY wl.points DESC) as rank
       FROM weekly_leaderboard wl
       JOIN users u ON wl.user_id = u.id
       LEFT JOIN profile_pictures pp ON u.current_profile_picture_id = pp.id
       WHERE wl.week_start = $1
       ORDER BY wl.points DESC
       LIMIT 20`,
      [weekStart]
    );

    // Get current user's rank and points
    let userRank = null;
    if (req.user) {
      const userRankResult = await pool.query(
        `WITH ranked_leaderboard AS (
           SELECT user_id, points,
                  RANK() OVER (ORDER BY points DESC) as rank
           FROM weekly_leaderboard
           WHERE week_start = $1
         )
         SELECT rank, points
         FROM ranked_leaderboard
         WHERE user_id = $2`,
        [weekStart, req.user.id]
      );

      if (userRankResult.rows.length > 0) {
        userRank = {
          rank: parseInt(userRankResult.rows[0].rank),
          points: userRankResult.rows[0].points
        };
      } else {
        userRank = {
          rank: null,
          points: 0
        };
      }
    }

    return res.status(200).json({
      week_start: weekStart,
      top_users: topUsersResult.rows.map(row => ({
        ...row,
        rank: parseInt(row.rank)
      })),
      user_rank: userRank
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;
