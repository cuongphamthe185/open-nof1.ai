#!/bin/bash
# ============================================
# NOF1 Trading Bot - PRODUCTION MODE
# ============================================
# ⚠️  REAL MONEY TRADING - USE WITH CAUTION!
# ============================================

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

clear
echo -e "${RED}============================================${NC}"
echo -e "${RED}⚠️  PRODUCTION MODE - REAL MONEY TRADING ⚠️${NC}"
echo -e "${RED}============================================${NC}"
echo ""

# ============================================
# ENVIRONMENT VARIABLES - AUTO LOAD
# ============================================
echo -e "${YELLOW}📋 Loading environment variables...${NC}"
echo ""

# Check if critical vars already set in shell (exported)
SHELL_VARS_SET=false
if [ -n "$BINANCE_API_KEY" ] && [ -n "$BINANCE_API_SECRET" ] && [ -n "$DEEPSEEK_API_KEY" ]; then
  SHELL_VARS_SET=true
  echo -e "${GREEN}✅ Using exported shell environment variables${NC}"
  echo -e "${BLUE}ℹ️  Shell variables have priority over .env.local${NC}"
fi

# Only load .env.local if shell vars NOT set
if [ "$SHELL_VARS_SET" = false ] && [ -f ".env.local" ]; then
  echo -e "${BLUE}ℹ️  Found .env.local, loading variables...${NC}"
  set -a
  source .env.local
  set +a
  echo -e "${GREEN}✅ Variables loaded from .env.local${NC}"
elif [ "$SHELL_VARS_SET" = false ]; then
  echo -e "${YELLOW}⚠️  No .env.local found and no shell vars set${NC}"
fi

echo ""

REQUIRED_VARS=(
  "DEEPSEEK_API_KEY"
  "BINANCE_API_KEY"
  "BINANCE_API_SECRET"
  "DATABASE_URL"
  "CRON_SECRET_KEY"
  "START_MONEY"
)

MISSING_VARS=()

echo -e "${YELLOW}Verifying required variables:${NC}"
for var in "${REQUIRED_VARS[@]}"; do
  if [ -z "${!var}" ]; then
    MISSING_VARS+=("$var")
    echo -e "   ${RED}❌ $var - NOT SET${NC}"
  else
    # Mask sensitive values
    if [[ "$var" == *"KEY"* ]] || [[ "$var" == *"SECRET"* ]]; then
      masked_value="${!var:0:6}...${!var: -4}"
      echo -e "   ${GREEN}✅ $var = $masked_value${NC}"
    else
      echo -e "   ${GREEN}✅ $var = ${!var}${NC}"
    fi
  fi
done

echo ""

# If any variables are missing
if [ ${#MISSING_VARS[@]} -ne 0 ]; then
  echo -e "${RED}❌ Missing required environment variables!${NC}"
  echo ""
  echo -e "${YELLOW}Option 1: Create/update .env.local file${NC}"
  echo -e "Option 2: Export from shell (source export-env-production.sh)"
  echo ""
  echo -e "${YELLOW}Missing variables:${NC}"
  echo ""
  for var in "${MISSING_VARS[@]}"; do
    echo -e "  $var=\"your_value_here\""
  done
  echo ""
  exit 1
fi

# ============================================
# PRODUCTION MODE CONFIGURATION
# ============================================
export BINANCE_USE_SANDBOX="false"
export NEXT_PUBLIC_URL="${NEXT_PUBLIC_URL:-http://localhost:3000}"

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}📊 PRODUCTION MODE - Configuration${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""
echo -e "${YELLOW}Trading Mode:${NC}    ${RED}PRODUCTION (REAL MONEY)${NC}"
echo -e "${YELLOW}Starting Capital:${NC} ${RED}\$$START_MONEY USDT${NC}"
echo -e "${YELLOW}Exchange:${NC}        ${RED}Binance (Live)${NC}"
echo -e "${YELLOW}AI Model:${NC}        DeepSeek Reasoner"
echo -e "${YELLOW}Auto Trading:${NC}    ${RED}DISABLED (Advisory Only)${NC}"
echo ""
echo -e "${GREEN}✅ Starting system in 2 seconds...${NC}"
sleep 2
echo ""

# ============================================
# CHECK POSTGRESQL
# ============================================
echo -e "${YELLOW}📊 Checking PostgreSQL...${NC}"
sudo service postgresql status > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo -e "${YELLOW}Starting PostgreSQL...${NC}"
    sudo service postgresql start
fi
echo -e "${GREEN}✅ PostgreSQL is running${NC}"
echo ""

# ============================================
# CLEANUP OLD PROCESSES
# ============================================
echo -e "${YELLOW}🧹 Cleaning up old processes...${NC}"
pkill -f "bun dev" 2>/dev/null
pkill -f "next dev" 2>/dev/null
pkill -f "cron.ts" 2>/dev/null
sleep 2
echo -e "${GREEN}✅ Cleanup complete${NC}"
echo ""

# ============================================
# CREATE PID FILE
# ============================================
PIDS_FILE="/tmp/nof1-pids.txt"
rm -f $PIDS_FILE

# ============================================
# CLEANUP HANDLER
# ============================================
cleanup() {
    echo ""
    echo -e "${YELLOW}🛑 Shutting down...${NC}"
    if [ -f $PIDS_FILE ]; then
        while read pid; do
            kill $pid 2>/dev/null
        done < $PIDS_FILE
        rm -f $PIDS_FILE
    fi
    echo -e "${GREEN}✅ All services stopped${NC}"
    exit 0
}

trap cleanup SIGINT SIGTERM

# ============================================
# START NEXT.JS APP
# ============================================
echo -e "${BLUE}🌐 Starting Next.js Dashboard...${NC}"
bun dev > /tmp/nof1-app.log 2>&1 &
APP_PID=$!
echo $APP_PID >> $PIDS_FILE
echo -e "${GREEN}✅ Dashboard starting (PID: $APP_PID)${NC}"

# Wait for Next.js to be ready
echo -e "${YELLOW}⏳ Waiting for Next.js to be ready...${NC}"
MAX_WAIT=60
COUNTER=0
while [ $COUNTER -lt $MAX_WAIT ]; do
    if curl -s http://localhost:3000 > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Next.js is ready!${NC}"
        break
    fi
    sleep 1
    COUNTER=$((COUNTER + 1))
    if [ $((COUNTER % 10)) -eq 0 ]; then
        echo -e "${YELLOW}   Still waiting... (${COUNTER}s)${NC}"
    fi
done

if [ $COUNTER -eq $MAX_WAIT ]; then
    echo -e "${RED}❌ Next.js not responding after ${MAX_WAIT}s${NC}"
    echo -e "${YELLOW}Check logs: tail -f /tmp/nof1-app.log${NC}"
    cleanup
    exit 1
fi

sleep 2
echo ""

# ============================================
# START CRON JOBS
# ============================================
echo -e "${BLUE}⏰ Starting Cron Jobs...${NC}"
bun run cron.ts > /tmp/nof1-cron.log 2>&1 &
CRON_PID=$!
echo $CRON_PID >> $PIDS_FILE
echo -e "${GREEN}✅ Cron jobs started (PID: $CRON_PID)${NC}"
echo ""

# ============================================
# SYSTEM READY
# ============================================
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}🎉 System is running!${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""
echo -e "${BLUE}📊 Access Points:${NC}"
echo -e "   Dashboard: ${GREEN}http://localhost:3000${NC}"
echo ""
echo -e "${BLUE}📝 Logs:${NC}"
echo -e "   App:  tail -f /tmp/nof1-app.log"
echo -e "   Cron: tail -f /tmp/nof1-cron.log"
echo ""
echo -e "${BLUE}⏰ Automated tasks:${NC}"
echo -e "   ${GREEN}✓${NC} Metrics collection: Every 20 seconds"
echo -e "   ${GREEN}✓${NC} AI analysis: Every 5 minutes"
echo ""
echo -e "${RED}⚠️  IMPORTANT REMINDERS:${NC}"
echo -e "   ${YELLOW}•${NC} Bot generates signals only (NO auto-execution)"
echo -e "   ${YELLOW}•${NC} Review each signal before trading manually"
echo -e "   ${YELLOW}•${NC} Monitor Binance account regularly"
echo -e "   ${YELLOW}•${NC} Set stop-losses on Binance for safety"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop all services${NC}"
echo ""
