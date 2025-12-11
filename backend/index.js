// index.js
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import session from "express-session";
import dotenv from "dotenv";

import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import passport from "./passport.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;


// CORS
app.use((req, res, next) => {
    next();
});

app.use(
    cors({
        origin: "http://localhost:3000",
        credentials: true
    })
);

// cookieParser
app.use((req, res, next) => {
    next();
});

app.use(cookieParser());

app.use((req, res, next) => {
    next();
});

// JSON
app.use((req, res, next) => {
    next();
});

app.use(express.json());

app.use((req, res, next) => {
    next();
});

// SESSIONS
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

// PASSPORT
app.use(passport.initialize());
app.use(passport.session());

// ROUTES
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);

// START
app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
});
