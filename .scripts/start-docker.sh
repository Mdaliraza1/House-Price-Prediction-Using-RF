#!/bin/bash
set -e

echo "==========================================="
echo "Deployment Started"
echo "==========================================="

echo "Checking disk space..."
df -h

echo "Stopping existing containers..."
sudo docker-compose down --remove-orphans 2>&1 || true

echo "Ensuring port 8000 is free..."
# Kill any process using port 8000
sudo lsof -ti:8000 | xargs -r sudo kill -9 2>/dev/null || true
# Remove any lingering containers
sudo docker ps -a | grep house_price_prediction | awk '{print $1}' | xargs -r sudo docker rm -f 2>/dev/null || true

echo "Cleaning up Docker system to free space..."
echo "Removing all Docker containers, images, and volumes..."
sudo docker stop $(sudo docker ps -aq) 2>&1 || true
sudo docker rm $(sudo docker ps -aq) 2>&1 || true
sudo docker rmi -f $(sudo docker images -aq) 2>&1 || true
sudo docker volume prune -af 2>&1 || true
sudo docker system prune -af --volumes 2>&1 || true
sudo docker builder prune -af 2>&1 || true

echo "Cleaning system temporary files..."
sudo rm -rf /tmp/* 2>&1 || true
sudo apt-get clean 2>&1 || true
sudo journalctl --vacuum-time=1d 2>&1 || true

echo "Disk space after cleanup:"
df -h

echo "Building containers (using cache when possible)..."
sudo docker-compose build 2>&1

echo "Starting containers..."
# Only recreate if needed (much faster on subsequent deploys)
sudo docker-compose up -d --remove-orphans 2>&1

echo "Waiting for application to initialize..."
sleep 5

echo "Checking container status..."
sudo docker-compose ps

echo "Checking if web container is running..."
CONTAINER_ID=$(sudo docker-compose ps -q web)
if [ -n "$CONTAINER_ID" ]; then
  CONTAINER_STATE=$(sudo docker inspect -f '{{.State.Status}}' $CONTAINER_ID)
  echo "Container state: $CONTAINER_STATE"
  
  if [ "$CONTAINER_STATE" = "running" ]; then
    echo "✓ Container is running successfully!"
  else
    echo "✗ Container is not running. Current state: $CONTAINER_STATE"
  fi
  
  echo ""
  echo "Recent container logs:"
  sudo docker logs $CONTAINER_ID --tail=50
else
  echo "✗ Web container not found!"
  sudo docker ps -a
fi

echo ""
echo "==========================================="
echo "Deployment Completed"
echo "==========================================="
echo "Application is accessible on port 8000"
