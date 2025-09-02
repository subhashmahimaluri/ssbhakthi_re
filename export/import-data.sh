#!/bin/bash

# SSBhakthi Data Import Script
# This script imports all necessary data for a new developer

echo "🚀 Starting SSBhakthi Data Import..."

# Check if export directory exists
if [ ! -d "./mongodb" ] || [ ! -d "./keycloak" ]; then
  echo "❌ Export directories not found. Please make sure you have the exported data."
  echo "   Expected directories: mongodb, keycloak"
  exit 1
fi

echo "📁 Found export directories"

# 1. Import MongoDB Data
echo "📦 Importing MongoDB Data..."

# Check if MongoDB container is running
if ! docker ps | grep -q ssbhakthi_mongodb; then
  echo "⚠️  MongoDB container not running. Please start it first."
  echo "   You can start it with: docker-compose up -d mongodb"
  exit 1
fi

# Copy the dump to container
echo "Copying MongoDB dump to container..."
docker cp ./mongodb/mongodump ssbhakthi_mongodb:/tmp/

# Restore the data
echo "Restoring MongoDB data..."
docker exec ssbhakthi_mongodb mongorestore \
  --username admin \
  --password devpassword123 \
  --authenticationDatabase admin \
  --drop \
  /tmp/mongodump

echo "✅ MongoDB data imported successfully"

# 2. Import Keycloak Configuration
echo "🔐 Setting up Keycloak Configuration..."

# Copy the realm configuration file to the appropriate directory
mkdir -p ./backend/infra/keycloak/import
cp ./keycloak/ssbhakthi-realm.json ./backend/infra/keycloak/import/

echo "✅ Keycloak configuration set up successfully"

# 3. Import Redis Data (if exists)
if [ -f "./redis/dump.rdb" ]; then
  echo "キャッシング Importing Redis Data..."
  
  # Check if Redis container is running
  if ! docker ps | grep -q ssbhakthi_redis; then
    echo "⚠️  Redis container not running. Please start it first."
    echo "   You can start it with: docker-compose up -d redis"
  else
    # Copy the dump file to container
    echo "Copying Redis dump to container..."
    docker cp ./redis/dump.rdb ssbhakthi_redis:/data/
    
    # Restart Redis to load the data
    echo "Restarting Redis to load data..."
    docker restart ssbhakthi_redis
    
    echo "✅ Redis data imported successfully"
  fi
else
  echo "ℹ️  No Redis dump file found. Skipping Redis import."
fi

# 4. Copy Configuration Files
echo "⚙️  Setting up Configuration Files..."

# Copy environment file if it doesn't exist
if [ ! -f ".env" ]; then
  cp .env.example .env
  echo "✅ Created .env file from .env.example"
  echo "⚠️  Please review and update .env file with your specific configuration"
else
  echo "ℹ️  .env file already exists. Skipping creation."
fi

echo "✅ Configuration files set up successfully"

echo "🎉 Import completed successfully!"
echo "💡 Next steps:"
echo "   1. Review and update .env file with your specific configuration"
echo "   2. Start all services with: docker-compose up -d"
echo "   3. Start backend with: cd backend && pnpm run dev"
echo "   4. Start frontend with: cd frontend && pnpm run dev"