import express from "express";
import { authService } from "../middleware/auth.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const result = await authService.getPool().query(
      'SELECT id, name, documentation FROM counters ORDER BY name ASC');

    return res.status(200).json({
      counters: result.rows,
    });
  } catch (err) {
    console.error("Error fetching counters list:", err);
    return res.status(500).json({ error: "Failed to fetch counters" });
  }
});

router.get("/:id", async (req, res) => {
  const counterId = req.params.id;

  try {
    const counterResult = await authService.getPool().query(
      'SELECT id, name, documentation FROM counters WHERE id = $1',
      [counterId]
    );

    if (counterResult.rows.length === 0) {
      return res.status(404).json({ error: "Counter not found" });
    }

    const counter = counterResult.rows[0];

    const pendingEditResult = await authService.getPool().query(
      "SELECT EXISTS(SELECT 1 FROM counter_edits WHERE counter_id = $1 AND status = 'pending') as has_pending_edit",
      [counterId]
    );

    const hasPendingEdit = pendingEditResult.rows[0].has_pending_edit;

    const exercisesResult = await authService.getPool().query(
      `SELECT id, sentence, min_count, max_count, decimal_points 
       FROM exercises 
       WHERE counter_id = $1 AND status = 'approved'
       ORDER BY RANDOM() 
       LIMIT 5`,
      [counterId]
    );

    const exercises = exercisesResult.rows;

    return res.status(200).json({
      counter,
      hasPendingEdit,
      exercises
    });
  } catch (error) {
    console.error("Error fetching counter info:", error);
    return res.status(500).json({ error: "Failed to fetch counter info" });
  }
});

export default router;