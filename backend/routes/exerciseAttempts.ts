import express from "express";
import { sessionMiddleware, AuthRequest } from "../middleware/auth.js";
import { authService } from "../middleware/auth.js";
import { calculateXp } from "../services/xp.js";
import { giveBadge } from "../services/badges.js";

const router = express.Router();

router.post("/submit", sessionMiddleware, async (req: AuthRequest, res) => {
  if (!req.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const { exerciseId, isCorrect, attempts, timeSeconds } = req.body;

  if (!exerciseId) {
    return res.status(400).json({ error: "exerciseId required" });
  }

  const pool = authService.getPool();
  const xp = calculateXp(isCorrect, attempts, timeSeconds);

  try {
    await pool.query("BEGIN");

    await pool.query(
      `INSERT INTO exercise_attempts
       (user_id, exercise_id, is_correct, attempts, time_seconds, xp_gained)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [req.user.id, exerciseId, isCorrect, attempts, timeSeconds, xp]
    );

    if (xp > 0) {
      await pool.query(
        "UPDATE users SET xp = xp + $1 WHERE id = $2",
        [xp, req.user.id]
      );
    }

    if (isCorrect) {
      await giveBadge(pool, req.user.id, "FIRST_CORRECT");

      const countRes = await pool.query(
        "SELECT COUNT(*) FROM exercise_attempts WHERE user_id = $1",
        [req.user.id]
      );

      if (Number(countRes.rows[0].count) === 1) {
        await giveBadge(pool, req.user.id, "FIRST_EXERCISE");
      }
    }

    await pool.query("COMMIT");

    res.json({
      success: true,
      xpGained: xp
    });
  } catch (err) {
    await pool.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ error: "Failed to submit exercise" });
  }
});

export default router;
