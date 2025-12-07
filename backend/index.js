const express = require('express');
const cors = require('cors');
const pool = require('./db');
const userRoutes = require('./routes/users');
const authRoutes = require('./routes/auth');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'Hello from Express backend!' });
});

app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working!' });
});

app.get('/api/db-test', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ 
      message: 'Database connection successful!',
      timestamp: result.rows[0].now 
    });
  } catch (err) {
    console.error('Database connection error:', err);
    res.status(500).json({ 
      message: 'Database connection failed',
      error: err.message 
    });
  }
});

//rute autentificare
app.use('/api/auth', authRoutes);

//rute crud
app.use('/api/users', userRoutes);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});