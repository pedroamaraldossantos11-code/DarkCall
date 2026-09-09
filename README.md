<div align="center">

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
- [Quick Start](#-quick-start)
- [Installation](#-installation)
- [Docker](#-docker)
- [Production Deployment](#-production-deployment)
- [Configuration](#-configuration)
- [Architecture](#-architecture)
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

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/pedroamaraldossantos11-code/DarkCall.git
cd DarkCall

# Run the setup script
chmod +x scripts/run.sh
./scripts/run.sh
```

Open http://localhost:8765 in your browser.

### Manual Setup

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python server.py
```

---

## 📦 Installation

See [docs/INSTALL.md](docs/INSTALL.md) for detailed instructions.

### Prerequisites

- Python 3.10 or higher
- pip
- Git

### Quick Install

```bash
git clone https://github.com/pedroamaraldossantos11-code/DarkCall.git
cd DarkCall
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python server.py
```

---

## 🐳 Docker

```bash
# Using Docker Compose
docker-compose up -d

# Or build manually
docker build -t darkcall .
docker run -d -p 8765:8765 darkcall
```

---

## 🌐 Production Deployment

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) or run the setup script:

```bash
sudo ./scripts/setup.sh
```

### Quick Deploy (Ubuntu 22.04)

```bash
# Install dependencies
sudo apt update
sudo apt install -y python3 python3-pip python3-venv nginx certbot python3-certbot-nginx git

# Clone and setup
cd /opt
sudo git clone https://github.com/pedroamaraldossantos11-code/DarkCall.git
cd DarkCall
sudo python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Create systemd service
sudo nano /etc/systemd/system/darkcall.service
```

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

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable darkcall
sudo systemctl start darkcall
```

### Nginx Configuration

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:8765;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /ws {
        proxy_pass http://127.0.0.1:8765;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

### Enable HTTPS

```bash
sudo certbot --nginx -d yourdomain.com
```

---

## ⚙️ Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `8765` | Server port |
| `HOST` | `0.0.0.0` | Server host |

Edit `server.py` to change the port:

```python
PORT = 8765
```

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENTS                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Browser 1  │  │   Browser 2  │  │   Browser 3  │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         └────────┬────────┴────────┬────────┘               │
└──────────────────┼─────────────────┼────────────────────────┘
                   │                 │
            ┌──────▼──────┐   ┌──────▼──────┐
            │  WebSocket  │   │    WebRTC   │
            │ (Signaling) │   │ (P2P Media) │
            └──────┬──────┘   └──────┬──────┘
                   └────────┬────────┘
            ┌───────────────▼───────────────┐
            │       DarkCall Server         │
            │  - Room Management            │
            │  - WebSocket Signaling        │
            │  - Static File Serving        │
            └───────────────────────────────┘
```

**How it works:**
1. **WebSocket** handles signaling (join/leave rooms, chat)
2. **WebRTC** handles peer-to-peer audio/video
3. **Server** only relays signals, never sees your media
4. **STUN servers** help peers connect through NATs

---

## 🤝 Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md).

```bash
# Fork and clone
git clone https://github.com/YOUR_USERNAME/DarkCall.git

# Create feature branch
git checkout -b feature/amazing-feature

# Commit and push
git commit -m "Add amazing feature"
git push origin feature/amazing-feature

# Open Pull Request
```

---

## 📄 License

This project is licensed under the MIT License - see [LICENSE](LICENSE).

---

<div align="center">

**Made with ❤️ by DarkCall Team**

[Report Bug](https://github.com/pedroamaraldossantos11-code/DarkCall/issues) · [Request Feature](https://github.com/pedroamaraldossantos11-code/DarkCall/issues)

</div>
