<![CDATA[<div align="center">

# 🔥 DarkCall

### Real-time Video Calls & Chat Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Python 3.10+](https://img.shields.io/badge/Python-3.10+-green.svg)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688.svg)](https://fastapi.tiangolo.com)
[![WebSocket](https://img.shields.io/badge/WebSocket-Supported-orange.svg)](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API)
[![WebRTC](https://img.shields.io/badge/WebRTC-P2P-purple.svg)](https://webrtc.org)

**Connect. Talk. Share.**

[![Portugues](https://img.shields.io/badge/Portugues-README-blue)](README-ptBR.md)

</div>

---

## 📋 Table of Contents

- [Features](#-features)
- [Demo](#-demo)
- [Quick Start](#-quick-start)
- [Installation](#-installation)
- [Docker](#-docker)
- [Production Deployment](#-production-deployment)
- [Configuration](#-configuration)
- [Architecture](#-architecture)
- [API Reference](#-api-reference)
- [Contributing](#-contributing)
- [License](#-license)

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🎥 **Video Calls** | HD video calls with WebRTC peer-to-peer |
| 🎙️ **Audio Calls** | Crystal clear audio with echo cancellation |
| 💬 **Real-time Chat** | Instant messaging during calls |
| 🖥️ **Screen Sharing** | Share your screen with participants |
| 🔐 **Room Codes** | Simple 4-digit codes to join rooms |
| 👤 **Custom Avatars** | Upload your profile picture |
| 📱 **Responsive** | Works on desktop, tablet, and mobile |
| 🌙 **Dark Mode** | Easy on the eyes, always |
| ⚡ **No Registration** | Just pick a name and start calling |
| 🔒 **Secure** | WebRTC encrypted, HTTPS ready |

---

## 🎬 Demo

> **Live Demo:** [darkcall.example.com](https://darkcall.example.com)

![DarkCall Screenshot](https://via.placeholder.com/800x450/050b14/247cff?text=DarkCall+Screenshot)

---

## 🚀 Quick Start

### Option 1: Run Directly

```bash
# Clone the repository
git clone https://github.com/yourusername/DarkCall.git
cd DarkCall

# Run the setup script
chmod +x run.sh
./run.sh
```

Open http://localhost:8765 in your browser.

### Option 2: Manual Setup

```bash
# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start the server
python server.py
```

---

## 📦 Installation

### Prerequisites

- Python 3.10 or higher
- pip (Python package manager)
- Git

### Step-by-Step

#### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/DarkCall.git
cd DarkCall
```

#### 2. Create Virtual Environment

```bash
python3 -m venv venv

# Linux/macOS
source venv/bin/activate

# Windows
venv\Scripts\activate
```

#### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

#### 4. Start the Server

```bash
python server.py
```

#### 5. Open Your Browser

Navigate to: **http://localhost:8765**

---

## 🐳 Docker

### Using Docker Compose (Recommended)

```bash
# Build and run
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

### Using Docker Only

```bash
# Build the image
docker build -t darkcall .

# Run the container
docker run -d -p 8765:8765 --name darkcall darkcall
```

---

## 🌐 Production Deployment

### Using Nginx + Let's Encrypt

#### 1. Server Setup (Ubuntu 22.04)

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install required packages
sudo apt install -y python3 python3-pip python3-venv nginx certbot python3-certbot-nginx git
```

#### 2. Deploy the Application

```bash
# Clone to /opt
cd /opt
sudo git clone https://github.com/yourusername/DarkCall.git
cd DarkCall

# Setup
sudo python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

#### 3. Create Systemd Service

```bash
sudo nano /etc/systemd/system/darkcall.service
```

Add this content:

```ini
[Unit]
Description=DarkCall Video Server
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/DarkCall
ExecStart=/opt/DarkCall/venv/bin/python server.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl daemon-reload
sudo systemctl enable darkcall
sudo systemctl start darkcall
```

#### 4. Configure Nginx

```bash
sudo nano /etc/nginx/sites-available/darkcall
```

Add this content:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:8765;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /ws {
        proxy_pass http://127.0.0.1:8765;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_read_timeout 86400;
    }
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/darkcall /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

#### 5. Enable HTTPS with Certbot

```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

#### 6. Setup Auto-Renewal

```bash
sudo systemctl status certbot.timer
sudo certbot renew --dry-run
```

---

## ⚙️ Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `8765` | Server port |
| `HOST` | `0.0.0.0` | Server host |
| `LOG_LEVEL` | `info` | Logging level |

### Custom Configuration

Edit `server.py` to change:

```python
PORT = 8765  # Change to your desired port
```

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENTS                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Browser 1  │  │   Browser 2  │  │   Browser 3  │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                 │                 │               │
│         └────────┬────────┴────────┬────────┘               │
│                  │                 │                        │
└──────────────────┼─────────────────┼────────────────────────┘
                   │                 │
            ┌──────▼──────┐   ┌──────▼──────┐
            │  WebSocket  │   │    WebRTC   │
            │ (Signaling) │   │ (P2P Media) │
            └──────┬──────┘   └──────┬──────┘
                   │                 │
            ┌──────▼──────────────────▼──────┐
            │         DarkCall Server         │
            │   - Room Management             │
            │   - WebSocket Signaling         │
            │   - Static File Serving         │
            └────────────────────────────────┘
```

### How It Works

1. **WebSocket** handles signaling (join/leave rooms, chat messages)
2. **WebRTC** handles peer-to-peer audio/video (no server load)
3. **Server** only relays signals, never sees your video/audio
4. **STUN servers** help peers find each other through NATs

---

## 📡 API Reference

### WebSocket Messages

#### Join Room
```json
{
    "type": "join_room",
    "room": "1234",
    "name": "John",
    "avatar": "data:image/png;base64,..."
}
```

#### Chat Message
```json
{
    "type": "chat_message",
    "text": "Hello everyone!"
}
```

#### WebRTC Signaling
```json
{
    "type": "offer",
    "target": "peer_uid",
    "sdp": { ... }
}
```

---

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details.

### Quick Start for Contributors

```bash
# Fork the repository
# Clone your fork
git clone https://github.com/yourusername/DarkCall.git

# Create a feature branch
git checkout -b feature/amazing-feature

# Make your changes
# Commit
git commit -m "Add amazing feature"

# Push
git push origin feature/amazing-feature

# Open a Pull Request
```

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [FastAPI](https://fastapi.tiangolo.com/) - Modern Python web framework
- [WebRTC](https://webrtc.org/) - Real-time communication
- [Uvicorn](https://www.uvicorn.org/) - Lightning-fast ASGI server

---

<div align="center">

**Made with ❤️ by DarkCall Team**

[Report Bug](https://github.com/yourusername/DarkCall/issues) · [Request Feature](https://github.com/yourusername/DarkCall/issues)

</div>
]]>