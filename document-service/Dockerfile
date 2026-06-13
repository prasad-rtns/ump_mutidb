FROM node:24-slim AS builder

WORKDIR /app

COPY sharedv1.0/package*.json ./sharedv1.0/
WORKDIR /app/sharedv1.0
RUN npm install
COPY sharedv1.0 ./
RUN npm run build

WORKDIR /app
COPY document-service/package*.json ./document-service/

WORKDIR /app/document-service
RUN npm install

COPY document-service ./
RUN npm run build
RUN npm prune --omit=dev
RUN rm -rf node_modules/@rtns/core \
    && mkdir -p node_modules/@rtns/core \
    && cp -R ../sharedv1.0/package*.json ../sharedv1.0/dist node_modules/@rtns/core/

FROM node:24-slim AS production

LABEL maintainer="UMP Platform"
LABEL service="document-service"

RUN groupadd -g 1001 nodejs \
    && useradd -u 1001 -g nodejs -m -s /bin/bash nodejs

WORKDIR /app
ENV NODE_PATH=/app/node_modules

COPY document-service/package*.json ./
COPY --from=builder /app/document-service/dist ./dist
COPY --from=builder /app/document-service/node_modules ./node_modules
COPY --from=builder /app/sharedv1.0/package*.json ./sharedv1.0/
COPY --from=builder /app/sharedv1.0/dist ./sharedv1.0/dist
COPY document-service/src ./src

RUN mkdir -p logs uploads \
    && npm cache clean --force \
    && chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 6003

HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD node -e "require('http').get('http://localhost:6003/health', r => process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"

CMD ["node", "dist/server.js"]
