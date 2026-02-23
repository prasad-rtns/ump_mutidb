# Which Download Should You Use?

You have **TWO versions** of the UMP platform. Choose based on your deployment needs:

---

## 📦 user-mgmt-platform.zip — Monorepo (140KB)

**Best for:**
- ✅ Local development (easier setup, single `npm install`)
- ✅ Small teams working on all services
- ✅ Prototyping and demos
- ✅ Running all services at once for testing

**Structure:**
```
user-mgmt-platform/
├── package.json              (npm workspaces)
├── shared/                   (symlinked to services)
├── auth-service/
├── master-service/
├── document-service/
└── docker-compose.yml        (all services)
```

**How to run:**
```bash
unzip user-mgmt-platform.zip
cd user-mgmt-platform/
npm install                   # installs all workspaces
docker-compose up --build     # runs all services
```

**Deployment:** All services build from root context. Harder to deploy independently.

---

## 📦 ump-polyrepo.zip — Polyrepo (132KB)

**Best for:**
- ✅ **Production deployment** (recommended)
- ✅ Independent microservices
- ✅ Multiple teams owning different services
- ✅ Services deploying on different schedules
- ✅ True CI/CD per service

**Structure:**
```
ump-polyrepo/
├── shared/                   (@ump/shared npm package)
├── auth-service/             (standalone, own Dockerfile)
├── master-service/           (standalone, own Dockerfile)
├── document-service/         (standalone, own Dockerfile)
├── DEPLOYMENT-GUIDE.md
└── MONOREPO-VS-POLYREPO.md
```

**How to run:**
```bash
unzip ump-polyrepo.zip
cd ump-polyrepo/

# Option 1: Publish shared to npm, then run services
cd shared/ && npm publish
cd ../auth-service/ && npm install && docker-compose up

# Option 2: Link locally (dev only)
cd shared/ && npm link
cd ../auth-service/ && npm link @ump/shared && npm run dev
```

**Deployment:** Each service has its own Docker build, CI/CD pipeline, and deployment schedule.

---

## Quick Decision Matrix

| Need | Use This |
|------|----------|
| "I want to run all services locally for testing" | **Monorepo** |
| "I want to deploy to production" | **Polyrepo** |
| "Services should deploy independently" | **Polyrepo** |
| "One team, tight coupling" | **Monorepo** |
| "Multiple teams, loose coupling" | **Polyrepo** |
| "Faster local setup" | **Monorepo** |
| "Production best practices" | **Polyrepo** |

---

## Files Included in Both

Both versions include:
- ✅ Full DAL layer (PostgreSQL, MySQL, MSSQL, Oracle, MongoDB)
- ✅ Service + Controller + Repository architecture
- ✅ Database switching via X-DB-Type header
- ✅ JWT authentication with refresh tokens
- ✅ Role-based access control
- ✅ Redis caching
- ✅ Swagger documentation
- ✅ Docker support
- ✅ Complete schemas and seed data

The **only difference** is how `@ump/shared` is distributed.

---

## Recommendation

**Start with polyrepo for production** because:
1. You asked about independent deployment ✓
2. True microservices architecture ✓  
3. Industry standard for scalable systems ✓
4. Each service can use different @ump/shared versions ✓

**You can always use monorepo locally** for convenience:
- Extract monorepo zip for local development
- Use polyrepo for production deployments
- Best of both worlds!

---

## Need Help?

- Polyrepo setup → Read `ump-polyrepo/DEPLOYMENT-GUIDE.md`
- Comparison → Read `ump-polyrepo/MONOREPO-VS-POLYREPO.md`
- Architecture → Read `user-mgmt-platform/ARCHITECTURE.md`
- DB switching → Read `user-mgmt-platform/WORKSPACE-AND-DB-GUIDE.md`
