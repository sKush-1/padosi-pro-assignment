/* eslint-disable camelcase */
import type { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createTable("users", {
    id: {
      primaryKey: true,
      type: "uuid",
      notNull: true,
      default: pgm.func("gen_random_uuid()"),
    },
    email: {
      type: "VARCHAR(150)",
      notNull: true,
      unique: true,
    },
    password_hash: {
      type: "VARCHAR(255)",
      notNull: true,
    },
    is_verified: {
      type: "BOOLEAN",
      notNull: true,
      default: false,
    },

    // OTP fields — stored as a bcrypt hash for security
    otp_hash: { type: "VARCHAR(255)" },
    otp_expires_at: { type: "TIMESTAMPTZ" },
    otp_attempts: { type: "INTEGER", notNull: true, default: 0 },
    last_otp_sent_at: { type: "TIMESTAMPTZ" },

    // Profile fields
    name: { type: "VARCHAR(150)" },
    phone: { type: "VARCHAR(13)", unique: true }, // +91XXXXXXXXXX
    address: { type: "TEXT" },
    business_name: { type: "VARCHAR(255)" }, // optional — many professionals operate without a registered business name

    created_at: {
      type: "TIMESTAMPTZ",
      default: pgm.func("CURRENT_TIMESTAMP"),
    },
    updated_at: {
      type: "TIMESTAMPTZ",
      default: pgm.func("CURRENT_TIMESTAMP"),
    },
  });

  pgm.createIndex("users", "email", { name: "idx_users_email" });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable("users");
}