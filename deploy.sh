#!/bin/bash
# AWS EC2 Deployment Script

set -e

echo "Starting deployment..."

# Navigate to application directory
# Try multiple possible locations
if [ -d "/var/www/house-price-prediction/House-Price-Prediction-Using-RF" ]; then
    cd /var/www/house-price-prediction/House-Price-Prediction-Using-RF
elif [ -d "/var/www/house-price-prediction" ]; then
    cd /var/www/house-price-prediction
elif [ -d "/home/ubuntu/house-price-prediction" ]; then
    cd /home/ubuntu/house-price-prediction
else
    echo "Error: Application directory not found!"
    echo "Searched in:"
    echo "  - /var/www/house-price-prediction/House-Price-Prediction-Using-RF"
    echo "  - /var/www/house-price-prediction"
    echo "  - /home/ubuntu/house-price-prediction"
    exit 1
fi

echo "Current directory: $(pwd)"

# Pull latest code
git pull origin main || git pull origin master

# Activate virtual environment if it exists
if [ -d "venv" ]; then
    source venv/bin/activate
elif [ -d "env" ]; then
    source env/bin/activate
fi

# Install/update dependencies
pip install -r requirements.txt --upgrade

# Collect static files
python manage.py collectstatic --noinput

# Run migrations
python manage.py migrate --noinput

# Restart application server
echo "Restarting application service..."
if sudo systemctl restart house-price-prediction; then
    echo "✓ Service restarted successfully"
    sudo systemctl status house-price-prediction --no-pager -l || true
else
    echo "✗ Failed to restart service"
    sudo systemctl status house-price-prediction --no-pager -l || true
    exit 1
fi

# Verify service is running
sleep 2
if sudo systemctl is-active --quiet house-price-prediction; then
    echo "✓ Service is running"
else
    echo "✗ Service is not running!"
    sudo systemctl status house-price-prediction --no-pager -l
    exit 1
fi

echo "Deployment completed successfully!"

