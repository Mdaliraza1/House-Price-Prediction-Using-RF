#!/bin/bash
set -e

echo "Starting Django application..."

# Set environment variables
export DJANGO_SETTINGS_MODULE=House_Price_Prediction.settings

# Run migrations
echo "Running database migrations..."
python manage.py migrate --noinput

# Collect static files
echo "Collecting static files..."
python manage.py collectstatic --noinput || echo "Static files collection skipped"

# Check Django configuration
echo "Checking Django configuration..."
python manage.py check

# Start Gunicorn with better logging
echo "Starting Gunicorn server..."
gunicorn --bind 0.0.0.0:8000 \
         --workers 3 \
         --timeout 120 \
         --access-logfile - \
         --error-logfile - \
         --log-level info \
         House_Price_Prediction.wsgi:application
