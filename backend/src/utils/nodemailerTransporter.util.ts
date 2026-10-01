import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const port = Number(process.env.SMTP_PORT) || 587;
// Port 465 = SSL/TLS (secure: true), Port 587 = STARTTLS (secure: false)
const isSecure = process.env.SMTP_SECURE === "true" || port === 465;

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.hostinger.com",
  port,
  secure: isSecure,
  // For port 587 STARTTLS: explicitly require upgraded TLS
  ...(port === 587 && {
    requireTLS: true,
    tls: { ciphers: "SSLv3" },
  }),
  auth:
    process.env.EMAIL_USER && process.env.EMAIL_PASS
      ? { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
      : undefined,
} as nodemailer.TransportOptions);

export { transporter };
