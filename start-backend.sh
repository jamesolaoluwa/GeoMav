#!/bin/bash
cd "$(cd "$(dirname "$0")" && pwd)/backend"
echo "Starting GeoMav backend on http://localhost:8000..."
nodemon --exec ".venv312/bin/python -m uvicorn app.main:app --host 0.0.0.0 --port 8000" \
  --watch app \
  --ext py \
  --signal SIGTERM
