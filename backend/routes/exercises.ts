import express, { Response } from "express";
import { z } from "zod";
import {
  authService,
  sessionMiddleware,
  adminMiddleware,
  AuthRequest,
} from "../middleware/auth.js";

const router = express.Router();

const exerciseSchema = z
  .object({
    counter_id: z.string().min(1),
    sentence: z
      .string()
      .min(1)
      .max(5000)
      .refine((sentence) => sentence.includes("<ans>"), {
        message:
          "Exercise sentence must contain at least one '<ans>' placeholder for the answer",
      }),
    min_count: z.number().min(0).default(1),
    max_count: z.number().min(0).default(10),
    decimal_points: z.number().int().min(0).default(0),
  })
  .refine((data) => data.min_count <= data.max_count, {
    message: "min_count must be less than or equal to max_count",
    path: ["min_count"],
  });

const rejectionSchema = z.object({
  reason: z
    .string()
    .min(1, "Rejection reason is required")
    .max(1000, "Reason is too long"),
});

/**
 * Helper: check if a column exists (safe across schemas).
 */
async function hasColumn(table: string, column: string): Promise<boolean> {
  const r = await authService.getPool().query(
    `
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = $1 AND column_name = $2
    LIMIT 1
    `,
    [table, column]
  );
  return r.rows.length > 0;
}

/**
 * Helper: quick schema flags (cached per process)
 */
let schemaCache:
  | null
  | {
      exercises_status: boolean;
      exercises_reviewed_at: boolean;
      exercises_rejection_reason: boolean;
      exercises_created_at: boolean;
    } = null;

async function getSchemaFlags() {
  if (schemaCache) return schemaCache;

  const [s, ra, rr, ca] = await Promise.all([
    hasColumn("exercises", "status"),
    hasColumn("exercises", "reviewed_at"),
    hasColumn("exercises", "rejection_reason"),
    hasColumn("exercises", "created_at"),
  ]);

  schemaCache = {
    exercises_status: s,
    exercises_reviewed_at: ra,
    exercises_rejection_reason: rr,
    exercises_created_at: ca,
  };

  return schemaCache;
}

// =====================
// ADMIN: pending exercises
// SAFE: daca exista status => ia doar status='pending'
// altfel => comportament vechi (is_approved = false)
// + sort: created_at daca exista, altfel id
// =====================
router.get(
  "/pending",
  sessionMiddleware,
  adminMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const hasStatusRes = await authService.getPool().query(
        `
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema='public'
          AND table_name='exercises'
          AND column_name='status'
        LIMIT 1
        `
      );

      const useStatus = hasStatusRes.rows.length > 0;

      const result = await authService.getPool().query(
        `
        SELECT 
          e.*,
          u.username as created_by_username,
          c.name as counter_name
        FROM exercises e
        LEFT JOIN users u ON e.created_by = u.id
        JOIN counters c ON e.counter_id = c.id
        WHERE ${useStatus ? "e.status = 'pending'" : "e.is_approved = FALSE"}
        ORDER BY ${useStatus ? "e.created_at DESC" : "e.id DESC"}
        `
      );

      return res.status(200).json(result.rows);
    } catch (error) {
      console.error("Error fetching pending exercises:", error);
      return res
        .status(500)
        .json({ error: "Failed to fetch pending exercises" });
    }
  }
);


// =====================
// CONTRIBUTOR: propose exercise
// SAFE: merge cu schema veche + noua
// - is_approved ramane FALSE
// - daca exista status => set pending
// =====================
router.post("/", sessionMiddleware, async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const validationResult = exerciseSchema.safeParse(req.body);
  if (!validationResult.success) {
    return res
      .status(400)
      .json({ error: validationResult.error.issues[0].message });
  }

  const { counter_id, sentence, min_count, max_count, decimal_points } =
    validationResult.data;
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

    const flags = await getSchemaFlags();

    // Insert de baza (compatibil)
    const baseInsert = await authService.getPool().query(
      `
      INSERT INTO exercises
      (id, created_by, counter_id, sentence, min_count, max_count, decimal_points, is_approved)
      VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, FALSE)
      RETURNING *
      `,
      [userId, counter_id, sentence, min_count, max_count, decimal_points]
    );

    const exercise = baseInsert.rows[0];

    // daca exista status: seteaza pending (desi default e pending, but safe)
    if (flags.exercises_status) {
      await authService
        .getPool()
        .query(`UPDATE exercises SET status='pending' WHERE id=$1`, [exercise.id]);
    }

    return res.status(201).json({
      success: true,
      exercise,
    });
  } catch (error) {
    console.error("Error proposing exercise:", error);
    return res.status(500).json({ error: "Failed to propose exercise" });
  }
});

// =====================
// ADMIN: approve exercise
// SAFE: pastreaza flow-ul vechi (is_approved = TRUE)
// + daca exista coloanele noi => status=approved, reviewed_at=NOW, rejection_reason=NULL
// =====================
router.post(
  "/:id/approve",
  sessionMiddleware,
  adminMiddleware,
  async (req: AuthRequest, res: Response) => {
    const exerciseId = req.params.id;
    const adminId = req.user!.id;

    try {
      const flags = await getSchemaFlags();

      await authService.getPool().query("BEGIN");

      // gasim exercitiul pending in functie de schema
      const pendingCond = flags.exercises_status
        ? `e.status='pending'`
        : `e.is_approved = FALSE`;

      const exerciseResult = await authService.getPool().query(
        `
        SELECT e.*, c.name as counter_name
        FROM exercises e
        JOIN counters c ON e.counter_id = c.id
        WHERE e.id = $1 AND ${pendingCond}
        FOR UPDATE
        `,
        [exerciseId]
      );

      if (exerciseResult.rows.length === 0) {
        await authService.getPool().query("ROLLBACK");
        return res
          .status(404)
          .json({ error: "Exercise not found or not pending" });
      }

      const exercise = exerciseResult.rows[0];

      // compat vechi
      await authService.getPool().query(
        `
        UPDATE exercises
        SET is_approved = TRUE,
            approved_by = $1
        WHERE id = $2
        `,
        [adminId, exerciseId]
      );

      // extensii noi
      if (flags.exercises_status) {
        await authService
          .getPool()
          .query(`UPDATE exercises SET status='approved' WHERE id=$1`, [exerciseId]);
      }
      if (flags.exercises_reviewed_at) {
        await authService
          .getPool()
          .query(`UPDATE exercises SET reviewed_at=CURRENT_TIMESTAMP WHERE id=$1`, [
            exerciseId,
          ]);
      }
      if (flags.exercises_rejection_reason) {
        await authService
          .getPool()
          .query(`UPDATE exercises SET rejection_reason=NULL WHERE id=$1`, [
            exerciseId,
          ]);
      }

      // notificare daca are created_by
      if (exercise.created_by) {
        await authService.getPool().query(
          `
          INSERT INTO notifications (user_id, message, type, exercise_id)
          VALUES ($1, $2, $3, $4)
          `,
          [
            exercise.created_by,
            `Your exercise proposal for ${exercise.counter_name} has been approved!`,
            "exercise_approval",
            exerciseId,
          ]
        );
      }

      await authService.getPool().query("COMMIT");

      return res.status(200).json({
        success: true,
        message: "Exercise approved successfully",
      });
    } catch (error) {
      await authService.getPool().query("ROLLBACK").catch(() => {});
      console.error("Error approving exercise:", error);
      return res.status(500).json({ error: "Failed to approve exercise" });
    }
  }
);

// =====================
// ADMIN: reject exercise
// IMPORTANT:
// - daca exista status/reviewed_at/rejection_reason => SOFT REJECT (NU delete)
// - daca NU exista => fallback: DELETE (altfel nu ai unde salva motivul + ramane pending forever)
// =====================
router.post(
  "/:id/reject",
  sessionMiddleware,
  adminMiddleware,
  async (req: AuthRequest, res: Response) => {
    const exerciseId = req.params.id;
    const adminId = req.user!.id;

    const validationResult = rejectionSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res
        .status(400)
        .json({ error: validationResult.error.issues[0].message });
    }

    const { reason } = validationResult.data;

    try {
      const flags = await getSchemaFlags();

      await authService.getPool().query("BEGIN");

      const pendingCond = flags.exercises_status
        ? `e.status='pending'`
        : `e.is_approved = FALSE`;

      const exerciseResult = await authService.getPool().query(
        `
        SELECT e.*, c.name as counter_name
        FROM exercises e
        JOIN counters c ON e.counter_id = c.id
        WHERE e.id = $1 AND ${pendingCond}
        FOR UPDATE
        `,
        [exerciseId]
      );

      if (exerciseResult.rows.length === 0) {
        await authService.getPool().query("ROLLBACK");
        return res
          .status(404)
          .json({ error: "Exercise not found or not pending" });
      }

      const exercise = exerciseResult.rows[0];

      // daca ai schema noua, soft reject
      if (flags.exercises_status && flags.exercises_rejection_reason) {
        await authService.getPool().query(
          `
          UPDATE exercises
          SET status = 'rejected',
              approved_by = $1
          WHERE id = $2
          `,
          [adminId, exerciseId]
        );

        if (flags.exercises_reviewed_at) {
          await authService.getPool().query(
            `UPDATE exercises SET reviewed_at = CURRENT_TIMESTAMP WHERE id = $1`,
            [exerciseId]
          );
        }

        await authService.getPool().query(
          `UPDATE exercises SET rejection_reason = $1 WHERE id = $2`,
          [reason, exerciseId]
        );
      } else {
        // fallback pt colegi: delete (nu exista rejection_reason unde sa salvezi)
        await authService
          .getPool()
          .query(`DELETE FROM exercises WHERE id = $1`, [exerciseId]);
      }

      // notificare catre contributor (asta e utila in ambele cazuri)
      if (exercise.created_by) {
        await authService.getPool().query(
          `
          INSERT INTO notifications (user_id, message, type, exercise_id)
          VALUES ($1, $2, $3, $4)
          `,
          [
            exercise.created_by,
            `Your exercise proposal for ${exercise.counter_name} has been rejected. Reason: ${reason}`,
            "exercise_rejection",
            exerciseId,
          ]
        );
      }

      await authService.getPool().query("COMMIT");

      return res.status(200).json({
        success: true,
        message: "Exercise rejected successfully",
      });
    } catch (error) {
      await authService.getPool().query("ROLLBACK").catch(() => {});
      console.error("Error rejecting exercise:", error);
      return res.status(500).json({ error: "Failed to reject exercise" });
    }
  }
);

export default router;
