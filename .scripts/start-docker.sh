#!/bin/bash
set -e

echo "Checking if rebuild is needed..."

# Check if Docker image exists
IMAGE_EXISTS=$(docker images -q house_price_prediction_web 2>/dev/null || echo "")
NEEDS_REBUILD=false

if [ -z "$IMAGE_EXISTS" ]; then
  echo "Image not found, rebuild required"
  NEEDS_REBUILD=true
else
  # Check if critical files changed using git (more reliable)
  # Check last commit for changes to critical files
  if git rev-parse HEAD~1 >/dev/null 2>&1; then
    if git diff HEAD~1 HEAD --name-only | grep -qE "(dockerfile|requirements\.txt|\.py$|docker-compose\.yaml)" 2>/dev/null; then
      echo "Critical files changed, rebuild required"
      NEEDS_REBUILD=true
    else
      echo "No critical changes detected, skipping rebuild"
    fi
  else
    # If no previous commit, rebuild to be safe
    echo "No previous commit found, rebuilding"
    NEEDS_REBUILD=true
  fi
fi

echo "Stopping existing containers..."
docker-compose down --remove-orphans

if [ "$NEEDS_REBUILD" = true ]; then
  echo "Rebuilding and starting containers..."
  # Use build cache for faster rebuilds
  docker-compose build
  docker-compose up -d
else
  echo "Starting containers (using existing image)..."
  docker-compose up -d
fi

# Restart services
echo "Restarting services..."
sudo systemctl restart gunicorn 2>/dev/null || true
sudo systemctl restart nginx 2>/dev/null || true

echo "Deployment completed successfully!"
echo "All containers started successfully."