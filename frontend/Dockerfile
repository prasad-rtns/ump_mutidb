# ─────────────────────────────────────────────────────────────
# Build Stage
# ─────────────────────────────────────────────────────────────
FROM node:24-slim AS builder

WORKDIR /app

# Install deps first (layer-cached separately from source)
COPY package*.json ./
RUN npm install

# Copy source
COPY . .

# Server-side URLs used only during the Next.js rewrite config —
# not baked into the client bundle (no NEXT_PUBLIC_ prefix)
ARG AUTH_SERVICE_URL=http://auth-service:6001/api/v1
ARG MASTER_SERVICE_URL=http://master-service:6002/api/v1
ARG DOCUMENT_SERVICE_URL=http://document-service:6003/api/v1
ENV AUTH_SERVICE_URL=$AUTH_SERVICE_URL
ENV MASTER_SERVICE_URL=$MASTER_SERVICE_URL
ENV DOCUMENT_SERVICE_URL=$DOCUMENT_SERVICE_URL

RUN npm run build


# ─────────────────────────────────────────────────────────────
# Production Stage — standalone output only
# ─────────────────────────────────────────────────────────────
FROM node:24-slim AS production

LABEL maintainer="UMP Platform"
LABEL service="frontend"

RUN groupadd -g 1001 nodejs \
 && useradd  -u 1001 -g nodejs -m -s /bin/bash nodejs

WORKDIR /app

# Copy the self-contained standalone build
COPY --from=builder --chown=nodejs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nodejs:nodejs /app/.next/static    ./.next/static
COPY --from=builder --chown=nodejs:nodejs /app/public          ./public

USER nodejs

ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0

# Runtime env vars — injected by docker-compose, not baked into the image
ENV AUTH_SERVICE_URL=http://auth-service:6001/api/v1
ENV MASTER_SERVICE_URL=http://master-service:6002/api/v1
ENV DOCUMENT_SERVICE_URL=http://document-service:6003/api/v1

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/', r => process.exit(r.statusCode < 500 ? 0 : 1)).on('error', () => process.exit(1))"

CMD ["node", "server.js"]
