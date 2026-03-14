# ─────────────────────────────────────────────────────────────
# Build Stage
# ─────────────────────────────────────────────────────────────
FROM node:24-slim AS builder

WORKDIR /app

# Copy only this service's manifests
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
LABEL service="master-service"

# Create non-root user (Debian-based image)
RUN groupadd -g 1001 nodejs \
    && useradd -u 1001 -g nodejs -m -s /bin/bash nodejs

WORKDIR /app

# Copy package manifests
COPY package*.json ./

# Install production dependencies only
RUN npm ci --omit=dev \
    && npm cache clean --force

# Copy compiled output
COPY --from=builder /app/dist ./dist
COPY src ./src
# Ensure correct permissions
RUN mkdir -p logs \
    && chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 6002

HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD node -e "require('http').get('http://localhost:6002/health', r => process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"

#CMD ["node", "dist/server.js"]
CMD ["sh", "-c", "node dist/server.js || echo FAILED && sleep 1000"]