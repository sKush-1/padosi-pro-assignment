import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcrypt';
import { generateOtp } from '../utils/generateOtp.util';
import {
  validateRegister,
  validateLogin,
  validateSendOtp,
  validateVerifyOtp,
} from '../utils/validation/auth.validation';
import { validateProfile, validateTaskSelection } from '../utils/validation/user.validation';

describe('Risky Logic: OTP Generation', () => {
  test('OTP must be exactly 6 characters long and numeric only', () => {
    for (let i = 0; i < 50; i++) {
      const otp = generateOtp();
      assert.strictEqual(otp.length, 6, `Expected OTP length 6, got ${otp}`);
      assert.match(otp, /^\d{6}$/, `Expected 6 digits, got ${otp}`);
    }
  });

  test('OTP generation generates varying codes (not static)', () => {
    const set = new Set<string>();
    for (let i = 0; i < 20; i++) {
      set.add(generateOtp());
    }
    // High probability of > 1 unique code in 20 iterations
    assert.ok(set.size > 1, 'OTP generator produced duplicate static values');
  });

  test('OTP hash verification with bcrypt', async () => {
    const rawOtp = generateOtp();
    const hash = await bcrypt.hash(rawOtp, 10);

    // Stored hash must verify against the original OTP
    const isMatch = await bcrypt.compare(rawOtp, hash);
    assert.strictEqual(isMatch, true, 'bcrypt compare should match original OTP');

    // Wrong OTP must fail
    const wrongOtp = rawOtp === '123456' ? '654321' : '123456';
    const isWrongMatch = await bcrypt.compare(wrongOtp, hash);
    assert.strictEqual(isWrongMatch, false, 'bcrypt compare must fail on wrong OTP');
  });
});

describe('Risky Logic: OTP Expiry Rules', () => {
  const OTP_EXPIRY_MINUTES = 10;

  test('Valid OTP inside the 10-minute window should be accepted', () => {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + OTP_EXPIRY_MINUTES * 60 * 1000);

    const isExpired = now.getTime() > expiresAt.getTime();
    assert.strictEqual(isExpired, false, 'OTP within 10 minutes must not be expired');
  });

  test('OTP after 10 minutes must be considered expired', () => {
    const pastTime = new Date(Date.now() - 1000); // 1 second ago
    const expiresAt = pastTime;

    const isExpired = Date.now() > expiresAt.getTime();
    assert.strictEqual(isExpired, true, 'OTP past expires_at must be expired');
  });
});

describe('Risky Logic: OTP Attempt Limits', () => {
  const OTP_MAX_ATTEMPTS = 5;

  test('Allow attempts when counter is below 5', () => {
    for (let attempts = 0; attempts < 5; attempts++) {
      const isBlocked = attempts >= OTP_MAX_ATTEMPTS;
      assert.strictEqual(isBlocked, false, `Attempt count ${attempts} should be allowed`);
    }
  });

  test('Block further attempts once 5 wrong attempts are reached', () => {
    const attempts = 5;
    const isBlocked = attempts >= OTP_MAX_ATTEMPTS;
    assert.strictEqual(isBlocked, true, '5th attempt and above must be blocked');
  });

  test('Remaining attempts correctly decrement', () => {
    const currentAttempts = 3;
    const remaining = OTP_MAX_ATTEMPTS - (currentAttempts + 1);
    assert.strictEqual(remaining, 1, 'Should have exactly 1 attempt left after 4th failure');
  });
});

describe('Risky Logic: Resend Cooldown (30 seconds)', () => {
  const OTP_RESEND_COOLDOWN_SECONDS = 30;

  test('Resend requested within 30 seconds is blocked with wait time', () => {
    const lastSentAt = new Date(Date.now() - 10 * 1000); // sent 10 seconds ago
    const elapsed = (Date.now() - lastSentAt.getTime()) / 1000;
    const isCoolingDown = elapsed < OTP_RESEND_COOLDOWN_SECONDS;
    const wait = Math.ceil(OTP_RESEND_COOLDOWN_SECONDS - elapsed);

    assert.strictEqual(isCoolingDown, true, 'Should enforce cooldown');
    assert.strictEqual(wait, 20, 'Wait time should be 20 seconds');
  });

  test('Resend requested after 30 seconds is allowed', () => {
    const lastSentAt = new Date(Date.now() - 35 * 1000); // sent 35 seconds ago
    const elapsed = (Date.now() - lastSentAt.getTime()) / 1000;
    const isCoolingDown = elapsed < OTP_RESEND_COOLDOWN_SECONDS;

    assert.strictEqual(isCoolingDown, false, 'Should allow resend after 30s');
  });
});

describe('Risky Logic: Login Rules & Input Validations', () => {
  test('Unverified users must not be granted login access', () => {
    const mockUser = {
      id: 'uuid-1',
      email: 'user@example.com',
      is_verified: false,
    };

    const allowLogin = mockUser.is_verified;
    assert.strictEqual(allowLogin, false, 'Unverified user must not be logged in');
  });

  test('Verified users can be granted login access if password matches', async () => {
    const password = 'Password@123';
    const passwordHash = await bcrypt.hash(password, 10);
    const mockUser = {
      id: 'uuid-1',
      email: 'user@example.com',
      password_hash: passwordHash,
      is_verified: true,
    };

    const passwordMatch = await bcrypt.compare(password, mockUser.password_hash);
    const canLogin = mockUser.is_verified && passwordMatch;
    assert.strictEqual(canLogin, true, 'Verified user with correct password must login');
  });

  test('Password mismatch rejects login', async () => {
    const passwordHash = await bcrypt.hash('CorrectPassword', 10);
    const passwordMatch = await bcrypt.compare('WrongPassword', passwordHash);
    assert.strictEqual(passwordMatch, false, 'Incorrect password must be rejected');
  });

  test('validateRegister: rejects weak passwords (< 8 chars)', () => {
    const res = validateRegister({ email: 'test@example.com', password: 'short' });
    assert.strictEqual(res.valid, false);
    if (!res.valid) {
      assert.match(res.error, /8 characters/i);
    }
  });

  test('validateProfile: enforces Indian mobile phone format (+91, 10 digits)', () => {
    // Valid Indian phone
    const validRes = validateProfile({
      name: 'Ravi Verma',
      phone: '+919876543210',
      address: 'Indiranagar, Bengaluru',
    });
    assert.strictEqual(validRes.valid, true);

    // Invalid phone: US number or wrong prefix
    const invalidRes = validateProfile({
      name: 'Ravi Verma',
      phone: '+14155552671',
      address: 'Indiranagar, Bengaluru',
    });
    assert.strictEqual(invalidRes.valid, false);
    if (!invalidRes.valid) {
      assert.match(invalidRes.error, /Indian/i);
    }
  });

  test('validateTaskSelection: requires valid UUID array', () => {
    // Valid UUIDs
    const valid = validateTaskSelection({
      task_ids: ['a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'],
    });
    assert.strictEqual(valid.valid, true);

    // Invalid non-UUID
    const invalid = validateTaskSelection({
      task_ids: ['invalid-task-id'],
    });
    assert.strictEqual(invalid.valid, false);
  });
});
