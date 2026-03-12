#!/bin/bash
# Start both frontend and backend servers

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "Starting GeoMav..."

# Start backend
echo "Starting backend on http://localhost:8000..."
cd "$ROOT_DIR/backend"
python3 -m uvicorn app.main:app --reload --port 8000 &
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID"
echo "$BACKEND_PID" > "$ROOT_DIR/.backend.pid"

# Start frontend
echo "Starting frontend on http://localhost:3000..."
cd "$ROOT_DIR/frontend"
npm run dev &
FRONTEND_PID=$!
echo "Frontend PID: $FRONTEND_PID"
echo "$FRONTEND_PID" > "$ROOT_DIR/.frontend.pid"

echo ""
echo "GeoMav is running!"
echo "  Frontend: http://localhost:3000"
echo "  Backend:  http://localhost:8000"
echo ""
echo "Run ./stop.sh to stop both servers."

wait
