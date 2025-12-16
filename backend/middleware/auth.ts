import { Pool } from 'pg';
import { Request, Response, NextFunction } from 'express';
import AuthService from '../services/db.js';

const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});




export const authService = new AuthService(pool);

export interface AuthRequest extends Request {
  user?: any;
  session?: any;
}

export const sessionMiddleware = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const sessionId = req.cookies?.sessionId || req.headers.authorization?.replace('Bearer ', '');

  if (sessionId) {
    try {
      const session = await authService.validateSession(sessionId);
      if (session) {
        
        req.session = session;
        req.user = {
        id: session.user_id,
        username: session.username,
        email: session.email,
        };
      }
      next();
    } catch (error) {
      next();
    }
  } else {
    next();
  }
};

export const adminMiddleware = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  try {
    const result = await authService.getPool().query(
      'SELECT is_admin FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0 || !result.rows[0].is_admin) {
      res.status(403).json({ error: "Admin access required" });
      return;
    }

    next();
  } catch (error) {
    console.error('Admin middleware error:', error);
    res.status(500).json({ error: "Server error" });
  }
};
