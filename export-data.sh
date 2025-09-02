#!/bin/bash

# SSBhakthi Data Export Script
# This script exports all necessary data for another developer to import and work

echo "🚀 Starting SSBhakthi Data Export..."

# Create export directory
EXPORT_DIR="./export"
mkdir -p "$EXPORT_DIR"
mkdir -p "$EXPORT_DIR/mongodb"
mkdir -p "$EXPORT_DIR/keycloak"
mkdir -p "$EXPORT_DIR/redis"

echo "📁 Created export directory structure"

# 1. Export MongoDB Data
echo "📦 Exporting MongoDB Data..."

# Start MongoDB container if not running
echo "Starting MongoDB container..."
docker start ssbhakthi_mongodb 2>/dev/null || echo "MongoDB container already running or failed to start"

# Wait a moment for container to be ready
sleep 5

# Export all collections
echo "Exporting all collections from ssbhakthi_api database..."
docker exec ssbhakthi_mongodb mongodump \
  --username admin \
  --password devpassword123 \
  --authenticationDatabase admin \
  --db ssbhakthi_api \
  --out /tmp/mongodump

# Copy the dump from container to local export directory
echo "Copying MongoDB dump to export directory..."
docker cp ssbhakthi_mongodb:/tmp/mongodump "$EXPORT_DIR/mongodb/"

echo "✅ MongoDB data exported successfully"

# 2. Export Keycloak Configuration
echo "🔐 Exporting Keycloak Configuration..."

# Copy the realm configuration file
cp ./backend/infra/keycloak/import/ssbhakthi-realm.json "$EXPORT_DIR/keycloak/"

echo "✅ Keycloak configuration exported successfully"

# 3. Export Redis Data (if any important data exists)
echo "キャッシング Exporting Redis Data..."

# Start Redis container if not running
echo "Starting Redis container..."
docker start ssbhakthi_redis 2>/dev/null || echo "Redis container already running or failed to start"

# Wait a moment for container to be ready
sleep 3

# Save Redis data to a dump file
echo "Saving Redis data..."
docker exec ssbhakthi_redis redis-cli -a devpassword123 SAVE

# Copy the dump file from container to local export directory
echo "Copying Redis dump to export directory..."
docker cp ssbhakthi_redis:/data/dump.rdb "$EXPORT_DIR/redis/" 2>/dev/null || echo "No Redis dump file found or failed to copy"

echo "✅ Redis data exported successfully"

# 4. Copy Important Configuration Files
echo "⚙️  Exporting Configuration Files..."

# Copy environment file example
cp ./.env.example "$EXPORT_DIR/"

# Copy docker-compose files
cp ./docker-compose.yml "$EXPORT_DIR/"
cp ./backend/docker-compose.yml "$EXPORT_DIR/docker-compose.backend.yml" 2>/dev/null || echo "Backend docker-compose not found"
cp ./backend/docker-compose.dev.yml "$EXPORT_DIR/docker-compose.dev.yml" 2>/dev/null || echo "Dev docker-compose not found"
cp ./backend/docker-compose.keycloak.yml "$EXPORT_DIR/docker-compose.keycloak.yml" 2>/dev/null || echo "Keycloak docker-compose not found"

# Copy initialization scripts
cp -r ./backend/docker/mongo-init "$EXPORT_DIR/" 2>/dev/null || echo "Mongo init scripts not found"

# Copy import script
cp ./import-data.sh "$EXPORT_DIR/" 2>/dev/null || echo "Import script not found"

echo "✅ Configuration files exported successfully"

# 5. Create README with import instructions
echo "📝 Creating README with import instructions..."

cat > "$EXPORT_DIR/README.md" << 'EOF'
# SSBhakthi Data Export

This export contains all the necessary data for a new developer to set up their local development environment.

## Contents

1. **MongoDB Data** - Complete database dump
2. **Keycloak Configuration** - Realm configuration file
3. **Redis Data** - Cache data (if any)
4. **Configuration Files** - Environment and docker-compose files

## Import Instructions

### 1. Automated Import

For an easier import process, use the provided `import-data.sh` script:

```bash
chmod +x import-data.sh
./import-data.sh
```

This script will automatically handle:
- MongoDB data import
- Keycloak configuration setup
- Redis data import (if available)
- Configuration file setup

### 2. Manual Import

If you prefer to import manually:

#### MongoDB Data Import

```bash
# Start MongoDB container
docker run -d --name mongodb -p 27017:27017 \
  -e MONGO_INITDB_ROOT_USERNAME=admin \
  -e MONGO_INITDB_ROOT_PASSWORD=devpassword123 \
  -v mongodb_data:/data/db \
  mongo:7-jammy

# Import the data
docker cp mongodb/ mongodump ssbhakthi_mongodb:/tmp/
docker exec ssbhakthi_mongodb mongorestore \
  --username admin \
  --password devpassword123 \
  --authenticationDatabase admin \
  --drop \
  /tmp/mongodump
```

### 3. Keycloak Setup

The Keycloak realm configuration is in `keycloak/ssbhakthi-realm.json`. 
When starting Keycloak, it will automatically import this realm.

### 4. Redis Data

If a Redis dump exists, copy it to your Redis container's data directory.

### 5. Environment Setup

1. Copy `.env.example` to `.env` and adjust values as needed
2. Use the provided docker-compose files to start services

## Services Overview

- **MongoDB**: Port 27017, Username: admin, Password: devpassword123
- **Redis**: Port 6379, Password: devpassword123
- **Keycloak**: Port 8080, Admin: admin/admin

## Notes

- Make sure to change default passwords in production
- Update URLs in configuration files to match your environment
- Some data may need to be regenerated based on your specific setup
- This export directory should not be committed to version control
EOF

echo "✅ README created successfully"

# 6. Create a compressed archive
echo "📦 Creating compressed archive..."

tar -czf ssbhakthi-export-$(date +%Y%m%d-%H%M%S).tar.gz -C "$EXPORT_DIR" .

echo "🎉 Export completed successfully!"
echo "📁 Export files are located in: $EXPORT_DIR"
echo "📦 Compressed archive created in current directory"

echo "💡 To import this data on another machine:"
echo "   1. Extract the tar.gz file"
echo "   2. Follow the instructions in README.md"