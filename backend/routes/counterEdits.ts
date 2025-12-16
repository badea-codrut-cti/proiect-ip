import express, { Response } from "express";
import { z } from "zod";
import { authService, sessionMiddleware, adminMiddleware, AuthRequest } from "../middleware/auth.js";

const router = express.Router();

const counterEditSchema = z.object({
  counter_id: z.string().min(1),
  content: z.string().min(1).max(10000),
}).refine((data) => data.content.trim().length > 0, {
  message: "Content cannot be empty or only whitespace"
});

router.get("/pending", sessionMiddleware, adminMiddleware, async (req, res) => {
  try {
    const result = await authService.getPool().query(
      `SELECT ce.*, u.username as created_by_username, c.name as counter_name
       FROM counter_edits ce
       JOIN users u ON ce.created_by = u.id
       JOIN counters c ON ce.counter_id = c.id
       WHERE ce.status = 'pending'
       ORDER BY ce.created_at DESC`
    );
    
    return res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching pending counter edits:", error);
    return res.status(500).json({ error: "Failed to fetch pending counter edits" });
  }
});

router.post("/", sessionMiddleware, async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const validationResult = counterEditSchema.safeParse(req.body);
  if (!validationResult.success) {
    return res.status(400).json({ error: validationResult.error.issues[0].message });
  }

  const { counter_id, content } = validationResult.data;
  const userId = req.user.id;

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

    const pendingEditResult = await authService.getPool().query(
      'SELECT id FROM counter_edits WHERE counter_id = $1 AND status = $2',
      [counter_id, 'pending']
    );
    
    if (pendingEditResult.rows.length > 0) {
      return res.status(409).json({ error: "There is already a pending edit for this counter" });
    }

    const result = await authService.getPool().query(
      `INSERT INTO counter_edits 
       (id, created_by, counter_id, content, status, created_at, updated_at) 
       VALUES (gen_random_uuid(), $1, $2, $3, 'pending', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) 
       RETURNING id, created_by, counter_id, content, status, created_at, updated_at`,
      [userId, counter_id, content]
    );

    return res.status(201).json({
      success: true,
      counterEdit: result.rows[0]
    });
  } catch (error) {
    console.error("Error proposing counter edit:", error);
    return res.status(500).json({ error: "Failed to propose counter edit" });
  }
});

router.post("/:id/approve", sessionMiddleware, adminMiddleware, async (req: AuthRequest, res: Response) => {
  const editId = req.params.id;
  const adminId = req.user.id;

  try {
    await authService.getPool().query('BEGIN');

    const editResult = await authService.getPool().query(
      `SELECT ce.*, u.email as created_by_email, u.username as created_by_username
       FROM counter_edits ce
       JOIN users u ON ce.created_by = u.id
       WHERE ce.id = $1 AND ce.status = 'pending'
       FOR UPDATE`,
      [editId]
    );
    
    if (editResult.rows.length === 0) {
      await authService.getPool().query('ROLLBACK');
      return res.status(404).json({ error: "Counter edit not found or not pending" });
    }

    const edit = editResult.rows[0];

    await authService.getPool().query(
      `UPDATE counter_edits 
       SET status = 'approved', approved_by = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [adminId, editId]
    );

    await authService.getPool().query(
      `UPDATE counters 
       SET documentation = $1
       WHERE id = $2`,
      [edit.content, edit.counter_id]
    );

    await authService.getPool().query('COMMIT');

    return res.status(200).json({
      success: true,
      message: "Counter edit approved successfully"
    });
  } catch (error) {
    await authService.getPool().query('ROLLBACK').catch(() => {});
    console.error("Error approving counter edit:", error);
    return res.status(500).json({ error: "Failed to approve counter edit" });
  }
});

router.post("/:id/reject", sessionMiddleware, adminMiddleware, async (req: AuthRequest, res: Response) => {
  const editId = req.params.id;
  const adminId = req.user.id;
  const { reason } = req.body;

  try {
    await authService.getPool().query('BEGIN');

    const editResult = await authService.getPool().query(
      `SELECT ce.*, u.email as created_by_email, u.username as created_by_username
       FROM counter_edits ce
       JOIN users u ON ce.created_by = u.id
       WHERE ce.id = $1 AND ce.status = 'pending'
       FOR UPDATE`,
      [editId]
    );
    
    if (editResult.rows.length === 0) {
      await authService.getPool().query('ROLLBACK');
      return res.status(404).json({ error: "Counter edit not found or not pending" });
    }

    const edit = editResult.rows[0];

    await authService.getPool().query(
      `UPDATE counter_edits 
       SET status = 'rejected', approved_by = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [adminId, editId]
    );

    await authService.getPool().query('COMMIT');

    return res.status(200).json({
      success: true,
      message: "Counter edit rejected successfully"
    });
  } catch (error) {
    await authService.getPool().query('ROLLBACK').catch(() => {});
    console.error("Error rejecting counter edit:", error);
    return res.status(500).json({ error: "Failed to reject counter edit" });
  }
});

export default router;
