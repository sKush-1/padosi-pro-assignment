#!/bin/sh
set -e

export DATABASE_URL="postgres://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}"

echo "Running database migrations..."
npx node-pg-migrate -m src/config/database/migrations up

echo "Starting server..."
exec node dist/server.js
