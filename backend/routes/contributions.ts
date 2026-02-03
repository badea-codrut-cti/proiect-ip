import express, { Response } from "express";
import { authService, sessionMiddleware, AuthRequest } from "../middleware/auth.js";

const router = express.Router();

router.get("/", sessionMiddleware, async (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: "Not authenticated" });

  const userId = req.user.id;
  const pool = authService.getPool();

  try {
    const exercisesQuery = `
      SELECT
        e.id,
        e.counter_id,
        c.name AS counter_name,
        e.sentence,
        e.min_count,
        e.max_count,
        e.decimal_points,
        e.status,
        e.created_at,
        e.updated_at,
        e.reviewed_at,
        e.rejection_reason,
        e.approved_by
      FROM exercises e
      JOIN counters c ON c.id = e.counter_id
      WHERE e.created_by = $1
      ORDER BY e.created_at DESC, e.id DESC
    `;

    const editsQuery = `
      SELECT
        ce.id,
        ce.counter_id,
        c.name AS counter_name,
        c.documentation AS current_content,
        ce.content,
        ce.status,
        ce.created_at,
        ce.updated_at,
        ce.reviewed_at,
        ce.rejection_reason,
        ce.approved_by
      FROM counter_edits ce
      JOIN counters c ON c.id = ce.counter_id
      WHERE ce.created_by = $1
      ORDER BY ce.created_at DESC, ce.id DESC
    `;

    const [exercises, counterEdits] = await Promise.all([
      pool.query(exercisesQuery, [userId]),
      pool.query(editsQuery, [userId]),
    ]);

    return res.status(200).json({
      exercises: exercises.rows ?? [],
      counter_edits: counterEdits.rows ?? [],
    });
  } catch (err) {
    console.error("Error /api/contributions:", err);
    return res.status(500).json({ error: "Failed to fetch contributions" });
  }
});

export default router;
