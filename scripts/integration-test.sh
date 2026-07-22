#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

GREEN='\033[0;32m'; RED='\033[0;31m'; CYAN='\033[0;36m'; NC='\033[0m'

cleanup() {
  echo -e "\n${CYAN}🧹 Limpiando...${NC}"
  cd "$PROJECT_DIR"
  docker compose -f docker-compose.test.yml down -v 2>/dev/null || true
}
trap cleanup EXIT

echo -e "${CYAN}══════════════════════════════════════════${NC}"
echo -e "${CYAN}🧪 SDK Integration Tests${NC}"
echo -e "${CYAN}══════════════════════════════════════════${NC}"

# 1. Build and start
echo -e "\n${CYAN}🐘 Build + start Soma + PostgreSQL...${NC}"
cd "$PROJECT_DIR"
docker compose -f docker-compose.test.yml build --no-cache postgres soma 2>&1 | tail -3
docker compose -f docker-compose.test.yml up -d postgres soma 2>&1

# 2. Wait for Soma
echo -e "\n${CYAN}🏥 Esperando Soma (puede tardar ~90s en build+start)...${NC}"
for i in $(seq 1 60); do
  if curl -s http://localhost:4084/health 2>/dev/null | grep -q "ok"; then
    echo -e "  ${GREEN}✅ Soma listo${NC} (${i}s)"
    # Run migrations
    docker compose -f docker-compose.test.yml exec -T soma bin/soma eval "Soma.Release.migrate" 2>/dev/null || true
    break
  fi
  sleep 2
  echo -n "."
done

# Verify
if ! curl -s http://localhost:4084/health 2>/dev/null | grep -q "ok"; then
  echo -e "\n${RED}❌ Soma no arrancó${NC}"
  docker compose -f docker-compose.test.yml logs soma
  exit 1
fi

# 3. Run unit tests
echo -e "\n${CYAN}🧪 Tests unitarios...${NC}"
npx vitest run --exclude='**/integration*' 2>&1

# 4. Run integration tests against Soma
echo -e "\n${CYAN}🔗 Tests de integración contra Soma...${NC}"
npx vitest run src/integration.test.ts 2>&1

echo -e "\n${GREEN}✅ All integration tests passed${NC}"
