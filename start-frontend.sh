#!/bin/bash

cd "$(cd "$(dirname "$0")" && pwd)/frontend"
echo "Starting GeoMav frontend on http://localhost:3000..."

# Run Next.js dev server directly; Nodemon is not required.
npm run dev
