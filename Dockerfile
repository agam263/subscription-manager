FROM node:20-bookworm

# Install Python and venv
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 1. Install frontend dependencies and build
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
RUN rm -rf public && mv dist public

# 2. Install backend dependencies
WORKDIR /app/server
RUN npm install

# 3. Setup Python Bot Environment
# requirements.txt pins the CPU-only PyTorch wheel, so no CUDA libraries
# (~2 GB) are pulled in. The sentence-transformers model (all-MiniLM-L6-v2)
# is downloaded at first startup, not during the build, keeping the image lean.
WORKDIR /app/server/python_bot
RUN python3 -m venv venv
RUN ./venv/bin/pip install --no-cache-dir -r requirements.txt

# HuggingFace model cache — mount /app/data/hf_cache as a volume to persist
# downloaded models across container restarts.
ENV HF_HOME=/app/data/hf_cache
ENV TRANSFORMERS_CACHE=/app/data/hf_cache

# 4. Finalize
WORKDIR /app
EXPOSE 3001
CMD ["/app/start.sh"]