FROM node:24-slim AS builder

WORKDIR /app

COPY sharedv1.0/package*.json ./sharedv1.0/
WORKDIR /app/sharedv1.0
RUN npm install
COPY sharedv1.0 ./
RUN npm run build

WORKDIR /app
COPY master-service/package*.json ./master-service/

WORKDIR /app/master-service
RUN npm install

COPY master-service ./
RUN npm run build
RUN npm prune --omit=dev
RUN rm -rf node_modules/@rtns/core \
    && mkdir -p node_modules/@rtns/core \
    && cp -R ../sharedv1.0/package*.json ../sharedv1.0/dist node_modules/@rtns/core/

FROM node:24-slim AS production

LABEL maintainer="UMP Platform"
LABEL service="master-service"

RUN groupadd -g 1001 nodejs \
    && useradd -u 1001 -g nodejs -m -s /bin/bash nodejs

WORKDIR /app
ENV NODE_PATH=/app/node_modules

COPY master-service/package*.json ./
COPY --from=builder /app/master-service/dist ./dist
COPY --from=builder /app/master-service/node_modules ./node_modules
COPY --from=builder /app/sharedv1.0/package*.json ./sharedv1.0/
COPY --from=builder /app/sharedv1.0/dist ./sharedv1.0/dist
COPY master-service/src ./src

RUN mkdir -p logs \
    && npm cache clean --force \
    && chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 6002

HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD node -e "require('http').get('http://localhost:6002/health', r => process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"

CMD ["sh", "-c", "node dist/server.js || echo FAILED && sleep 1000"]
