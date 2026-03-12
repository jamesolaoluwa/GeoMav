#!/bin/bash
cd "$(cd "$(dirname "$0")" && pwd)/backend"
echo "Starting GeoMav backend on http://localhost:8000..."
python3 -m uvicorn app.main:app --reload --port 8000
