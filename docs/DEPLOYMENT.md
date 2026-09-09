# Deployment Guide

## Production Setup (Ubuntu 22.04)

### 1. Server Requirements

- Ubuntu 22.04 LTS
- 1GB RAM minimum
- 10GB storage
- Root access

### 2. Quick Deploy

```bash
# Clone and run setup script
git clone https://github.com/pedroamaraldossantos11-code/DarkCall.git
cd DarkCall
sudo ./scripts/setup.sh
```

The script will:
- Install all dependencies
- Configure Nginx
- Set up SSL with Let's Encrypt
- Create systemd service

### 3. Manual Deployment

#### Install Dependencies

```bash
sudo apt update
sudo apt install -y python3 python3-pip python3-venv nginx certbot python3-certbot-nginx git
```

#### Clone and Setup

```bash
cd /opt
sudo git clone https://github.com/pedroamaraldossantos11-code/DarkCall.git
cd DarkCall
sudo python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

#### Create Systemd Service

```bash
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
RestartSec=10

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable darkcall
sudo systemctl start darkcall
```

#### Configure Nginx

```bash
sudo nano /etc/nginx/sites-available/darkcall
```

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

```bash
sudo ln -s /etc/nginx/sites-available/darkcall /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

#### Enable HTTPS

```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

## Docker Deployment

```bash
# Build and run
docker-compose up -d

# View logs
docker-compose logs -f

# Restart
docker-compose restart

# Stop
docker-compose down
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| PORT | 8765 | Server port |
| HOST | 0.0.0.0 | Server host |
| LOG_LEVEL | info | Logging level |

## Service Management

```bash
# Check status
sudo systemctl status darkcall

# Restart
sudo systemctl restart darkcall

# Stop
sudo systemctl stop darkcall

# View logs
sudo journalctl -u darkcall -f
```

## SSL Certificate Renewal

Certificates auto-renew via certbot. Test with:

```bash
sudo certbot renew --dry-run
```
