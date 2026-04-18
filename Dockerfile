# --- STAGE 1: Build Frontend ---
FROM node:20-slim AS frontend-builder
WORKDIR /app/frontend
# Copy package files first for faster caching
COPY frontend/package*.json ./
RUN npm install
# Copy the rest of the frontend source
COPY frontend/ ./
# IMPORTANT: Set VITE_API_URL to empty to force relative paths in production
ENV VITE_API_URL=""
# Build the production files
RUN npm run build

# --- STAGE 2: Backend & Final Image ---
FROM python:3.10-slim
WORKDIR /app

# Install system dependencies (for building some python wheels if needed)
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Setup backend dependencies
COPY backend-python/requirements.txt ./backend-python/
RUN pip install --no-cache-dir -r backend-python/requirements.txt

# Copy backend source code
COPY backend-python/ ./backend-python/

# Copy the built frontend from Stage 1 into the backend's static folder
# This matches the mount path in main.py
COPY --from=frontend-builder /app/frontend/dist ./backend-python/static

# Switch to backend directory for the execution context
WORKDIR /app/backend-python

# Ensure runtime directories exist
RUN mkdir -p certificates summaries videos

# Expose port (Internal)
EXPOSE 5001

# Start the unified server
# The backend will now serve the API (/api/*) AND the Frontend (/)
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-5001}"]
