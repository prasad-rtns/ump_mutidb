#!/bin/bash
# ump-start.sh - Full platform startup script
set -e

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'

log() { echo -e "${GREEN}[UMP]${NC} $1"; }
warn() { echo -e "${YELLOW}[UMP]${NC} $1"; }
err() { echo -e "${RED}[UMP]${NC} $1"; }

# ─── Pre-flight checks ─────────────────────────────────────────────────────────
log "🔍 Pre-flight checks..."
command -v docker >/dev/null 2>&1 || { err "Docker not found"; exit 1; }
command -v docker-compose >/dev/null 2>&1 || docker compose version >/dev/null 2>&1 || { err "Docker Compose not found"; exit 1; }

# ─── Environment setup ─────────────────────────────────────────────────────────
if [ ! -f .env ]; then
  warn ".env not found, copying from .env.example"
  cp .env.example .env 2>/dev/null || warn "No .env.example found, using defaults"
fi

# ─── Build and start ──────────────────────────────────────────────────────────
log "🏗️  Building services..."
docker compose build --no-cache

log "🚀 Starting infrastructure..."
docker compose up -d postgres mysql mongodb redis

log "⏳ Waiting for databases (30s)..."
sleep 30

log "🚀 Starting microservices..."
docker compose up -d auth-service master-service document-service

log "⏳ Waiting for services (15s)..."
sleep 15

docker compose up -d nginx

# ─── Health checks ─────────────────────────────────────────────────────────────
log "🏥 Health checks..."
check_health() {
  if curl -sf "$1/health" > /dev/null 2>&1; then
    log "  ✅ $2 is healthy"
  else
    warn "  ⚠️  $2 may not be ready yet"
  fi
}

check_health "http://localhost:6001" "Auth Service"
check_health "http://localhost:6002" "Master Service"
check_health "http://localhost:6003" "Document Service"
check_health "http://localhost:8082" "NGINX Gateway"

echo ""
log "🎉 UMP Platform is running!"
echo ""
echo "  📚 Swagger Docs:"
echo "     Auth Service:     http://localhost:6001/api/docs"
echo "     Master Service:   http://localhost:6002/api/docs"
echo "     Document Service: http://localhost:6003/api/docs"
echo "     Via Gateway:      http://localhost:8082/docs/auth"
echo ""
echo "  🔑 Default Admin:"
echo "     Email:    admin@ump-platform.com"
echo "     Password: Admin@1234"
echo ""
echo "  🐳 Container status:"
docker compose ps
