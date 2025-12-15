import AuthService from '../db.js';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

// Mock pg Pool
const mockPool = {
  query: jest.fn(),
  end: jest.fn(),
  totalCount: 0,
  idleCount: 0,
  waitingCount: 0,
  expiredCount: 0,
  // Add other required Pool properties as needed
} as any;

// Mock bcrypt
jest.mock('bcrypt', () => ({
  genSalt: jest.fn(),
  hash: jest.fn(),
  compare: jest.fn()
}));

// Mock crypto
jest.mock('crypto', () => ({
  randomBytes: jest.fn(),
  createHash: jest.fn(),
  createHmac: jest.fn()
}));

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    jest.clearAllMocks();
    authService = new AuthService(mockPool);
  });

  describe('hashPassword', () => {
    it('should hash password correctly', async () => {
      const mockSalt = 'mockSalt';
      const mockHashedPassword = 'mockHashedPassword';

      bcrypt.genSalt = jest.fn().mockResolvedValue(mockSalt);
      bcrypt.hash = jest.fn().mockResolvedValue(mockHashedPassword);

      const result = await authService.hashPassword('password123');

      expect(result).toEqual({
        hashedPassword: mockHashedPassword,
        salt: mockSalt
      });
      expect(bcrypt.genSalt).toHaveBeenCalledWith(10);
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', mockSalt);
    });
  });

  describe('verifyPassword', () => {
    it('should verify password correctly', async () => {
      const mockResult = true;
      bcrypt.compare = jest.fn().mockResolvedValue(mockResult);

      const result = await authService.verifyPassword('password123', 'hashedPassword');

      expect(result).toBe(mockResult);
      expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashedPassword');
    });
  });

  describe('generateSessionToken', () => {
    it('should generate a session token', () => {
      const mockToken = 'mockToken123';
      crypto.randomBytes = jest.fn().mockReturnValue({
        toString: jest.fn().mockReturnValue(mockToken)
      });

      const result = authService.generateSessionToken();

      expect(result).toBe(mockToken);
      expect(crypto.randomBytes).toHaveBeenCalledWith(32);
    });
  });

  describe('getCurrentTimestamp', () => {
    it('should return current timestamp', () => {
      const now = Date.now();
      jest.spyOn(Date, 'now').mockReturnValue(now);

      const result = authService.getCurrentTimestamp();

      expect(result).toBe(now);
    });
  });

  describe('getSessionExpiration', () => {
    it('should return session expiration times', () => {
      const now = 1000000;
      jest.spyOn(Date, 'now').mockReturnValue(now);

      const result = authService.getSessionExpiration();

      expect(result).toEqual({
        active_expires: now + (1000 * 60 * 60 * 24 * 7),
        idle_expires: now + (1000 * 60 * 60 * 24 * 30)
      });
    });
  });

  describe('createUser', () => {
    it('should create a new user successfully', async () => {
      const mockUser = {
        id: 'user123',
        username: 'testuser',
        email: 'test@example.com',
        joined_at: new Date().toISOString()
      };

      mockPool.query
        .mockResolvedValueOnce({ rows: [] }) // Check existing user
        .mockResolvedValueOnce({ rows: [mockUser] }); // Insert user

      bcrypt.genSalt = jest.fn().mockResolvedValue('mockSalt');
      bcrypt.hash = jest.fn().mockResolvedValue('mockHashedPassword');

      const result = await authService.createUser('testuser', 'test@example.com', 'password123');

      expect(result).toEqual(mockUser);
      expect(mockPool.query).toHaveBeenCalledTimes(2);
    });

    it('should throw error if username or email already exists', async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [{ id: 'existingUser' }]
      });

      await expect(
        authService.createUser('testuser', 'test@example.com', 'password123')
      ).rejects.toThrow('Username or email already taken');
    });
  });

  describe('authenticateUser', () => {
    it('should authenticate user successfully', async () => {
      const mockUser = {
        id: 'user123',
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashedPassword'
      };

      mockPool.query.mockResolvedValueOnce({
        rows: [mockUser]
      });

      bcrypt.compare = jest.fn().mockResolvedValue(true);

      const result = await authService.authenticateUser('testuser', 'password123');

      expect(result).toEqual({
        id: mockUser.id,
        username: mockUser.username,
        email: mockUser.email
      });
    });

    it('should throw error for invalid credentials', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      await expect(
        authService.authenticateUser('testuser', 'wrongpassword')
      ).rejects.toThrow('Invalid credentials');
    });
  });

  describe('createSession', () => {
    it('should create a new session', async () => {
      const mockSession = {
        id: 'session123',
        user_id: 'user123',
        active_expires: Date.now() + 1000000,
        idle_expires: Date.now() + 2000000,
        created_at: new Date().toISOString()
      };

      crypto.randomBytes = jest.fn().mockReturnValue({
        toString: jest.fn().mockReturnValue('session123')
      });

      mockPool.query.mockResolvedValueOnce({
        rows: [mockSession]
      });

      const result = await authService.createSession('user123');

      expect(result).toEqual(mockSession);
      expect(mockPool.query).toHaveBeenCalledWith(
        'INSERT INTO user_session (id, user_id, active_expires, idle_expires) VALUES ($1, $2, $3, $4) RETURNING id, user_id, active_expires, idle_expires, created_at',
        expect.any(Array)
      );
    });
  });

  describe('validateSession', () => {
    it('should validate an active session', async () => {
      const mockSession = {
        id: 'session123',
        user_id: 'user123',
        active_expires: Date.now() + 1000000,
        idle_expires: Date.now() + 2000000,
        created_at: new Date().toISOString(),
        username: 'testuser',
        email: 'test@example.com'
      };

      mockPool.query.mockResolvedValueOnce({
        rows: [mockSession]
      });

      jest.spyOn(Date, 'now').mockReturnValue(Date.now());

      const result = await authService.validateSession('session123');

      expect(result).toEqual(mockSession);
    });

    it('should return null for expired session', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      const result = await authService.validateSession('expired123');

      expect(result).toBeNull();
    });
  });

  describe('invalidateSession', () => {
    it('should invalidate a session', async () => {
      mockPool.query.mockResolvedValueOnce({});

      const result = await authService.invalidateSession('session123');

      expect(result).toBe(true);
      expect(mockPool.query).toHaveBeenCalledWith(
        'DELETE FROM user_session WHERE id = $1',
        ['session123']
      );
    });
  });

  describe('invalidateAllUserSessions', () => {
    it('should invalidate all user sessions', async () => {
      mockPool.query.mockResolvedValueOnce({});

      const result = await authService.invalidateAllUserSessions('user123');

      expect(result).toBe(true);
      expect(mockPool.query).toHaveBeenCalledWith(
        'DELETE FROM user_session WHERE user_id = $1',
        ['user123']
      );
    });
  });

  describe('generatePasswordResetToken', () => {
    it('should generate a password reset token', async () => {
      const mockToken = 'resetToken123';
      const mockHash = 'hashedToken123';

      crypto.randomBytes = jest.fn().mockReturnValue({
        toString: jest.fn().mockReturnValue(mockToken)
      });

      crypto.createHash = jest.fn().mockReturnValue({
        update: jest.fn().mockReturnValue({
          digest: jest.fn().mockReturnValue(mockHash)
        })
      });

      mockPool.query.mockResolvedValueOnce({});

      const result = await authService.generatePasswordResetToken('user123');

      expect(result).toEqual({ token: mockToken });
      expect(mockPool.query).toHaveBeenCalledWith(
        'UPDATE users SET password_reset_token = $1 WHERE id = $2',
        [mockHash, 'user123']
      );
    });
  });

  describe('validatePasswordResetToken', () => {
    it('should validate a password reset token', async () => {
      const mockUser = {
        id: 'user123',
        username: 'testuser',
        email: 'test@example.com'
      };

      const mockHash = 'hashedToken123';

      crypto.createHash = jest.fn().mockReturnValue({
        update: jest.fn().mockReturnValue({
          digest: jest.fn().mockReturnValue(mockHash)
        })
      });

      mockPool.query.mockResolvedValueOnce({
        rows: [mockUser]
      });

      const result = await authService.validatePasswordResetToken('token123');

      expect(result).toEqual(mockUser);
    });

    it('should return null for invalid token', async () => {
      const mockHash = 'hashedToken123';

      crypto.createHash = jest.fn().mockReturnValue({
        update: jest.fn().mockReturnValue({
          digest: jest.fn().mockReturnValue(mockHash)
        })
      });

      mockPool.query.mockResolvedValueOnce({ rows: [] });

      const result = await authService.validatePasswordResetToken('invalidToken');

      expect(result).toBeNull();
    });
  });

  describe('resetPassword', () => {
    it('should reset user password', async () => {
      const mockSalt = 'mockSalt';
      const mockHashedPassword = 'mockHashedPassword';

      bcrypt.genSalt = jest.fn().mockResolvedValue(mockSalt);
      bcrypt.hash = jest.fn().mockResolvedValue(mockHashedPassword);

      mockPool.query.mockResolvedValueOnce({});
      mockPool.query.mockResolvedValueOnce({});

      await authService.resetPassword('user123', 'newPassword123');

      expect(mockPool.query).toHaveBeenCalledWith(
        'UPDATE users SET password_hash = $1, password_salt = $2, password_reset_token = NULL WHERE id = $3',
        [mockHashedPassword, mockSalt, 'user123']
      );
    });
  });

  describe('cleanupSessions', () => {
    it('should cleanup expired sessions', async () => {
      const mockRowCount = 5;

      mockPool.query.mockResolvedValueOnce({ rowCount: mockRowCount });

      jest.spyOn(Date, 'now').mockReturnValue(Date.now());

      const result = await authService.cleanupSessions();

      expect(result).toBe(mockRowCount);
    });
  });

  describe('close', () => {
    it('should close the pool connection', async () => {
      mockPool.end.mockResolvedValueOnce(undefined);

      await authService.close();

      expect(mockPool.end).toHaveBeenCalled();
    });
  });
});

