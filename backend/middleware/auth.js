import AuthService from "../db.js";

export const authService = new AuthService({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

export const sessionMiddleware = async (req, res, next) => {
  const sessionId = req.cookies?.sessionId || req.headers.authorization?.replace('Bearer ', '');
  
  if (sessionId) {
    try {
      const session = await authService.validateSession(sessionId);
      if (session) {
        req.user = session;
        req.session = session;
      }
      next();
    } catch (error) {
      next();
    }
  } else {
    next();
  }
};

export const adminMiddleware = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  
  try {
    const result = await authService.getPool().query(
      'SELECT is_admin FROM users WHERE id = $1',
      [req.user.user_id]
    );
    
    if (result.rows.length === 0 || !result.rows[0].is_admin) {
      return res.status(403).json({ error: "Admin access required" });
    }
    
    next();
  } catch (error) {
    console.error('Admin middleware error:', error);
    return res.status(500).json({ error: "Server error" });
  }
};