// routes/users.js
import express from "express";
import { z } from "zod";
import bcrypt from "bcryptjs";
import userService from "../services/userService.js";

const router = express.Router();

// middleware
function requireAuth(req, res, next) {
    console.log("\n=== REQUIRE AUTH (Passport) ===");
    console.log("req.isAuthenticated():", req.isAuthenticated?.());
    console.log("req.user:", req.user);

    if (!req.isAuthenticated || !req.isAuthenticated()) {
        return res.status(401).json({ error: "Not authenticated" });
    }

    next();
}

// GET /api/users/me
router.get("/me", requireAuth, async (req, res) => {
    const userId = req.user.id;
    const profile = await userService.getProfile(userId);

    if (!profile) return res.status(404).json({ error: "User not found" });

    res.json(profile);
});

// schema pentru update
const updateSchema = z.object({
    username: z.string().min(3),
    email: z.string().email(),
    newPassword: z.string().min(6).optional()
});

// PUT /api/users/me/update
router.put("/me/update", requireAuth, async (req, res) => {
    console.log("=== UPDATE START ===");

    try {
        const { username, email, newPassword } = updateSchema.parse(req.body);

        const userId = req.user.id;
        const normalizedEmail = email.toLowerCase();

        // verificam email
        const existing = await userService.findUserByEmail(normalizedEmail);
        if (existing && existing.id !== userId) {
            return res.status(400).json({ error: "Email already in use" });
        }

        // update profil
        const updatedUser = await userService.updateProfile(
            userId,
            username,
            normalizedEmail
        );

        // update parola 
        if (newPassword) {
            const passwordHash = await bcrypt.hash(newPassword, 10);
            await userService.updatePassword(userId, passwordHash);
        }

        // update req user
        req.user.username = updatedUser.username;
        req.user.email = updatedUser.email;

        res.json({
            message: "Profile updated successfully",
            user: updatedUser
        });
    } catch (err) {
        console.error("UPDATE ERROR:", err);

        if (err instanceof z.ZodError) {
            return res
                .status(400)
                .json({ error: "Invalid data", details: err.errors });
        }

        res.status(500).json({ error: "Update failed" });
    }
});

export default router;
