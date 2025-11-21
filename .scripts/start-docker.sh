#!/bin/bash
set -e

echo "==========================================="
echo "Deployment Started"
echo "==========================================="

echo "Stopping existing containers..."
sudo docker-compose down --remove-orphans 2>/dev/null || true

echo "Cleaning up old images..."
sudo docker system prune -f --volumes 2>/dev/null || true

echo "Building and starting containers..."
sudo docker-compose up --build -d --force-recreate --remove-orphans

echo "Waiting for containers to start..."
sleep 10

echo "Container status:"
sudo docker-compose ps

# Wait for container to be healthy
echo "Checking if container is running..."
RETRIES=30
until [ "$(sudo docker-compose ps -q web | xargs sudo docker inspect -f '{{.State.Running}}' 2>/dev/null)" == "true" ] || [ $RETRIES -eq 0 ]; do
  echo "Waiting for container to start... ($RETRIES attempts remaining)"
  sleep 2
  RETRIES=$((RETRIES - 1))
done

if [ $RETRIES -eq 0 ]; then
  echo "ERROR: Container failed to start properly!"
  echo "Showing container logs:"
  sudo docker-compose logs --tail=100
  exit 1
fi

echo "Container is running successfully!"

echo "Checking container logs (last 50 lines)..."
sudo docker-compose logs --tail=50

echo "Restarting services..."
sudo systemctl restart gunicorn 2>/dev/null || echo "Gunicorn not found, skipping..."
sudo systemctl restart nginx 2>/dev/null || echo "Nginx not found, skipping..."

echo "==========================================="
echo "Deployment Completed Successfully"
echo "==========================================="
echo "Application should be running on port 8000"
echo "Run 'sudo docker-compose logs -f' to view live logs"
