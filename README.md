# User Management Platform

UMP is a Node.js and TypeScript microservices stack with `auth-service`, `master-service`, and `document-service`. This branch is wired for `WSO2 API Manager` as the public API gateway and developer-facing control plane.

## Architecture

```text
Client App
  |
  v
WSO2 API Manager
  - Publisher: https://localhost:9443/publisher
  - Dev Portal: https://localhost:9443/devportal
  - Gateway: https://localhost:8243
  |
  v
UMP Services on Docker Network
  - auth-service
  - master-service
  - document-service
  |
  v
MySQL / MongoDB / Redis
```

`auth-service` is the resource server. It validates WSO2-issued access tokens and resolves or auto-provisions the local UMP user profile used by the other services. `master-service` and `document-service` trust `auth-service /auth/me` for identity enrichment, so only one service needs direct WSO2 token logic.

## What Changed For APIM Mode

- `docker-compose.yml` now includes a `wso2-apim` container with Publisher, Dev Portal, and Gateway ports.
- Root `.env` and `.env.example` now define APIM and WSO2 settings.
- Service env files now default to `AUTH_PROVIDER=wso2`.
- `document-service/.env` now uses `AUTH_SERVICE_URL=http://auth-service:6001/api/v1` to match the middleware contract.
- Services already run with `trust proxy`, so they can sit behind APIM or NGINX without breaking forwarded request metadata.

## Required URLs

After `docker compose up -d`, use:

- Publisher: `https://localhost:9443/publisher`
- Dev Portal: `https://localhost:9443/devportal`
- Gateway HTTPS: `https://localhost:8243`
- Gateway HTTP: `http://localhost:8280`

Internal service URLs remain:

- Auth API: `http://localhost:6001/api/v1`
- Master API: `http://localhost:6002/api/v1`
- Document API: `http://localhost:6003/api/v1`

Those direct ports are useful for debugging. For consumer traffic, use APIM Gateway URLs.

## Environment

Root `.env` now carries the APIM-facing settings:

```env
AUTH_PROVIDER=wso2
APIM_IMAGE=wso2/wso2am:4.4.0
APIM_PUBLISHER_URL=https://localhost:9443/publisher
APIM_DEVPORTAL_URL=https://localhost:9443/devportal
APIM_GATEWAY_URL=https://localhost:8243
WSO2_ISSUER=https://wso2-apim:9443/oauth2/token
WSO2_JWKS_URI=https://wso2-apim:9443/oauth2/jwks
WSO2_AUDIENCE=ump-client
WSO2_AUTO_PROVISION_USERS=true
```

You still need valid local master data IDs for first-time user provisioning:

```env
WSO2_DEFAULT_ROLE_ID=550e8400-e29b-41d4-a716-446655440003
WSO2_DEFAULT_DEPARTMENT_ID=660e8400-e29b-41d4-a716-446655440005
WSO2_DEFAULT_DESIGNATION_ID=770e8400-e29b-41d4-a716-446655440006
```

## Start The Stack

1. Copy the root env file.

```bash
cp .env.example .env
```

2. Review the APIM and WSO2 values in `.env`.

3. Start the containers.

```bash
docker compose up -d
```

4. Check the main endpoints.

```bash
docker compose ps
curl http://localhost:6001/health
curl http://localhost:6002/health
curl http://localhost:6003/health
```

Note: the stock `wso2/wso2am:4.4.0` image is enough for local wiring, but production deployments should use WSO2's maintained deployment guidance rather than this single-container setup.

## WSO2 API Publishing Flow

1. Open Publisher at `https://localhost:9443/publisher`.
2. Create or import an API for each public UMP surface you want to expose.
3. Point the backend endpoints at the internal service URLs on the Docker network.
4. Configure OAuth2 security in APIM for the APIs.
5. Publish the APIs so they are visible in the Dev Portal.

Suggested backend targets inside Docker:

- `http://auth-service:6001/api/v1`
- `http://master-service:6002/api/v1`
- `http://document-service:6003/api/v1`

Suggested public APIs in APIM:

- `ump-auth` -> `/identity`
- `ump-master` -> `/master`
- `ump-documents` -> `/documents`

## Subscription And Application Flow

1. Open Dev Portal at `https://localhost:9443/devportal`.
2. Create an application for the consuming frontend or client.
3. Subscribe that application to the published UMP APIs.
4. Generate keys or tokens from the application.
5. Call the APIM Gateway URL with the issued token.

Example gateway calls:

```bash
curl https://localhost:8243/identity/auth/me \
  -H "Authorization: Bearer <access-token>"

curl https://localhost:8243/master/countries \
  -H "Authorization: Bearer <access-token>"

curl https://localhost:8243/documents \
  -H "Authorization: Bearer <access-token>"
```

If your APIM API context includes `/api/v1`, reflect that in the gateway URL you publish. Keep the backend and published context aligned. The services only require a bearer token; they do not require APIM-specific custom headers.

## Auth Behavior In APIM Mode

When `AUTH_PROVIDER=wso2`:

- `auth-service` validates the bearer token against WSO2 JWKS.
- `auth-service` resolves the local UMP user or auto-provisions one.
- `master-service` and `document-service` call `auth-service /auth/me` internally.
- Local `register`, `login`, and `refresh` flows are disabled.
- Local authorization still uses UMP role, department, and designation data.

This keeps authentication external and central while preserving UMP's authorization model.

## Throttling, Policies, And Monetization

These concerns are expected to live in WSO2 APIM, not in the Node services:

- API lifecycle and versioning: Publisher
- Application and subscription management: Dev Portal
- Rate limits and quotas: APIM throttling policies
- Gateway mediation and policy enforcement: APIM gateway
- Monetization: APIM product configuration

The Node services should remain thin backend implementations. Avoid duplicating APIM policies inside Express unless the policy is service-internal and independent of gateway behavior.

## Local Service Commands

Use workspace-root commands:

```bash
npm install
npm run build --workspace=auth-service
npm run build --workspace=master-service
npm run build --workspace=document-service
```

MySQL migration examples:

```bash
npm run migrate:mysql --workspace=master-service
npm run migrate:mysql --workspace=document-service
```

If you run migrations from the host shell instead of inside containers, use host-resolvable DB values such as `MYSQL_HOST=localhost` and `MYSQL_PORT=3305`.

## Notes

- `nginx` is still present for internal routing or legacy local access, but APIM should be treated as the public gateway in this branch.
- If APIM forwards the original bearer token, the current middleware path is sufficient.
- If you later decide to use APIM-generated backend JWTs or custom mediation policies, that is a separate integration step and should be designed explicitly rather than inferred.
