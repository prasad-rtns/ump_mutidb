# WSO2 APIM Import Assets

This directory contains import-ready OpenAPI definitions for the UMP services.

Use these files in WSO2 API Manager Publisher with `Create API -> Import OpenAPI`.

## Recommended APIs

| API | OpenAPI File | Recommended Context | Backend Endpoint |
|---|---|---|---|
| UMP Identity API | `openapi/ump-auth.yaml` | `/identity` | `http://auth-service:6001/api/v1` |
| UMP Master API | `openapi/ump-master.yaml` | `/master` | `http://master-service:6002/api/v1/master` |
| UMP Documents API | `openapi/ump-documents.yaml` | `/documents` | `http://document-service:6003/api/v1/documents` |

`/identity` is used instead of `/auth` so the API can expose both `/auth/*` and `/users/*` resources without awkward duplicated gateway paths like `/auth/auth/login`.

## Publisher Import Flow

1. Open `https://localhost:9443/publisher`.
2. Choose `Import OpenAPI`.
3. Upload one of the files from `apim/openapi`.
4. Verify:
   - API name
   - version `1.0.0`
   - context
   - endpoint URL
5. Create the API.
6. Review subscriptions, scopes, throttling, and lifecycle status.
7. Publish the API.

## Dev Portal Flow

1. Open `https://localhost:9443/devportal`.
2. Create an application.
3. Subscribe the application to:
   - `UMP Identity API`
   - `UMP Master API`
   - `UMP Documents API`
4. Generate keys.
5. Use the generated access token with the APIM Gateway.

## Example Gateway Calls

```bash
curl https://localhost:8243/identity/auth/me \
  -H "Authorization: Bearer <access-token>"

curl https://localhost:8243/master/countries \
  -H "Authorization: Bearer <access-token>"

curl https://localhost:8243/documents \
  -H "Authorization: Bearer <access-token>"
```

## Notes

- The OpenAPI files include `x-wso2-*` endpoint metadata so APIM can prefill backend settings during import.
- The definitions default to the `Unlimited` API throttling tier to avoid import failures in a clean local APIM instance.
- If you want application throttling tiers such as `Bronze`, `Silver`, or `Gold`, attach them in APIM after import based on the policies available in your environment.
- If you later split user-management APIs away from auth APIs, create a fourth API with context `/users` rather than changing the `/identity` contract in place.
