# Architecture Guide — Layered Service + DAL Pattern

## Layer Overview

```
HTTP Request
    │
    ▼
┌─────────────────────────────────────────────────────────────┐
│  ROUTES  (routes/index.ts)                                   │
│  Wires HTTP verbs → controller methods via asyncHandler()    │
│  Applies middleware: authenticate, authorize, validators      │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  CONTROLLER  (controllers/*.controller.ts)                   │
│  ● Parses request (body, query, params, user from JWT)       │
│  ● Delegates to Service                                       │
│  ● Formats response via ResponseUtil                         │
│  ✗ No DB access  ✗ No business rules                        │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  SERVICE  (services/*.service.ts)                            │
│  ● Business logic, validation, orchestration                 │
│  ● Reads/writes cache (Redis)                                │
│  ● Calls one or more DAL methods                             │
│  ● Emits structured logs                                     │
│  ✗ No HTTP knowledge  ✗ No raw DB drivers                   │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  DAL FACTORY  (dal/dal.factory.ts)                           │
│  Reads req.dbType → returns correct DAL bundle               │
│  Services depend on interfaces, never concrete classes       │
└────────┬───────────────────────────┬────────────────────────┘
         │                           │
         ▼                           ▼
┌────────────────┐         ┌──────────────────────┐
│  dal/pg/       │         │  dal/mongo/           │
│  *.dal.pg.ts   │         │  *.dal.mongo.ts       │
│  Drizzle ORM   │         │  Native MongoDB       │
│  (PostgreSQL   │         │  driver               │
│   / MySQL)     │         │                       │
└────────────────┘         └──────────────────────┘
         │                           │
         ▼                           ▼
     PostgreSQL                  MongoDB
     MySQL / MSSQL
```

---

## File Structure

```
<service>/src/
├── types/
│   └── index.ts              ← Domain entities, DTOs, filter types
│
├── dal/
│   ├── interfaces/
│   │   └── *.dal.interface.ts ← Contracts (IUserDAL, ISessionDAL, …)
│   ├── pg/
│   │   └── *.dal.pg.ts       ← PostgreSQL / Drizzle implementations
│   ├── mongo/
│   │   └── *.dal.mongo.ts    ← MongoDB implementations
│   └── dal.factory.ts        ← Resolves DB type → returns DALBundle
│
├── services/
│   └── *.service.ts          ← Business logic (imports DALFactory)
│
├── controllers/
│   └── *.controller.ts       ← HTTP handlers (imports Services)
│
├── routes/
│   └── index.ts              ← Express Router + asyncHandler wrapper
│
├── schemas/                  ← Drizzle / MongoDB collection definitions
├── database/                 ← Connection functions
├── middleware/                ← Service-specific middleware
└── validators/               ← express-validator rule sets
```

---

## Services

| Service | Port | DAL | Notes |
|---------|------|-----|-------|
| auth-service | 3001 | `PgUserDAL`, `MongoUserDAL`, `PgSessionDAL`, `PgRoleDAL`, etc. | Switchable via X-DB-Type header |
| master-service | 3002 | `PgCountryDAL`, `PgStateDAL`, `PgCategoryDAL`, etc. | PostgreSQL only (stable reference data) |
| document-service | 3003 | `MongoDocumentDAL` | Metadata always in MongoDB; files in S3/Cloudinary/local |

---

## Adding a New Database Adapter

1. Create `dal/<db>/entity.dal.<db>.ts` implementing the interface
2. Import and add a case in `dal.factory.ts`
3. No changes needed in services or controllers

```typescript
// Example: adding MySQL adapter
// dal/mysql/user.dal.mysql.ts
export class MysqlUserDAL implements IUserDAL {
  constructor(private db: MySql2Database) {}
  // implement all IUserDAL methods ...
}

// dal.factory.ts
case 'mysql': {
  const db = await connectMysql();
  return {
    user: new MysqlUserDAL(db),
    // ...
  };
}
```

---

## Error Handling

All async route handlers are wrapped with `asyncHandler()`:

```typescript
// routes/index.ts
router.get('/:id', authenticate, asyncHandler(UserController.getById));

// asyncHandler catches service errors and maps them to HTTP codes:
//   "not found"    → 404
//   "Access denied" → 403
//   "already exists" → 409
//   "Invalid"      → 401
//   otherwise      → 400
```

Services throw plain `Error` with descriptive messages — no HTTP codes in service layer.

---

## Cache Strategy

| Scope | Key Pattern | TTL |
|-------|-------------|-----|
| User detail | `users:detail:{id}` | 5 min |
| User list | `users:list:{filter_json}` | 1 min |
| Dashboard stats | `users:dashboard:{userId}:{role}` | 5 min |
| Roles | `master-auth:roles:{activeOnly}` | 1 hr |
| Departments | `master-auth:departments:{activeOnly}` | 1 hr |
| Countries | `master:countries:all` | 1 hr |
| States | `master:states:{countryId}` | 1 hr |
| Tags | `master:tags:all` | 30 min |
| Document types | `master:doc_types:all` | 1 hr |
| Public settings | `master:settings:public` | 5 min |
| Documents list | `documents:list:{filter_json}` | 1 min |

Cache is invalidated on every write operation for that entity.
