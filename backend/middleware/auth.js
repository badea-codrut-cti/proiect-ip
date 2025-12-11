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
