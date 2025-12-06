const request = require('supertest');
const express = require('express');
const userRoutes = require('../users');
const userService = require('../../services/userService');

jest.mock('../../services/userService');

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
      userService.getAllUsers.mockResolvedValue(mockUsers);

      const response = await request(app).get('/api/users');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockUsers);
      expect(userService.getAllUsers).toHaveBeenCalledTimes(1);
    });

    test('should handle errors when fetching users', async () => {
      userService.getAllUsers.mockRejectedValue(new Error('Database error'));

      const response = await request(app).get('/api/users');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Failed to fetch users' });
    });
  });

  describe('GET /api/users/:id', () => {
    test('should return user when found', async () => {
      const mockUser = { id: 1, name: 'John Doe', email: 'john@example.com' };
      userService.getUserById.mockResolvedValue(mockUser);

      const response = await request(app).get('/api/users/1');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockUser);
      expect(userService.getUserById).toHaveBeenCalledWith('1');
    });

    test('should return 404 when user not found', async () => {
      userService.getUserById.mockResolvedValue(null);

      const response = await request(app).get('/api/users/999');

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'User not found' });
    });

    test('should handle errors when fetching user', async () => {
      userService.getUserById.mockRejectedValue(new Error('Database error'));

      const response = await request(app).get('/api/users/1');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Failed to fetch user' });
    });
  });

  describe('POST /api/users', () => {
    test('should create new user with valid data', async () => {
      const newUser = { name: 'New User', email: 'new@example.com' };
      const createdUser = { id: 3, name: 'New User', email: 'new@example.com' };
      userService.createUser.mockResolvedValue(createdUser);

      const response = await request(app)
        .post('/api/users')
        .send(newUser);

      expect(response.status).toBe(201);
      expect(response.body).toEqual(createdUser);
      expect(userService.createUser).toHaveBeenCalledWith(newUser);
    });

    test('should return 400 when name is missing', async () => {
      const invalidUser = { email: 'test@example.com' };

      const response = await request(app)
        .post('/api/users')
        .send(invalidUser);

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Name and email are required' });
      expect(userService.createUser).not.toHaveBeenCalled();
    });

    test('should return 400 when email is missing', async () => {
      const invalidUser = { name: 'Test User' };

      const response = await request(app)
        .post('/api/users')
        .send(invalidUser);

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Name and email are required' });
      expect(userService.createUser).not.toHaveBeenCalled();
    });

    test('should handle errors when creating user', async () => {
      const newUser = { name: 'New User', email: 'new@example.com' };
      userService.createUser.mockRejectedValue(new Error('Database error'));

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
      userService.updateUser.mockResolvedValue(updatedUser);

      const response = await request(app)
        .put('/api/users/1')
        .send({ name: 'Updated Name', email: 'updated@example.com' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(updatedUser);
    });

    test('should return 404 when user not found', async () => {
      userService.updateUser.mockResolvedValue(null);

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
      expect(userService.updateUser).not.toHaveBeenCalled();
    });
  });

  describe('DELETE /api/users/:id', () => {
    test('should delete user successfully', async () => {
      userService.deleteUser.mockResolvedValue(true);

      const response = await request(app).delete('/api/users/1');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ message: 'User deleted successfully' });
      expect(userService.deleteUser).toHaveBeenCalledWith('1');
    });

    test('should return 404 when user not found', async () => {
      userService.deleteUser.mockResolvedValue(false);

      const response = await request(app).delete('/api/users/999');

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'User not found' });
    });
  });
});