#!/bin/bash
set -e

# Force npm to use public registry
npm config set registry https://registry.npmjs.org/
npm config delete @scope:registry || true
npm config set always-auth false

# Remove any global npmrc that might be interfering
rm -f ~/.npmrc /root/.npmrc 2>/dev/null || true

# Run npm ci with explicit registry
npm ci --registry=https://registry.npmjs.org/

# Build
npm run build

