#!/usr/bin/env bash
# DarkCall — Production Setup Script
# Run this on a fresh Ubuntu 22.04 server
set -e

echo ""
echo "  DarkCall Production Setup"
echo "  ========================="
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "Please run as root: sudo ./setup.sh"
    exit 1
fi

# Get domain from user
read -p "Enter your domain (e.g., call.example.com): " DOMAIN
read -p "Enter your email for Let's Encrypt: " EMAIL

if [ -z "$DOMAIN" ] || [ -z "$EMAIL" ]; then
    echo "Error: Domain and email are required."
    exit 1
fi

echo ""
echo "[1/8] Updating system..."
apt update && apt upgrade -y

echo ""
echo "[2/8] Installing dependencies..."
apt install -y python3 python3-pip python3-venv nginx certbot python3-certbot-nginx git curl

echo ""
echo "[3/8] Creating application directory..."
mkdir -p /opt/DarkCall
cd /opt/DarkCall

echo ""
echo "[4/8] Cloning repository..."
if [ -d ".git" ]; then
    git pull
else
    git clone https://github.com/yourusername/DarkCall.git .
fi

echo ""
echo "[5/8] Setting up Python environment..."
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

echo ""
echo "[6/8] Creating systemd service..."
cat > /etc/systemd/system/darkcall.service << EOF
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
EOF

systemctl daemon-reload
systemctl enable darkcall
systemctl start darkcall

echo ""
echo "[7/8] Configuring Nginx..."
cat > /etc/nginx/sites-available/darkcall << EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;

    location / {
        proxy_pass http://127.0.0.1:8765;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location /ws {
        proxy_pass http://127.0.0.1:8765;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_read_timeout 86400;
    }
}
EOF

ln -sf /etc/nginx/sites-available/darkcall /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx

echo ""
echo "[8/8] Enabling HTTPS with Let's Encrypt..."
certbot --nginx -d "$DOMAIN" -d "www.$DOMAIN" --non-interactive --agree-tos -m "$EMAIL"

echo ""
echo "  Setup Complete!"
echo "  ==============="
echo ""
echo "  Your DarkCall instance is now running at:"
echo "  https://$DOMAIN"
echo ""
echo "  Service commands:"
echo "    sudo systemctl status darkcall    # Check status"
echo "    sudo systemctl restart darkcall   # Restart"
echo "    sudo systemctl stop darkcall      # Stop"
echo "    sudo journalctl -u darkcall -f    # View logs"
echo ""
echo "  Nginx commands:"
echo "    sudo nginx -t                     # Test config"
echo "    sudo systemctl reload nginx       # Reload"
echo ""
