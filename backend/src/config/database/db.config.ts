import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

const connectionString = process.env.DATABASE_URL;

const pool = connectionString
  ? new Pool({
      connectionString,
      ssl:
        connectionString.includes("sslmode=require") ||
        process.env.DB_SSL === "true" ||
        connectionString.includes("neon.tech")
          ? { rejectUnauthorized: false }
          : undefined,
    })
  : new Pool({
      host: process.env.DB_HOST || "localhost",
      port: parseInt(process.env.DB_PORT as string) || 5432,
      user: process.env.DB_USER || "postgres",
      password: process.env.DB_PASSWORD || "postgres",
      database: process.env.DB_NAME || "padosi_pro",
      ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
    });

export default pool;
