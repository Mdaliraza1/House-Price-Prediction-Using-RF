#!/bin/bash
set -e

echo "Starting Django application..."

# Run migrations
python manage.py migrate

# Start Gunicorn
gunicorn --bind 0.0.0.0:8000 House_Price_Prediction.wsgi:application --workers 3
