import express from "express";
import { z } from "zod";
import { authService, sessionMiddleware, adminMiddleware } from "../middleware/auth.js";

const router = express.Router();

const exerciseSchema = z.object({
  counter_id: z.string().min(1),
  sentence: z.string().min(1).max(5000).refine((sentence) => sentence.includes('<ans>'), {
    message: "Exercise sentence must contain at least one '<ans>' placeholder for the answer"
  }),
  min_count: z.number().min(0).default(1),
  max_count: z.number().min(0).default(10),
  decimal_points: z.number().int().min(0).default(0),
}).refine((data) => data.min_count <= data.max_count, {
  message: "min_count must be less than or equal to max_count",
  path: ["min_count"]
});

router.get("/pending", sessionMiddleware, adminMiddleware, async (req, res) => {
  try {
    const result = await authService.getPool().query(
      `SELECT e.*, u.username as created_by_username, c.name as counter_name
       FROM exercises e
       JOIN users u ON e.created_by = u.id
       JOIN counters c ON e.counter_id = c.id
       WHERE e.status = 'pending'
       ORDER BY e.created_at DESC`
    );
    
    return res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching pending exercises:", error);
    return res.status(500).json({ error: "Failed to fetch pending exercises" });
  }
});

router.post("/", sessionMiddleware, async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const validationResult = exerciseSchema.safeParse(req.body);
  if (!validationResult.success) {
    return res.status(400).json({ error: validationResult.error.errors[0].message });
  }

  const { counter_id, sentence, min_count, max_count, decimal_points } = validationResult.data;
  const userId = req.user.user_id;

  try {
    const userResult = await authService.getPool().query(
      'SELECT is_contributor FROM users WHERE id = $1',
      [userId]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    
    if (!userResult.rows[0].is_contributor) {
      return res.status(403).json({ error: "Contributor access required" });
    }

    const counterResult = await authService.getPool().query(
      'SELECT id FROM counters WHERE id = $1',
      [counter_id]
    );
    
    if (counterResult.rows.length === 0) {
      return res.status(404).json({ error: "Counter not found" });
    }

    const result = await authService.getPool().query(
      `INSERT INTO exercises 
       (id, created_by, counter_id, sentence, min_count, max_count, decimal_points) 
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6) 
       RETURNING id, created_by, counter_id, sentence, min_count, max_count, decimal_points, status, created_at`,
      [userId, counter_id, sentence, min_count, max_count, decimal_points]
    );

    return res.status(201).json({
      success: true,
      exercise: result.rows[0]
    });
  } catch (error) {
    console.error("Error proposing exercise:", error);
    return res.status(500).json({ error: "Failed to propose exercise" });
  }
});

router.post("/:id/approve", sessionMiddleware, adminMiddleware, async (req, res) => {
  const exerciseId = req.params.id;
  const adminId = req.user.user_id;

  try {
    await authService.getPool().query('BEGIN');

    const exerciseResult = await authService.getPool().query(
      `SELECT e.*, u.email as created_by_email, u.username as created_by_username
       FROM exercises e
       JOIN users u ON e.created_by = u.id
       WHERE e.id = $1 AND e.status = 'pending'
       FOR UPDATE`,
      [exerciseId]
    );
    
    if (exerciseResult.rows.length === 0) {
      await authService.getPool().query('ROLLBACK');
      return res.status(404).json({ error: "Exercise not found or not pending" });
    }

    const exercise = exerciseResult.rows[0];

    await authService.getPool().query(
      `UPDATE exercises 
       SET status = 'approved', approved_by = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [adminId, exerciseId]
    );

    await authService.getPool().query('COMMIT');

    return res.status(200).json({
      success: true,
      message: "Exercise approved successfully"
    });
  } catch (error) {
    await authService.getPool().query('ROLLBACK').catch(() => {});
    console.error("Error approving exercise:", error);
    return res.status(500).json({ error: "Failed to approve exercise" });
  }
});

router.post("/:id/reject", sessionMiddleware, adminMiddleware, async (req, res) => {
  const exerciseId = req.params.id;
  const adminId = req.user.user_id;
  const { reason } = req.body;

  try {
    await authService.getPool().query('BEGIN');

    const exerciseResult = await authService.getPool().query(
      `SELECT e.*, u.email as created_by_email, u.username as created_by_username
       FROM exercises e
       JOIN users u ON e.created_by = u.id
       WHERE e.id = $1 AND e.status = 'pending'
       FOR UPDATE`,
      [exerciseId]
    );
    
    if (exerciseResult.rows.length === 0) {
      await authService.getPool().query('ROLLBACK');
      return res.status(404).json({ error: "Exercise not found or not pending" });
    }

    const exercise = exerciseResult.rows[0];

    await authService.getPool().query(
      `UPDATE exercises 
       SET status = 'rejected', approved_by = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [adminId, exerciseId]
    );

    await authService.getPool().query('COMMIT');

    return res.status(200).json({
      success: true,
      message: "Exercise rejected successfully"
    });
  } catch (error) {
    await authService.getPool().query('ROLLBACK').catch(() => {});
    console.error("Error rejecting exercise:", error);
    return res.status(500).json({ error: "Failed to reject exercise" });
  }
});

export default router;