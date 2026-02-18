#!/bin/bash
set -e

echo "=== Instalando pnpm ==="
npm install -g pnpm@9

echo "=== Instalando dependencias ==="
pnpm install --no-frozen-lockfile

echo "=== Buildando widget ==="
cd packages/widget
node build.mjs
cd ../..

echo "=== Buildando backend ==="
cd apps/backend
npx nest build
cd ../..

echo "=== Build completo! ==="
