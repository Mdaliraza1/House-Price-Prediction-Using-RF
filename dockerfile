# Taking Python as the base image
FROM python:3.11-slim

# Setting the working directory
WORKDIR /app

# Installing system libraries and Python dependencies in one layer
RUN apt-get update && apt-get install -y \
    gcc libpq-dev --no-install-recommends && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

# Copying requirements file first
COPY requirements.txt /app/

# Installing Python dependencies with aggressive cleanup
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt && \
    find /usr/local/lib/python3.11 -type d -name '__pycache__' -exec rm -rf {} + 2>/dev/null || true && \
    find /usr/local/lib/python3.11 -type d -name 'tests' -exec rm -rf {} + 2>/dev/null || true && \
    find /usr/local/lib/python3.11 -type f -name '*.pyc' -delete && \
    find /usr/local/lib/python3.11 -type f -name '*.pyo' -delete && \
    rm -rf /root/.cache /tmp/*

# Copying project files
COPY . /app/
COPY .scripts/start.sh /start.sh

# Set permissions and cleanup
RUN chmod +x /start.sh && \
    find /app -type d -name '__pycache__' -exec rm -rf {} + 2>/dev/null || true && \
    find /app -type f -name '*.pyc' -delete

# Exposing the port
EXPOSE 8000

# Start command
CMD ["sh", "/start.sh"]