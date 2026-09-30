import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

/**
 * Uses Mailpit (local mail catcher) by default.
 * Set SMTP_HOST / SMTP_PORT / EMAIL_USER / EMAIL_PASS in .env for a real SMTP relay.
 * Mailpit SMTP default: localhost:1025 (no auth needed).
 */
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "localhost",
  port: Number(process.env.SMTP_PORT) || 1025,
  secure: false, // Mailpit uses plain SMTP on 1025; real SMTP providers can use TLS via env
  auth:
    process.env.EMAIL_USER && process.env.EMAIL_PASS
      ? { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
      : undefined,
} as nodemailer.TransportOptions);

export { transporter };
