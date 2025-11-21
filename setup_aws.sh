#!/bin/bash
# Initial AWS EC2 Setup Script
# Run this once on your EC2 instance

set -e

echo "Setting up AWS EC2 for Django deployment..."

# Update system
sudo apt-get update
sudo apt-get upgrade -y

# Install Python and pip
sudo apt-get install -y python3 python3-pip python3-venv git nginx

# Install PostgreSQL (optional, if not using SQLite)
# sudo apt-get install -y postgresql postgresql-contrib

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
APP_DIR="$SCRIPT_DIR"

# Change to script directory
cd "$APP_DIR"

# Verify requirements.txt exists
if [ ! -f "requirements.txt" ]; then
    echo "Error: requirements.txt not found in $APP_DIR"
    echo "Current directory: $PWD"
    echo "Please run this script from the directory containing requirements.txt"
    exit 1
fi

echo "Using application directory: $APP_DIR"

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install --upgrade pip
pip install -r requirements.txt

# Create settings.ini from template (check in current directory)
if [ ! -f settings.ini ]; then
    if [ -f settings.ini.example ]; then
        cp settings.ini.example settings.ini
        echo "Please edit settings.ini with your production settings!"
    else
        echo "Warning: settings.ini.example not found. You'll need to create settings.ini manually."
    fi
fi

# Collect static files
python manage.py collectstatic --noinput

# Run migrations
python manage.py migrate

# Create systemd service file
sudo tee /etc/systemd/system/house-price-prediction.service > /dev/null <<EOF
[Unit]
Description=House Price Prediction Django App
After=network.target

[Service]
User=$USER
Group=$USER
WorkingDirectory=$APP_DIR
Environment="PATH=$APP_DIR/venv/bin"
ExecStart=$APP_DIR/venv/bin/gunicorn \\
    --workers 3 \\
    --bind 127.0.0.1:8000 \\
    House_Price_Prediction.wsgi:application

[Install]
WantedBy=multi-user.target
EOF

# Enable and start service
sudo systemctl daemon-reload
sudo systemctl enable house-price-prediction
sudo systemctl start house-price-prediction

# Configure Nginx
sudo tee /etc/nginx/sites-available/house-price-prediction > /dev/null <<EOF
server {
    listen 80;
    server_name _;

    location /static/ {
        alias $APP_DIR/staticfiles/;
    }

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

# Enable Nginx site
sudo ln -sf /etc/nginx/sites-available/house-price-prediction /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx

echo "Setup completed!"
echo "Next steps:"
echo "1. Edit $APP_DIR/settings.ini with your production settings"
echo "2. Configure your domain in Nginx config"
echo "3. Set up SSL with Let's Encrypt: sudo apt-get install certbot python3-certbot-nginx"
echo "4. Run: sudo certbot --nginx -d your-domain.com"

