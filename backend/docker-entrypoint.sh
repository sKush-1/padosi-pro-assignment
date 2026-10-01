#!/bin/sh
set -e

# Only construct DATABASE_URL from components if not already provided
if [ -z "$DATABASE_URL" ]; then
  export DATABASE_URL="postgres://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}"
fi

echo "Running database migrations..."
if [ -d "dist/config/database/migrations" ]; then
  npx node-pg-migrate -m dist/config/database/migrations up
else
  npx node-pg-migrate -m src/config/database/migrations up
fi

echo "Starting server..."
exec node dist/server.js
