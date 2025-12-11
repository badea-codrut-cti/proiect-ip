// routes/auth.js
import express from "express";
import { z } from "zod";
import bcrypt from "bcryptjs";
import passport from "../passport.js";
import userService from "../services/userService.js";

const router = express.Router();

// Zod schemas
const registerSchema = z.object({
    username: z.string().min(3),
    email: z.string().email(),
    password: z.string().min(6)
});

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6)
});

const forgotSchema = z.object({
    email: z.string().email()
});

const resetSchema = z.object({
    token: z.string().min(1),
    password: z.string().min(6)
});

// POST /auth/register
router.post("/register", async (req, res) => {
    console.log("\n=== REGISTER ATTEMPT ===");
    console.log("[REQ BODY]:", req.body);

    try {
        const { username, email, password } = registerSchema.parse(req.body);
        const normalizedEmail = email.toLowerCase();

        const existing = await userService.findUserByEmail(normalizedEmail);
        if (existing) {
            return res.status(400).json({ error: "Email already exists!" });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const user = await userService.createUser({
            username,
            email: normalizedEmail,
            passwordHash
        });

        // login automat
        req.logIn(user, (err) => {
            if (err) {
                console.error("[REGISTER] req.logIn error:", err);
                return res.status(500).json({ error: "Login after register failed" });
            }

            res.status(201).json({
                message: "User registered successfully!",
                user
            });
        });
    } catch (err) {
        console.error("REGISTER ERROR:", err);

        if (err instanceof z.ZodError) {
            return res
                .status(400)
                .json({ error: "Invalid data", details: err.errors });
        }

        res.status(500).json({ error: "Internal server error" });
    }
});

// POST /auth/login
router.post("/login", (req, res, next) => {
    console.log("\n=== LOGIN ATTEMPT ===");
    console.log("[REQ BODY]:", req.body);

    try {
        loginSchema.parse(req.body);
    } catch (err) {
        if (err instanceof z.ZodError) {
            return res
                .status(400)
                .json({ error: "Invalid data", details: err.errors });
        }
        return res.status(400).json({ error: "Invalid data" });
    }

    passport.authenticate("local", (err, user, info) => {
        if (err) {
            console.error("[LOGIN] Error:", err);
            return next(err);
        }

        if (!user) {
            return res
                .status(401)
                .json({ error: info?.message || "Invalid email or password" });
        }

        req.logIn(user, (err) => {
            if (err) {
                console.error("[LOGIN] req.logIn error:", err);
                return next(err);
            }

            return res.json({
                message: "Logged in",
                user
            });
        });
    })(req, res, next);
});

// POST /auth/logout
router.post("/logout", (req, res, next) => {
    console.log("\n=== LOGOUT ATTEMPT ===");

    req.logout((err) => {
        if (err) {
            console.error("[LOGOUT ERROR]:", err);
            return next(err);
        }

        res.json({ message: "Logged out" });
    });
});

// POST /auth/forgot-password
router.post("/forgot-password", async (req, res) => {
    console.log("\n=== FORGOT PASSWORD ATTEMPT ===");

    try {
        const { email } = forgotSchema.parse(req.body);
        const normalizedEmail = email.toLowerCase();

        const user = await userService.findUserByEmail(normalizedEmail);

        if (user) {
            console.log("[FORGOT] User found:", user.id);
            const token = await userService.createPasswordResetToken(user.id);

            console.log("[FORGOT] Temporary reset link:");
            console.log(`http://localhost:3000/reset-password/${token}`);
        } else {
            console.log("[FORGOT] No user found (silent).");
        }

        res.json({
            message: "If the email exists, a reset link has been sent."
        });
    } catch (err) {
        console.error("FORGOT PASSWORD ERROR:", err);

        if (err instanceof z.ZodError) {
            return res
                .status(400)
                .json({ error: "Invalid data", details: err.errors });
        }

        res.status(500).json({ error: "Failed to generate reset token" });
    }
});

// POST /auth/reset-password
router.post("/reset-password", async (req, res) => {
    console.log("\n=== RESET PASSWORD ATTEMPT ===");

    try {
        const { token, password } = resetSchema.parse(req.body);

        const user = await userService.validateAndConsumePasswordResetToken(token);

        if (!user) {
            return res.status(400).json({ error: "Invalid or expired token" });
        }

        const passwordHash = await bcrypt.hash(password, 10);
        await userService.updatePassword(user.id, passwordHash);

        res.json({ message: "Password reset successfully" });
    } catch (err) {
        console.error("RESET PASSWORD ERROR:", err);

        if (err instanceof z.ZodError) {
            return res
                .status(400)
                .json({ error: "Invalid data", details: err.errors });
        }

        res.status(500).json({ error: "Password reset failed" });
    }
});

export default router;
