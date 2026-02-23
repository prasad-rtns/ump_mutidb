# Shared Code & Deployment — Full Guide

## The Problem (Before)

```
auth-service/Dockerfile
  ├── COPY package*.json ./
  ├── COPY src/ ./src/          ← can only see auth-service/
  └── build                    ✗ FAILS — can't reach ../shared/
```

Each Docker build context was the service folder. The `../shared/src/` relative imports were invisible to Docker, breaking every build.

---

## The Fix — npm Workspaces Monorepo

```
ump-platform/               ← monorepo root
├── package.json            ← NEW: workspaces manifest
├── .dockerignore
│
├── shared/                 ← @ump/shared package
│   ├── package.json        → "name": "@ump/shared", "main": "dist/index.js"
│   ├── tsconfig.json       → compiles src/ → dist/
│   └── src/
│
├── auth-service/
│   ├── package.json        → depends on "@ump/shared": "*"
│   ├── tsconfig.json       → paths: { "@ump/shared": ["../shared/src"] }
│   └── Dockerfile          ← NEW: context is monorepo root
│
├── master-service/   (same pattern)
└── document-service/ (same pattern)
```

### How the import resolution works

| Environment | How `@ump/shared` is found |
|-------------|---------------------------|
| `npm install` | npm creates `node_modules/@ump/shared` → symlink to `../shared` |
| TypeScript build | tsconfig `paths` override: resolves to `../shared/src` (source) |
| Docker build | copies both `shared/` and `service/` → compiles shared first |
| Production image | `shared/dist/` is compiled; `@ump/shared` resolves to `dist/index.js` |

---

## Docker Build — How It Works Now

```
docker-compose.yml
  build:
    context: .                     ← entire monorepo root
    dockerfile: auth-service/Dockerfile
```

```dockerfile
# auth-service/Dockerfile
WORKDIR /app
COPY package.json package-lock.json ./   # root workspace manifest
COPY shared/package.json      ./shared/
COPY auth-service/package.json ./auth-service/
RUN npm ci                               # installs ALL workspaces at once

COPY shared/       ./shared/
COPY auth-service/ ./auth-service/

RUN npm run build --workspace=shared     # compile @ump/shared → dist/
RUN npm run build --workspace=auth-service
```

Each service **only copies what it needs** — auth-service doesn't copy master-service files, etc.

### Why layer caching is efficient

```
Layer 1: COPY package.json, package-lock.json, shared/package.json, auth-service/package.json
Layer 2: RUN npm ci                     ← only re-runs if manifests change
Layer 3: COPY shared/src, auth-service/src
Layer 4: RUN build                      ← only re-runs if source changes
```

---

## Running Locally (Development)

```bash
# Install all workspaces from root
npm install

# Build shared once
npm run build:shared

# Start individual services (ts-node reads shared src directly via tsconfig paths)
npm run dev:auth
npm run dev:master
npm run dev:document
```

---

## Database Switching

Switch databases per-request using the `X-DB-Type` header:

```
X-DB-Type: postgres   (default)
X-DB-Type: mysql
X-DB-Type: mssql
X-DB-Type: oracle
X-DB-Type: mongodb
```

Or set the default globally in `.env`:
```
DEFAULT_DB_TYPE=postgres
```

### How switching works internally

```
Request → security.middleware → sets req.dbType from X-DB-Type header
       → Controller → Service.create(req.dbType)
       → DALFactory.get(dbType)   ← picks the right pool/driver
       → returns DALBundle with concrete implementations
       → Service uses only the IUserDAL interface — no DB-specific code
```

### Database connection matrix

| DB type | Driver | Connection pool | Pool singleton |
|---------|--------|----------------|----------------|
| `postgres` | `pg` + Drizzle ORM | `pg.Pool` | Created once per process |
| `mysql` | `mysql2/promise` | `mysql2.Pool` | Created once per process |
| `mssql` | `mssql` (tedious) | `mssql.ConnectionPool` | Created once, `.connected` checked |
| `oracle` | `oracledb` | `oracledb.Pool` | Created once per process |
| `mongodb` | `mongodb` | `MongoClient` (internal pool) | Created once per process |

All pools are **lazily initialised** — a database only connects when its first request arrives. Unused databases incur zero overhead.

---

## Environment Variables for Each Database

```env
# ─── Switch default ───────────────────────────────────────────────────────────
DEFAULT_DB_TYPE=postgres   # or mysql / mssql / oracle / mongodb

# ─── PostgreSQL ───────────────────────────────────────────────────────────────
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_DB=ump_db
POSTGRES_USER=ump_user
POSTGRES_PASSWORD=your_password

# ─── MySQL ────────────────────────────────────────────────────────────────────
MYSQL_HOST=mysql
MYSQL_PORT=3306
MYSQL_DB=ump_db
MYSQL_USER=ump_user
MYSQL_PASSWORD=your_password

# ─── SQL Server ───────────────────────────────────────────────────────────────
MSSQL_HOST=mssql
MSSQL_PORT=1433
MSSQL_DB=ump_db
MSSQL_USER=sa
MSSQL_PASSWORD=your_password
MSSQL_TRUST_CERT=true        # set false in production with a valid cert

# ─── Oracle ───────────────────────────────────────────────────────────────────
ORACLE_USER=ump_user
ORACLE_PASSWORD=your_password
ORACLE_HOST=oracle
ORACLE_PORT=1521
ORACLE_SID=XE
# OR full connection string (takes precedence):
# ORACLE_CONN_STR=oracle:1521/XE

# ─── MongoDB ──────────────────────────────────────────────────────────────────
MONGO_HOST=mongodb
MONGO_PORT=27017
MONGO_DB=ump_auth
MONGO_USER=ump_user
MONGO_PASSWORD=your_password
# OR:
# MONGO_URL=mongodb://user:pass@host:27017/dbname?authSource=admin
```

---

## Oracle — Important Notes

1. **Docker image**: Oracle XE is large (~10 GB) and slow to start (60-120 seconds)
2. **Instant Client**: The `oracledb` package requires Oracle Instant Client on the host for non-Docker dev. For Docker it's included in the Oracle image.
3. **In `node:20-alpine`** (production stage), you need to install Oracle Instant Client:
   ```dockerfile
   RUN apk add --no-cache libaio libnsl libc6-compat curl && \
       curl -o /tmp/instantclient.zip https://download.oracle.com/otn_software/linux/instantclient/instantclient-basiclite-linuxx64.zip && \
       unzip /tmp/instantclient.zip -d /opt/oracle && \
       sh -c "echo /opt/oracle/instantclient* > /etc/ld.so.conf.d/oracle.conf" && \
       ldconfig
   ```
4. **Result keys** are uppercase in Oracle (`ROW.FIRST_NAME`). The `OracleUserDAL._map()` helper normalises these.

---

## SQL Server — Important Notes

1. `MSSQL_TRUST_CERT=true` is needed for local/Docker. In production with Azure SQL or a real cert, set it to `false`.
2. Init script runs at `./scripts/init-mssql.sql` — it's volume-mounted but not auto-executed by the Docker image. Run it manually after container starts:
   ```bash
   docker exec -i ump_mssql /opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P 'Ump_Pass@2024' < scripts/init-mssql.sql
   ```
3. `OUTPUT INSERTED.*` syntax is used for atomic increment operations.

---

## Adding a New Database Adapter

```
1.  Create auth-service/src/dal/<db>/user.dal.<db>.ts   ← implement IUserDAL
2.  Create auth-service/src/dal/<db>/others.dal.<db>.ts  ← implement other DALs
3.  Add connection function to database/adapters/db.connection.ts
4.  Add a case in dal/dal.factory.ts
5.  Add env vars to .env
```

No changes needed in services, controllers, or routes.
