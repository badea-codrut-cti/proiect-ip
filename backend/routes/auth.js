import express from "express";
import { auth } from "../lucia.js";
import { LuciaError } from "lucia";

const router = express.Router();

// Sign up route
router.post("/signup", async (req, res) => {
  const { username, password } = req.body;
  
  // Basic validation
  if (typeof username !== "string" || username.length < 4 || username.length > 31) {
    return res.status(400).json({ error: "Invalid username. Must be 4-31 characters." });
  }
  if (typeof password !== "string" || password.length < 6 || password.length > 255) {
    return res.status(400).json({ error: "Invalid password. Must be 6-255 characters." });
  }

  try {
    const user = await auth.createUser({
      key: {
        providerId: "username",
        providerUserId: username.toLowerCase(),
        password: password
      },
      attributes: {
        username: username
      }
    });

    const session = await auth.createSession({
      userId: user.userId,
      attributes: {}
    });

    const authRequest = auth.handleRequest(req, res);
    authRequest.setSession(session);

    return res.status(201).json({
      success: true,
      user: {
        id: user.userId,
        username: user.attributes.username
      }
    });
  } catch (e) {
    // Check for unique constraint error
    if (e.message && e.message.includes("duplicate key value violates unique constraint")) {
      return res.status(400).json({ error: "Username already taken" });
    }
    
    console.error("Signup error:", e);
    return res.status(500).json({ error: "An unknown error occurred" });
  }
});

// Login route
router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  // Basic validation
  if (typeof username !== "string" || username.length < 1 || username.length > 31) {
    return res.status(400).json({ error: "Invalid username" });
  }
  if (typeof password !== "string" || password.length < 1 || password.length > 255) {
    return res.status(400).json({ error: "Invalid password" });
  }

  try {
    const key = await auth.useKey("username", username.toLowerCase(), password);
    const session = await auth.createSession({
      userId: key.userId,
      attributes: {}
    });

    const authRequest = auth.handleRequest(req, res);
    authRequest.setSession(session);

    return res.status(200).json({
      success: true,
      user: {
        id: key.userId,
        username: key.userAttributes.username
      }
    });
  } catch (e) {
    if (e instanceof LuciaError) {
      if (e.message === "AUTH_INVALID_KEY_ID" || e.message === "AUTH_INVALID_PASSWORD") {
        return res.status(400).json({ error: "Incorrect username or password" });
      }
    }
    
    console.error("Login error:", e);
    return res.status(500).json({ error: "An unknown error occurred" });
  }
});

// Get current user
router.get("/me", async (req, res) => {
  const authRequest = auth.handleRequest(req, res);
  const session = await authRequest.validate();
  
  if (!session) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  return res.status(200).json({
    user: {
      id: session.user.userId,
      username: session.user.username
    }
  });
});

// Logout
router.post("/logout", async (req, res) => {
  const authRequest = auth.handleRequest(req, res);
  const session = await authRequest.validate();
  
  if (!session) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  await auth.invalidateSession(session.sessionId);
  authRequest.setSession(null);

  return res.status(200).json({ success: true });
});

export default router;