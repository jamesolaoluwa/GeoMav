#!/bin/bash
cd "$(cd "$(dirname "$0")" && pwd)/frontend"
echo "Starting GeoMav frontend on http://localhost:3000..."
npm run dev
