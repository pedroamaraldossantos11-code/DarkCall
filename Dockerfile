# DarkCall Dockerfile
# Multi-stage build for smaller image

# Build stage
FROM python:3.11-slim as builder

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt

# Final stage
FROM python:3.11-slim

WORKDIR /app

# Copy installed packages
COPY --from=builder /install /usr/local

# Copy application files
COPY server.py .
COPY static/ ./static/

# Expose port
EXPOSE 8765

# Run the server
CMD ["python", "server.py"]
