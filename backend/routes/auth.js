const express = require("express");
const router = express.Router();
const userService = require("../services/userService");

// Autentificarea utilizatorului pentru rute protejate
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  // daca nu e autorizat
  if (!authHeader)
    return res.status(401).json({ error: "Authorization header missing" });

  // format corect: "Bearer TOKEN"
  const token = authHeader.split(" ")[1];

  if (!token)
    return res.status(401).json({ error: "Token missing" });

  try {
    // verificare token
    const decoded = userService.verifyToken(token);

    // salavre date
    req.user = decoded;

    next(); 
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

// Ruta protejata pentru profil
router.get("/user/me", authMiddleware, async (req, res) => {
  userService.getProfile(req, res);
});



// Register
router.post("/auth/register", async (req, res) => {
  userService.register(req, res);
});

// Login
router.post("/auth/login", async (req, res) => {
  userService.login(req, res);
});

// Request reset password token
router.post("/auth/forgot-password", async (req, res) => {
  userService.requestPasswordReset(req, res);
});

// Resetare parola
router.post("/auth/reset-password", async (req, res) => {
  userService.resetPassword(req, res);
});

// Update user profile
router.put("/user/update", authMiddleware, async (req, res) => {
  userService.updateProfile(req, res);
});

module.exports = router;
