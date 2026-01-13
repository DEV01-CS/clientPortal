#!/bin/bash
set -e
# Remove all npm config files
rm -rf ~/.npm ~/.npmrc /root/.npm /root/.npmrc /vercel/.npmrc .npmrc 2>/dev/null || true
# Clear all auth tokens
npm config delete _auth 2>/dev/null || true
npm config delete _authToken 2>/dev/null || true
npm config delete always-auth 2>/dev/null || true
# Force public registry
export NPM_CONFIG_REGISTRY=https://registry.npmjs.org/
npm config set registry https://registry.npmjs.org/
# Install with explicit registry
npm install --registry=https://registry.npmjs.org/ --no-audit --prefer-offline=false

