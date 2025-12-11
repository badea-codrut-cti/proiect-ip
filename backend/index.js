import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth.js';

import session from "express-session";
import dotenv from "dotenv";
import userRoutes from "./routes/users.js";
import passport from "./passport.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT;

app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));



app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

//sesiune pentru Passport.js
app.use(
    session({
        secret: process.env.SESSION_SECRET || "cheie_secreta",
        resave: false,
        saveUninitialized: false,
        cookie: {
            httpOnly: true,
            secure: false, 
            sameSite: "lax"
        }
    })
);

app.use(passport.initialize());
app.use(passport.session());

app.get('/', (req, res) => {
  res.json({ message: 'Hello from Express backend with custom auth!' });
});

app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working!' });
});

app.use('/api/auth', authRoutes);
app.use("/api/users", userRoutes);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});
