import { apiClient } from '../api';

// Mock fetch globally
global.fetch = jest.fn();

describe('API Client', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  describe('getUsers', () => {
    test('should return users on successful request', async () => {
      const mockUsers = [
        { id: 1, name: 'John Doe', email: 'john@example.com' },
        { id: 2, name: 'Jane Smith', email: 'jane@example.com' }
      ];
      
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockUsers,
      });

      const users = await apiClient.getUsers();

      expect(users).toEqual(mockUsers);
      expect(fetch).toHaveBeenCalledWith('http://localhost:5000/api/users');
    });

    test('should throw error on failed request', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      await expect(apiClient.getUsers()).rejects.toThrow('API Error: 500');
    });
  });

  describe('createUser', () => {
    test('should create user with valid data', async () => {
      const newUser = { name: 'New User', email: 'new@example.com' };
      const createdUser = { id: 3, name: 'New User', email: 'new@example.com' };
      
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => createdUser,
      });

      const result = await apiClient.createUser(newUser);

      expect(result).toEqual(createdUser);
      expect(fetch).toHaveBeenCalledWith('http://localhost:5000/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newUser),
      });
    });
  });

  describe('updateUser', () => {
    test('should update user successfully', async () => {
      const updatedUser = { id: 1, name: 'Updated Name', email: 'updated@example.com' };
      const updateData = { name: 'Updated Name', email: 'updated@example.com' };
      
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => updatedUser,
      });

      const result = await apiClient.updateUser(1, updateData);

      expect(result).toEqual(updatedUser);
      expect(fetch).toHaveBeenCalledWith('http://localhost:5000/api/users/1', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });
    });
  });

  describe('deleteUser', () => {
    test('should delete user successfully', async () => {
      const deleteResponse = { message: 'User deleted successfully' };
      
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => deleteResponse,
      });

      const result = await apiClient.deleteUser(1);

      expect(result).toEqual(deleteResponse);
      expect(fetch).toHaveBeenCalledWith('http://localhost:5000/api/users/1', {
        method: 'DELETE',
      });
    });
  });

  describe('testConnection', () => {
    test('should return connection test result', async () => {
      const testResponse = { message: 'API is working!' };
      
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => testResponse,
      });

      const result = await apiClient.testConnection();

      expect(result).toEqual(testResponse);
      expect(fetch).toHaveBeenCalledWith('http://localhost:5000/api/test');
    });
  });
});