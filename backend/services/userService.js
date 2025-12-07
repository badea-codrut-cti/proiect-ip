const pool = require('../db');
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto"); // generare token random


// Validare
function validateEmail(email) {
  return email && email.includes("@") && email.includes(".");
}



class UserService {
  async getAllUsers() {
    const result = await pool.query('SELECT id, name, email FROM users ORDER BY name');
    return result.rows;
  }

  async getUserById(id) {
    const result = await pool.query('SELECT id, name, email FROM users WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  async createUser(userData) {
    const { name, email } = userData;
    const result = await pool.query(
      'INSERT INTO users (name, email) VALUES ($1, $2) RETURNING id, name, email',
      [name, email]
    );
    return result.rows[0];
  }

  async updateUser(id, userData) {
    const { name, email } = userData;
    const result = await pool.query(
      'UPDATE users SET name = $1, email = $2 WHERE id = $3 RETURNING id, name, email',
      [name, email, id]
    );
    return result.rows[0] || null;
  }

  async deleteUser(id) {
    const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);
    return result.rows.length > 0;
  }

  async getUserCount() {
    const result = await pool.query('SELECT COUNT(*) FROM users');
    return parseInt(result.rows[0].count);
  }





  // verificare token
  verifyToken(token) {
    return jwt.verify(token, process.env.JWT_SECRET);
  }


  // Ruta protejata pentru profil
  async getProfile(req, res) {
    try {
      const result = await pool.query(
        "SELECT id, username, email, xp FROM users WHERE id = $1",
        [req.user.id]
      );

      if (result.rows.length === 0)
        return res.status(404).json({ error: "User not found" });

      const user = result.rows[0];

      // Calculam nivelul
      function calculateLevel(xp) {
        let level = 0;
        while (xp >= 100 * (level + 1) * (level + 1)) {
          level++;
        }
        return level;
      }

      const level = calculateLevel(user.xp);

      res.json({
        id: user.id,
        username: user.username,
        email: user.email,
        xp: user.xp,
        level: level
      });

    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Could not get user data" });
    }
  }


  // Register
  async register(req, res) {
    try {
      const { username, email, password } = req.body;

      // validari
      if (!username || !email || !password)
        return res.status(400).json({ error: "All fields are required" });

      if (!validateEmail(email))
        return res.status(400).json({ error: "Invalid email" });

      // user existent
      const exists = await pool.query(
        "SELECT id FROM users WHERE email = $1 LIMIT 1",
        [email]
      );

      if (exists.rows.length > 0)
        return res.status(400).json({ error: "Email already registered" });

      // hash parola
      const hashed = await bcrypt.hash(password, 10);

      // inserare user
      const result = await pool.query(
        `INSERT INTO users (username, email, password_hash, password_salt)
         VALUES ($1, $2, $3, '') RETURNING id, username, email`,
        [username, email, hashed]
      );

      res.json({
        message: "User created",
        user: result.rows[0]
      });

    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Registration failed" });
    }
  }



  // Login
  async login(req, res) {
    try {
      const { email, password } = req.body;

      // validare
      if (!email || !password)
        return res.status(400).json({ error: "Email and password required" });

      // exista email
      const result = await pool.query(
        "SELECT * FROM users WHERE email = $1 LIMIT 1",
        [email]
      );

      if (result.rows.length === 0)
        return res.status(400).json({ error: "User not found" });

      const user = result.rows[0];

      // verificare parola
      const ok = await bcrypt.compare(password, user.password_hash);

      if (!ok)
        return res.status(400).json({ error: "Wrong password" });

      const token = jwt.sign(
        { id: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );

      res.json({
        message: "Login successful",
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email
        }
      });

    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Login failed" });
    }
  }



  // Request reset password token
  async requestPasswordReset(req, res) {
    try {
      const { email } = req.body;

      if (!email)
        return res.status(400).json({ error: "Email is required" });

      const userResult = await pool.query(
        "SELECT id FROM users WHERE email = $1",
        [email]
      );

      if (userResult.rows.length === 0)
        return res.status(400).json({ error: "User not found" });

      const userId = userResult.rows[0].id;

      // generam token random
      const token = crypto.randomBytes(32).toString("hex");

      // expiră in 60m
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

      // salvam token în DB
      await pool.query(
        `INSERT INTO password_reset_tokens (user_id, token, expires_at)
         VALUES ($1, $2, $3)`,
        [userId, token, expiresAt]
      );

      // MOCK EMAIL 
      console.log("====== RESET PASSWORD EMAIL ======");
      console.log(`Reset link: http://localhost:3000/reset-password/${token}`);
      console.log("=================================");

      res.json({
        message: "Password reset link sent to email (mock)",
        token // îl trimitem și în response pentru testare
      });

    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to generate reset token" });
    }
  }



  // Resetare parola
  async resetPassword(req, res) {
    try {
      const { token, newPassword } = req.body;

      if (!token || !newPassword)
        return res.status(400).json({ error: "Token and new password required" });

      // cautam token-ul in DB
      const result = await pool.query(
        `SELECT * FROM password_reset_tokens 
         WHERE token = $1`,
        [token]
      );

      if (result.rows.length === 0)
        return res.status(400).json({ error: "Invalid token" });

      const entry = result.rows[0];

      // verificam daca token-ul a expirat
      if (new Date(entry.expires_at) < new Date())
        return res.status(400).json({ error: "Token expired" });

      // verificam daca a fost deja folosit
      if (entry.used)
        return res.status(400).json({ error: "Token already used" });

      // hash parola noua
      const hashed = await bcrypt.hash(newPassword, 10);

      // actualizam parola in users
      await pool.query(
        "UPDATE users SET password_hash = $1 WHERE id = $2",
        [hashed, entry.user_id]
      );

      // marcam token-ul ca folosit
      await pool.query(
        "UPDATE password_reset_tokens SET used = TRUE WHERE id = $1",
        [entry.id]
      );

      res.json({ message: "Password reset successfully" });

    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Password reset failed" });
    }
  }



  // Update user profile
  async updateProfile(req, res) {
    try {
      const { username, email, newPassword } = req.body;
      const userId = req.user.id;

      // Validari
      if (!username || !email)
        return res.status(400).json({ error: "Username and email are required" });

      if (!validateEmail(email))
        return res.status(400).json({ error: "Invalid email format" });

      // Verificam dacă email-ul este folosit de alt user
      const emailExists = await pool.query(
        "SELECT id FROM users WHERE email = $1 AND id != $2",
        [email, userId]
      );

      if (emailExists.rows.length > 0)
        return res.status(400).json({ error: "Email already in use" });

      // Daca userul vrea sa schimbe parola
      let hashedPassword = null;
      if (newPassword) {
        if (newPassword.length < 6)
          return res.status(400).json({ error: "Password must be at least 6 characters" });

        hashedPassword = await bcrypt.hash(newPassword, 10);
      }

      // Construim query-ul dinamic
      const updateFields = ["username = $1", "email = $2"];
      const values = [username, email];
      let index = 3;

      if (hashedPassword) {
        updateFields.push(`password_hash = $${index}`);
        values.push(hashedPassword);
        index++;
      }

      values.push(userId);

      const query = `
        UPDATE users
        SET ${updateFields.join(", ")}
        WHERE id = $${index}
        RETURNING id, username, email, xp
      `;

      const result = await pool.query(query, values);

      res.json({
        message: "Profile updated successfully",
        user: result.rows[0]
      });

    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Profile update failed" });
    }
  }
}

module.exports = new UserService();