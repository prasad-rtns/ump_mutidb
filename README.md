# 🏗️ User Management Platform (UMP)

Enterprise-grade microservices user management platform with multi-database support, built with Node.js, TypeScript, Drizzle ORM, and Redis.

## 📐 Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         NGINX (Port 80)                         │
│                       API Gateway / Proxy                       │
└────────┬──────────────────┬──────────────────┬─────────────────┘
         │                  │                  │
         ▼                  ▼                  ▼
┌─────────────────┐ ┌──────────────┐ ┌─────────────────────┐
│  auth-service   │ │master-service│ │  document-service   │
│    Port 3001    │ │  Port 3002   │ │     Port 3003       │
│                 │ │              │ │                     │
│ • Login         │ │ • Countries  │ │ • File Upload       │
│ • Register      │ │ • States     │ │ • S3/Cloudinary     │
│ • JWT Auth      │ │ • Cities     │ │ • Local Storage     │
│ • Users CRUD    │ │ • Categories │ │ • Signed URLs       │
│ • Roles         │ │ • Tags       │ │ • Bulk Upload       │
│ • Departments   │ │ • Doc Types  │ │ • Metadata Mgmt     │
│ • Designations  │ │ • Settings   │ │                     │
└────────┬────────┘ └──────┬───────┘ └──────────┬──────────┘
         │                 │                     │
┌────────▼─────────────────▼─────────────────────▼────────────┐
│                    Shared Infrastructure                      │
├───────────────────┬──────────────────┬───────────────────────┤
│   PostgreSQL:5432 │   MySQL:3306     │   MSSQL:1433          │
│   MongoDB:27017   │   Redis:6379     │   Oracle (optional)   │
└───────────────────┴──────────────────┴───────────────────────┘
```

## 🗂️ Project Structure

```
user-mgmt-platform/
├── docker-compose.yml              # Full stack orchestration
├── .env                            # Root env variables
├── README.md
│
├── shared/                         # Shared utilities (symlinked)
│   └── src/
│       ├── types/index.ts          # TypeScript interfaces
│       ├── utils/
│       │   ├── response.ts         # API response helpers
│       │   ├── logger.ts           # Winston logger factory
│       │   ├── jwt.ts              # JWT sign/verify utilities
│       │   └── redis.ts            # Redis client + cache service
│       ├── middleware/
│       │   ├── auth.middleware.ts  # authenticate, authorize, scope
│       │   └── security.middleware.ts  # helmet, cors, rate-limit
│       └── database/
│           └── manager.ts          # Multi-DB connection manager
│
├── auth-service/                   # Port 3001
│   ├── Dockerfile
│   ├── .env
│   ├── package.json
│   ├── tsconfig.json
│   ├── drizzle.pg.config.ts
│   ├── drizzle.mysql.config.ts
│   └── src/
│       ├── server.ts               # Entry point
│       ├── app.ts                  # Express app setup
│       ├── schemas/
│       │   ├── pg.schema.ts        # Drizzle PostgreSQL schema
│       │   ├── mysql.schema.ts     # Drizzle MySQL schema
│       │   └── mongo.schema.ts     # MongoDB collections
│       ├── database/
│       │   ├── connection.ts       # Multi-DB connections
│       │   └── logger.ts           # Service logger
│       ├── repositories/
│       │   ├── user.repository.ts  # User CRUD (all DBs)
│       │   ├── session.repository.ts
│       │   └── types.ts            # Repository types
│       ├── services/
│       │   ├── auth.service.ts     # Login, register, JWT
│       │   └── user.service.ts     # User management business logic
│       ├── controllers/
│       │   ├── auth.controller.ts  # HTTP handlers for auth
│       │   └── user.controller.ts  # HTTP handlers for users
│       ├── routes/
│       │   └── index.ts            # Route definitions + JSDoc
│       ├── validators/
│       │   └── auth.validator.ts   # express-validator rules
│       └── swagger/
│           └── swagger.config.ts   # OpenAPI spec
│
├── master-service/                 # Port 3002
│   ├── Dockerfile
│   ├── .env
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── server.ts
│       ├── app.ts
│       ├── schemas/
│       │   └── pg.schema.ts        # Countries, states, cities, etc.
│       ├── controllers/
│       │   └── master.controller.ts
│       ├── routes/
│       │   └── index.ts
│       └── swagger/
│           └── swagger.config.ts
│
├── document-service/               # Port 3003
│   ├── Dockerfile
│   ├── .env
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── server.ts
│       ├── app.ts
│       ├── providers/
│       │   └── storage.provider.ts # S3, Cloudinary, Local
│       ├── database/
│       │   └── mongo.schema.ts     # Document metadata in MongoDB
│       ├── controllers/
│       │   └── document.controller.ts
│       ├── middleware/
│       │   └── upload.middleware.ts # Multer + validation
│       └── routes/
│           └── index.ts
│
├── nginx/
│   └── conf/
│       ├── nginx.conf              # Main nginx config
│       └── upstream.conf           # Service routing
│
└── scripts/
    ├── init-postgres.sql           # PostgreSQL DDL + seed data
    ├── init-mysql.sql              # MySQL DDL + seed data
    └── init-mongo.js               # MongoDB collections + indexes
```

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose v2.x
- Node.js 20+ (for local development)

### 1. Start all services
```bash
# Clone & setup
cp .env.example .env    # edit credentials

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f auth-service

# Check service health
curl http://localhost/health
curl http://localhost:3001/health
curl http://localhost:3002/health
curl http://localhost:3003/health
```

### 2. API Documentation
| Service | Swagger URL |
|---------|-------------|
| Auth & Users | http://localhost:3001/api/docs |
| Master Data | http://localhost:3002/api/docs |
| Documents | http://localhost:3003/api/docs |
| Via Gateway | http://localhost/docs/auth |

### 3. Default Admin Credentials
```
Email:    admin@ump-platform.com
Password: Admin@1234
```

## 🔐 Authentication Flow

```
1. POST /api/auth/login         → Access Token (15min) + Refresh Token (7d, httpOnly cookie)
2. Authorization: Bearer <token> → Protected endpoints
3. POST /api/auth/refresh       → New Access + Refresh Token (rotation)
4. POST /api/auth/logout        → Blacklist + revoke
```

## 🔄 Database Switching

Pass the `X-DB-Type` header to switch databases **per request**:

```bash
# Use PostgreSQL (default)
curl -H "Authorization: Bearer $TOKEN" http://localhost:3001/api/users

# Use MySQL
curl -H "Authorization: Bearer $TOKEN" -H "X-DB-Type: mysql" http://localhost:3001/api/users

# Use MongoDB
curl -H "Authorization: Bearer $TOKEN" -H "X-DB-Type: mongodb" http://localhost:3001/api/users
```

## 👥 Role-Based Access Control

| Action | Admin | Lead | User |
|--------|-------|------|------|
| View all users | ✅ | ❌ | ❌ |
| View dept users | ✅ | ✅ | ❌ |
| View own profile | ✅ | ✅ | ✅ |
| Create user | ✅ | ❌ | ❌ |
| Edit user | ✅ | Own dept | Own profile |
| Delete user | ✅ | ❌ | ❌ |
| Change status | ✅ | ✅ | ❌ |
| Dashboard stats | All | Dept-level | Own |

## 📤 Document Upload

```bash
# Single upload
curl -X POST http://localhost:3003/api/documents/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@document.pdf" \
  -F "folder=contracts" \
  -F "entityType=user" \
  -F "entityId=USER_UUID"

# Upload to S3
curl -X POST http://localhost:3003/api/documents/upload?provider=s3 \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@photo.jpg"

# Bulk upload
curl -X POST http://localhost:3003/api/documents/upload-bulk \
  -H "Authorization: Bearer $TOKEN" \
  -F "files=@file1.pdf" \
  -F "files=@file2.pdf"
```

## 🔒 Security Features

- ✅ JWT Access + Refresh tokens with rotation
- ✅ httpOnly cookie for refresh token
- ✅ Token blacklisting in Redis
- ✅ Account lockout after failed attempts
- ✅ bcrypt password hashing (12 rounds)
- ✅ Helmet.js security headers
- ✅ CORS with whitelist
- ✅ Rate limiting (global + per-endpoint)
- ✅ SQL injection guard
- ✅ Input validation (express-validator)
- ✅ Role-based access control
- ✅ Department-scope filtering
- ✅ File type & size validation
- ✅ Non-root Docker containers
- ✅ XSS protection headers

## 🧪 Environment Variables Reference

### auth-service
| Variable | Description | Default |
|----------|-------------|---------|
| `DEFAULT_DB_TYPE` | Primary DB to use | `postgres` |
| `JWT_ACCESS_EXPIRES` | Access token TTL | `15m` |
| `JWT_REFRESH_EXPIRES` | Refresh token TTL | `7d` |
| `BCRYPT_ROUNDS` | Password hash rounds | `12` |
| `MAX_LOGIN_ATTEMPTS` | Lockout threshold | `5` |
| `LOCK_DURATION_MINUTES` | Lockout duration | `30` |

### document-service
| Variable | Description | Default |
|----------|-------------|---------|
| `STORAGE_PROVIDER` | `s3`, `cloudinary`, `local` | `local` |
| `MAX_FILE_SIZE_MB` | Upload size limit | `50` |
| `ALLOWED_MIME_TYPES` | Comma-separated allowed types | see .env |

## 📡 API Endpoints Summary

### Auth Service (`:3001`)
| Method | Path | Auth | Role |
|--------|------|------|------|
| POST | `/api/auth/register` | Public | - |
| POST | `/api/auth/login` | Public | - |
| POST | `/api/auth/refresh` | Public | - |
| POST | `/api/auth/logout` | JWT | Any |
| POST | `/api/auth/logout-all` | JWT | Any |
| GET | `/api/auth/me` | JWT | Any |
| POST | `/api/auth/change-password` | JWT | Any |
| GET | `/api/users` | JWT | All |
| POST | `/api/users` | JWT | Admin |
| GET | `/api/users/dashboard` | JWT | All |
| GET | `/api/users/:id` | JWT | Scoped |
| PUT | `/api/users/:id` | JWT | Admin/Self |
| DELETE | `/api/users/:id` | JWT | Admin |
| PATCH | `/api/users/:id/status` | JWT | Admin/Lead |

### Master Service (`:3002`)
| Method | Path | Auth |
|--------|------|------|
| GET | `/api/master/countries` | Public |
| GET | `/api/master/states?countryId=` | Public |
| GET | `/api/master/cities?stateId=` | Public |
| GET/POST | `/api/master/categories` | Public/Admin |
| GET/POST | `/api/master/tags` | Public/Admin |
| GET/POST | `/api/master/document-types` | Public/Admin |
| GET | `/api/master/settings` | Public |
| POST | `/api/master/settings` | Admin |

### Document Service (`:3003`)
| Method | Path | Auth |
|--------|------|------|
| POST | `/api/documents/upload` | JWT |
| POST | `/api/documents/upload-bulk` | JWT |
| GET | `/api/documents` | JWT |
| GET | `/api/documents/:id` | JWT |
| GET | `/api/documents/:id/download` | JWT |
| PATCH | `/api/documents/:id/status` | Admin/Lead |
| DELETE | `/api/documents/:id` | JWT |


## SQL Generate
`npx drizzle-kit generate --config=drizzle.pg.config.ts`
This creates SQL file inside:src/database/migrations/pg

## Apply Migration - For production-safe workflow:
`npx drizzle-kit migrate --config=drizzle.pg.config.ts`

## Alternative (Dev Only Fast Way)
If you are in development and don't care about migration files:
`npx drizzle-kit push --config=drizzle.pg.config.ts`

## DB Push
`npx drizzle-kit push --config=drizzle.pg.config.ts`

## Create .env.local file 
```
set -a
source .env.local
npx drizzle-kit push --config=drizzle.pg.config.ts
```
