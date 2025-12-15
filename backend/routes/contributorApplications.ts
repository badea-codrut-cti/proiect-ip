import express, { Response } from "express";
import { z } from "zod";
import nodemailer from "nodemailer";
import { authService, sessionMiddleware, adminMiddleware, AuthRequest } from "../middleware/auth.js";
import EmailService from "../services/email.js";

const router = express.Router();

const emailService = new EmailService(nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.SMTP_USER || 'mailhog',
    pass: process.env.SMTP_PASS || 'mailhog'
  }
}));

const applicationSchema = z.object({
  description: z.string().min(1).max(5000),
  jlpt_level: z.number().int().min(1).max(5).nullable().optional()
});

router.get("/pending", sessionMiddleware, adminMiddleware, async (req, res) => {
  try {
    const result = await authService.getPool().query(
      `SELECT ca.*, u.username, u.email 
       FROM contributor_applications ca
       JOIN users u ON ca.user_id = u.id
       WHERE ca.status = 'pending'
       ORDER BY ca.applied_at DESC`
    );
    
    return res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching pending applications:", error);
    return res.status(500).json({ error: "Failed to fetch pending applications" });
  }
});

router.post("/", sessionMiddleware, async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const validationResult = applicationSchema.safeParse(req.body);
  if (!validationResult.success) {
    return res.status(400).json({ error: validationResult.error.issues[0].message });
  }

  const { description, jlpt_level } = validationResult.data;
  const userId = req.user.user_id;

  try {
    const userResult = await authService.getPool().query(
      'SELECT is_contributor FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    if (userResult.rows[0].is_contributor) {
      return res.status(400).json({ error: "User is already a contributor" });
    }

    const pendingResult = await authService.getPool().query(
      'SELECT id FROM contributor_applications WHERE user_id = $1 AND status = $2',
      [userId, 'pending']
    );

    if (pendingResult.rows.length > 0) {
      return res.status(400).json({ error: "You already have a pending application" });
    }

    const rejectedResult = await authService.getPool().query(
      `SELECT id, applied_at FROM contributor_applications
       WHERE user_id = $1 AND status = 'rejected'
       ORDER BY applied_at DESC LIMIT 1`,
      [userId]
    );

    if (rejectedResult.rows.length > 0) {
      const lastRejected = new Date(rejectedResult.rows[0].applied_at);
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

      if (lastRejected > threeMonthsAgo) {
        return res.status(400).json({
          error: "You can only reapply 3 months after a rejected application"
        });
      }
    }

    const result = await authService.getPool().query(
      `INSERT INTO contributor_applications
       (user_id, description, jlpt_level)
       VALUES ($1, $2, $3)
       RETURNING id, applied_at, status`,
      [userId, description, jlpt_level || null]
    );

    const userEmailResult = await authService.getPool().query(
      'SELECT email FROM users WHERE id = $1',
      [userId]
    );

    if (userEmailResult.rows.length > 0) {
      try {
        await emailService.sendMail({
          from: process.env.SMTP_FROM,
          to: userEmailResult.rows[0].email,
          subject: 'Contributor Application Submitted',
          text: `Your contributor application has been submitted successfully. We'll review it soon.`,
          html: `
            <h2>Application Submitted</h2>
            <p>Your contributor application has been submitted successfully.</p>
            <p>We'll review it and get back to you soon.</p>
          `
        });
      } catch (emailError) {
        console.error("Failed to send confirmation email:", emailError);
      }
    }

    return res.status(201).json({
      success: true,
      application: result.rows[0]
    });
  } catch (error) {
    console.error("Error submitting application:", error);
    return res.status(500).json({ error: "Failed to submit application" });
  }
});

router.post("/:id/approve", sessionMiddleware, adminMiddleware, async (req: AuthRequest, res: Response) => {
  const applicationId = req.params.id;
  const adminId = req.user.user_id;

  try {
    await authService.getPool().query('BEGIN');

    const applicationResult = await authService.getPool().query(
      `SELECT ca.*, u.email, u.username 
       FROM contributor_applications ca
       JOIN users u ON ca.user_id = u.id
       WHERE ca.id = $1 AND ca.status = 'pending'
       FOR UPDATE`,
      [applicationId]
    );
    
    if (applicationResult.rows.length === 0) {
      await authService.getPool().query('ROLLBACK');
      return res.status(404).json({ error: "Application not found or not pending" });
    }

    const application = applicationResult.rows[0];
    const userId = application.user_id;

    await authService.getPool().query(
      `UPDATE contributor_applications 
       SET status = 'approved', approved_by = $1, reviewed_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [adminId, applicationId]
    );

    await authService.getPool().query(
      'UPDATE users SET is_contributor = true WHERE id = $1',
      [userId]
    );

    try {
      await emailService.sendMail({
        from: process.env.SMTP_FROM,
        to: application.email,
        subject: 'Contributor Application Approved',
        text: `Congratulations! Your contributor application has been approved.`,
        html: `
          <h2>Application Approved</h2>
          <p>Congratulations ${application.username}! Your contributor application has been approved.</p>
          <p>You now have contributor privileges.</p>
        `
      });
    } catch (emailError) {
      console.error("Failed to send approval email:", emailError);
    }

    await authService.getPool().query('COMMIT');

    return res.status(200).json({
      success: true,
      message: "Application approved successfully"
    });
  } catch (error) {
    await authService.getPool().query('ROLLBACK').catch(() => {});
    console.error("Error approving application:", error);
    return res.status(500).json({ error: "Failed to approve application" });
  }
});

router.post("/:id/reject", sessionMiddleware, adminMiddleware, async (req: AuthRequest, res: Response) => {
  const applicationId = req.params.id;
  const adminId = req.user.user_id;
  const { reason } = req.body;

  try {
    await authService.getPool().query('BEGIN');

    const applicationResult = await authService.getPool().query(
      `SELECT ca.*, u.email, u.username 
       FROM contributor_applications ca
       JOIN users u ON ca.user_id = u.id
       WHERE ca.id = $1 AND ca.status = 'pending'
       FOR UPDATE`,
      [applicationId]
    );
    
    if (applicationResult.rows.length === 0) {
      await authService.getPool().query('ROLLBACK');
      return res.status(404).json({ error: "Application not found or not pending" });
    }

    const application = applicationResult.rows[0];

    await authService.getPool().query(
      `UPDATE contributor_applications 
       SET status = 'rejected', approved_by = $1, reviewed_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [adminId, applicationId]
    );

    try {
      await emailService.sendMail({
        from: process.env.SMTP_FROM,
        to: application.email,
        subject: 'Contributor Application Status',
        text: `Your contributor application has been reviewed.${reason ? ` Reason: ${reason}` : ''}`,
        html: `
          <h2>Application Reviewed</h2>
          <p>Hello ${application.username},</p>
          <p>Your contributor application has been reviewed.</p>
          ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
          <p>You can reapply after 3 months if you wish.</p>
        `
      });
    } catch (emailError) {
      console.error("Failed to send rejection email:", emailError);
    }

    await authService.getPool().query('COMMIT');

    return res.status(200).json({
      success: true,
      message: "Application rejected successfully"
    });
  } catch (error) {
    await authService.getPool().query('ROLLBACK').catch(() => {});
    console.error("Error rejecting application:", error);
    return res.status(500).json({ error: "Failed to reject application" });
  }
});

router.get("/my-applications", sessionMiddleware, async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  try {
    const result = await authService.getPool().query(
      `SELECT id, applied_at, description, jlpt_level, status, reviewed_at
       FROM contributor_applications 
       WHERE user_id = $1
       ORDER BY applied_at DESC`,
      [req.user.user_id]
    );
    
    return res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching user applications:", error);
    return res.status(500).json({ error: "Failed to fetch applications" });
  }
});

export default router;
