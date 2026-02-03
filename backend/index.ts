import express, { Application } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth.js';
import profilesRoutes from './routes/profiles.js';
import contributorApplicationsRoutes from './routes/contributorApplications.js';
import reviewsRoutes from './routes/reviews.js';
import leaderboardRoutes from './routes/leaderboard.js';
import exercisesRoutes from './routes/exercises.js';
import exerciseAttemptRoutes from './routes/exerciseAttempts.js';
import counterRoutes from './routes/counters.js';
import counterEditsRoutes from './routes/counterEdits.js';
import notificationsRoutes from './routes/notifications.js';
import { initCronJobs } from './services/cron.js';
import contributionsRouter from "./routes/contributions.js";

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
app.use('/api/reviews', reviewsRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/contributor-applications', contributorApplicationsRoutes);
app.use('/api/exercises', exercisesRoutes);
app.use('/api/exercise-attempts', exerciseAttemptRoutes);
app.use('/api/counters', counterRoutes);
app.use('/api/counter-edits', counterEditsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use("/api/contributions", contributionsRouter);

initCronJobs().catch(err => {
  console.error('[CRON] Failed to initialize cron jobs:', err);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});
