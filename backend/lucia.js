import { lucia } from "lucia";
import { express } from "lucia/middleware";
import pg from "pg";
import { pg as pgAdapter } from "@lucia-auth/adapter-pg";

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://localhost:5432/myapp"
});

export const auth = lucia({
  adapter: pgAdapter(pool, {
    user: "users",
    key: "user_key",
    session: "user_session"
  }),
  env: process.env.NODE_ENV === "development" ? "DEV" : "PROD",
  middleware: express(),
  getUserAttributes: (data) => {
    return {
      username: data.username
    };
  }
});

export type Auth = typeof auth;