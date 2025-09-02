# SSBhakthi Data Export

This export contains all the necessary data for a new developer to set up their local development environment.

## Contents

1. **MongoDB Data** - Complete database dump
2. **Keycloak Configuration** - Realm configuration file
3. **Redis Data** - Cache data (if any)
4. **Configuration Files** - Environment and docker-compose files

## Import Instructions

### 1. MongoDB Data Import

You can use the provided `import-data.sh` script which automates this process, or manually import:

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

### 2. Automated Import

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

### 3. Keycloak Setup

The Keycloak realm configuration is in `keycloak/ssbhakthi-realm.json`. 
When starting Keycloak, it will automatically import this realm.

### 3. Redis Data

If a Redis dump exists, copy it to your Redis container's data directory.

### 4. Environment Setup

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
