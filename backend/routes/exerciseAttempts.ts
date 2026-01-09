import express, { Response } from 'express';
import { randomUUID } from 'crypto';
import { z } from 'zod';
import { counterToKana } from '../counter/index.js';
import { authService, sessionMiddleware, AuthRequest } from '../middleware/auth.js';

const router = express.Router();

const requestExerciseSchema = z.object({
  counterId: z.string().min(1)
});

const submitExerciseSchema = z.object({
  reviewId: z.string().min(1),
  answer: z.string().min(1)
});

const XP_REWARD_CORRECT = 30;
const XP_REWARD_INCORRECT = 5;
const REVIEW_STATE_AGAIN = 0;
const REVIEW_STATE_GOOD = 2;
const REVIEW_RATING_PENDING = 2;
const REVIEW_RATING_CORRECT = 4;
const REVIEW_RATING_INCORRECT = 1;

function generateRandomNumber(min: number, max: number, decimalPoints: number): number {
  const safeDecimalPoints = Math.max(0, Math.trunc(decimalPoints));

  if (min === max) {
    return Number(min.toFixed(safeDecimalPoints));
  }

  const range = max - min;
  const randomValue = Math.random() * range + min;
  const factor = 10 ** safeDecimalPoints;
  const rounded = Math.round(randomValue * factor) / factor;
  const clamped = Math.min(Math.max(rounded, min), max);

  return Number(clamped.toFixed(safeDecimalPoints));
}

router.post('/request', sessionMiddleware, async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const parseResult = requestExerciseSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ error: parseResult.error.issues[0].message });
  }

  const { counterId } = parseResult.data;
  const pool = authService.getPool();

  try {
    const exercisesResult = await pool.query(
      `SELECT e.id, e.sentence, e.min_count, e.max_count, e.decimal_points, c.name as counter_name
       FROM exercises e
       JOIN counters c ON e.counter_id = c.id
       WHERE e.counter_id = $1 AND e.is_approved = TRUE`,
      [counterId]
    );

    if (exercisesResult.rows.length === 0) {
      return res.status(404).json({ error: 'No approved exercises available for this counter' });
    }

    const exercises = exercisesResult.rows;
    const chosenExercise = exercises[Math.floor(Math.random() * exercises.length)];

    const minCount = Number(chosenExercise.min_count);
    const maxCount = Number(chosenExercise.max_count);
    const decimalPoints = Number(chosenExercise.decimal_points) || 0;

    if (Number.isNaN(minCount) || Number.isNaN(maxCount) || minCount > maxCount) {
      return res.status(500).json({ error: 'Invalid exercise configuration' });
    }

    const generatedNumber = generateRandomNumber(minCount, maxCount, decimalPoints);

    let kanaAnswer: string;

    try {
      kanaAnswer = counterToKana(chosenExercise.counter_name, generatedNumber);
    } catch (error) {
      console.error('Counter to kana conversion failed:', error);
      return res.status(500).json({ error: 'Failed to derive answer for the requested counter' });
    }

    const reviewId = randomUUID();

    await pool.query(
      `INSERT INTO reviews (id, user_id, counter_id, exercise_id, generated_number, rating, state)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        reviewId,
        req.user.id,
        counterId,
        chosenExercise.id,
        generatedNumber,
        REVIEW_RATING_PENDING,
        REVIEW_STATE_AGAIN
      ]
    );

    return res.status(201).json({
      review_id: reviewId,
      exercise: {
        id: chosenExercise.id,
        sentence: chosenExercise.sentence,
        counter_id: counterId,
        decimal_points: decimalPoints
      },
      generated_number: generatedNumber
    });
  } catch (error) {
    console.error('Exercise request failed:', error);
    return res.status(500).json({ error: 'Failed to request exercise' });
  }
});

router.post('/submit', sessionMiddleware, async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const parseResult = submitExerciseSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ error: parseResult.error.issues[0].message });
  }

  const { reviewId, answer } = parseResult.data;
  const pool = authService.getPool();

  try {
    const reviewResult = await pool.query(
      `SELECT r.id, r.generated_number, r.completed_at, r.user_id, r.state,
              c.name as counter_name
       FROM reviews r
       JOIN counters c ON c.id = r.counter_id
       WHERE r.id = $1`,
      [reviewId]
    );

    if (reviewResult.rows.length === 0) {
      return res.status(404).json({ error: 'Review attempt not found' });
    }

    const review = reviewResult.rows[0];

    if (review.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Review does not belong to the authenticated user' });
    }

    if (review.completed_at) {
      return res.status(400).json({ error: 'This review has already been completed' });
    }

    const generatedNumber = Number(review.generated_number);
    const expectedAnswer = counterToKana(review.counter_name, generatedNumber);
    const isCorrect = expectedAnswer === answer;
    const xpAwarded = isCorrect ? XP_REWARD_CORRECT : XP_REWARD_INCORRECT;
    const newState = isCorrect ? REVIEW_STATE_GOOD : REVIEW_STATE_AGAIN;
    const newRating = isCorrect ? REVIEW_RATING_CORRECT : REVIEW_RATING_INCORRECT;

    await pool.query('BEGIN');

    try {
      const updateResult = await pool.query(
        `UPDATE reviews
         SET completed_at = CURRENT_TIMESTAMP,
             submitted_answer = $1,
             rating = $2,
             state = $3
         WHERE id = $4
         RETURNING rating`,
        [answer, newRating, newState, reviewId]
      );

      const userResult = await pool.query(
        `UPDATE users
         SET xp = xp + $1
         WHERE id = $2
         RETURNING xp`,
        [xpAwarded, req.user.id]
      );

      await pool.query('COMMIT');

      return res.status(200).json({
        correct: isCorrect,
        xp_awarded: xpAwarded,
        total_xp: userResult.rows[0].xp,
        expected_answer: expectedAnswer,
        rating: updateResult.rows[0].rating,
        state: newState
      });
    } catch (transactionError) {
      await pool.query('ROLLBACK').catch(() => {});
      throw transactionError;
    }
  } catch (error) {
    console.error('Exercise submission failed:', error);
    if (error instanceof Error && error.message.includes('Counter')) {
      return res.status(500).json({ error: 'Failed to evaluate the submitted answer' });
    }
    return res.status(500).json({ error: 'Failed to submit exercise answer' });
  }
});

export default router;

