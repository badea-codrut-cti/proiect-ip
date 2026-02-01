import express, { Response } from "express";
import { z } from "zod";
import nodemailer from "nodemailer";
import { authService, sessionMiddleware, AuthRequest } from "../middleware/auth.js";
import EmailService from "../services/email.js";

const router = express.Router();

// Create transporter for email service
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.SMTP_USER || 'mailhog',
    pass: process.env.SMTP_PASS || 'mailhog'
  }
});

const emailService = new EmailService(transporter);

const keyboardChars = /^[a-zA-Z0-9!@#$%^&*()_+={}\[\]|\\:;"'<>,.?/~`-]+$/;
const passwordSchema = z.string()
  .min(6)
  .max(30)
  .regex(/\d/, "Must contain at least one digit")
  .regex(/[!@#$%^&*()_+={}\[\]|\\:;"'<>,.?/~`-]/, "Must contain at least one symbol")
  .regex(keyboardChars, "Only keyboard characters allowed");

const emailSchema = z.string().email().max(255);
const usernameSchema = z.string().min(4).max(31);

router.post("/signup", async (req: AuthRequest, res: Response): Promise<void> => {
  const { username, password, email } = req.body;

  const usernameResult = usernameSchema.safeParse(username);
  if (!usernameResult.success) {
    res.status(400).json({ error: usernameResult.error.issues[0].message });
    return;
  }

  const passwordResult = passwordSchema.safeParse(password);
  if (!passwordResult.success) {
    res.status(400).json({ error: passwordResult.error.issues[0].message });
    return;
  }

  const emailResult = emailSchema.safeParse(email);
  if (!emailResult.success) {
    res.status(400).json({ error: emailResult.error.issues[0].message });
    return;
  }

  try {
    const user = await authService.createUser(username, email, password);
    const session = await authService.createSession(user.id);

    emailService.sendWelcomeEmail(email, username);

    res.cookie('sessionId', session.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000
    });

    res.status(201).json({
      message: "User created successfully",
      user: {
        id: user.id,
        username: user.username
      },
      session: {
        id: session.id,
        expires: new Date(Number(session.active_expires)).toISOString()
      }
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post("/login", async (req: AuthRequest, res: Response): Promise<void> => {
  const { identifier, password } = req.body;

  try {
    const user = await authService.authenticateUser(identifier, password);
    const session = await authService.createSession(user.id);

    res.cookie('sessionId', session.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000
    });

    res.json({
      message: "Login successful",
      user: {
        id: user.id,
        username: user.username
      },
      session: {
        id: session.id,
        expires: new Date(Number(session.active_expires)).toISOString()
      }
    });
  } catch (error: any) {
    res.status(401).json({ error: error.message });
  }
});

router.post("/logout", sessionMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  const sessionId = req.cookies?.sessionId;

  if (sessionId) {
    try {
      await authService.invalidateSession(sessionId);
      res.clearCookie('sessionId');
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  res.json({ message: "Logged out successfully" });
});

router.get("/me", sessionMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  res.json({
    user: req.user
  });
});

router.post("/forgot-password", async (req: AuthRequest, res: Response): Promise<void> => {
  const { email } = req.body;

  try {
    const result = await authService.getPool().query(
      'SELECT id, username, email FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length > 0) {
      const user = result.rows[0];
      const { token } = await authService.generatePasswordResetToken(user.id);
      await emailService.sendPasswordResetEmail(user.email, token);
    }

    res.json({ message: "If the email exists, a password reset link has been sent" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/reset-password", async (req: AuthRequest, res: Response): Promise<void> => {
  const { token, newPassword } = req.body;

  const passwordResult = passwordSchema.safeParse(newPassword);
  if (!passwordResult.success) {
    res.status(400).json({ error: passwordResult.error.issues[0].message });
    return;
  }

  try {
    const user = await authService.validatePasswordResetToken(token);

    if (!user) {
      res.status(400).json({ error: "Invalid or expired reset token" });
      return;
    }

    await authService.resetPassword(user.id, newPassword);
    res.json({ message: "Password reset successful" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Recalculate FSRS parameters
router.post("/fsrs/recalculate", async (req: AuthRequest, res: Response): Promise<void> => {
  // Get user from session
  const pool = authService.getPool();
  const sessionId = req.cookies?.sessionId || req.headers.authorization?.replace('Bearer ', '');
  
  if (!sessionId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  try {
    const session = await authService.validateSession(sessionId);
    if (!session) {
      res.status(401).json({ error: "Invalid session" });
      return;
    }

    // Reset FSRS parameters for all reviews belonging to this user
    await pool.query(
      `UPDATE reviews SET 
        difficulty = 2.5, 
        stability = 0, 
        reps = 0,
        lapses = 0,
        due = CURRENT_TIMESTAMP
       WHERE user_id = $1`,
      [session.user_id]
    );

    res.json({ 
      message: "FSRS parameters recalculated successfully" 
    });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : "Failed to recalculate FSRS parameters" });
  }
});

import profileUpdateRoutes from './profileUpdate.js';

router.use('/profile', profileUpdateRoutes);

export default router;
