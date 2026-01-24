import { Pool } from 'pg';
import dotenv from 'dotenv';
import { Request, Response, NextFunction } from 'express';
import AuthService from '../services/db.js';

dotenv.config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

export const authService = new AuthService(pool);

export interface AuthRequest extends Request {
  user?: {
    id: string;
    username: string;
    email: string;
    display_name?: string;
    password_hash: string;
  };
  session?: {
    id: string;
    user_id: string;
    active_expires: number;
    idle_expires: number;
    created_at: string;
    username?: string;
    email?: string;
    display_name?: string;
  };
}

export const sessionMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const sessionId = req.cookies?.sessionId ?? req.headers.authorization?.replace('Bearer ', '');

  if (sessionId) {
    try {
      const session = (await authService.validateSession(sessionId)) as any; // quick fix


      if (session) {
        req.session = session;
        req.user = {
          id: session.user_id,
          username: session.username,
          email: session.email,
          display_name: session.display_name,
          password_hash: session.password_hash
        } as AuthRequest['user'];
      }
    } catch (error) {
      console.error('Session middleware error:', error);
    }
  }

  next();
};

export const adminMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }

  try {
    const result = await authService.getPool().query(
      'SELECT is_admin FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0 || !result.rows[0].is_admin) {
      res.status(403).json({ error: 'Admin access required' });
      return;
    }

    next();
  } catch (error) {
    console.error('Admin middleware error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};
