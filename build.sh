#!/bin/bash
set -e

echo "=== Step 1: Installing pnpm ==="
npm install -g pnpm@9
pnpm --version

echo "=== Step 2: Installing dependencies ==="
pnpm install --no-frozen-lockfile

echo "=== Step 3: Building widget ==="
cd packages/widget
ls -la
node build.mjs
ls -la dist/
cd ../..

echo "=== Step 4: Building backend ==="
cd apps/backend
ls -la
npx nest build
ls -la dist/
cd ../..

echo "=== Build complete! ==="
