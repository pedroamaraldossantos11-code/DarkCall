# Installation Guide

## Prerequisites

- Python 3.10 or higher
- pip (Python package manager)
- Git

## Quick Start

```bash
# Clone the repository
git clone https://github.com/pedroamaraldossantos11-code/DarkCall.git
cd DarkCall

# Run the setup script
chmod +x scripts/run.sh
./scripts/run.sh
```

Open http://localhost:8765 in your browser.

## Manual Installation

### 1. Create Virtual Environment

```bash
python3 -m venv venv
source venv/bin/activate  # Linux/macOS
# venv\Scripts\activate   # Windows
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Start Server

```bash
python server.py
```

## Docker Installation

```bash
# Build and run with Docker Compose
docker-compose up -d

# Or build manually
docker build -t darkcall .
docker run -p 8765:8765 darkcall
```

## Production Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for production setup with Nginx and SSL.

## Troubleshooting

### Port already in use

```bash
# Find process using port 8765
lsof -i :8765

# Kill the process
kill -9 <PID>
```

### Permission denied

```bash
# Make scripts executable
chmod +x scripts/*.sh
```

### WebSocket connection failed

Ensure your firewall allows WebSocket connections on port 8765.
