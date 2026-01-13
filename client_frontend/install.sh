#!/bin/bash
set -e

# Remove all npm config files and auth tokens
rm -rf ~/.npm ~/.npmrc /root/.npm /root/.npmrc /vercel/.npmrc 2>/dev/null || true

# Clear all npm auth configurations
npm config delete _auth 2>/dev/null || true
npm config delete _authToken 2>/dev/null || true
npm config delete always-auth 2>/dev/null || true
npm config delete //registry.npmjs.org/:_authToken 2>/dev/null || true

# Set public registry
npm config set registry https://registry.npmjs.org/
npm config set @scope:registry https://registry.npmjs.org/

# Install with explicit registry flag
npm install --registry=https://registry.npmjs.org/ --no-audit

