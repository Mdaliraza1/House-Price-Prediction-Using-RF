#!/bin/bash
set -e

echo "==========================================="
echo "Deployment Started"
echo "==========================================="

echo "Stopping existing containers..."
docker-compose down --remove-orphans 2>/dev/null || true

echo "Building and starting containers..."
docker-compose up --build -d

echo "Waiting for containers to start..."
sleep 5

echo "Container status:"
docker-compose ps

echo "Restarting services..."
sudo systemctl restart gunicorn 2>/dev/null || echo "Gunicorn not found"
sudo systemctl restart nginx 2>/dev/null || echo "Nginx not found"

echo "==========================================="
echo "Deployment Completed Successfully"
echo "==========================================="
