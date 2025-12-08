const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'fsrs_app',
  user: process.env.DB_USER || 'fsrs',
  password: process.env.DB_PASSWORD || '123456',
});

module.exports = pool;