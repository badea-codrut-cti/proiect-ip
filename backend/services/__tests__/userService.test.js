const userService = require('../userService');
const pool = require('../../db');

jest.mock('../../db');

describe('UserService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllUsers', () => {
    test('should return all users', async () => {
      const mockUsers = [
        { id: 1, name: 'John Doe', email: 'john@example.com' },
        { id: 2, name: 'Jane Smith', email: 'jane@example.com' }
      ];
      
      pool.query.mockResolvedValue({ rows: mockUsers });
      
      const users = await userService.getAllUsers();
      
      expect(users).toEqual(mockUsers);
      expect(pool.query).toHaveBeenCalledWith('SELECT id, name, email FROM users ORDER BY name');
      expect(pool.query).toHaveBeenCalledTimes(1);
    });

    test('should return empty array when no users exist', async () => {
      pool.query.mockResolvedValue({ rows: [] });
      
      const users = await userService.getAllUsers();
      
      expect(users).toEqual([]);
      expect(pool.query).toHaveBeenCalledTimes(1);
    });
  });

  describe('getUserById', () => {
    test('should return user when found', async () => {
      const mockUser = { id: 1, name: 'John Doe', email: 'john@example.com' };
      pool.query.mockResolvedValue({ rows: [mockUser] });
      
      const user = await userService.getUserById(1);
      
      expect(user).toEqual(mockUser);
      expect(pool.query).toHaveBeenCalledWith('SELECT id, name, email FROM users WHERE id = $1', [1]);
    });

    test('should return null when user not found', async () => {
      pool.query.mockResolvedValue({ rows: [] });
      
      const user = await userService.getUserById(999);
      
      expect(user).toBeNull();
    });
  });

  describe('createUser', () => {
    test('should create new user', async () => {
      const newUser = { name: 'New User', email: 'new@example.com' };
      const createdUser = { id: 3, name: 'New User', email: 'new@example.com' };
      
      pool.query.mockResolvedValue({ rows: [createdUser] });
      
      const result = await userService.createUser(newUser);
      
      expect(result).toEqual(createdUser);
      expect(pool.query).toHaveBeenCalledWith(
        'INSERT INTO users (name, email) VALUES ($1, $2) RETURNING id, name, email',
        ['New User', 'new@example.com']
      );
    });
  });

  describe('updateUser', () => {
    test('should update existing user', async () => {
      const updatedUser = { id: 1, name: 'Updated Name', email: 'updated@example.com' };
      pool.query.mockResolvedValue({ rows: [updatedUser] });
      
      const result = await userService.updateUser(1, { name: 'Updated Name', email: 'updated@example.com' });
      
      expect(result).toEqual(updatedUser);
      expect(pool.query).toHaveBeenCalledWith(
        'UPDATE users SET name = $1, email = $2 WHERE id = $3 RETURNING id, name, email',
        ['Updated Name', 'updated@example.com', 1]
      );
    });

    test('should return null when user to update is not found', async () => {
      pool.query.mockResolvedValue({ rows: [] });
      
      const result = await userService.updateUser(999, { name: 'Test', email: 'test@example.com' });
      
      expect(result).toBeNull();
    });
  });

  describe('deleteUser', () => {
    test('should delete existing user', async () => {
      pool.query.mockResolvedValue({ rows: [{ id: 1 }] });
      
      const result = await userService.deleteUser(1);
      
      expect(result).toBe(true);
      expect(pool.query).toHaveBeenCalledWith('DELETE FROM users WHERE id = $1 RETURNING id', [1]);
    });

    test('should return false when user to delete is not found', async () => {
      pool.query.mockResolvedValue({ rows: [] });
      
      const result = await userService.deleteUser(999);
      
      expect(result).toBe(false);
    });
  });

  describe('getUserCount', () => {
    test('should return user count', async () => {
      pool.query.mockResolvedValue({ rows: [{ count: '42' }] });
      
      const count = await userService.getUserCount();
      
      expect(count).toBe(42);
      expect(pool.query).toHaveBeenCalledWith('SELECT COUNT(*) FROM users');
    });
  });
});