# ─────────────────────────────────────────────────────────────
# Build Stage
# ─────────────────────────────────────────────────────────────
FROM node:24-slim AS builder

WORKDIR /app

# Copy only this service manifests
COPY package*.json ./

# Install all dependencies (including dev for build)
RUN npm ci

# Copy full service source (including src/shared)
COPY . .

# Compile TypeScript
RUN npm run build


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

# Install production dependencies only
RUN npm ci --omit=dev \
    && npm cache clean --force

# Copy compiled output from builder
COPY --from=builder /app/dist ./dist
COPY src ./src
# Create required runtime folders
RUN mkdir -p logs uploads \
    && chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 6003

HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD node -e "require('http').get('http://localhost:6003/health', r => process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"

CMD ["node", "dist/server.js"]