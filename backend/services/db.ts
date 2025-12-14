import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import { Pool } from 'pg';

interface User {
  id: string;
  username: string;
  email: string;
  password_hash: string;
  password_salt?: string;
  password_reset_token?: string | null;
  joined_at?: string;
  is_admin?: boolean;
}

interface Session {
  id: string;
  user_id: string;
  active_expires: number;
  idle_expires: number;
  created_at: string;
  username?: string;
  email?: string;
}

interface PasswordHashResult {
  hashedPassword: string;
  salt: string;
}

class AuthService {
  private pool: Pool;
  private bcryptRounds: number;

  constructor(pool: Pool) {
    this.pool = pool;
    this.bcryptRounds = 10;
  }

  async hashPassword(password: string): Promise<PasswordHashResult> {
    const salt = await bcrypt.genSalt(this.bcryptRounds);
    const hashedPassword = await bcrypt.hash(password, salt);
    return { hashedPassword, salt };
  }

  async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  generateSessionToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  getCurrentTimestamp(): number {
    return Date.now();
  }

  getSessionExpiration(): { active_expires: number; idle_expires: number } {
    const now = this.getCurrentTimestamp();
    const active_expires = now + (1000 * 60 * 60 * 24 * 7);
    const idle_expires = now + (1000 * 60 * 60 * 24 * 30);
    return { active_expires, idle_expires };
  }

  async createUser(username: string, email: string, password: string): Promise<User> {
    const existingUser = await this.pool.query(
      'SELECT id FROM users WHERE username = $1 OR email = $2',
      [username, email]
    );

    if (existingUser.rows.length > 0) {
      throw new Error('Username or email already taken');
    }

    const { hashedPassword, salt } = await this.hashPassword(password);
    const userId = uuidv4();

    const result = await this.pool.query(
      'INSERT INTO users (id, username, email, password_hash, password_salt) VALUES ($1, $2, $3, $4, $5) RETURNING id, username, email, joined_at',
      [userId, username, email, hashedPassword, salt]
    );

    return result.rows[0];
  }

  async authenticateUser(identifier: string, password: string): Promise<{ id: string; username: string; email: string }> {
    const result = await this.pool.query(
      'SELECT id, username, email, password_hash FROM users WHERE username = $1 OR email = $2',
      [identifier, identifier]
    );

    if (result.rows.length === 0) {
      throw new Error('Invalid credentials');
    }

    const user = result.rows[0] as User;
    const isValid = await this.verifyPassword(password, user.password_hash);

    if (!isValid) {
      throw new Error('Invalid credentials');
    }

    return {
      id: user.id,
      username: user.username,
      email: user.email
    };
  }

  async createSession(userId: string): Promise<Session> {
    const sessionToken = this.generateSessionToken();
    const { active_expires, idle_expires } = this.getSessionExpiration();

    const result = await this.pool.query(
      'INSERT INTO user_session (id, user_id, active_expires, idle_expires) VALUES ($1, $2, $3, $4) RETURNING id, user_id, active_expires, idle_expires, created_at',
      [sessionToken, userId, active_expires, idle_expires]
    );

    return result.rows[0];
  }

  async validateSession(sessionId: string): Promise<Session | null> {
    const result = await this.pool.query(
      `SELECT s.id, s.user_id, s.active_expires, s.idle_expires, s.created_at,
              u.username, u.email
       FROM user_session s
       JOIN users u ON s.user_id = u.id
       WHERE s.id = $1 AND s.active_expires > $2`,
      [sessionId, this.getCurrentTimestamp()]
    );

    return result.rows.length > 0 ? result.rows[0] : null;
  }

  async invalidateSession(sessionId: string): Promise<boolean> {
    await this.pool.query(
      'DELETE FROM user_session WHERE id = $1',
      [sessionId]
    );
    return true;
  }

  async invalidateAllUserSessions(userId: string): Promise<boolean> {
    await this.pool.query(
      'DELETE FROM user_session WHERE user_id = $1',
      [userId]
    );
    return true;
  }

  async generatePasswordResetToken(userId: string): Promise<{ token: string }> {
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    await this.pool.query(
      'UPDATE users SET password_reset_token = $1 WHERE id = $2',
      [tokenHash, userId]
    );

    return { token };
  }

  async validatePasswordResetToken(token: string): Promise<User | null> {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const result = await this.pool.query(
      'SELECT id, username, email FROM users WHERE password_reset_token = $1',
      [tokenHash]
    );

    return result.rows.length > 0 ? result.rows[0] : null;
  }

  async resetPassword(userId: string, newPassword: string): Promise<void> {
    const { hashedPassword, salt } = await this.hashPassword(newPassword);

    await this.pool.query(
      'UPDATE users SET password_hash = $1, password_salt = $2, password_reset_token = NULL WHERE id = $3',
      [hashedPassword, salt, userId]
    );

    await this.invalidateAllUserSessions(userId);
  }

  async cleanupSessions(): Promise<number> {
    const result = await this.pool.query(
      'DELETE FROM user_session WHERE idle_expires < $1',
      [this.getCurrentTimestamp()]
    );
    return result.rowCount || 0;
  }

  async close(): Promise<void> {
    await this.pool.end();
  }

  getPool(): Pool {
    return this.pool;
  }
}

export default AuthService;

