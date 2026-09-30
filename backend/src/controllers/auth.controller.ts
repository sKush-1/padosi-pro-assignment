import { FastifyRequest, FastifyReply } from "fastify";
import bcrypt from "bcrypt";
import pool from "../config/database/db.config";
import { hashPassword, compareUserPassword } from "../utils/bcrypt.util";
import {
  createUserAccessToken,
  createUserRefreshToken,
  verifyRefreshToken,
} from "../utils/jwt.util";
import { sendResponse } from "../utils/sendresponse.util";
import { sendOtpEmail } from "../services/sendEmail.service";
import { generateOtp } from "../utils/generateOtp.util";
import {
  validateRegister,
  validateLogin,
  validateSendOtp,
  validateVerifyOtp,
} from "../utils/validation/auth.validation";

const OTP_EXPIRY_MINUTES = 10;
const OTP_MAX_ATTEMPTS = 5;
const OTP_RESEND_COOLDOWN_SECONDS = 30;

// ─── Shared helpers ───────────────────────────────────────────────────────────

function setAuthCookies(reply: FastifyReply, userId: string): void {
  const accessToken = createUserAccessToken({ user_id: userId });
  const refreshToken = createUserRefreshToken({ user_id: userId });
  const prod = process.env.NODE_ENV === "production";

  reply.setCookie("accessToken", accessToken, {
    httpOnly: true,
    secure: prod,
    sameSite: "strict",
    path: "/",
    maxAge: 15 * 60,
  });

  reply.setCookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: prod,
    sameSite: "strict",
    path: "/api/v1/auth/refresh",
    maxAge: 7 * 24 * 60 * 60,
  });
}

async function issueOtp(userId: string, email: string): Promise<void> {
  const otp = generateOtp();
  const otp_hash = await bcrypt.hash(otp, 10);
  const expires_at = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  await pool.query(
    `UPDATE users
        SET otp_hash         = $1,
            otp_expires_at   = $2,
            otp_attempts     = 0,
            last_otp_sent_at = NOW()
      WHERE id = $3`,
    [otp_hash, expires_at, userId],
  );

  await sendOtpEmail(email, otp);
}

// ─── POST /auth/register ──────────────────────────────────────────────────────
// Creates the account AND immediately sends the OTP — one request, two results.
export async function register(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const v = validateRegister(request.body);
  if (!v.valid) return sendResponse(reply, 400, false, v.error);
  const { email, password } = v.value;

  try {
    const existing = await pool.query(
      "SELECT id, is_verified FROM users WHERE email = $1",
      [email],
    );

    if (existing.rows.length > 0) {
      const msg = existing.rows[0].is_verified
        ? "An account with this email already exists."
        : "This email is already registered but not yet verified. Use /resend-otp to get a new code.";
      return sendResponse(reply, 409, false, msg);
    }

    const password_hash = await hashPassword(password);
    const { rows } = await pool.query(
      "INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id",
      [email, password_hash],
    );

    await issueOtp(rows[0].id, email);

    return sendResponse(
      reply,
      201,
      false,
      "Account created. A 6-digit verification code has been sent to your email.",
    );
  } catch (err) {
    request.log.error(err);
    return sendResponse(reply, 500, true, "Internal server error.");
  }
}

// ─── POST /auth/verify-otp ────────────────────────────────────────────────────
// Verifies OTP → marks account verified → issues JWT tokens.
export async function verifyOtp(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const v = validateVerifyOtp(request.body);
  if (!v.valid) return sendResponse(reply, 400, false, v.error);
  const { email, otp } = v.value;

  try {
    const { rows } = await pool.query(
      `SELECT id, is_verified, otp_hash, otp_expires_at, otp_attempts,
              name, phone, address, business_name
         FROM users WHERE email = $1`,
      [email],
    );

    if (rows.length === 0) return sendResponse(reply, 400, false, "Invalid email or OTP.");

    const user = rows[0];

    if (user.is_verified) {
      return sendResponse(reply, 400, false, "Email already verified. Please log in.");
    }
    if (!user.otp_hash || !user.otp_expires_at) {
      return sendResponse(reply, 400, false, "No code found. Use /resend-otp to request one.");
    }
    if (user.otp_attempts >= OTP_MAX_ATTEMPTS) {
      return sendResponse(reply, 429, false, "Too many attempts. Use /resend-otp for a new code.");
    }
    if (new Date() > new Date(user.otp_expires_at)) {
      return sendResponse(reply, 400, false, "Code expired. Use /resend-otp for a new one.");
    }

    const match = await bcrypt.compare(otp, user.otp_hash);
    if (!match) {
      await pool.query(
        "UPDATE users SET otp_attempts = otp_attempts + 1 WHERE id = $1",
        [user.id],
      );
      const left = OTP_MAX_ATTEMPTS - (user.otp_attempts + 1);
      return sendResponse(
        reply,
        400,
        false,
        left > 0
          ? `Incorrect code. ${left} attempt(s) remaining.`
          : "Too many attempts. Use /resend-otp for a new code.",
      );
    }

    await pool.query(
      `UPDATE users
          SET is_verified    = true,
              otp_hash       = NULL,
              otp_expires_at = NULL,
              otp_attempts   = 0,
              updated_at     = NOW()
        WHERE id = $1`,
      [user.id],
    );

    setAuthCookies(reply, user.id);

    return sendResponse(reply, 200, false, 'Email verified. You are now logged in.', {
      access_token: createUserAccessToken({ user_id: user.id }),
      refresh_token: createUserRefreshToken({ user_id: user.id }),
      user: { id: user.id, email, name: user.name, phone: user.phone, address: user.address, business_name: user.business_name },
    });
  } catch (err) {
    request.log.error(err);
    return sendResponse(reply, 500, true, "Internal server error.");
  }
}

// ─── POST /auth/resend-otp ────────────────────────────────────────────────────
// Sends a fresh OTP to an unverified account (30-second cooldown).
export async function resendOtp(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const v = validateSendOtp(request.body);
  if (!v.valid) return sendResponse(reply, 400, false, v.error);
  const { email } = v.value;

  try {
    const { rows } = await pool.query(
      "SELECT id, is_verified, last_otp_sent_at FROM users WHERE email = $1",
      [email],
    );

    // Generic response to avoid email enumeration
    if (rows.length === 0 || rows[0].is_verified) {
      return sendResponse(reply, 200, false, "If that email is registered and unverified, a new code has been sent.");
    }

    const user = rows[0];
    if (user.last_otp_sent_at) {
      const elapsed = (Date.now() - new Date(user.last_otp_sent_at).getTime()) / 1000;
      if (elapsed < OTP_RESEND_COOLDOWN_SECONDS) {
        const wait = Math.ceil(OTP_RESEND_COOLDOWN_SECONDS - elapsed);
        return sendResponse(reply, 429, false, `Please wait ${wait}s before requesting a new code.`);
      }
    }

    await issueOtp(user.id, email);
    return sendResponse(reply, 200, false, "A new 6-digit code has been sent to your email.");
  } catch (err) {
    request.log.error(err);
    return sendResponse(reply, 500, true, "Internal server error.");
  }
}

// ─── POST /auth/login ─────────────────────────────────────────────────────────
export async function login(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const v = validateLogin(request.body);
  if (!v.valid) return sendResponse(reply, 400, false, v.error);
  const { email, password } = v.value;

  try {
    const { rows } = await pool.query(
      "SELECT id, password_hash, is_verified, name, phone, address, business_name FROM users WHERE email = $1",
      [email],
    );

    if (rows.length === 0) return sendResponse(reply, 401, false, "Invalid email or password.");

    const user = rows[0];
    const match = await compareUserPassword(password, user.password_hash);
    if (!match) return sendResponse(reply, 401, false, "Invalid email or password.");

    if (!user.is_verified) {
      return sendResponse(reply, 403, false, "Email not verified. Please verify your email to log in.", { redirect: "verify" });
    }

    setAuthCookies(reply, user.id);

    return sendResponse(reply, 200, false, 'Login successful.', {
      access_token: createUserAccessToken({ user_id: user.id }),
      refresh_token: createUserRefreshToken({ user_id: user.id }),
      user: { id: user.id, email, name: user.name, phone: user.phone, address: user.address, business_name: user.business_name },
    });
  } catch (err) {
    request.log.error(err);
    return sendResponse(reply, 500, true, "Internal server error.");
  }
}

// ─── POST /auth/logout ────────────────────────────────────────────────────────
export async function logout(_request: FastifyRequest, reply: FastifyReply): Promise<void> {
  reply.clearCookie("accessToken", { path: "/" });
  reply.clearCookie("refreshToken", { path: "/api/v1/auth/refresh" });
  return sendResponse(reply, 200, false, "Logged out successfully.");
}

// ─── GET /auth/refresh ────────────────────────────────────────────────────────
export async function refreshAccessToken(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const token = request.cookies.refreshToken;
  if (!token) return sendResponse(reply, 401, false, "Refresh token missing.");

  try {
    const decoded = verifyRefreshToken(token);
    const { rows } = await pool.query(
      "SELECT id FROM users WHERE id = $1 AND is_verified = true",
      [decoded.user_id],
    );
    if (rows.length === 0) return sendResponse(reply, 401, false, "User not found.");

    const accessToken = createUserAccessToken({ user_id: decoded.user_id });
    reply.setCookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 15 * 60,
    });

    return sendResponse(reply, 200, false, "Token refreshed.");
  } catch {
    return sendResponse(reply, 401, false, "Invalid or expired refresh token.");
  }
}

// ─── GET /auth/me ─────────────────────────────────────────────────────────────
export async function me(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  try {
    const { rows } = await pool.query(
      "SELECT id, email, name, phone, address, business_name, is_verified, created_at FROM users WHERE id = $1",
      [request.user_id],
    );
    if (rows.length === 0) return sendResponse(reply, 404, false, "User not found.");
    return sendResponse(reply, 200, false, "User details fetched.", rows[0]);
  } catch (err) {
    request.log.error(err);
    return sendResponse(reply, 500, true, "Internal server error.");
  }
}
