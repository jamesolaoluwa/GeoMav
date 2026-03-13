#!/bin/bash

cd "$(cd "$(dirname "$0")" && pwd)/backend"
echo "Starting GeoMav backend on http://localhost:8000..."

# Start Uvicorn directly with autoreload using the default python3
python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
