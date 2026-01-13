#!/bin/bash
set -e
rm -rf ~/.npm ~/.npmrc /root/.npm /root/.npmrc /vercel/.npmrc 2>/dev/null || true
npm config delete _auth 2>/dev/null || true
npm config delete _authToken 2>/dev/null || true
npm config set registry https://registry.npmjs.org/
npm install --registry=https://registry.npmjs.org/

