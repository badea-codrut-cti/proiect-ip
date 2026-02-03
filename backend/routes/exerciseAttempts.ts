import express, { Response } from 'express';
import { randomUUID } from 'crypto';
import { z } from 'zod';
import { counterToKana } from '../counter/index.js';
import { authService, sessionMiddleware, AuthRequest } from '../middleware/auth.js';
import { generatorParameters, fsrs, createEmptyCard, Rating } from 'ts-fsrs';
import type { Card, FSRSParameters } from 'ts-fsrs';
import { computeParameters, FSRSBindingReview, FSRSBindingItem } from '@open-spaced-repetition/binding';
import { calculateWeeklyPoints, getCurrentWeekStart } from '../services/leaderboard.js';
import { checkBadgesOnReview } from '../services/badges.js';

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
const FAST_RESPONSE_TIME = 10000;
const DECENT_RESPONSE_TIME = 20000;

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

function initFsrs(userParams: number[] | null, desiredRetention: number = 0.9) {
  const fsrsParams: FSRSParameters = generatorParameters({
    enable_fuzz: true,
    request_retention: desiredRetention,
    w: userParams || undefined
  });

  return fsrs(fsrsParams);
}

router.get('/pending', sessionMiddleware, async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const pool = authService.getPool();

  try {
    const result = await pool.query(
      `SELECT COUNT(*) as count FROM (
        SELECT DISTINCT ON (counter_id) due, completed_at, scheduled_days
        FROM reviews
        WHERE user_id = $1
        ORDER BY counter_id, completed_at DESC NULLS FIRST, created_at DESC
      ) as latest_states
      WHERE completed_at IS NULL OR due <= CURRENT_TIMESTAMP OR scheduled_days = 0`,
      [req.user.id]
    );

    const dueCountersResult = await pool.query(
      `SELECT counter_id FROM (
        SELECT DISTINCT ON (counter_id) counter_id, due, completed_at, scheduled_days
        FROM reviews
        WHERE user_id = $1
        ORDER BY counter_id, completed_at DESC NULLS FIRST, created_at DESC
      ) as latest_states
      WHERE completed_at IS NULL OR due <= CURRENT_TIMESTAMP OR scheduled_days = 0`,
      [req.user.id]
    );

    return res.status(200).json({
      count: parseInt(result.rows[0].count, 10),
      due_counters: dueCountersResult.rows.map(r => r.counter_id)
    });
  } catch (error) {
    console.error('Failed to fetch pending reviews:', error);
    return res.status(500).json({ error: 'Failed to fetch pending reviews' });
  }
});

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
    // Check for an existing pending review for this counter
    const pendingReviewResult = await pool.query(
      `SELECT r.id, r.generated_number, e.id as exercise_id, e.sentence, e.decimal_points
       FROM reviews r
       JOIN exercises e ON r.exercise_id = e.id
       WHERE r.user_id = $1 AND r.counter_id = $2 AND r.completed_at IS NULL
       LIMIT 1`,
      [req.user.id, counterId]
    );

    if (pendingReviewResult.rowCount > 0) {
      const pendingReview = pendingReviewResult.rows[0];
      return res.status(200).json({
        review_id: pendingReview.id,
        exercise: {
          id: pendingReview.exercise_id,
          sentence: pendingReview.sentence,
          counter_id: counterId,
          decimal_points: Number(pendingReview.decimal_points)
        },
        generated_number: Number(pendingReview.generated_number)
      });
    }

    const exercisesResult = await pool.query(
      `SELECT e.id, e.sentence, e.min_count, e.max_count, e.decimal_points, c.name as counter_name
       FROM exercises e
       JOIN counters c ON e.counter_id = c.id
	   WHERE e.counter_id = $1 AND e.status = 'approved'`,
      [counterId]
    );

    if (exercisesResult.rowCount === 0) {
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

    const lastReviewResult = await pool.query(
      `SELECT stability, difficulty, elapsed_days, scheduled_days, reps, lapses, state, due
       FROM reviews
       WHERE user_id = $1 AND counter_id = $2 AND completed_at IS NOT NULL
       ORDER BY completed_at DESC
       LIMIT 1`,
      [req.user.id, counterId]
    );

    const initialCard = lastReviewResult.rows[0] || createEmptyCard(new Date());
    const reviewId = randomUUID();

    await pool.query(
      `INSERT INTO reviews (
        id, user_id, counter_id, exercise_id, generated_number,
        stability, difficulty, elapsed_days, scheduled_days, reps, lapses, due
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [
        reviewId,
        req.user.id,
        counterId,
        chosenExercise.id,
        generatedNumber,
        initialCard.stability,
        initialCard.difficulty,
        initialCard.elapsed_days,
        initialCard.scheduled_days,
        initialCard.reps,
        initialCard.lapses,
        initialCard.due
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

router.post('/recalculate', sessionMiddleware, async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const pool = authService.getPool();

  try {
    const reviewRows = await pool.query(`
			SELECT rating, counter_id
			FROM reviews
			WHERE user_id = $1
		`, [req.user.id]);

    const reviews = reviewRows.rows.filter((el: any) => el.rating != null);

    if (reviews.length === 0) {
      return res.status(200).json({ message: 'No reviews to recalculate' });
    }

    const groupedReviews = Object.values(reviews.reduce((acc: Record<string, FSRSBindingReview[]>, el) => {
      (acc[el.counter_id] ??= []).push(new FSRSBindingReview(el.rating, acc[el.counter_id].length + 1));
      return acc;
    }, {} as Record<string, FSRSBindingReview[]>));

    const newParams = await computeParameters(groupedReviews.map(el => new FSRSBindingItem(el)));

    await pool.query(`
			UPDATE users
			SET fsrs_params = $1
			WHERE id = $2
		`, [newParams, req.user.id]);

    res.status(200).json({ message: 'FSRS parameters recalculated' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to recalculate' });
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
      `SELECT rs.id, rs.generated_number, rs.completed_at, rs.user_id,
              e.counter_id, c.name as counter_name,
              u.fsrs_params, u.desired_retention,
              rs.stability, rs.difficulty, rs.elapsed_days, rs.scheduled_days, 
              rs.reps, rs.lapses, rs.state, rs.due, 
              EXTRACT(EPOCH FROM rs.created_at) * 1000 as created_at_ms
       FROM reviews rs
       JOIN exercises e ON e.id = rs.exercise_id
       JOIN counters c ON c.id = e.counter_id
       JOIN users u ON u.id = rs.user_id
       WHERE rs.id = $1`,
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
    const fsrsInstance = initFsrs(review.fsrs_params, review.desired_retention);
    const now = new Date();

    // Fetch the incoming state (previous review's result state)
    // The current row's 'state' is NULL (due to constraint)
    const prevReviewResult = await pool.query(
      `SELECT state FROM reviews 
       WHERE user_id = $1 AND counter_id = $2 AND completed_at IS NOT NULL 
       ORDER BY completed_at DESC LIMIT 1`,
      [req.user.id, review.counter_id]
    );
    const incomingState = prevReviewResult.rows[0]?.state ?? 0;

    const card: Card = {
      due: new Date(review.due),
      stability: Number(review.stability),
      difficulty: Number(review.difficulty),
      elapsed_days: Number(review.elapsed_days),
      scheduled_days: Number(review.scheduled_days),
      reps: Number(review.reps),
      lapses: Number(review.lapses),
      state: incomingState,
      last_review: review.reps > 0 ? new Date(review.due) : undefined,
      learning_steps: 0
    };


    const timeDiff = now.getTime() - Number(review.created_at_ms);

    const rating = isCorrect ? timeDiff < FAST_RESPONSE_TIME ? Rating.Easy : timeDiff < DECENT_RESPONSE_TIME ? Rating.Good : Rating.Hard : Rating.Again;
    const schedulingCards = fsrsInstance.repeat(card, now);
    const result = schedulingCards[rating];
    const newCard = result.card;


    await pool.query('BEGIN');

    try {
      const updateResult = await pool.query(
        `UPDATE reviews
         SET completed_at = CURRENT_TIMESTAMP,
             submitted_answer = $1,
             rating = $2,
             state = $3,
             stability = $4,
             difficulty = $5,
             elapsed_days = $6,
             scheduled_days = $7,
             reps = $8,
             lapses = $9,
             due = $10
         WHERE id = $11
         RETURNING rating`,
        [
          answer,
          rating,
          newCard.state,
          newCard.stability,
          newCard.difficulty,
          newCard.elapsed_days,
          newCard.scheduled_days,
          newCard.reps,
          newCard.lapses,
          newCard.due,
          reviewId
        ]
      );

      const userResult = await pool.query(
        `UPDATE users
         SET xp = xp + $1
         WHERE id = $2
         RETURNING xp`,
        [xpAwarded, req.user.id]
      );

      const newXp = userResult.rows[0].xp;
      const oldXp = newXp - xpAwarded;
      const levelsGained = Math.floor(newXp / 500) - Math.floor(oldXp / 500);

      if (levelsGained > 0) {
        const gemsAwarded = levelsGained * 10;
        await pool.query(
          `UPDATE users SET gems = gems + $1 WHERE id = $2`,
          [gemsAwarded, req.user.id]
        );
      }

      const weeklyPoints = calculateWeeklyPoints(rating);
      if (weeklyPoints > 0) {
        const weekStart = getCurrentWeekStart();
        await pool.query(
          `INSERT INTO weekly_leaderboard (user_id, week_start, points)
           VALUES ($1, $2, $3)
           ON CONFLICT (user_id, week_start)
           DO UPDATE SET points = weekly_leaderboard.points + $3`,
          [req.user.id, weekStart, weeklyPoints]
        );
      }

      await pool.query('COMMIT');

      checkBadgesOnReview(pool, req.user.id, rating, isCorrect).catch(err => {
        console.error('Error checking badges:', err);
      });

      return res.status(200).json({
        correct: isCorrect,
        xp_awarded: xpAwarded,
        total_xp: userResult.rows[0].xp,
        expected_answer: expectedAnswer,
        rating: updateResult.rows[0].rating,
        state: newCard.state
      });
    } catch (transactionError) {
      await pool.query('ROLLBACK').catch(() => { });
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

