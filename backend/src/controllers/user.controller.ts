import { FastifyRequest, FastifyReply } from "fastify";
import pool from "../config/database/db.config";
import { sendResponse } from "../utils/sendresponse.util";
import { validateProfile } from "../utils/validation/user.validation";

// ─── PATCH /user/profile ──────────────────────────────────────────────────────
export async function updateProfile(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const validation = validateProfile(request.body);
  if (!validation.valid) {
    return sendResponse(reply, 400, false, validation.error);
  }
  const { name, phone, address, business_name } = validation.value;

  try {
    // Check phone uniqueness (exclude current user)
    const phoneCheck = await pool.query(
      "SELECT id FROM users WHERE phone = $1 AND id != $2",
      [phone, request.user_id],
    );
    if (phoneCheck.rows.length > 0) {
      return sendResponse(
        reply,
        409,
        false,
        "This mobile number is already registered with another account.",
      );
    }

    const result = await pool.query(
      `UPDATE users
         SET name          = $1,
             phone         = $2,
             address       = $3,
             business_name = $4,
             updated_at    = NOW()
       WHERE id = $5
       RETURNING id, email, name, phone, address, business_name, updated_at`,
      [name, phone, address, business_name ?? null, request.user_id],
    );

    if (result.rows.length === 0) {
      return sendResponse(reply, 404, false, "User not found.");
    }

    return sendResponse(reply, 200, false, "Profile updated successfully.", result.rows[0]);
  } catch (err) {
    request.log.error(err);
    return sendResponse(reply, 500, true, "Internal server error.");
  }
}

// ─── GET /user/profile ────────────────────────────────────────────────────────
export async function getProfile(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  try {
    const result = await pool.query(
      `SELECT id, email, name, phone, address, business_name, is_verified, created_at, updated_at
         FROM users WHERE id = $1`,
      [request.user_id],
    );
    if (result.rows.length === 0) {
      return sendResponse(reply, 404, false, "User not found.");
    }
    return sendResponse(reply, 200, false, "Profile fetched.", result.rows[0]);
  } catch (err) {
    request.log.error(err);
    return sendResponse(reply, 500, true, "Internal server error.");
  }
}
