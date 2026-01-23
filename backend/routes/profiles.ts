import express, { Response } from "express";
import { sessionMiddleware, AuthRequest } from "../middleware/auth.js";
import { authService } from "../middleware/auth.js";

const router = express.Router();

router.get("/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    const pool = authService.getPool();

    const userResult = await pool.query(
      `SELECT u.id, u.username, u.email, u.xp, u.gems, u.joined_at, u.current_profile_picture_id,
              pp.name as current_profile_picture_name, pp.description as current_profile_picture_description
       FROM users u
       LEFT JOIN profile_pictures pp ON u.current_profile_picture_id = pp.id
       WHERE u.id = $1`,
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = userResult.rows[0];

    const ownedPicturesResult = await pool.query(
      `SELECT pp.id, pp.name, pp.description, pp.cost
       FROM profile_pictures pp
       JOIN user_profile_pictures upp ON pp.id = upp.profile_picture_id
       WHERE upp.user_id = $1
       ORDER BY pp.cost, pp.name`,
      [userId]
    );

    const reviewStatsResult = await pool.query(
      `SELECT DATE(completed_at) as date, COUNT(*) as count
       FROM reviews
       WHERE user_id = $1 AND completed_at IS NOT NULL
       GROUP BY DATE(completed_at)
       ORDER BY date DESC`,
      [userId]
    );

    const reviewHistory = reviewStatsResult.rows.reduce((acc: Record<string, number>, row) => {
      const dateStr = new Date(row.date).toISOString().split('T')[0];
      acc[dateStr] = parseInt(row.count);
      return acc;
    }, {});

    return res.status(200).json({
      id: user.id,
      username: user.username,
      email: user.email,
      xp: user.xp,
      gems: user.gems,
      joined_at: user.joined_at,
      current_profile_picture: user.current_profile_picture_id ? {
        id: user.current_profile_picture_id,
        name: user.current_profile_picture_name,
        description: user.current_profile_picture_description
      } : null,
      owned_profile_pictures: ownedPicturesResult.rows,
      review_history: reviewHistory
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Server error" });
  }
});

router.post("/buy-profile-picture", sessionMiddleware, async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const { profilePictureId } = req.body;

  if (!profilePictureId || typeof profilePictureId !== 'string') {
    return res.status(400).json({ error: "Valid profile picture ID required" });
  }

  try {
    const pool = authService.getPool();

    const pictureResult = await pool.query(
      'SELECT id, name, cost FROM profile_pictures WHERE id = $1',
      [profilePictureId]
    );

    if (pictureResult.rows.length === 0) {
      return res.status(404).json({ error: "Profile picture not found" });
    }

    const picture = pictureResult.rows[0];

    const ownershipResult = await pool.query(
      'SELECT 1 FROM user_profile_pictures WHERE user_id = $1 AND profile_picture_id = $2',
      [req.user.id, profilePictureId]
    );

    if (ownershipResult.rows.length > 0) {
      return res.status(400).json({ error: "You already own this profile picture" });
    }

    const userResult = await pool.query(
      'SELECT gems FROM users WHERE id = $1',
      [req.user.id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const userGems = userResult.rows[0].gems;

    if (userGems < picture.cost) {
      return res.status(400).json({
        error: "Insufficient gems",
        required: picture.cost,
        available: userGems
      });
    }

    await pool.query('BEGIN');

    try {
      await pool.query(
        'UPDATE users SET gems = gems - $1 WHERE id = $2',
        [picture.cost, req.user.id]
      );

      await pool.query(
        'INSERT INTO user_profile_pictures (user_id, profile_picture_id) VALUES ($1, $2)',
        [req.user.id, profilePictureId]
      );

      await pool.query('COMMIT');

      return res.status(200).json({
        success: true,
        message: `Successfully purchased ${picture.name}`,
        gems_remaining: userGems - picture.cost
      });
    } catch (error) {
      await pool.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Server error" });
  }
});

router.get("/profile-pictures/available", async (req, res) => {
  try {
    const pool = authService.getPool();

    const result = await pool.query(
      'SELECT id, name, description, cost FROM profile_pictures ORDER BY cost, name'
    );

    return res.status(200).json({
      profile_pictures: result.rows
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Server error" });
  }
});

router.post("/set-profile-picture", sessionMiddleware, async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const { profilePictureId } = req.body;

  if (profilePictureId !== null && typeof profilePictureId !== 'string') {
    return res.status(400).json({ error: "Valid profile picture ID required or null" });
  }

  try {
    const pool = authService.getPool();

    if (profilePictureId !== null) {
      const ownershipResult = await pool.query(
        'SELECT 1 FROM user_profile_pictures WHERE user_id = $1 AND profile_picture_id = $2',
        [req.user.id, profilePictureId]
      );

      if (ownershipResult.rows.length === 0) {
        return res.status(400).json({ error: "You don't own this profile picture" });
      }
    }

    await pool.query(
      'UPDATE users SET current_profile_picture_id = $1 WHERE id = $2',
      [profilePictureId, req.user.id]
    );

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Server error" });
  }
});

router.get("/badges/all", async (req, res) => {
  try {
    const pool = authService.getPool();

    const badgesResult = await pool.query(
      `SELECT id, code, name, description
       FROM badges
       ORDER BY id`
    );

    return res.status(200).json(badgesResult.rows);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;
