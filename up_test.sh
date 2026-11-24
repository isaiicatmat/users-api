#!/bin/sh
# Starts a throwaway Postgres, applies migrations and runs every test suite.
set -e

export DATABASE_URL="postgresql://postgres:postgres@localhost:5433/users_test"

docker compose -f docker-compose.test.yml up -d --wait
trap 'docker compose -f docker-compose.test.yml down' EXIT

npx prisma migrate deploy
npm run test:all
