# @ump/shared

Shared types, utilities, and middleware for UMP microservices platform.

## What's included

- **Types**: `DatabaseType`, `JwtPayload`, `ApiResponse`, common interfaces
- **Utils**: `ResponseUtil`, `JwtUtil`, `CacheService`, `logger`
- **Middleware**: `authenticate`, `authorize`, `departmentScope`, `selfOrAdmin`, security middleware
- **Database**: Multi-DB connection manager

## Installation

```bash
npm install @ump/shared
```

## Usage

```typescript
import { ResponseUtil, authenticate, DatabaseType } from '@ump/shared';

// In controllers
return ResponseUtil.success(res, data);

// In routes
router.get('/protected', authenticate, controller.method);

// In services
import { JwtPayload } from '@ump/shared';
```

## Publishing (maintainers only)

```bash
# Bump version
npm version patch   # or minor / major

# Build and publish to npm
npm publish

# Or publish to GitHub Packages
npm publish --registry=https://npm.pkg.github.com
```

## Development

```bash
# Build
npm run build

# Watch mode
npm run build:watch

# Link locally for development
npm link
cd ../auth-service && npm link @ump/shared
```

## Version History

- `1.0.0` — Initial release with all core utilities
