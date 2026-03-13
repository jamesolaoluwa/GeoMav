#!/bin/bash
cd "$(cd "$(dirname "$0")" && pwd)/frontend"
echo "Starting GeoMav frontend on http://localhost:3000..."
nodemon --exec "npm run dev" \
  --watch src \
  --ext ts,tsx,css \
  --signal SIGTERM
