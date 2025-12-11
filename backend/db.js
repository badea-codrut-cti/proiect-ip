import pkg from "pg";
import dotenv from "dotenv";

dotenv.config(); 

const { Pool } = pkg;

console.log("[DB] DATABASE_URL =", process.env.DATABASE_URL);

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

pool.connect()
    .then(() => console.log("[DB] Connected successfully!"))
    .catch(err => console.error("[DB] Connection error:", err));

export default pool;
