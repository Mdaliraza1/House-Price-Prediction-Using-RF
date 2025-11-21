#!/bin/bash
# AWS EC2 Deployment Script

set -e

echo "Starting deployment..."

# Navigate to application directory
cd /home/ubuntu/house-price-prediction || cd /var/www/house-price-prediction

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
# For systemd service
sudo systemctl restart house-price-prediction || true

# Or for supervisor
# sudo supervisorctl restart house-price-prediction || true

# Or for gunicorn directly (if running as service)
# sudo systemctl restart gunicorn || true

echo "Deployment completed successfully!"

