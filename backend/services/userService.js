// services/userService.js
import pool from "../db.js";
import crypto from "crypto";

class UserService {
    // register nou
    async createUser({ username, email, passwordHash }) {
        const id = crypto.randomUUID();

        const result = await pool.query(
            `INSERT INTO users (id, username, email, password_hash, xp)
             VALUES ($1, $2, $3, $4, 0)
             RETURNING id, username, email, xp`,
            [id, username, email, passwordHash]
        );

        return result.rows[0];
    }

    async getUserById(id) {
        const result = await pool.query(
            "SELECT id, username, email, xp FROM users WHERE id = $1",
            [id]
        );
        return result.rows[0] || null;
    }

    async findUserByEmail(email) {
        const result = await pool.query(
            "SELECT id, username, email, xp FROM users WHERE LOWER(email) = LOWER($1)",
            [email]
        );
        return result.rows[0] || null;
    }

    // pentru login 
    async getUserByEmailWithPassword(email) {
        const result = await pool.query(
            "SELECT id, username, email, xp, password_hash FROM users WHERE LOWER(email) = LOWER($1)",
            [email]
        );
        return result.rows[0] || null;
    }

    async getAllUsers() {
        const result = await pool.query(
            "SELECT id, username, email, xp FROM users ORDER BY username"
        );
        return result.rows;
    }

    async deleteUser(id) {
        const result = await pool.query(
            "DELETE FROM users WHERE id = $1 RETURNING id",
            [id]
        );
        return result.rows.length > 0;
    }

    async updateProfile(id, username, email) {
        const result = await pool.query(
            `UPDATE users
             SET username = $1, email = $2
             WHERE id = $3
             RETURNING id, username, email, xp`,
            [username, email, id]
        );
        return result.rows[0];
    }

    async updatePassword(id, passwordHash) {
        await pool.query(
            `UPDATE users
             SET password_hash = $1
             WHERE id = $2`,
            [passwordHash, id]
        );
    }

    async addXP(id, amount) {
        const result = await pool.query(
            `UPDATE users
             SET xp = xp + $1
             WHERE id = $2
             RETURNING id, username, email, xp`,
            [amount, id]
        );
        return result.rows[0];
    }

    calculateLevel(xp) {
        return Math.floor(Math.sqrt(xp / 100));
    }

    async getProfile(id) {
        const user = await this.getUserById(id);
        if (!user) return null;
        const level = this.calculateLevel(user.xp);
        return { ...user, level };
    }

    // reset password tokens
    async createPasswordResetToken(userId) {
        const tokenRaw = crypto.randomBytes(32).toString("hex");
        const tokenHash = crypto
            .createHash("sha256")
            .update(tokenRaw)
            .digest("hex");

        const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

        await pool.query(
            `
            INSERT INTO password_reset_tokens (user_id, token_hash, expires_at, used)
            VALUES ($1, $2, $3, FALSE)
            `,
            [userId, tokenHash, expiresAt]
        );

        return tokenRaw;
    }

    async validateAndConsumePasswordResetToken(tokenRaw) {
        const tokenHash = crypto
            .createHash("sha256")
            .update(tokenRaw)
            .digest("hex");

        const result = await pool.query(
            `
            SELECT prt.id AS token_id, prt.user_id, prt.expires_at, prt.used,
                   u.email, u.username
            FROM password_reset_tokens prt
            JOIN users u ON u.id = prt.user_id
            WHERE prt.token_hash = $1
            `,
            [tokenHash]
        );

        if (result.rows.length === 0) return null;

        const row = result.rows[0];

        if (row.used) return null;
        if (new Date(row.expires_at) < new Date()) return null;

        await pool.query(
            "UPDATE password_reset_tokens SET used = TRUE WHERE id = $1",
            [row.token_id]
        );

        return {
            id: row.user_id,
            email: row.email,
            username: row.username
        };
    }

    async cleanExpiredTokens() {
        await pool.query(
            "DELETE FROM password_reset_tokens WHERE expires_at < NOW() OR used = TRUE"
        );
    }
}

export default new UserService();
