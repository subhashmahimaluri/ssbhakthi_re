# SSBhakthi Data Export and Import Guide

This guide explains how to export and import the SSBhakthi application data for development purposes.

## Exporting Data (For the Current Developer)

To export all data for another developer:

```bash
# Make the export script executable
chmod +x export-data.sh

# Run the export script
./export-data.sh
```

This will create:

1. A `export/` directory with all data organized by service
2. A compressed tar.gz archive with a timestamp

The export includes:

- MongoDB database dump (all collections)
- Keycloak realm configuration
- Redis data (if any)
- Configuration files

## Importing Data (For the New Developer)

To import the data on a new machine:

1. Extract the provided tar.gz archive:

   ```bash
   tar -xzf ssbhakthi-export-YYYYMMDD-HHMMSS.tar.gz
   ```

2. Make the import script executable:

   ```bash
   chmod +x import-data.sh
   ```

3. Run the import script:

   ```bash
   ./import-data.sh
   ```

4. Run the import script:

   ```bash
   ./import-data.sh
   ```

5. Review and update the `.env` file with your specific configuration

6. Start the services:
   ```bash
   docker-compose up -d
   ```

## Service Credentials

### MongoDB

- Port: 27017
- Username: admin
- Password: devpassword123
- Database: ssbhakthi_api

### Redis

- Port: 6379
- Password: devpassword123

### Keycloak

- Port: 8080
- Admin Username: admin
- Admin Password: admin
- Realm: ssbhakthi

## Keycloak Users

The default Keycloak realm includes:

- Username: editor1
- Password: Passw0rd!
- Role: editor

## Environment Variables

After importing, make sure to:

1. Copy `.env.example` to `.env`
2. Update any paths or URLs specific to your environment
3. Change default passwords for production use

## Troubleshooting

If you encounter issues:

1. Ensure Docker is running
2. Check that all containers start properly
3. Verify network connectivity between services
4. Confirm that ports are not already in use

For any issues, check the Docker logs:

```bash
docker-compose logs [service-name]
```
