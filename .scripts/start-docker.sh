#!/bin/bash
set -e

echo "==========================================="
echo "Deployment Started"
echo "==========================================="

echo "Stopping existing containers..."
sudo docker-compose down --remove-orphans 2>/dev/null || true

echo "Building and starting containers in detached mode..."
sudo docker-compose up --build -d --force-recreate --remove-orphans 2>&1

echo "Waiting for containers to initialize..."
sleep 10

echo "Container status:"
sudo docker-compose ps 2>&1

# Quick health check
echo "Verifying container is running..."
if sudo docker-compose ps | grep -q "Up"; then
  echo "✓ Container is UP and running!"
else
  echo "✗ Warning: Container may not be running properly"
  echo "Container logs:"
  sudo docker-compose logs --tail=100 2>&1
fi

echo "Latest container logs:"
sudo docker-compose logs --tail=30 2>&1

echo "==========================================="
echo "Deployment Completed"
echo "==========================================="
echo "Application should be accessible on port 8000"
