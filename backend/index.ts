import express, { Application } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth.js';
import profilesRoutes from './routes/profiles.js';
import contributorApplicationsRoutes from './routes/contributorApplications.js';
import exercisesRoutes from './routes/exercises.js';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '3000');

app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get('/', (req, res) => {
  res.json({ message: 'Hello from Express backend with custom auth!' });
});

app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working!' });
});

app.use('/api/auth', authRoutes);
app.use('/api/profiles', profilesRoutes);
app.use('/api/contributor-applications', contributorApplicationsRoutes);
app.use('/api/exercises', exercisesRoutes);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});
