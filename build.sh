#!/bin/bash
set -e

echo "Step 1: Install pnpm"
npm install -g pnpm@9

echo "Step 2: Install dependencies"
cd apps/backend
pnpm install --no-frozen-lockfile

echo "Step 3: Build backend"
pnpm run build

echo "Step 4: Verify dist"
ls -la dist/

echo "Build complete!"
