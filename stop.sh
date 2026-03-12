#!/bin/bash
# Stop both frontend and backend servers

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "Stopping GeoMav..."

if [ -f "$ROOT_DIR/.backend.pid" ]; then
  kill $(cat "$ROOT_DIR/.backend.pid") 2>/dev/null
  rm "$ROOT_DIR/.backend.pid"
  echo "Backend stopped."
fi

if [ -f "$ROOT_DIR/.frontend.pid" ]; then
  kill $(cat "$ROOT_DIR/.frontend.pid") 2>/dev/null
  rm "$ROOT_DIR/.frontend.pid"
  echo "Frontend stopped."
fi

lsof -ti:8000 | xargs kill -9 2>/dev/null
lsof -ti:3000 | xargs kill -9 2>/dev/null

echo "GeoMav stopped."
