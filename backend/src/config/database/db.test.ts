import pool from "./db.config";
import logger from "../../utils/logger";

export async function testConnection() {
  try {
    const client = await pool.connect();
    logger.info("Connected to PostgreSQL database successfully!");

    // Test query
    const result = await client.query("SELECT NOW()");
    logger.info(`Current timestamp from DB: ${result.rows[0].now}`);

    client.release();
    return true;
  } catch (err) {
    logger.error("Failed to connect to PostgreSQL database:", err);
    return false;
  }
}
