import { Pool } from 'pg';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

class AuthService {
  constructor(dbConfig, smtpConfig = null) {
    this.pool = new Pool(dbConfig);
    this.smtpConfig = smtpConfig;
    this.bcryptRounds = 10;
  }

  hashPassword(password) {
    return bcrypt.genSalt(this.bcryptRounds)
      .then(salt => bcrypt.hash(password, salt)
        .then(hashedPassword => ({ hashedPassword, salt })));
  }

  verifyPassword(password, hashedPassword) {
    return bcrypt.compare(password, hashedPassword);
  }

  generateSessionToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  getCurrentTimestamp() {
    return Date.now();
  }

  getSessionExpiration() {
    const now = this.getCurrentTimestamp();
    const active_expires = now + (1000 * 60 * 60 * 24 * 7);
    const idle_expires = now + (1000 * 60 * 60 * 24 * 30);
    return { active_expires, idle_expires };
  }

  createUser(username, email, password) {
    return this.pool.query(
      'SELECT id FROM users WHERE username = $1 OR email = $2',
      [username, email]
    )
      .then(existingUser => {
        if (existingUser.rows.length > 0) {
          throw new Error('Username or email already taken');
        }
        return this.hashPassword(password);
      })
      .then(({ hashedPassword, salt }) => {
        const userId = uuidv4();
        return this.pool.query(
          'INSERT INTO users (id, username, email, password_hash, password_salt) VALUES ($1, $2, $3, $4, $5) RETURNING id, username, email, joined_at',
          [userId, username, email, hashedPassword, salt]
        );
      })
      .then(result => result.rows[0]);
  }

  authenticateUser(identifier, password) {
    return this.pool.query(
      'SELECT id, username, email, password_hash FROM users WHERE username = $1 OR email = $2',
      [identifier, identifier]
    )
      .then(result => {
        if (result.rows.length === 0) {
          throw new Error('Invalid credentials');
        }
        const user = result.rows[0];
        return this.verifyPassword(password, user.password_hash)
          .then(isValid => {
            if (!isValid) {
              throw new Error('Invalid credentials');
            }
            return {
              id: user.id,
              username: user.username,
              email: user.email
            };
          });
      });
  }

  createSession(userId) {
    const sessionToken = this.generateSessionToken();
    const { active_expires, idle_expires } = this.getSessionExpiration();
    
    return this.pool.query(
      'INSERT INTO user_session (id, user_id, active_expires, idle_expires) VALUES ($1, $2, $3, $4) RETURNING id, user_id, active_expires, idle_expires, created_at',
      [sessionToken, userId, active_expires, idle_expires]
    )
      .then(result => result.rows[0]);
  }

  validateSession(sessionId) {
    return this.pool.query(
      `SELECT s.id, s.user_id, s.active_expires, s.idle_expires, s.created_at,
              u.username, u.email
       FROM user_session s
       JOIN users u ON s.user_id = u.id
       WHERE s.id = $1 AND s.active_expires > $2`,
      [sessionId, this.getCurrentTimestamp()]
    )
      .then(result => result.rows.length > 0 ? result.rows[0] : null);
  }

  invalidateSession(sessionId) {
    return this.pool.query(
      'DELETE FROM user_session WHERE id = $1',
      [sessionId]
    ).then(() => true);
  }

  invalidateAllUserSessions(userId) {
    return this.pool.query(
      'DELETE FROM user_session WHERE user_id = $1',
      [userId]
    ).then(() => true);
  }

  generatePasswordResetToken(userId) {
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    
    return this.pool.query(
      'UPDATE users SET password_reset_token = $1 WHERE id = $2',
      [tokenHash, userId]
    ).then(() => ({ token }));
  }

  validatePasswordResetToken(token) {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    
    return this.pool.query(
      'SELECT id, username, email FROM users WHERE password_reset_token = $1',
      [tokenHash]
    ).then(result => result.rows.length > 0 ? result.rows[0] : null);
  }

  resetPassword(userId, newPassword) {
    return this.hashPassword(newPassword)
      .then(({ hashedPassword, salt }) => 
        this.pool.query(
          'UPDATE users SET password_hash = $1, password_salt = $2, password_reset_token = NULL WHERE id = $3',
          [hashedPassword, salt, userId]
        )
      )
      .then(() => this.invalidateAllUserSessions(userId));
  }

  cleanupSessions() {
    return this.pool.query(
      'DELETE FROM user_session WHERE idle_expires < $1',
      [this.getCurrentTimestamp()]
    ).then(result => result.rowCount);
  }

  close() {
    return this.pool.end();
  }

  getPool() {
    return this.pool;
  }
}

export default AuthService;