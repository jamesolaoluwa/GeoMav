#!/bin/bash
cd "$(cd "$(dirname "$0")" && pwd)"
echo "Starting GeoMav (backend + frontend)..."
echo ""
npx concurrently \
  --names "API,WEB" \
  --prefix-colors "cyan,magenta" \
  --kill-others-on-fail \
  "./start-backend.sh" \
  "./start-frontend.sh"
