# ── Build stage ───────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Build tools for bcrypt native addon (node-gyp)
RUN apk add --no-cache python3 make g++

# Disable Corepack so our globally-installed pnpm is used, not the
# platform-specific @pnpm/exe binary that the "packageManager" field triggers
# (which has no musl/Alpine binary for pnpm@10.24.0).
RUN corepack disable

RUN npm install -g pnpm@10.24.0

COPY package.json pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile --ignore-scripts
RUN pnpm rebuild bcrypt

COPY . .

RUN pnpm build

# ── Production stage ──────────────────────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

RUN apk add --no-cache python3 make g++

RUN corepack disable

RUN npm install -g pnpm@10.24.0

COPY package.json pnpm-lock.yaml ./

RUN pnpm install --prod --frozen-lockfile --ignore-scripts
RUN pnpm rebuild bcrypt

COPY --from=builder /app/dist ./dist

COPY docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x docker-entrypoint.sh

EXPOSE 4000

CMD ["sh", "docker-entrypoint.sh"]
