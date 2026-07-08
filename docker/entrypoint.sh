#!/bin/sh
set -e

echo "==> Rodando migrations..."
node node_modules/.bin/tsx src/server/scripts/migration-run.ts

echo "==> Rodando seed..."
node node_modules/.bin/tsx src/server/seeds/seed.ts

echo "==> Iniciando servidor..."
exec node dist/server/index.mjs
