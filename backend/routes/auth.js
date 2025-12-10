import express from "express";
import { z } from "zod";
import AuthService from "../db.js";

const router = express.Router();

const authService = new AuthService({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

const keyboardChars = /^[a-zA-Z0-9!@#$%^&*()_+={}\[\]|\\:;"'<>,.?/~`-]+$/;
const passwordSchema = z.string()
  .min(6)
  .max(30)
  .regex(/\d/, "Must contain at least one digit")
  .regex(/[!@#$%^&*()_+={}\[\]|\\:;"'<>,.?/~`-]/, "Must contain at least one symbol")
  .regex(keyboardChars, "Only keyboard characters allowed");

const emailSchema = z.string().email().max(255);
const usernameSchema = z.string().min(4).max(31);

const sessionMiddleware = (req, res, next) => {
  const sessionId = req.cookies?.sessionId || req.headers.authorization?.replace('Bearer ', '');
  
  if (sessionId) {
    authService.validateSession(sessionId)
      .then(session => {
        if (session) {
          req.user = session;
          req.session = session;
        }
        next();
      })
      .catch(() => next());
  } else {
    next();
  }
};

router.post("/signup", (req, res) => {
  const { username, password, email } = req.body;
  
  const usernameResult = usernameSchema.safeParse(username);
  if (!usernameResult.success) {
    return res.status(400).json({ error: usernameResult.error.errors[0].message });
  }
  
  const passwordResult = passwordSchema.safeParse(password);
  if (!passwordResult.success) {
    return res.status(400).json({ error: passwordResult.error.errors[0].message });
  }
  
  const emailResult = emailSchema.safeParse(email);
  if (!emailResult.success) {
    return res.status(400).json({ error: emailResult.error.errors[0].message });
  }

  authService.createUser(username, email, password)
    .then(user => authService.createSession(user.id)
      .then(session => {
        res.cookie('sessionId', session.id, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 30 * 24 * 60 * 60 * 1000
        });
        
        return res.status(201).json({
          success: true,
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            joined_at: user.joined_at
          },
          sessionId: session.id
        });
      })
    )
    .catch(error => {
      if (error.message && error.message.includes('already taken')) {
        return res.status(400).json({ error: error.message });
      }
      return res.status(500).json({ error: "Server error" });
    });
});

router.post("/login", (req, res) => {
  const { username, password } = req.body;
  
  if (!username || username.length === 0) {
    return res.status(400).json({ error: "Username required" });
  }
  
  if (!password || password.length === 0) {
    return res.status(400).json({ error: "Password required" });
  }

  authService.authenticateUser(username, password)
    .then(user => authService.createSession(user.id)
      .then(session => {
        res.cookie('sessionId', session.id, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 30 * 24 * 60 * 60 * 1000
        });
        
        return res.status(200).json({
          success: true,
          user: {
            id: user.id,
            username: user.username,
            email: user.email
          },
          sessionId: session.id
        });
      })
    )
    .catch(error => {
      if (error.message === 'Invalid credentials') {
        return res.status(400).json({ error: "Invalid credentials" });
      }
      return res.status(500).json({ error: "Server error" });
    });
});

router.get("/me", sessionMiddleware, (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  return res.status(200).json({
    user: {
      id: req.user.user_id,
      username: req.user.username,
      email: req.user.email
    }
  });
});

router.post("/logout", sessionMiddleware, (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  authService.invalidateSession(req.user.id)
    .then(() => {
      res.clearCookie('sessionId');
      return res.status(200).json({ success: true });
    })
    .catch(() => res.status(500).json({ error: "Server error" }));
});

router.post("/update-password", sessionMiddleware, (req, res) => {
  const { currentPassword, newPassword } = req.body;
  
  if (!req.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const newPasswordResult = passwordSchema.safeParse(newPassword);
  if (!newPasswordResult.success) {
    return res.status(400).json({ error: newPasswordResult.error.errors[0].message });
  }

  authService.authenticateUser(req.user.username, currentPassword)
    .then(user => authService.resetPassword(user.id, newPassword))
    .then(() => authService.invalidateSession(req.user.id))
    .then(() => {
      res.clearCookie('sessionId');
      return res.status(200).json({ success: true });
    })
    .catch(error => {
      if (error.message === 'Invalid credentials') {
        return res.status(400).json({ error: "Current password incorrect" });
      }
      return res.status(500).json({ error: "Server error" });
    });
});

router.post("/request-password-reset", (req, res) => {
  const { email } = req.body;
  
  const emailResult = emailSchema.safeParse(email);
  if (!emailResult.success) {
    return res.status(400).json({ error: emailResult.error.errors[0].message });
  }

  authService.getPool().query(
    'SELECT id FROM users WHERE email = $1',
    [email]
  )
    .then(userResult => {
      if (userResult.rows.length > 0) {
        return authService.generatePasswordResetToken(userResult.rows[0].id)
          .then(({ token }) => {
            console.log(`Password reset token for ${email}: ${token}`);
          });
      }
    })
    .then(() => res.status(200).json({}))
    .catch(() => res.status(500).json({ error: "Server error" }));
});

router.post("/reset-password", (req, res) => {
  const { token, newPassword } = req.body;
  
  if (!token || token.length !== 64) {
    return res.status(400).json({ error: "Invalid token" });
  }
  
  const newPasswordResult = passwordSchema.safeParse(newPassword);
  if (!newPasswordResult.success) {
    return res.status(400).json({ error: newPasswordResult.error.errors[0].message });
  }

  authService.validatePasswordResetToken(token)
    .then(user => {
      if (!user) {
        return res.status(400).json({ error: "Invalid token" });
      }
      return authService.resetPassword(user.id, newPassword)
        .then(() => res.status(200).json({ success: true }));
    })
    .catch(() => res.status(500).json({ error: "Server error" }));
});

router.post("/cleanup-sessions", (req, res) => {
  authService.cleanupSessions()
    .then(deletedCount => res.status(200).json({ deleted: deletedCount }))
    .catch(() => res.status(500).json({ error: "Server error" }));
});

export default router;
export { authService };