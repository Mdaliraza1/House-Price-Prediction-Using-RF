#!/bin/bash
set -e

echo "==========================================="
echo "Deployment Started"
echo "==========================================="

echo "Stopping existing containers..."
sudo docker-compose down --remove-orphans 2>&1 || true

echo "Pulling latest images if any..."
sudo docker-compose pull 2>&1 || true

echo "Building containers..."
sudo docker-compose build --no-cache 2>&1

echo "Starting containers in detached mode..."
sudo docker-compose up -d --force-recreate --remove-orphans 2>&1

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
