# ─────────────────────────────────────────────────────────────
# Build Stage
# ─────────────────────────────────────────────────────────────
FROM node:24-slim AS builder

WORKDIR /app

# Copy only this service manifests
COPY package*.json ./

# Install dependencies for isolated service builds.
RUN npm install

# Copy full service source (including src/shared)
COPY . .

# Compile TypeScript
RUN npm run build

# Trim builder dependencies down to production before handing off to runtime.
RUN npm prune --omit=dev


# ─────────────────────────────────────────────────────────────
# Production Stage
# ─────────────────────────────────────────────────────────────
FROM node:24-slim AS production

LABEL maintainer="UMP Platform"
LABEL service="document-service"

# Create non-root user (Debian syntax)
RUN groupadd -g 1001 nodejs \
    && useradd -u 1001 -g nodejs -m -s /bin/bash nodejs

WORKDIR /app

# Copy only manifests
COPY package*.json ./

# Copy compiled output from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY src ./src
# Create required runtime folders
RUN mkdir -p logs uploads \
    && npm cache clean --force \
    && chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 6003

HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD node -e "require('http').get('http://localhost:6003/health', r => process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"

CMD ["node", "dist/server.js"]
