// ─── Register ────────────────────────────────────────────────────────────────
export interface RegisterBody {
  email: string;
  password: string;
}

export function validateRegister(data: unknown): {
  valid: true;
  value: RegisterBody;
} | { valid: false; error: string } {
  if (!data || typeof data !== "object") {
    return { valid: false, error: "Request body is required." };
  }
  const { email, password } = data as Record<string, unknown>;

  if (!email || typeof email !== "string" || email.trim() === "") {
    return { valid: false, error: "Email is required." };
  }
  const trimmedEmail = email.trim().toLowerCase();
  if (trimmedEmail.length > 150) {
    return { valid: false, error: "Email must not exceed 150 characters." };
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmedEmail)) {
    return { valid: false, error: "Invalid email format." };
  }

  if (!password || typeof password !== "string") {
    return { valid: false, error: "Password is required." };
  }
  if (password.length < 8) {
    return { valid: false, error: "Password must be at least 8 characters long." };
  }
  if (password.length > 72) {
    return { valid: false, error: "Password must not exceed 72 characters." };
  }

  return { valid: true, value: { email: trimmedEmail, password } };
}

// ─── Login ───────────────────────────────────────────────────────────────────
export interface LoginBody {
  email: string;
  password: string;
}

export function validateLogin(data: unknown): {
  valid: true;
  value: LoginBody;
} | { valid: false; error: string } {
  if (!data || typeof data !== "object") {
    return { valid: false, error: "Request body is required." };
  }
  const { email, password } = data as Record<string, unknown>;

  if (!email || typeof email !== "string" || email.trim() === "") {
    return { valid: false, error: "Email is required." };
  }
  const trimmedEmail = email.trim().toLowerCase();

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmedEmail)) {
    return { valid: false, error: "Invalid email format." };
  }

  if (!password || typeof password !== "string" || password.trim() === "") {
    return { valid: false, error: "Password is required." };
  }

  return { valid: true, value: { email: trimmedEmail, password } };
}

// ─── Send OTP ────────────────────────────────────────────────────────────────
export interface SendOtpBody {
  email: string;
}

export function validateSendOtp(data: unknown): {
  valid: true;
  value: SendOtpBody;
} | { valid: false; error: string } {
  if (!data || typeof data !== "object") {
    return { valid: false, error: "Request body is required." };
  }
  const { email } = data as Record<string, unknown>;

  if (!email || typeof email !== "string" || email.trim() === "") {
    return { valid: false, error: "Email is required." };
  }
  const trimmedEmail = email.trim().toLowerCase();
  if (trimmedEmail.length > 150) {
    return { valid: false, error: "Email must not exceed 150 characters." };
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmedEmail)) {
    return { valid: false, error: "Invalid email format." };
  }

  return { valid: true, value: { email: trimmedEmail } };
}

// ─── Verify OTP ──────────────────────────────────────────────────────────────
export interface VerifyOtpBody {
  email: string;
  otp: string;
}

export function validateVerifyOtp(data: unknown): {
  valid: true;
  value: VerifyOtpBody;
} | { valid: false; error: string } {
  if (!data || typeof data !== "object") {
    return { valid: false, error: "Request body is required." };
  }
  const { email, otp } = data as Record<string, unknown>;

  if (!email || typeof email !== "string" || email.trim() === "") {
    return { valid: false, error: "Email is required." };
  }
  const trimmedEmail = email.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmedEmail)) {
    return { valid: false, error: "Invalid email format." };
  }

  if (!otp || typeof otp !== "string") {
    return { valid: false, error: "OTP is required." };
  }
  if (!/^\d{6}$/.test(otp)) {
    return { valid: false, error: "OTP must be a 6-digit number." };
  }

  return { valid: true, value: { email: trimmedEmail, otp } };
}
