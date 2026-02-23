# @ump/shared — Quick Start Cheat Sheet

## 🚀 5-Minute Setup

### 1️⃣ Publish to GitHub (1 min)

```bash
cd ump-polyrepo/shared/
git init && git add . && git commit -m "Initial commit: v1.0.0"
git remote add origin https://github.com/YOUR_USERNAME/ump-shared.git
git push -u origin main
```

### 2️⃣ Publish to npm (1 min)

```bash
# Login (first time only)
npm login

# Update package name
sed -i 's/@ump\/shared/@YOUR_NPM_USERNAME\/shared/' package.json

# Publish
npm run build
npm publish --access public
```

**✅ Published:** `https://npmjs.com/package/@YOUR_NPM_USERNAME/shared`

### 3️⃣ Test Package (30 sec)

```bash
mkdir ~/test-pkg && cd ~/test-pkg
npm init -y
npm install @YOUR_NPM_USERNAME/shared express

cat > test.js << 'EOF'
const { ResponseUtil } = require('@YOUR_NPM_USERNAME/shared');
console.log('✅ Works:', typeof ResponseUtil === 'function');
EOF

node test.js  # Should print: ✅ Works: true
```

### 4️⃣ Install in Services (1 min each)

```bash
# Auth Service
cd ump-polyrepo/auth-service/
npm install @YOUR_NPM_USERNAME/shared
npm run build && docker-compose up

# Master Service
cd ../master-service/
npm install @YOUR_NPM_USERNAME/shared
npm run build && docker-compose up

# Document Service
cd ../document-service/
npm install @YOUR_NPM_USERNAME/shared
npm run build && docker-compose up
```

---

## 🔄 Updating Package

```bash
cd shared/

# Make changes
git add . && git commit -m "Update" && git push

# Version bump + publish
npm version patch           # 1.0.0 → 1.0.1 (bug fix)
npm version minor           # 1.0.0 → 1.1.0 (new feature)
npm version major           # 1.0.0 → 2.0.0 (breaking change)

git push --tags
npm run build && npm publish

# Update in services
cd ../auth-service/
npm update @YOUR_NPM_USERNAME/shared
npm run build
```

---

## ✅ Verify Installation

```bash
# Check version installed
npm list @YOUR_NPM_USERNAME/shared

# Test import
node -e "const {ResponseUtil}=require('@YOUR_NPM_USERNAME/shared'); console.log(typeof ResponseUtil)"
# Should print: function

# Check health endpoint
curl http://localhost:3001/health
```

---

## ⚠️ If Imports Fail

```bash
# Update all import statements
find src/ -name "*.ts" -exec sed -i 's/@ump\/shared/@YOUR_NPM_USERNAME\/shared/g' {} +

# Clean install
rm -rf node_modules package-lock.json
npm install
```

---

## 📚 Package Name Examples

```json
// Scoped (recommended)
"name": "@john/shared"           → npm install @john/shared
"name": "@acme-corp/shared"      → npm install @acme-corp/shared

// Unscoped (must be globally unique)
"name": "ump-shared-toolkit"     → npm install ump-shared-toolkit
"name": "acme-ump-utils"         → npm install acme-ump-utils
```

---

## 🆘 Troubleshooting

| Error | Fix |
|-------|-----|
| "Not logged in" | `npm login` |
| "Package exists" | Change name in package.json |
| "Module not found" | `npm install @YOUR_USERNAME/shared` |
| Build fails | `npm run build` in shared folder first |
| Types not found | `npm version patch && npm publish` (regenerate) |

---

## 🎯 Final Check

```bash
✅ GitHub: https://github.com/YOUR_USERNAME/ump-shared
✅ npm: https://npmjs.com/package/@YOUR_USERNAME/shared
✅ Test: node test.js → ✅ Works: true
✅ Build: npm run build → no errors
✅ Run: docker-compose up → services start
```

**🎉 Done! All services use published package.**
