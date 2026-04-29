#!/bin/bash
set -e

# Ensure the HuggingFace model cache directory exists inside the data volume.
# The all-MiniLM-L6-v2 model is downloaded here on first startup and reused
# on subsequent starts, so the container doesn't re-download it every time.
mkdir -p /app/data/hf_cache

echo "Starting Python SubManager Bot (RAG)..."
cd /app/server/python_bot
export PYTHONIOENCODING=utf-8
export HF_HOME=/app/data/hf_cache
export TRANSFORMERS_CACHE=/app/data/hf_cache
source venv/bin/activate
python app.py &

echo "Starting Node Backend..."
export DATABASE_PATH=/app/data/database.sqlite
export PORT=3001
cd /app/server
node server.js
