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
echo -e "\n${CYAN}🐘 Levantando Soma + PostgreSQL...${NC}"
cd "$PROJECT_DIR"
docker compose -f docker-compose.test.yml up -d --build postgres
docker compose -f docker-compose.test.yml up -d --build soma

# 2. Wait for Soma
echo -e "\n${CYAN}🏥 Esperando Soma...${NC}"
for i in $(seq 1 30); do
  if curl -s http://localhost:4084/health 2>/dev/null | grep -q "ok"; then
    echo -e "  ${GREEN}✅ Soma listo${NC} (${i}s)"
    break
  fi
  sleep 2
  echo -n "."
done

# 3. Run unit tests
echo -e "\n${CYAN}🧪 Tests unitarios...${NC}"
npx vitest run --exclude='**/integration*' 2>&1

# 4. Run integration tests against Soma
echo -e "\n${CYAN}🔗 Tests de integración contra Soma...${NC}"
npx vitest run src/integration.test.ts 2>&1

echo -e "\n${GREEN}✅ All integration tests passed${NC}"
