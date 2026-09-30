# Padosi Pro — Backend API

A REST API for the Padosi Pro home-services platform.  
**Stack:** Node.js · TypeScript · Fastify · PostgreSQL · Mailpit (local mail catcher)

---

## Quick Start (one command)

```bash
# 1. Clone and enter the directory
cd backend

# 2. Copy environment variables
cp .env.example .env
#    Edit .env if you need custom secrets (especially JWT keys in production)

# 3. Start everything — Postgres + Mailpit + App
docker compose up --build
```

The API is available at **http://localhost:4000**  
Caught emails (OTPs) are visible at **http://localhost:8025** (Mailpit web UI)

### Run migrations (first time / after DB wipe)
```bash
# Inside the running app container:
docker compose exec app pnpm migrate

# Or locally (if Postgres is already running):
pnpm migrate
```

### Local development (without Docker)
```bash
pnpm install
cp .env.example .env   # then fill in your local values
pnpm dev               # hot-reload via tsx watch
```

---

## Email — Mailpit

This project ships with **[Mailpit](https://mailpit.axllent.org/)** as the local SMTP mail catcher.

- App sends email to `localhost:1025` (no auth needed locally)
- All emails are captured and displayed at `http://localhost:8025`
- **No real emails are sent in development** — ideal for testing OTP flows

To switch to a real SMTP provider (Gmail, SendGrid, etc.), set these in `.env`:
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
EMAIL_USER=you@gmail.com
EMAIL_PASS=your_app_password
```

---

## API Reference

All endpoints return JSON in the shape:
```json
{ "error": false, "message": "...", "data": {} }
```

### Auth `POST /api/v1/auth/...`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/register` | ❌ | Register with email + password |
| POST | `/send-otp` | ❌ | Send/resend 6-digit OTP to email |
| POST | `/verify-otp` | ❌ | Verify the OTP |
| POST | `/login` | ❌ | Login (verified users only) → sets JWT cookies |
| POST | `/logout` | ❌ | Clear JWT cookies |
| GET | `/refresh` | ❌ | Refresh access token via refresh-token cookie |
| GET | `/me` | ✅ | Get current user details |

#### POST `/register`
```json
{ "email": "user@example.com", "password": "myPassword123" }
```

#### POST `/send-otp`
```json
{ "email": "user@example.com" }
```
- 30-second resend cooldown enforced in the database
- Only works for unverified accounts

#### POST `/verify-otp`
```json
{ "email": "user@example.com", "otp": "123456" }
```
- OTP is a 6-digit number, valid for **10 minutes**, **single-use**
- At most **5 wrong attempts** before the code is locked (request a new one)
- Only the **hash** of the OTP is stored (bcrypt)

#### POST `/login`
```json
{ "email": "user@example.com", "password": "myPassword123" }
```
- Returns `403` with `{ redirect: "verify" }` for unverified users
- Sets `accessToken` (15 min) and `refreshToken` (7 days) as `HttpOnly` cookies

---

### User `{GET,PATCH} /api/v1/user/...`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/profile` | ✅ | Fetch own profile |
| PATCH | `/profile` | ✅ | Update name, phone, address, business_name |

#### PATCH `/profile`
```json
{
  "name": "Ravi Kumar",
  "phone": "+919876543210",
  "address": "12, MG Road, Bengaluru, Karnataka 560001",
  "business_name": "Kumar Electricals"
}
```
- `phone` — Indian mobile only: `+91` followed by 10 digits starting with 6–9
- `business_name` — **optional** (many service providers operate informally without a registered business name)

---

### Tasks `GET,POST /api/v1/tasks/...`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | ❌ | List all tasks (optional `?category=` filter) |
| GET | `/categories` | ❌ | List distinct categories |
| POST | `/select` | ✅ | Save user's task selection (replaces previous) |
| GET | `/my-tasks` | ✅ | Get tasks the user has selected |

#### GET `/` (with category filter)
```
GET /api/v1/tasks?category=Plumbing
```

#### POST `/select`
```json
{ "task_ids": ["uuid-1", "uuid-2", "uuid-3"] }
```
- Replaces the entire selection atomically in a DB transaction
- Validates all UUIDs exist before committing

---

## Seeded Task Catalogue

25 tasks across 5 categories, seeded via migration:

| Category | Count |
|----------|-------|
| Home Cleaning | 5 |
| Plumbing | 5 |
| Electrical | 5 |
| Carpentry & Furniture | 5 |
| Appliance Services | 5 |

---

## Design Decisions

### Why is `business_name` optional?
Many individual service professionals in India (plumbers, electricians, cleaners) operate informally without a registered business name. Making it required would create unnecessary friction during onboarding and exclude a large segment of the target user base.

### No Redis
All OTP state (hash, expiry, attempts, last-sent timestamp) is stored directly in the `users` table. For the scale this application targets, a PostgreSQL column with a timestamp check is simpler, more reliable, and eliminates an entire infrastructure dependency.

### No rate limiting middleware
The OTP resend cooldown (30 s) and attempt cap (5 tries) are enforced at the database level, which survives app restarts and works correctly across multiple replicas without additional infrastructure.

### Password storage
Passwords are hashed with **bcrypt** (10 rounds). OTP codes are also stored as bcrypt hashes — never in plain text.

### Authentication
JWT in `HttpOnly` cookies (not `Authorization` headers) to prevent XSS token theft. Access token expires in 15 minutes; refresh token in 7 days.

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `4000` | App listen port |
| `DB_HOST` | `localhost` | Postgres host |
| `DB_PORT` | `5432` | Postgres port |
| `DB_USER` | `postgres` | Postgres user |
| `DB_PASSWORD` | `postgres` | Postgres password |
| `DB_NAME` | `padosi_pro` | Database name |
| `DB_SSL` | `false` | Set `true` for cloud Postgres |
| `JWT_ACCESS_TOKEN_SECRET_KEY` | — | **Required** — at least 32 random chars |
| `JWT_REFRESH_TOKEN_SECRET_KEY` | — | **Required** — at least 32 random chars |
| `JWT_ACCESSTOKEN_EXPIRY` | `15m` | Access token TTL |
| `JWT_REFRESHTOKEN_EXPIRY` | `7d` | Refresh token TTL |
| `COOKIE_SECRET` | — | For signed cookies |
| `SMTP_HOST` | `localhost` | SMTP server (Mailpit default) |
| `SMTP_PORT` | `1025` | SMTP port |
| `EMAIL_USER` | — | SMTP user (leave blank for Mailpit) |
| `EMAIL_PASS` | — | SMTP password |
| `EMAIL_FROM` | `"Padosi Pro" <noreply@padosipro.local>` | From address |
| `CORS` | `http://localhost:3000` | Allowed CORS origin |

---

## Project Structure

```
src/
├── config/
│   └── database/
│       ├── db.config.ts       # pg Pool
│       ├── db.test.ts         # connection health check
│       └── migrations/
│           ├── 001-user.ts    # users table
│           └── 002-tasks.ts   # tasks, user_tasks + 25 seed rows
├── controllers/
│   ├── auth.controller.ts     # register, sendOtp, verifyOtp, login, logout, refresh, me
│   ├── user.controller.ts     # getProfile, updateProfile
│   └── task.controller.ts     # listTasks, listCategories, selectTasks, getMyTasks
├── middlewares/
│   └── middleware.auth.ts     # JWT cookie auth guard
├── routes/
│   ├── auth.routes.ts
│   ├── user.routes.ts
│   └── task.routes.ts
├── services/
│   └── sendEmail.service.ts   # OTP email via nodemailer
├── utils/
│   ├── bcrypt.util.ts
│   ├── generateOtp.util.ts    # 6-digit numeric OTP
│   ├── jwt.util.ts
│   ├── logger.ts
│   ├── nodemailerTransporter.util.ts
│   ├── sendresponse.util.ts
│   └── validation/
│       ├── auth.validation.ts
│       └── user.validation.ts
├── interfaces/
│   └── users/index.ts
├── fastify.d.ts               # extends FastifyRequest with user_id
└── server.ts
```
