# Keycloak Authentication Setup

## Starting Keycloak

```bash
# Start Keycloak with Postgres database
docker compose -f docker-compose.keycloak.yml up -d
```

## Admin Console

- URL: http://localhost:8080/
- Admin credentials: `admin` / `admin` (change after first login)
- Realm: `ssbhakthi` (auto-imported at startup)
- Test user: `editor1` / `Passw0rd!`

## Client Configuration

### Admin App (admin-app)

- For frontend applications
- Public client
- Redirect URIs: `http://localhost:3000/*`, `http://localhost:3001/*`
- Web origins: `http://localhost:3000`, `http://localhost:3001`
- To get credentials:
  1. Go to Clients → admin-app
  2. Click on the client
  3. Credentials tab

### API App (api-app)

- For backend services
- Confidential client
- Service accounts enabled
- Audience value: `api-app`
- To get credentials:
  1. Go to Clients → api-app
  2. Click on the client
  3. Credentials tab

## Backend Configuration

The following environment variables need to be set in your `.env` file:

```env
KEYCLOAK_ISSUER=http://localhost:8080/realms/ssbhakthi
KEYCLOAK_JWKS_URL=http://localhost:8080/realms/ssbhakthi/protocol/openid-connect/certs
KEYCLOAK_AUDIENCE=api-app
```

## Token Validation

The backend validates tokens using the following process:

1. Check for `Authorization: Bearer <token>` header
2. Verify token signature using JWKS endpoint
3. Validate issuer (`iss`) matches KEYCLOAK_ISSUER
4. Validate audience (`aud`) matches KEYCLOAK_AUDIENCE
5. Extract user information (sub, email, roles) from token

## Troubleshooting

### Realm Import Issues

The realm is imported only when the database is empty. To re-import:

1. Remove the Keycloak database volume:

```bash
docker volume rm ssbhakthi_api_keycloak-db-data
```

2. Restart the containers:

```bash
docker compose -f docker-compose.keycloak.yml up -d
```

### Getting JWKS

To manually check JWKS:

```bash
curl http://localhost:8080/realms/ssbhakthi/protocol/openid-connect/certs
```

### OpenID Configuration

To get OpenID configuration:

```bash
curl http://localhost:8080/realms/ssbhakthi/.well-known/openid-configuration
```
