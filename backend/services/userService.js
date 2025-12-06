const pool = require('../db');

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
}

module.exports = new UserService();