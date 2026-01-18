import express, { Response } from 'express';
import { sessionMiddleware, AuthRequest, authService } from '../middleware/auth.js';
import { userProfileUpdateSchema } from '../validators/profile.js';

const router = express.Router();

router.put('/me', sessionMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }

  const parseResult = userProfileUpdateSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ error: parseResult.error.issues[0].message });
    return;
  }

  const { displayName, email, password, currentPassword } = parseResult.data;
  const hasUpdates = Boolean(displayName || email || password);

  if (!hasUpdates) {
    res.status(400).json({ error: 'Provide a new display name, email, or password to update' });
    return;
  }

  if (!currentPassword) {
    res.status(400).json({ error: 'Current password is required to make changes' });
    return;
  }

  const pool = authService.getPool();

  try {
    const userResult = await pool.query(
      'SELECT id, username, email, display_name, password_hash FROM users WHERE id = $1',
      [req.user.id]
    );

    if (userResult.rows.length === 0) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const userRecord = userResult.rows[0];
    const isPasswordValid = await authService.verifyPassword(currentPassword, userRecord.password_hash);

    if (!isPasswordValid) {
      res.status(401).json({ error: 'Current password is incorrect', field: 'currentPassword' });
      return;
    }

    const updates: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (displayName && displayName !== userRecord.display_name) {
      updates.push(`display_name = $${paramIndex++}`);
      values.push(displayName);
    }

    if (email && email !== userRecord.email) {
      const emailConflict = await pool.query(
        'SELECT 1 FROM users WHERE email = $1 AND id <> $2',
        [email, req.user.id]
      );

      if (emailConflict.rows.length > 0) {
        res.status(409).json({ error: 'Email already in use', field: 'email' });
        return;
      }

      updates.push(`email = $${paramIndex++}`);
      values.push(email);
    }

    let passwordChanged = false;

    if (password) {
      const { hashedPassword, salt } = await authService.hashPassword(password);
      updates.push(`password_hash = $${paramIndex++}`);
      values.push(hashedPassword);
      updates.push(`password_salt = $${paramIndex++}`);
      values.push(salt);
      passwordChanged = true;
    }

    if (updates.length === 0) {
      res.status(400).json({
        error: 'No changes detected. Please provide a different display name, email, or password.'
      });
      return;
    }

    values.push(req.user.id);
    const updateQuery = `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING id, username, email, display_name`;

    const updatedResult = await pool.query(updateQuery, values);
    const updatedUser = updatedResult.rows[0];

    if (passwordChanged) {
      await authService.invalidateAllUserSessions(req.user.id);
    }

    res.status(200).json({
      message: 'Profile updated successfully',
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        displayName: updatedUser.display_name
      }
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

export default router;

