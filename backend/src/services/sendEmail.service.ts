export async function sendOtpEmail(to: string, otp: string): Promise<void> {
  const apiUrl = `https://api.mail.hostinger.com/api/v1/mailboxes/${process.env.HOSTINGER_MAILBOX_ID}/send`;
  const token = process.env.HOSTINGER_API_TOKEN;

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      to: [to],
      subject: "Your Padosi Pro Verification Code",
      text: `Your 6-digit OTP code is ${otp}. It is valid for 10 minutes.`,
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:24px;border:1px solid #e5e7eb;border-radius:8px;">
          <h2 style="color:#1d4ed8;">Padosi Pro</h2>
          <p>Hello,</p>
          <p>Use the code below to verify your email address. It expires in <strong>10 minutes</strong> and can only be used once.</p>
          <div style="font-size:2rem;font-weight:bold;letter-spacing:0.4em;text-align:center;padding:16px 0;color:#1d4ed8;">${otp}</div>
          <p style="color:#6b7280;font-size:0.875rem;">If you did not request this, you can safely ignore this email.</p>
        </div>
      `,
    }),
  });

  if (response.status !== 204) {
    const body = await response.text().catch(() => "");
    throw new Error(`Hostinger Mail API error ${response.status}: ${body}`);
  }
}
