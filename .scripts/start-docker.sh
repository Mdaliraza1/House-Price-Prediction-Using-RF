#!/bin/bash
set -e

echo "Removing existing containers..."
docker-compose down --remove-orphans -v

echo "Building and starting containers..."
docker-compose up --build -d

echo "Waiting for containers to stabilize..."
sleep 3

echo "Checking container logs..."
docker-compose logs --tail=20

echo "✔ Deployment completed successfully (using Docker only)"
