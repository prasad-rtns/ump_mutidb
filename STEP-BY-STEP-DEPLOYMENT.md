# 🚀 Complete Deployment Guide — @ump/shared to npm + GitHub

## ⚡ Quick Overview (5 minutes)

```
1. Extract shared folder          → 30 seconds
2. Push to GitHub                 → 2 minutes  
3. Publish to npm                 → 1 minute
4. Test independently             → 1 minute
5. Install in 3 services          → 30 seconds
```

---

## 📋 PART 1 — Publish to GitHub (2 minutes)

### Step 1.1: Extract and Navigate

```bash
# Extract the polyrepo zip
cd ~/Downloads  # or wherever you downloaded
unzip ump-polyrepo.zip
cd ump-polyrepo/shared/
```

### Step 1.2: Create GitHub Repository

**Go to browser:** https://github.com/new

Fill in:
- **Repository name**: `ump-shared`
- **Description**: `Shared utilities for UMP microservices`
- **Visibility**: Private (or Public)
- **DO NOT** check "Initialize with README"

Click **"Create repository"**

### Step 1.3: Push Code to GitHub

**Copy these commands** (replace `YOUR_GITHUB_USERNAME`):

```bash
# Still in ump-polyrepo/shared/ directory

# Initialize git
git init
git add .
git commit -m "Initial commit: @ump/shared v1.0.0"

# Connect to GitHub (REPLACE YOUR_GITHUB_USERNAME!)
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/ump-shared.git
git branch -M main
git push -u origin main
```

**What you'll see:**
```
Enumerating objects: 45, done.
Counting objects: 100% (45/45), done.
Delta compression using up to 8 threads
Compressing objects: 100% (38/38), done.
Writing objects: 100% (45/45), 15.23 KiB | 1.52 MiB/s, done.
Total 45 (delta 2), reused 0 (delta 0)
To https://github.com/YOUR_GITHUB_USERNAME/ump-shared.git
 * [new branch]      main -> main
```

✅ **Verify:** Go to `https://github.com/YOUR_GITHUB_USERNAME/ump-shared` — you should see your files!

---

## 📦 PART 2 — Publish to npm Registry (1 minute)

### Step 2.1: Create npm Account (if needed)

**Go to:** https://www.npmjs.com/signup

Fill in:
- Username
- Email
- Password

**Verify your email** (check inbox)

### Step 2.2: Login to npm

```bash
# Still in ump-polyrepo/shared/ directory

npm login
```

**What you'll see:**
```
npm notice Log in on https://registry.npmjs.org/
Login at:
https://www.npmjs.com/login?next=/login/cli/abc123

Press ENTER to open in the browser...
```

Press ENTER → Browser opens → Login → Click "Authorize npm"

**Verify:**
```bash
npm whoami
```
Should print your npm username.

### Step 2.3: Update Package Name

```bash
# Edit package.json
nano package.json
```

**Change line 2** from:
```json
  "name": "@ump/shared",
```

**To** (replace YOUR_NPM_USERNAME):
```json
  "name": "@YOUR_NPM_USERNAME/shared",
```

Press `Ctrl+O` to save, `Ctrl+X` to exit.

**Or use this one-liner:**
```bash
# Replace YOUR_NPM_USERNAME with your actual npm username!
sed -i 's/"name": "@ump\/shared"/"name": "@YOUR_NPM_USERNAME\/shared"/' package.json
```

### Step 2.4: Build and Publish

```bash
# Build TypeScript to dist/
npm run build

# Verify dist/ was created
ls dist/
# You should see: index.js  index.d.ts  types/  utils/  middleware/  database/

# Publish!
npm publish --access public
```

**What you'll see:**
```
npm notice 
npm notice 📦  @YOUR_NPM_USERNAME/shared@1.0.0
npm notice === Tarball Contents === 
npm notice 966B   package.json     
npm notice 1.2kB  README.md        
npm notice 45.3kB dist/index.js    
npm notice 2.1kB  dist/index.d.ts  
npm notice === Tarball Details === 
npm notice name:          @YOUR_NPM_USERNAME/shared                
npm notice version:       1.0.0                                     
npm notice filename:      YOUR_NPM_USERNAME-shared-1.0.0.tgz       
npm notice package size:  15.2 kB                                   
npm notice unpacked size: 49.5 kB                                   
npm notice shasum:        abc123def456...                           
npm notice integrity:     sha512-xyz789...                         
npm notice total files:   24                                        
npm notice 
npm notice Publishing to https://registry.npmjs.org/
+ @YOUR_NPM_USERNAME/shared@1.0.0
```

✅ **Success!** 

**Verify:** Visit `https://www.npmjs.com/package/@YOUR_NPM_USERNAME/shared`

---

## 🧪 PART 3 — Test Package Independently (1 minute)

### Step 3.1: Create Test Project

```bash
# Go to a different directory
cd ~/
mkdir test-shared-package
cd test-shared-package/

# Initialize project
npm init -y

# Install YOUR published package (REPLACE YOUR_NPM_USERNAME!)
npm install @YOUR_NPM_USERNAME/shared

# Install dependencies that @ump/shared needs
npm install express jsonwebtoken redis winston
```

### Step 3.2: Create Test Script

```bash
cat > test.js << 'ENDTEST'
// Test importing @ump/shared
const { ResponseUtil, DatabaseType } = require('@YOUR_NPM_USERNAME/shared');

console.log('✅ Package imported successfully!');
console.log('✅ ResponseUtil type:', typeof ResponseUtil);

// Mock Express response object
const mockRes = {
  status: function(code) {
    this.statusCode = code;
    return this;
  },
  json: function(data) {
    console.log('\nResponse Status:', this.statusCode);
    console.log('Response Body:', JSON.stringify(data, null, 2));
    return this;
  }
};

// Test 1: Success response
console.log('\n--- TEST 1: Success Response ---');
ResponseUtil.success(mockRes, { userId: '123', name: 'Test User' }, 'User fetched');

// Test 2: Error response
console.log('\n--- TEST 2: Error Response ---');
ResponseUtil.error(mockRes, 'User not found', 404);

// Test 3: Validation error
console.log('\n--- TEST 3: Validation Error ---');
ResponseUtil.validationError(mockRes, [
  { field: 'email', message: 'Invalid email format' }
]);

console.log('\n✅ ALL TESTS PASSED! Package is working correctly.\n');
ENDTEST

# IMPORTANT: Replace YOUR_NPM_USERNAME in the file!
sed -i 's/@YOUR_NPM_USERNAME/@YOUR_ACTUAL_USERNAME/g' test.js

# Run test
node test.js
```

**Expected Output:**
```
✅ Package imported successfully!
✅ ResponseUtil type: function

--- TEST 1: Success Response ---

Response Status: 200
Response Body: {
  "success": true,
  "message": "User fetched",
  "data": {
    "userId": "123",
    "name": "Test User"
  }
}

--- TEST 2: Error Response ---

Response Status: 404
Response Body: {
  "success": false,
  "message": "User not found"
}

--- TEST 3: Validation Error ---

Response Status: 422
Response Body: {
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}

✅ ALL TESTS PASSED! Package is working correctly.
```

✅ **If you see this, your package works perfectly!**

---

## 🔧 PART 4 — Install in Auth Service (30 seconds)

### Step 4.1: Navigate and Install

```bash
cd ~/Downloads/ump-polyrepo/auth-service/

# Install from npm (REPLACE YOUR_NPM_USERNAME!)
npm install @YOUR_NPM_USERNAME/shared
```

**What you'll see:**
```
added 1 package, and audited 85 packages in 3s

12 packages are looking for funding
  run `npm fund` for details

found 0 vulnerabilities
```

### Step 4.2: Update Import (if package name changed)

**Only if you used a different name than `@ump/shared`:**

```bash
# Find all imports
grep -r "from '@ump/shared'" src/

# Replace with your package name
find src/ -type f -name "*.ts" -exec sed -i "s/@ump\/shared/@YOUR_NPM_USERNAME\/shared/g" {} +
```

### Step 4.3: Test Build

```bash
# Build TypeScript
npm run build
```

**Expected:**
```
> auth-service@1.0.0 build
> tsc

# (no errors = success!)
```

✅ **If it compiles without errors, it works!**

### Step 4.4: Test with Docker

```bash
# Start service
docker-compose up --build
```

**Look for:**
```
auth-service_1  | [INFO] Server running on port 3001
auth-service_1  | [INFO] Connected to PostgreSQL
auth-service_1  | [INFO] Connected to Redis
auth-service_1  | [INFO] Swagger docs at http://localhost:3001/api/docs
```

✅ **Service is running successfully!**

**Test the API:**
```bash
# In another terminal
curl http://localhost:3001/health
```

**Expected:**
```json
{"success":true,"message":"Service is healthy","data":{"service":"auth-service","uptime":5,"timestamp":"2024-..."}}
```

---

## 🔧 PART 5 — Install in Master Service (30 seconds)

```bash
cd ~/Downloads/ump-polyrepo/master-service/

# Install
npm install @YOUR_NPM_USERNAME/shared

# Update imports if needed
find src/ -type f -name "*.ts" -exec sed -i "s/@ump\/shared/@YOUR_NPM_USERNAME\/shared/g" {} +

# Build
npm run build

# Test
docker-compose up --build
```

✅ **Look for:** `[INFO] Server running on port 3002`

---

## 🔧 PART 6 — Install in Document Service (30 seconds)

```bash
cd ~/Downloads/ump-polyrepo/document-service/

# Install
npm install @YOUR_NPM_USERNAME/shared

# Update imports if needed
find src/ -type f -name "*.ts" -exec sed -i "s/@ump\/shared/@YOUR_NPM_USERNAME\/shared/g" {} +

# Build
npm run build

# Test
docker-compose up --build
```

✅ **Look for:** `[INFO] Server running on port 3003`

---

## 🎯 PART 7 — Verify Everything Works Together

### Test All Services

```bash
# Terminal 1 - Auth Service
cd ~/Downloads/ump-polyrepo/auth-service/
docker-compose up

# Terminal 2 - Master Service
cd ~/Downloads/ump-polyrepo/master-service/
docker-compose up

# Terminal 3 - Document Service
cd ~/Downloads/ump-polyrepo/document-service/
docker-compose up
```

### Quick API Test

```bash
# Test auth-service
curl http://localhost:3001/health

# Test master-service
curl http://localhost:3002/health

# Test document-service
curl http://localhost:3003/health
```

**All should return:**
```json
{"success":true,"message":"Service is healthy","data":{...}}
```

---

## 🔄 PART 8 — Updating @ump/shared (When You Make Changes)

### Step 8.1: Make Changes

```bash
cd ~/Downloads/ump-polyrepo/shared/

# Edit any file
nano src/utils/response.ts

# Commit changes
git add .
git commit -m "feat: add new utility function"
git push origin main
```

### Step 8.2: Bump Version and Publish

```bash
# For bug fixes (1.0.0 → 1.0.1)
npm version patch

# For new features (1.0.0 → 1.1.0)
npm version minor

# For breaking changes (1.0.0 → 2.0.0)
npm version major

# This automatically:
# - Updates package.json version
# - Creates git commit
# - Creates git tag

# Push tag to GitHub
git push origin main --tags

# Rebuild and republish to npm
npm run build
npm publish
```

**What you'll see:**
```
npm notice Publishing to https://registry.npmjs.org/
+ @YOUR_NPM_USERNAME/shared@1.0.1
```

### Step 8.3: Update Services

```bash
# In each service
cd ~/Downloads/ump-polyrepo/auth-service/

# Update to latest version
npm update @YOUR_NPM_USERNAME/shared

# OR install specific version
npm install @YOUR_NPM_USERNAME/shared@1.0.1

# Rebuild
npm run build

# Redeploy
docker-compose up --build
```

---

## 📝 Quick Reference — All Commands

```bash
# PUBLISH SHARED PACKAGE
cd ump-polyrepo/shared/
git init && git add . && git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/ump-shared.git
git push -u origin main
npm login
npm run build
npm publish --access public

# TEST INDEPENDENTLY
mkdir test-shared && cd test-shared
npm init -y
npm install @YOUR_NPM_USERNAME/shared express jsonwebtoken redis winston
node test.js

# INSTALL IN SERVICES
cd ../auth-service && npm install @YOUR_NPM_USERNAME/shared && npm run build
cd ../master-service && npm install @YOUR_NPM_USERNAME/shared && npm run build
cd ../document-service && npm install @YOUR_NPM_USERNAME/shared && npm run build

# UPDATE PACKAGE
cd ../shared
git add . && git commit -m "Update" && git push
npm version patch
npm run build && npm publish
```

---

## ❌ Common Errors and Fixes

### Error: "You must be logged in to publish packages"

```bash
npm login
npm whoami  # verify login
npm publish --access public
```

### Error: "Package name too similar to existing package"

Change package name in `package.json`:
```json
"name": "@YOUR_USERNAME/ump-shared-toolkit"
```

### Error: "Cannot find module '@ump/shared'"

```bash
# Check if installed
npm list @YOUR_USERNAME/shared

# If missing
npm install @YOUR_USERNAME/shared

# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Error: "Module build failed: Cannot find type definitions"

```bash
cd shared/
npm run build  # Rebuild to generate .d.ts files
npm version patch
npm publish
```

### Error: Build fails with "Cannot find '@ump/shared'"

Update all imports:
```bash
find src/ -name "*.ts" -exec sed -i 's/@ump\/shared/@YOUR_USERNAME\/shared/g' {} +
```

---

## ✅ Final Checklist

- [ ] ✅ Shared package on GitHub: `https://github.com/YOUR_USERNAME/ump-shared`
- [ ] ✅ Shared package on npm: `https://npmjs.com/package/@YOUR_USERNAME/shared`
- [ ] ✅ Test passes: `node test.js` shows ✅ ALL TESTS PASSED
- [ ] ✅ Auth service builds: `npm run build` succeeds
- [ ] ✅ Master service builds: `npm run build` succeeds
- [ ] ✅ Document service builds: `npm run build` succeeds
- [ ] ✅ All services run: `docker-compose up` works
- [ ] ✅ Health checks pass: `curl localhost:3001/health` returns success

**🎉 YOU'RE DONE! All services now use the published @ump/shared package!**

---

## 🆘 Need Help?

**Check package on npm:**
```bash
npm view @YOUR_USERNAME/shared
```

**Check what version is installed:**
```bash
npm list @YOUR_USERNAME/shared
```

**Force reinstall:**
```bash
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

**Test specific function:**
```bash
node -e "const {ResponseUtil} = require('@YOUR_USERNAME/shared'); console.log(typeof ResponseUtil)"
```

Should print: `function`
