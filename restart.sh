#!/bin/bash
# Restart both frontend and backend servers

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "Restarting GeoMav..."
"$ROOT_DIR/stop.sh"
sleep 2
"$ROOT_DIR/start.sh"
