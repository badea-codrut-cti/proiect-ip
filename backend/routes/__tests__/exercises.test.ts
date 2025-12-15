import request from 'supertest';
import express from 'express';
import exercisesRouter from '../exercises.js';

// Mock the middleware and authService - define mockQuery at module level
const mockQuery = jest.fn();

jest.mock('../../middleware/auth.js', () => ({
  authService: {
    getPool: jest.fn(() => ({
      query: mockQuery
    }))
  },
  sessionMiddleware: (req: any, res: any, next: any) => {
    req.user = { user_id: 'test-user-id', username: 'testuser', email: 'test@example.com' };
    next();
  },
  adminMiddleware: (req: any, res: any, next: any) => {
    req.user = { user_id: 'admin-user-id', username: 'admin', email: 'admin@example.com' };
    next();
  }
}));

const app = express();
app.use(express.json());
app.use('/exercises', exercisesRouter);

describe('Exercises Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockQuery.mockReset();
  });

  describe('GET /exercises/pending', () => {
    it('should return pending exercises for admin', async () => {
      const mockExercises = [
        {
          id: 'exercise-1',
          created_by: 'user-1',
          counter_id: 'counter-1',
          sentence: 'Test sentence with <ans> placeholder',
          min_count: 1,
          max_count: 10,
          decimal_points: 0,
          status: 'pending',
          created_at: new Date().toISOString(),
          created_by_username: 'testuser',
          counter_name: 'Test Counter'
        }
      ];

      mockQuery.mockResolvedValueOnce({ rows: mockExercises });

      const response = await request(app)
        .get('/exercises/pending')
        .expect(200);

      expect(response.body).toEqual(mockExercises);
    });
  });

  describe('POST /exercises', () => {
    it('should create a new exercise proposal for contributor', async () => {
      const mockUser = { is_contributor: true };
      const mockCounter = { id: 'counter-1' };
      const mockExercise = {
        id: 'new-exercise-id',
        created_by: 'test-user-id',
        counter_id: 'counter-1',
        sentence: 'Test sentence with <ans> placeholder',
        min_count: 1,
        max_count: 10,
        decimal_points: 0,
        status: 'pending',
        created_at: new Date().toISOString()
      };

      mockQuery
        .mockResolvedValueOnce({ rows: [mockUser] })
        .mockResolvedValueOnce({ rows: [mockCounter] })
        .mockResolvedValueOnce({ rows: [mockExercise] });

      const response = await request(app)
        .post('/exercises')
        .send({
          counter_id: 'counter-1',
          sentence: 'Test sentence with <ans> placeholder',
          min_count: 1,
          max_count: 10,
          decimal_points: 0
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.exercise).toEqual(mockExercise);
    });

    it('should reject exercise without <ans> placeholder', async () => {
      const mockUser = { is_contributor: true };

      mockQuery.mockResolvedValueOnce({ rows: [mockUser] });

      const response = await request(app)
        .post('/exercises')
        .send({
          counter_id: 'counter-1',
          sentence: 'Test sentence without placeholder',
          min_count: 1,
          max_count: 10,
          decimal_points: 0
        })
        .expect(400);

      expect(response.body.error).toContain("must contain at least one '<ans>' placeholder");
    });

    it('should reject exercise from non-contributor', async () => {
      const mockUser = { is_contributor: false };

      mockQuery.mockResolvedValueOnce({ rows: [mockUser] });

      const response = await request(app)
        .post('/exercises')
        .send({
          counter_id: 'counter-1',
          sentence: 'Test sentence with <ans> placeholder',
          min_count: 1,
          max_count: 10,
          decimal_points: 0
        })
        .expect(403);

      expect(response.body.error).toBe('Contributor access required');
    });
  });

  describe('POST /exercises/:id/approve', () => {
    it('should approve a pending exercise', async () => {
      const mockExercise = {
        id: 'exercise-1',
        created_by: 'user-1',
        counter_id: 'counter-1',
        sentence: 'Test sentence with <ans> placeholder',
        min_count: 1,
        max_count: 10,
        decimal_points: 0,
        status: 'pending'
      };

      mockQuery
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({ rows: [mockExercise] })
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({});

      const response = await request(app)
        .post('/exercises/exercise-1/approve')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Exercise approved successfully');
    });

    it('should reject approval for non-existent exercise', async () => {
      mockQuery
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({});

      const response = await request(app)
        .post('/exercises/non-existent-id/approve')
        .expect(404);

      expect(response.body.error).toBe('Exercise not found or not pending');
    });
  });

  describe('POST /exercises/:id/reject', () => {
    it('should reject a pending exercise', async () => {
      const mockExercise = {
        id: 'exercise-1',
        created_by: 'user-1',
        counter_id: 'counter-1',
        sentence: 'Test sentence with <ans> placeholder',
        min_count: 1,
        max_count: 10,
        decimal_points: 0,
        status: 'pending'
      };

      mockQuery
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({ rows: [mockExercise] })
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({});

      const response = await request(app)
        .post('/exercises/exercise-1/reject')
        .send({ reason: 'Not appropriate' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Exercise rejected successfully');
    });
  });
});
