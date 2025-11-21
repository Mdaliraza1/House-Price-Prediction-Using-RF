#!/bin/bash
set -e

echo "==========================================="
echo "🚀 Deployment Started"
echo "==========================================="

# Basic info
IMAGE_NAME="house_price_prediction_web"
CRITICAL_FILES_REGEX="(dockerfile|Dockerfile|requirements\.txt|\.py$|docker-compose\.ya?ml)"

echo "Checking if rebuild is needed..."
echo ""

# Check existing image
IMAGE_EXISTS=$(docker images -q "$IMAGE_NAME" 2>/dev/null || echo "")
NEEDS_REBUILD=false

if [ -z "$IMAGE_EXISTS" ]; then
    echo "⚠️  Image does not exist, rebuilding..."
    NEEDS_REBUILD=true
else
    echo "✓ Existing image found."
fi

# Check if any important file changed in the latest commit
if [ "$NEEDS_REBUILD" = false ]; then
    if git rev-parse HEAD~1 >/dev/null 2>&1; then
        CHANGED_FILES=$(git diff HEAD~1 HEAD --name-only || echo "")

        # Look for python, dockerfile, requirements, docker-compose changes
        if echo "$CHANGED_FILES" | grep -qiE "$CRITICAL_FILES_REGEX"; then
            echo "⚠️  Important files changed:"
            echo "$CHANGED_FILES" | grep -iE "$CRITICAL_FILES_REGEX"
            NEEDS_REBUILD=true
        else
            echo "✓ No important changes detected."
        fi
    else
        echo "⚠️  No previous commit found (first deploy), rebuilding..."
        NEEDS_REBUILD=true
    fi
fi

echo ""
echo "🛑 Stopping old containers..."
docker-compose down --remove-orphans || true
echo "✓ Stopped."

echo ""

# Build or just run based on above check
if [ "$NEEDS_REBUILD" = true ]; then
    echo "🔄 Building new image..."
    docker-compose build
    echo "🚀 Starting with fresh build..."
    docker-compose up -d
else
    echo "🚀 Starting using existing image..."
    docker-compose up -d
fi

echo ""
echo "⏳ Allowing services to start..."
sleep 3

echo "📦 Current container status:"
docker-compose ps

echo ""
echo "🔁 Restarting services (if available)..."
sudo systemctl restart gunicorn 2>/dev/null || echo "Gunicorn not found."
sudo systemctl restart nginx 2>/dev/null || echo "Nginx not found."

echo ""
echo "==========================================="
echo "🎉 Deployment Completed Successfully"
echo "==========================================="
