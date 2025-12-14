import request from 'supertest';
import express from 'express';
import userRoutes from '../users.js';
import { authService } from '../../middleware/auth.js';

// Mock the middleware
jest.mock('../../middleware/auth.js', () => {
  const mockQuery = jest.fn();

  return {
    __esModule: true,
    authService: {
      getPool: jest.fn(() => ({
        query: mockQuery
      }))
    }
  };
});

const app = express();
app.use(express.json());
app.use('/api/users', userRoutes);

describe('User Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/users', () => {
    test('should return all users', async () => {
      const mockUsers = [
        { id: 1, name: 'John Doe', email: 'john@example.com' },
        { id: 2, name: 'Jane Smith', email: 'jane@example.com' }
      ];

      (authService.getPool().query as jest.Mock).mockResolvedValue({ rows: mockUsers });

      const response = await request(app).get('/api/users');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockUsers);
    });

    test('should handle errors when fetching users', async () => {
      (authService.getPool().query as jest.Mock).mockRejectedValue(new Error('Database error'));

      const response = await request(app).get('/api/users');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Failed to fetch users' });
    });
  });

  describe('GET /api/users/:id', () => {
    test('should return user when found', async () => {
      const mockUser = { id: 1, name: 'John Doe', email: 'john@example.com' };
      (authService.getPool().query as jest.Mock).mockResolvedValue({ rows: [mockUser] });

      const response = await request(app).get('/api/users/1');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockUser);
    });

    test('should return 404 when user not found', async () => {
      (authService.getPool().query as jest.Mock).mockResolvedValue({ rows: [] });

      const response = await request(app).get('/api/users/999');

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'User not found' });
    });

    test('should handle errors when fetching user', async () => {
      (authService.getPool().query as jest.Mock).mockRejectedValue(new Error('Database error'));

      const response = await request(app).get('/api/users/1');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Failed to fetch user' });
    });
  });

  describe('POST /api/users', () => {
    test('should create new user with valid data', async () => {
      const newUser = { name: 'New User', email: 'new@example.com' };
      const createdUser = { id: 3, name: 'New User', email: 'new@example.com' };
      (authService.getPool().query as jest.Mock).mockResolvedValue({ rows: [createdUser] });

      const response = await request(app)
        .post('/api/users')
        .send(newUser);

      expect(response.status).toBe(201);
      expect(response.body).toEqual(createdUser);
    });

    test('should return 400 when name is missing', async () => {
      const invalidUser = { email: 'test@example.com' };

      const response = await request(app)
        .post('/api/users')
        .send(invalidUser);

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Name and email are required' });
    });

    test('should return 400 when email is missing', async () => {
      const invalidUser = { name: 'Test User' };

      const response = await request(app)
        .post('/api/users')
        .send(invalidUser);

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Name and email are required' });
    });

    test('should handle errors when creating user', async () => {
      const newUser = { name: 'New User', email: 'new@example.com' };
      (authService.getPool().query as jest.Mock).mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .post('/api/users')
        .send(newUser);

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Failed to create user' });
    });
  });

  describe('PUT /api/users/:id', () => {
    test('should update user with valid data', async () => {
      const updatedUser = { id: 1, name: 'Updated Name', email: 'updated@example.com' };
      (authService.getPool().query as jest.Mock).mockResolvedValue({ rows: [updatedUser] });

      const response = await request(app)
        .put('/api/users/1')
        .send({ name: 'Updated Name', email: 'updated@example.com' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(updatedUser);
    });

    test('should return 404 when user not found', async () => {
      (authService.getPool().query as jest.Mock).mockResolvedValue({ rows: [] });

      const response = await request(app)
        .put('/api/users/999')
        .send({ name: 'Test', email: 'test@example.com' });

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'User not found' });
    });

    test('should return 400 when required fields are missing', async () => {
      const response = await request(app)
        .put('/api/users/1')
        .send({ name: 'Test' });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Name and email are required' });
    });
  });

  describe('DELETE /api/users/:id', () => {
    test('should delete user successfully', async () => {
      (authService.getPool().query as jest.Mock).mockResolvedValue({ rows: [{ id: 1 }] });

      const response = await request(app).delete('/api/users/1');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ message: 'User deleted successfully' });
    });

    test('should return 404 when user not found', async () => {
      (authService.getPool().query as jest.Mock).mockResolvedValue({ rows: [] });

      const response = await request(app).delete('/api/users/999');

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'User not found' });
    });
  });
});
