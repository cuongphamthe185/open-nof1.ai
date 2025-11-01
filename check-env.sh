#!/bin/bash
# ============================================
# CHECK ENVIRONMENT VARIABLES
# ============================================
# Script này giúp bạn verify env vars trước khi run production

RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}🔍 Environment Variables Check${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""

# Check shell environment
echo -e "${YELLOW}📋 Shell Environment (exported vars):${NC}"
echo ""

SHELL_VARS=(
  "DEEPSEEK_API_KEY"
  "BINANCE_API_KEY"
  "BINANCE_API_SECRET"
  "BINANCE_USE_SANDBOX"
  "DATABASE_URL"
  "CRON_SECRET_KEY"
  "START_MONEY"
)

SHELL_COUNT=0
for var in "${SHELL_VARS[@]}"; do
  if [ -n "${!var}" ]; then
    SHELL_COUNT=$((SHELL_COUNT + 1))
    if [[ "$var" == *"KEY"* ]] || [[ "$var" == *"SECRET"* ]]; then
      masked="${!var:0:6}...${!var: -4}"
      echo -e "   ${GREEN}✅ $var = $masked${NC}"
    else
      echo -e "   ${GREEN}✅ $var = ${!var}${NC}"
    fi
  else
    echo -e "   ${RED}❌ $var = (not set)${NC}"
  fi
done

echo ""
echo -e "${BLUE}Shell vars set: $SHELL_COUNT / ${#SHELL_VARS[@]}${NC}"
echo ""

# Check .env.local
if [ -f ".env.local" ]; then
  echo -e "${YELLOW}📄 .env.local file:${NC}"
  echo -e "   ${GREEN}✅ File exists${NC}"
  
  # Check sandbox mode in file
  if grep -q 'BINANCE_USE_SANDBOX.*=.*"true"' .env.local; then
    echo -e "   ${YELLOW}⚠️  BINANCE_USE_SANDBOX=true (TESTNET MODE)${NC}"
  elif grep -q 'BINANCE_USE_SANDBOX.*=.*"false"' .env.local; then
    echo -e "   ${RED}⚠️  BINANCE_USE_SANDBOX=false (PRODUCTION MODE)${NC}"
  fi
  
  # Check database
  if grep -q 'nof1_dev' .env.local; then
    echo -e "   ${BLUE}ℹ️  Database: nof1_dev (development)${NC}"
  elif grep -q 'nof1_prod' .env.local; then
    echo -e "   ${RED}ℹ️  Database: nof1_prod (production)${NC}"
  fi
else
  echo -e "${YELLOW}📄 .env.local file:${NC}"
  echo -e "   ${RED}❌ File not found${NC}"
fi

echo ""
echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}📊 Which will be used?${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""

if [ $SHELL_COUNT -ge 3 ]; then
  echo -e "${GREEN}✅ SHELL ENVIRONMENT will be used${NC}"
  echo -e "   (At least 3 critical vars are exported)"
  echo -e ""
  echo -e "   ${GREEN}Priority: Shell > .env.local${NC}"
  echo -e ""
  
  if [ -n "$BINANCE_USE_SANDBOX" ]; then
    if [ "$BINANCE_USE_SANDBOX" = "false" ]; then
      echo -e "   ${RED}⚠️  MODE: PRODUCTION (REAL MONEY)${NC}"
    else
      echo -e "   ${YELLOW}⚠️  MODE: SANDBOX (TESTNET)${NC}"
    fi
  fi
else
  echo -e "${YELLOW}⚠️  .env.local will be used${NC}"
  echo -e "   (Not enough shell vars exported)"
  echo -e ""
  
  if [ -f ".env.local" ]; then
    if grep -q 'BINANCE_USE_SANDBOX.*=.*"true"' .env.local; then
      echo -e "   ${YELLOW}⚠️  MODE: SANDBOX (TESTNET)${NC}"
    elif grep -q 'BINANCE_USE_SANDBOX.*=.*"false"' .env.local; then
      echo -e "   ${RED}⚠️  MODE: PRODUCTION (REAL MONEY)${NC}"
    fi
  fi
fi

echo ""
echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}💡 Recommendations${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""

if [ $SHELL_COUNT -ge 3 ] && [ "$BINANCE_USE_SANDBOX" = "false" ]; then
  echo -e "${GREEN}✅ Ready for production!${NC}"
  echo -e "   Run: ./start-production.sh"
elif [ $SHELL_COUNT -ge 3 ] && [ "$BINANCE_USE_SANDBOX" = "true" ]; then
  echo -e "${YELLOW}⚠️  Shell vars set, but SANDBOX mode${NC}"
  echo -e "   For production, set: export BINANCE_USE_SANDBOX=\"false\""
elif [ -f ".env.local" ]; then
  if grep -q 'BINANCE_USE_SANDBOX.*=.*"true"' .env.local; then
    echo -e "${GREEN}✅ Good for development (testnet)${NC}"
    echo -e "   Run: bun dev"
  else
    echo -e "${RED}⚠️  .env.local is in PRODUCTION mode!${NC}"
    echo -e "   Consider using shell exports for production instead"
  fi
else
  echo -e "${RED}❌ No environment configured${NC}"
  echo -e "   Create .env.local or export shell vars"
fi

echo ""
