// OTP is always a 6-digit numeric code as per the spec
export function generateOtp(): string {
  const otp = Math.floor(100000 + Math.random() * 900000);
  return otp.toString();
}
