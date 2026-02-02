import express, { Response } from "express";
import { authService, sessionMiddleware, AuthRequest } from "../middleware/auth.js";

const router = express.Router();

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

router.get("/", sessionMiddleware, async (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: "Not authenticated" });

  const userId = req.user.id;
  const pool = authService.getPool();

  try {
    // exercises optional columns 
    const exHasStatus = await hasColumn("exercises", "status");
    const exHasCreatedAt = await hasColumn("exercises", "created_at");
    const exHasReviewedAt = await hasColumn("exercises", "reviewed_at");
    const exHasRejection = await hasColumn("exercises", "rejection_reason");

    // counter_edits optional columns
    const ceHasStatus = await hasColumn("counter_edits", "status");
    const ceHasReviewedAt = await hasColumn("counter_edits", "reviewed_at");
    const ceHasRejection = await hasColumn("counter_edits", "rejection_reason");

    const exercisesQuery = `
      SELECT
        e.id,
        e.counter_id,
        c.name AS counter_name,
        e.sentence,
        e.min_count,
        e.max_count,
        e.decimal_points,
        e.is_approved,
        ${exHasStatus ? "e.status" : "CASE WHEN e.is_approved THEN 'approved' ELSE 'pending' END AS status"}
        ${exHasCreatedAt ? ", e.created_at" : ", NULL::timestamp AS created_at"}
        ${exHasReviewedAt ? ", e.reviewed_at" : ", NULL::timestamp AS reviewed_at"}
        ${exHasRejection ? ", e.rejection_reason" : ", NULL::text AS rejection_reason"}
      FROM exercises e
      JOIN counters c ON c.id = e.counter_id
      WHERE e.created_by = $1
      ORDER BY ${exHasCreatedAt ? "e.created_at" : "e.id"} DESC
    `;

    const editsQuery = `
      SELECT
        ce.id,
        ce.counter_id,
        c.name AS counter_name,
        c.documentation AS current_content,
        ce.content,
        ce.edited_at,
        ce.is_approved,
        ${ceHasStatus ? "ce.status" : "CASE WHEN ce.is_approved THEN 'approved' ELSE 'pending' END AS status"}
        ${ceHasReviewedAt ? ", ce.reviewed_at" : ", NULL::timestamp AS reviewed_at"}
        ${ceHasRejection ? ", ce.rejection_reason" : ", NULL::text AS rejection_reason"}
      FROM counter_edits ce
      JOIN counters c ON c.id = ce.counter_id
      WHERE ce.edited_by = $1
      ORDER BY ce.edited_at DESC, ce.id DESC
    `;

    const [exercises, counterEdits] = await Promise.all([
      pool.query(exercisesQuery, [userId]),
      pool.query(editsQuery, [userId]),
    ]);

    return res.status(200).json({
      exercises: exercises.rows,
      counter_edits: counterEdits.rows,
    });
  } catch (err) {
    console.error("Error /api/contributions:", err);
    return res.status(500).json({ error: "Failed to fetch contributions" });
  }
});

export default router;
