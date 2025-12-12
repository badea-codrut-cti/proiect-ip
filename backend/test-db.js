import { Pool } from 'pg';

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'myapp',
  user: 'postgres',
  password: 'postgres'
});

async function test() {
  try {
    const result = await pool.query('SELECT 1 as test');
    console.log('Database connection successful:', result.rows[0]);
  } catch (error) {
    console.error('Database connection error:', error.message);
  } finally {
    await pool.end();
  }
}

test();