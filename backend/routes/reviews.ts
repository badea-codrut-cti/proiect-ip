import express, { Response } from "express";
import { sessionMiddleware, AuthRequest } from "../middleware/auth.js";
import { authService } from "../middleware/auth.js";

const router = express.Router();

router.get("/me", sessionMiddleware, async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  try {
    const pool = authService.getPool();
    
    const reviewsResult = await pool.query(
      `SELECT r.id, r.counter_id, c.name as counter_name, r.rating, r.state, 
              r.reviewed_at, r.completed_at, r.generated_number, r.submitted_answer
       FROM reviews r
       JOIN counters c ON r.counter_id = c.id
       WHERE r.user_id = $1 AND r.completed_at IS NOT NULL
       ORDER BY r.completed_at DESC`,
      [req.user.id]
    );

    return res.status(200).json({
      reviews: reviewsResult.rows
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;
