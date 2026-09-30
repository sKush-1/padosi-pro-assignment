# 📐 System Design & Architecture — Padosi Pro

## 1. High-Level Architecture

The system is built as a lightweight, reliable full-stack application designed to connect local service professionals with neighborhood tasks:

```
[ Mobile Client (React Native / Expo) ]
               │
               ▼  HTTP / REST (JSON + Bearer Token / HttpOnly Cookies)
[ Fastify API Server (Node.js + TypeScript) ]
       │                               │
       ▼                               ▼
[ PostgreSQL 18 ]               [ Mailpit SMTP ]
(Users, OTP Hash, Tasks,       (Local Mail Catcher for OTPs)
 Task Selections)
```

- **Backend**: Fastify on Node.js with native TypeScript compilation (`tsc`) and `node-pg-migrate` for schema versioning.
- **Database**: PostgreSQL 18 storing relational schemas for accounts, salted bcrypt hashes, and task catalogue mapping.
- **Frontend**: Pure React Native built on Expo Router (file-based navigation) with Zustand for persistent token state in `AsyncStorage`.

---

## 2. Key Technical Decisions & Trade-Offs

### A. Database-Enforced State vs. Redis Cache
- **Decision**: Eliminated Redis completely; OTP state (`otp_hash`, `otp_expires_at`, `otp_attempts`, `last_otp_sent_at`) is maintained directly within PostgreSQL.
- **Trade-off**: A Redis key with TTL is traditionally used for transient OTPs. However, maintaining OTP records in PostgreSQL provides strong ACID guarantees, survives container restarts, avoids dual-source-of-truth reconciliation issues, and removes an entire infrastructure component from local setup.
- **Protection**: Resend cooldown (30 seconds) and failure lockout (5 attempts) are enforced at the database transaction layer.

### B. Dual Token Transport (HttpOnly Cookies + Bearer Auth)
- **Decision**: The API supports both `HttpOnly; SameSite=Strict` cookies (best practice for web browsers against XSS) and `Authorization: Bearer <token>` headers (standard for mobile native runtimes where cookies can be brittle).
- **Trade-off**: Slightly more logic in `authMiddleware`, but ensures zero-compromise cross-platform compatibility without branching endpoints.

### C. Atomic Task Selection
- **Decision**: The `POST /api/v1/tasks/select` endpoint wraps the replacement of user task associations (`DELETE` previous + batch `INSERT` new) inside a single dedicated client database transaction (`BEGIN ... COMMIT / ROLLBACK`).
- **Trade-off**: Replaces previous selections in one atomic operation, guaranteeing no orphaned records or partial selection writes.

### D. Optional Business Name
- **Decision**: `business_name` is optional during onboarding and profile updates.
- **Rationale**: Many skilled independent tradespeople (electricians, cleaners, carpenters) operate informally as sole proprietors without a registered commercial entity. Forcing a company name creates unnecessary onboarding friction.

---

## 3. What Was Left Out (Scope Constraints)

1. **SMS Gateway Integration**: Real-world OTPs for Indian mobile numbers frequently rely on SMS (e.g. Fast2SMS / Twilio). For local reproducibility and zero vendor lock-in, transactional email via Mailpit was used.
2. **Refresh Token Rotation & Revocation List**: While refresh tokens with 7-day expiry are issued, family-based refresh token rotation in a dedicated revocation table was deferred.
3. **Geo-Location & Distance Radius**: Geocoding addresses to coordinates (PostGIS) to filter tasks by kilometer radius was omitted in favor of category-based grouping.
4. **Third-Party Social Auth**: Google/Apple OAuth was omitted to maintain strict focus on the required email + OTP verification pipeline.

---

## 4. What We Would Build Next (Given Another Week)

1. **Service Booking & Order Lifecycle**:
   - Order entity with finite state machine (`REQUESTED` → `ACCEPTED` → `IN_PROGRESS` → `COMPLETED` → `CANCELLED`).
   - Customer booking interface matching service providers based on active tasks.
2. **Real-Time Communication**:
   - WebSocket / Socket.io server for live in-app chat and push notifications between neighborhood customers and service providers.
3. **Location Services & Map Matching**:
   - PostGIS extension integration for location radius matching ("show tasks within 5km").
4. **Payment Gateway & Escrow**:
   - Integration with Razorpay / UPI intent flows holding milestone payments in escrow until customer marks service completion.
5. **Role-Based Access Control (RBAC)**:
   - Differentiating between Customer accounts and Professional Partner accounts with specialized dashboards.
