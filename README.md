# 🏠 Padosi Pro — Full-Stack Assignment

A local home services platform inspired by [app.padosipro.com](https://app.padosipro.com).
Comprises a high-performance **Fastify + PostgreSQL backend** and a **React Native (Expo) mobile frontend**.

---

## 📑 Table of Contents
1. [Prerequisites](#-prerequisites)
2. [Quick Start (Backend Setup)](#-backend-setup)
3. [Environment Variables](#-environment-variables)
4. [Running Tests](#-running-tests)
5. [Frontend Mobile App Setup](#-frontend-mobile-app-setup)
6. [How to Build the Android APK](#-how-to-build-the-android-apk)
7. [API Documentation Summary](#-api-summary)

---

## ⚙️ Prerequisites

- **Docker & Docker Compose** (v2+)
- **Node.js**: v20+ (tested on v20 and v22)
- **Package Managers**: `pnpm` (backend) and `npm` (frontend)
- **Expo Go App** (on Android device/emulator) or Android Studio for local APK builds

---

## 🚀 Backend Setup

The backend runs locally with **one command** via Docker Compose.

```bash
# 1. Navigate to the backend directory
cd backend

# 2. Copy the sample environment file
cp .env.example .env

# 3. Start PostgreSQL, Mailpit, and the Fastify API
docker compose up -d --build
```

### Services Started:
| Service | URL / Port | Description |
| :--- | :--- | :--- |
| **API Server** | `http://localhost:4000` | Node.js + Fastify REST endpoints |
| **Mailpit Web UI** | `http://localhost:8025` | Local email catcher (view sent OTPs in your browser) |
| **PostgreSQL 18** | `localhost:5432` | Primary database with automatic migrations & 25 seeded tasks |

To run migrations manually (outside docker):
```bash
pnpm migrate
```

---

## 🔐 Environment Variables

The project uses `.env.example` in `backend/` with sensible local defaults:

```env
# Server
PORT=4000
NODE_ENV=development

# Database (PostgreSQL)
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=padosi_pro
DB_SSL=false

# Authentication Secrets
JWT_ACCESS_TOKEN_SECRET_KEY=dev_access_secret_key_at_least_32_characters_long
JWT_REFRESH_TOKEN_SECRET_KEY=dev_refresh_secret_key_at_least_32_characters_long
JWT_ACCESSTOKEN_EXPIRY=15m
JWT_REFRESHTOKEN_EXPIRY=7d
COOKIE_SECRET=dev_cookie_secret_at_least_32_chars

# Mailer (Mailpit local mail catcher)
SMTP_HOST=localhost
SMTP_PORT=1025
EMAIL_FROM="Padosi Pro" <noreply@padosipro.local>
```

> **Email Catcher**: By default, Mailpit intercepts all outgoing SMTP messages. Visit **`http://localhost:8025`** to see verification codes. No external email provider is required for development.

---

## 🧪 Running Tests

The test suite validates risky business logic (OTP generation, expiry checks, attempt limits, resend cooldown, and login constraints):

```bash
cd backend
pnpm test
```

Sample test output:
```
▶ Risky Logic: OTP Generation
  ✔ OTP must be exactly 6 characters long and numeric only
  ✔ OTP generation generates varying codes (not static)
  ✔ OTP hash verification with bcrypt
▶ Risky Logic: OTP Expiry Rules
  ✔ Valid OTP inside the 10-minute window should be accepted
  ✔ OTP after 10 minutes must be considered expired
▶ Risky Logic: OTP Attempt Limits
  ✔ Allow attempts when counter is below 5
  ✔ Block further attempts once 5 wrong attempts are reached
  ✔ Remaining attempts correctly decrement
▶ Risky Logic: Resend Cooldown (30 seconds)
  ✔ Resend requested within 30 seconds is blocked with wait time
  ✔ Resend requested after 30 seconds is allowed
▶ Risky Logic: Login Rules & Input Validations
  ✔ Unverified users must not be granted login access
  ✔ Verified users can be granted login access if password matches
  ✔ Password mismatch rejects login
  ✔ validateProfile: enforces Indian mobile phone format (+91, 10 digits)
  ✔ validateTaskSelection: requires valid UUID array
ℹ pass 16, fail 0
```

---

## 📱 Frontend Mobile App Setup

1. **Navigate to the frontend folder**:
   ```bash
   cd frontend
   npm install
   ```

2. **Start Expo**:
   ```bash
   npx expo start
   ```

3. **Open the app**:
   - **Android Emulator / Device**: Press `a` in the terminal or scan the QR code using the **Expo Go** app on your phone.
   - **Web Preview**: Press `w` to run in browser.

> **Dynamic API Connection**: The mobile client dynamically resolves the host machine's IP via `Constants.expoConfig?.hostUri`, automatically connecting to your backend from an Android physical device or emulator without needing manual IP configuration.

---

## 📦 How to Build the Android APK

There are two primary ways to produce an installable standalone Android `.apk`:

### Option A: Cloud Build with EAS (Recommended & Quickest)
EAS Build creates the standalone APK in the cloud without needing local Android SDK/NDK installations:

1. Install EAS CLI:
   ```bash
   npm install -g eas-cli
   ```
2. Log into your free Expo account:
   ```bash
   eas login
   ```
3. Verify `eas.json` has `buildType: "apk"` configured under `preview`:
   ```json
   "preview": {
     "distribution": "internal",
     "android": {
       "buildType": "apk"
     },
     "env": {
       "EXPO_PUBLIC_API_URL": "https://your-public-tunnel.trycloudflare.com/api/v1"
     }
   }
   ```
   > **Note**: `buildType: "apk"` ensures EAS compiles an installable `.apk` file (which can be sideloaded directly onto any Android device) rather than a Google Play `.aab` bundle. Make sure `EXPO_PUBLIC_API_URL` points to your public tunnel (e.g. Cloudflare Tunnel, Ngrok) or your LAN IP (`http://192.168.x.x:4000/api/v1`), not `localhost`.

4. Trigger the build:
   ```bash
   cd frontend
   eas build -p android --profile preview
   ```
   *EAS will return a direct download link and QR code for the completed `.apk` file.*

---

### Option B: Local Android Build (via Prebuild & Gradle)
If you have Android Studio and the Android SDK installed locally:

1. Generate the native Android project:
   ```bash
   cd frontend
   npx expo prebuild --platform android
   ```
2. Build the Release / Debug APK:
   ```bash
   cd android
   ./gradlew assembleRelease
   # Or for debug APK:
   ./gradlew assembleDebug
   ```
3. The generated APK will be at:
   ```
   frontend/android/app/build/outputs/apk/release/app-release.apk
   ```

---

## 📡 API Summary

| Method | Endpoint | Protection | Description |
| :--- | :--- | :---: | :--- |
| `POST` | `/api/v1/auth/register` | Public | Register with email and password, sends 6-digit OTP |
| `POST` | `/api/v1/auth/verify-otp` | Public | Verifies OTP (max 5 tries, 10 min window), marks verified & issues tokens |
| `POST` | `/api/v1/auth/resend-otp` | Public | Resends OTP (enforces 30-second cooldown in DB) |
| `POST` | `/api/v1/auth/login` | Public | Login for verified users only; returns JWT & cookies |
| `POST` | `/api/v1/auth/logout` | Protected | Clears authentication tokens |
| `GET` | `/api/v1/auth/me` | Protected | Fetches authenticated user's profile |
| `GET` | `/api/v1/user/profile` | Protected | Fetches full user profile |
| `PATCH`| `/api/v1/user/profile` | Protected | Updates Name, Phone (+91 Indian), Address, optional Business Name |
| `GET` | `/api/v1/tasks` | Public | Lists task catalogue (optional `?category=` filter) |
| `GET` | `/api/v1/tasks/categories` | Public | Returns distinct task categories |
| `POST` | `/api/v1/tasks/select` | Protected | Saves/replaces user's selected tasks in a DB transaction |
| `GET` | `/api/v1/tasks/my-tasks` | Protected | Returns the authenticated user's selected tasks |
