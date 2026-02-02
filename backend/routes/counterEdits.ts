import express, { Response } from "express";
import { z } from "zod";
import {
  authService,
  sessionMiddleware,
  adminMiddleware,
  AuthRequest,
} from "../middleware/auth.js";

const router = express.Router();

const counterEditSchema = z
  .object({
    counter_id: z.string().min(1),
    content: z.string().min(1).max(10000),
  })
  .refine((data) => data.content.trim().length > 0, {
    message: "Content cannot be empty or only whitespace",
  });

const rejectionSchema = z.object({
  reason: z
    .string()
    .min(1, "Rejection reason is required")
    .max(1000, "Reason is too long"),
});

// =====================
// ADMIN: pending edits
// =====================

router.get(
  "/pending",
  sessionMiddleware,
  adminMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const result = await authService.getPool().query(
        `SELECT 
           ce.*,
           u.username AS edited_by_username,
           c.name AS counter_name,
           c.documentation AS current_content
         FROM counter_edits ce
         JOIN users u ON ce.edited_by = u.id
         JOIN counters c ON ce.counter_id = c.id
         WHERE ce.status = 'pending'
         ORDER BY ce.edited_at DESC`
      );

      return res.status(200).json(result.rows);
    } catch (error) {
      console.error("Error fetching pending counter edits:", error);
      return res.status(500).json({ error: "Failed to fetch pending counter edits" });
    }
  }
);


// =====================
// CONTRIBUTOR: propose edit
// =====================
router.post(
  "/",
  sessionMiddleware,
  async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const validationResult = counterEditSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res
        .status(400)
        .json({ error: validationResult.error.issues[0].message });
    }

    const { counter_id, content } = validationResult.data;
    const userId = req.user.id;

    try {
      const userResult = await authService
        .getPool()
        .query("SELECT is_contributor FROM users WHERE id = $1", [userId]);

      if (userResult.rows.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }

      if (!userResult.rows[0].is_contributor) {
        return res.status(403).json({ error: "Contributor access required" });
      }

      const counterResult = await authService
        .getPool()
        .query("SELECT id FROM counters WHERE id = $1", [counter_id]);

      if (counterResult.rows.length === 0) {
        return res.status(404).json({ error: "Counter not found" });
      }

      const pendingEditResult = await authService.getPool().query(
        `SELECT id 
         FROM counter_edits 
         WHERE counter_id = $1 AND status = 'pending'`,
        [counter_id]
      );

      if (pendingEditResult.rows.length > 0) {
        return res
          .status(409)
          .json({ error: "There is already a pending edit for this counter" });
      }

      const result = await authService.getPool().query(
        `INSERT INTO counter_edits 
           (id, edited_by, counter_id, content, status, edited_at)
         VALUES 
           (gen_random_uuid(), $1, $2, $3, 'pending', CURRENT_TIMESTAMP)
         RETURNING 
           id, edited_by, approved_by, counter_id, content, status, rejection_reason, edited_at, reviewed_at`,
        [userId, counter_id, content]
      );

      return res.status(201).json({
        success: true,
        counterEdit: result.rows[0],
      });
    } catch (error) {
      console.error("Error proposing counter edit:", error);
      return res.status(500).json({ error: "Failed to propose counter edit" });
    }
  }
);

// =====================
// ADMIN: approve edit
// =====================
router.post(
  "/:id/approve",
  sessionMiddleware,
  adminMiddleware,
  async (req: AuthRequest, res: Response) => {
    const editId = req.params.id;
    const adminId = req.user!.id;

    try {
      await authService.getPool().query("BEGIN");

      const editResult = await authService.getPool().query(
        `SELECT 
           ce.*,
           u.email AS edited_by_email,
           u.username AS edited_by_username,
           c.name AS counter_name
         FROM counter_edits ce
         JOIN users u ON ce.edited_by = u.id
         JOIN counters c ON ce.counter_id = c.id
         WHERE ce.id = $1 AND ce.status = 'pending'
         FOR UPDATE`,
        [editId]
      );

      if (editResult.rows.length === 0) {
        await authService.getPool().query("ROLLBACK");
        return res
          .status(404)
          .json({ error: "Counter edit not found or not pending" });
      }

      const edit = editResult.rows[0];

      // update counter_edits
      await authService.getPool().query(
        `UPDATE counter_edits
         SET status = 'approved',
             approved_by = $1,
             reviewed_at = CURRENT_TIMESTAMP,
             rejection_reason = NULL
         WHERE id = $2`,
        [adminId, editId]
      );

      // apply edit to counters.documentation
      await authService.getPool().query(
        `UPDATE counters
         SET documentation = $1
         WHERE id = $2`,
        [edit.content, edit.counter_id]
      );

      // notify contributor
      await authService.getPool().query(
        `INSERT INTO notifications (user_id, message, type, counter_edit_id)
         VALUES ($1, $2, $3, $4)`,
        [
          edit.edited_by,
          `Your documentation edit for ${edit.counter_name} has been approved!`,
          "counter_edit_approval",
          editId,
        ]
      );

      await authService.getPool().query("COMMIT");

      return res.status(200).json({
        success: true,
        message: "Counter edit approved successfully",
      });
    } catch (error) {
      await authService.getPool().query("ROLLBACK").catch(() => {});
      console.error("Error approving counter edit:", error);
      return res.status(500).json({ error: "Failed to approve counter edit" });
    }
  }
);

// =====================
// ADMIN: reject edit
// =====================
router.post(
  "/:id/reject",
  sessionMiddleware,
  adminMiddleware,
  async (req: AuthRequest, res: Response) => {
    const editId = req.params.id;
    const adminId = req.user!.id;

    const validationResult = rejectionSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res
        .status(400)
        .json({ error: validationResult.error.issues[0].message });
    }

    const { reason } = validationResult.data;

    try {
      await authService.getPool().query("BEGIN");

      const editResult = await authService.getPool().query(
        `SELECT 
           ce.*,
           u.email AS edited_by_email,
           u.username AS edited_by_username,
           c.name AS counter_name
         FROM counter_edits ce
         JOIN users u ON ce.edited_by = u.id
         JOIN counters c ON ce.counter_id = c.id
         WHERE ce.id = $1 AND ce.status = 'pending'
         FOR UPDATE`,
        [editId]
      );

      if (editResult.rows.length === 0) {
        await authService.getPool().query("ROLLBACK");
        return res
          .status(404)
          .json({ error: "Counter edit not found or not pending" });
      }

      const edit = editResult.rows[0];

      await authService.getPool().query(
        `UPDATE counter_edits
         SET status = 'rejected',
             approved_by = $1,
             reviewed_at = CURRENT_TIMESTAMP,
             rejection_reason = $2
         WHERE id = $3`,
        [adminId, reason, editId]
      );

      await authService.getPool().query(
        `INSERT INTO notifications (user_id, message, type, counter_edit_id)
         VALUES ($1, $2, $3, $4)`,
        [
          edit.edited_by,
          `Your documentation edit for ${edit.counter_name} has been rejected. Reason: ${reason}`,
          "counter_edit_rejection",
          editId,
        ]
      );

      await authService.getPool().query("COMMIT");

      return res.status(200).json({
        success: true,
        message: "Counter edit rejected successfully",
      });
    } catch (error) {
      await authService.getPool().query("ROLLBACK").catch(() => {});
      console.error("Error rejecting counter edit:", error);
      return res.status(500).json({ error: "Failed to reject counter edit" });
    }
  }
);

export default router;
