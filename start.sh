#!/bin/bash
set -e

echo "Starting Python SubManager Bot (RAG)..."
cd /app/server/python_bot
export PYTHONIOENCODING=utf-8
source venv/bin/activate
python app.py &

echo "Starting Node Backend..."
export DATABASE_PATH=/app/data/database.sqlite
export PORT=3001
cd /app/server
node server.js
