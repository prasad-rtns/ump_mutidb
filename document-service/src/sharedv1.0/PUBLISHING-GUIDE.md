# Step-by-Step: Publishing @ump/shared and Using It

## Prerequisites

- [ ] GitHub account
- [ ] npm account (sign up at https://npmjs.com)
- [ ] Git installed
- [ ] Node.js 20+ installed

---

## STEP 1 — Set Up GitHub Repository for @ump/shared

### 1.1 Create GitHub Repository

Go to https://github.com/new and create:
- Repository name: `ump-shared`
- Description: `Shared utilities and middleware for UMP microservices`
- Visibility: **Private** (or Public if you want)
- ✅ Initialize with README: **NO** (we already have one)

Click "Create repository"

### 1.2 Initialize Git in Shared Folder

```bash
# Extract the polyrepo zip
unzip ump-polyrepo.zip
cd ump-polyrepo/shared/

# Initialize git
git init
git add .
git commit -m "Initial commit: @ump/shared v1.0.0"

# Link to GitHub (replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/ump-shared.git
git branch -M main
git push -u origin main
```

✅ **Verify**: Go to https://github.com/YOUR_USERNAME/ump-shared — you should see your files

---

## STEP 2 — Publish to npm Registry

### 2.1 Create npm Account (if you don't have one)

```bash
# Go to https://npmjs.com/signup
# Create account
# Verify your email
```

### 2.2 Login to npm

```bash
cd ump-polyrepo/shared/

# Login (will open browser)
npm login

# Verify you're logged in
npm whoami
# Should print your npm username
```

### 2.3 Update package.json with Your Details

```bash
# Edit package.json - change these fields:
nano package.json
```

Change:
```json
{
  "name": "@YOUR_NPM_USERNAME/shared",
  "repository": {
    "type": "git",
    "url": "https://github.com/YOUR_USERNAME/ump-shared.git"
  },
  "author": "Your Name <your.email@example.com>",
  "publishConfig": {
    "access": "public"
  }
}
```

**Important**: 
- Use `@YOUR_NPM_USERNAME/shared` (scoped package)
- OR use `ump-shared-YOUR_COMPANY` (unscoped, must be globally unique)

### 2.4 Build and Publish

```bash
# Build TypeScript to dist/
npm run build

# Verify dist/ was created
ls -la dist/
# Should see: index.js, index.d.ts, types/, utils/, middleware/

# Publish to npm (first time)
npm publish --access public

# ✅ Success! You should see:
# + @YOUR_NPM_USERNAME/shared@1.0.0
```

### 2.5 Verify Published Package

```bash
# Check on npm
npm view @YOUR_NPM_USERNAME/shared

# Or visit: https://npmjs.com/package/@YOUR_NPM_USERNAME/shared
```

---

## STEP 3 — Test @ump/shared Independently

### 3.1 Create Test Project

```bash
# Go outside the shared folder
cd ~/
mkdir test-ump-shared
cd test-ump-shared/

# Initialize test project
npm init -y

# Install your published package
npm install @YOUR_NPM_USERNAME/shared

# Install peer dependencies (needed by @ump/shared)
npm install express jsonwebtoken redis winston
```

### 3.2 Create Test File

```bash
# Create test.js
cat > test.js << 'EOF'
// Test importing from @ump/shared
const { ResponseUtil } = require('@YOUR_NPM_USERNAME/shared');

console.log('✅ Import successful!');
console.log('ResponseUtil:', typeof ResponseUtil);

// Test ResponseUtil mock
const mockRes = {
  status: (code) => ({
    json: (data) => {
      console.log('Status:', code);
      console.log('Response:', JSON.stringify(data, null, 2));
      return mockRes;
    }
  })
};

// Test success response
console.log('\n--- Testing ResponseUtil.success ---');
ResponseUtil.success(mockRes, { test: 'data' }, 'Success message');

console.log('\n--- Testing ResponseUtil.error ---');
ResponseUtil.error(mockRes, 'Error message', 400);

console.log('\n✅ All tests passed!');
EOF

# Run test
node test.js
```

**Expected output:**
```
✅ Import successful!
ResponseUtil: function

--- Testing ResponseUtil.success ---
Status: 200
Response: {
  "success": true,
  "message": "Success message",
  "data": { "test": "data" }
}

--- Testing ResponseUtil.error ---
Status: 400
Response: {
  "success": false,
  "message": "Error message"
}

✅ All tests passed!
```

### 3.3 Test TypeScript Imports

```bash
# Install TypeScript
npm install --save-dev typescript @types/node @types/express

# Create tsconfig.json
cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "esModuleInterop": true,
    "skipLibCheck": true
  }
}
EOF

# Create test.ts
cat > test.ts << 'EOF'
import { ResponseUtil, JwtPayload, DatabaseType } from '@YOUR_NPM_USERNAME/shared';

// Test types
const dbType: DatabaseType = 'postgres';
console.log('Database type:', dbType);

const payload: JwtPayload = {
  sub: 'user-123',
  username: 'testuser',
  email: 'test@example.com',
  role: 'admin',
  roleId: 'role-123',
  departmentId: 'dept-123',
  designationId: 'desig-123',
  sessionId: 'session-123',
  iat: 1234567890,
  exp: 1234567890
};

console.log('JWT Payload:', payload);
console.log('✅ TypeScript types work correctly!');
EOF

# Compile and run
npx tsc test.ts
node test.js
```

✅ **If this runs without TypeScript errors, your package is working correctly!**

---

## STEP 4 — Install in Auth Service

### 4.1 Update package.json

```bash
cd ump-polyrepo/auth-service/

# Remove old dependency (if using workspaces)
npm uninstall @ump/shared

# Install from npm
npm install @YOUR_NPM_USERNAME/shared

# Verify it's installed
npm list @YOUR_NPM_USERNAME/shared
```

### 4.2 Update Imports (Already Done!)

All imports are already using `@ump/shared`:
```typescript
import { ResponseUtil, authenticate } from '@ump/shared';
```

**No code changes needed** — just change the package name in package.json if you used a different scope.

### 4.3 Test Auth Service

```bash
# Build TypeScript
npm run build

# Should compile without errors
# ✅ If it builds, the package is working!

# Test with Docker
docker-compose up --build

# ✅ If it starts successfully, you're done!
```

### 4.4 Verify Package Resolution

```bash
# Check where @ump/shared is coming from
npm ls @YOUR_NPM_USERNAME/shared

# Should show: node_modules/@YOUR_NPM_USERNAME/shared@1.0.0

# NOT: symlink to ../shared (that would be workspace mode)
```

---

## STEP 5 — Install in Master Service

```bash
cd ump-polyrepo/master-service/

# Install from npm
npm install @YOUR_NPM_USERNAME/shared

# Build
npm run build

# Test
docker-compose up --build
```

---

## STEP 6 — Install in Document Service

```bash
cd ump-polyrepo/document-service/

# Install from npm
npm install @YOUR_NPM_USERNAME/shared

# Build
npm run build

# Test
docker-compose up --build
```

---

## STEP 7 — Making Updates to @ump/shared

### 7.1 Update Code

```bash
cd ump-polyrepo/shared/

# Make changes to src/
nano src/utils/response.ts

# Commit changes
git add .
git commit -m "feat: add new utility function"
```

### 7.2 Version Bump and Publish

```bash
# Patch version (1.0.0 → 1.0.1) - for bug fixes
npm version patch

# OR Minor version (1.0.0 → 1.1.0) - for new features
npm version minor

# OR Major version (1.0.0 → 2.0.0) - for breaking changes
npm version major

# This will:
# - Update package.json version
# - Create git tag
# - Create git commit

# Push to GitHub
git push origin main --tags

# Publish to npm
npm run build
npm publish
```

### 7.3 Update Services to Use New Version

```bash
# In each service
cd ump-polyrepo/auth-service/

# Update to latest patch (1.0.x)
npm update @YOUR_NPM_USERNAME/shared

# OR install specific version
npm install @YOUR_NPM_USERNAME/shared@1.1.0

# OR update to latest (any version)
npm install @YOUR_NPM_USERNAME/shared@latest
```

---

## OPTION B — Publishing to GitHub Packages (Instead of npm)

If you want to use GitHub Packages instead of npmjs.com:

### B.1 Create Personal Access Token

1. Go to https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Select scopes:
   - ✅ `write:packages`
   - ✅ `read:packages`
   - ✅ `delete:packages`
4. Generate token
5. **Copy the token** (you won't see it again!)

### B.2 Configure npm for GitHub

```bash
# Create or edit ~/.npmrc
nano ~/.npmrc

# Add (replace YOUR_GITHUB_USERNAME and YOUR_TOKEN):
@YOUR_GITHUB_USERNAME:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=YOUR_GITHUB_TOKEN
```

### B.3 Update package.json

```json
{
  "name": "@YOUR_GITHUB_USERNAME/shared",
  "publishConfig": {
    "registry": "https://npm.pkg.github.com/@YOUR_GITHUB_USERNAME"
  }
}
```

### B.4 Publish to GitHub Packages

```bash
npm run build
npm publish
```

### B.5 Install from GitHub Packages

```bash
# In each service, create .npmrc
cd auth-service/
cat > .npmrc << EOF
@YOUR_GITHUB_USERNAME:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=YOUR_GITHUB_TOKEN
EOF

# Install
npm install @YOUR_GITHUB_USERNAME/shared
```

---

## Troubleshooting

### Error: "package name must be lowercase"

```bash
# Change package.json name to lowercase
"name": "@your-npm-username/shared"  # all lowercase
```

### Error: "You do not have permission to publish"

```bash
# Make sure you're logged in
npm whoami

# If not logged in
npm login

# If scoped package (@your-name/package), make it public
npm publish --access public
```

### Error: "Cannot find module '@ump/shared'"

```bash
# Check if installed
npm list @ump/shared

# If not, install it
npm install @YOUR_NPM_USERNAME/shared

# Check node_modules
ls -la node_modules/@YOUR_NPM_USERNAME/
```

### Error: TypeScript types not found

```bash
# Verify dist/ has .d.ts files
cd shared/
ls -la dist/
# Should see: index.d.ts

# Rebuild
npm run build

# Republish
npm version patch
npm publish
```

### Error: Build fails in service

```bash
# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Rebuild
npm run build
```

---

## Summary Checklist

- [ ] ✅ Created GitHub repo for ump-shared
- [ ] ✅ Published @ump/shared to npm (or GitHub Packages)
- [ ] ✅ Tested package independently
- [ ] ✅ Installed in auth-service and it builds
- [ ] ✅ Installed in master-service and it builds
- [ ] ✅ Installed in document-service and it builds
- [ ] ✅ All services run with `docker-compose up`

**You're done! 🎉**

Each service now uses the published `@ump/shared` package and can deploy independently.
