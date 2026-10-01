import { transporter } from "../utils/nodemailerTransporter.util";

export async function sendOtpEmail(to: string, otp: string): Promise<void> {
  const fromAddress =
    process.env.EMAIL_FROM ||
    (process.env.EMAIL_USER
      ? `"Padosi Pro" <${process.env.EMAIL_USER}>`
      : '"Padosi Pro" <support@bulkparser.com>');

  await transporter.sendMail({
    from: fromAddress,
    to,
    subject: "Your Padosi Pro Verification Code",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:24px;border:1px solid #e5e7eb;border-radius:8px;">
        <h2 style="color:#1d4ed8;">Padosi Pro</h2>
        <p>Hello,</p>
        <p>Use the code below to verify your email address. It expires in <strong>10 minutes</strong> and can only be used once.</p>
        <div style="font-size:2rem;font-weight:bold;letter-spacing:0.4em;text-align:center;padding:16px 0;color:#1d4ed8;">${otp}</div>
        <p style="color:#6b7280;font-size:0.875rem;">If you did not request this, you can safely ignore this email.</p>
      </div>
    `,
  });
}
