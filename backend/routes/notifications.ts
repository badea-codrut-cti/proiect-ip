import express, { Response } from "express";
import { authService, sessionMiddleware, AuthRequest } from "../middleware/auth.js";

const router = express.Router();

router.get("/", sessionMiddleware, async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  try {
    const result = await authService.getPool().query(
      `SELECT id, message, type, exercise_id, counter_edit_id, announcement_id, is_read, created_at
       FROM notifications
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 5`,
      [req.user.id]
    );
    
    return res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return res.status(500).json({ error: "Failed to fetch notifications" });
  }
});

router.post("/mark-read", sessionMiddleware, async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  try {
    await authService.getPool().query(
      `UPDATE notifications
       SET is_read = TRUE
       WHERE user_id = $1 AND is_read = FALSE`,
      [req.user.id]
    );
    
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error marking notifications as read:", error);
    return res.status(500).json({ error: "Failed to mark notifications as read" });
  }
});

export default router;
