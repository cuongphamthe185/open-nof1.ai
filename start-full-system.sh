#!/bin/bash
# ============================================
# NOF1 Trading Bot - Full System Startup
# ============================================

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}🚀 Starting NOF1 Trading Bot (Full System)${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""

# Check PostgreSQL
echo -e "${YELLOW}📊 Checking PostgreSQL...${NC}"
sudo service postgresql status > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo -e "${YELLOW}Starting PostgreSQL...${NC}"
    sudo service postgresql start
fi
echo -e "${GREEN}✅ PostgreSQL is running${NC}"
echo ""

# Set environment variables
export BINANCE_USE_SANDBOX="true"
export DATABASE_URL="postgresql://postgres:root@localhost:5432/nof1_dev"
export NEXT_PUBLIC_URL="http://localhost:3000"

echo -e "${YELLOW}📋 Configuration:${NC}"
echo -e "   Environment: ${GREEN}SANDBOX (Safe Mode)${NC}"
echo -e "   Starting Capital: ${GREEN}\$${START_MONEY} USDT (Fake)${NC}"
echo -e "   URL: ${GREEN}${NEXT_PUBLIC_URL}${NC}"
echo -e "   Model: ${GREEN}DeepSeek Reasoner${NC}"
echo ""

# Create a temp file to track processes
PIDS_FILE="/tmp/nof1-pids.txt"
rm -f $PIDS_FILE

# Function to cleanup on exit
cleanup() {
    echo ""
    echo -e "${YELLOW}🛑 Shutting down...${NC}"
    if [ -f $PIDS_FILE ]; then
        while read pid; do
            kill $pid 2>/dev/null
        done < $PIDS_FILE
        rm -f $PIDS_FILE
    fi
    exit 0
}

trap cleanup SIGINT SIGTERM

# Start Next.js app in background
echo -e "${BLUE}🌐 Starting Next.js Dashboard...${NC}"
bun dev > /tmp/nof1-app.log 2>&1 &
APP_PID=$!
echo $APP_PID >> $PIDS_FILE
echo -e "${GREEN}✅ Dashboard starting (PID: $APP_PID)${NC}"

# Wait for Next.js to be ready
echo -e "${YELLOW}⏳ Waiting for Next.js to be ready...${NC}"
MAX_WAIT=30
COUNTER=0
while [ $COUNTER -lt $MAX_WAIT ]; do
    if curl -s http://localhost:3000 > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Next.js is ready!${NC}"
        break
    fi
    sleep 1
    COUNTER=$((COUNTER + 1))
    echo -n "."
done
echo ""

if [ $COUNTER -eq $MAX_WAIT ]; then
    echo -e "${YELLOW}⚠️  Next.js not responding after ${MAX_WAIT}s, but continuing...${NC}"
fi
sleep 2

# Start Cron Jobs in background
echo -e "${BLUE}⏰ Starting Cron Jobs...${NC}"
bun run cron.ts > /tmp/nof1-cron.log 2>&1 &
CRON_PID=$!
echo $CRON_PID >> $PIDS_FILE
echo -e "${GREEN}✅ Cron jobs started (PID: $CRON_PID)${NC}"
echo ""

echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}🎉 All systems running!${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""
echo -e "${BLUE}📊 Access points:${NC}"
echo -e "   Dashboard: ${GREEN}http://localhost:3000${NC}"
echo ""
echo -e "${BLUE}📝 Logs:${NC}"
echo -e "   App:  tail -f /tmp/nof1-app.log"
echo -e "   Cron: tail -f /tmp/nof1-cron.log"
echo ""
echo -e "${BLUE}⏰ Automated tasks:${NC}"
echo -e "   ${GREEN}✓${NC} Metrics collection: Every 20 seconds"
echo -e "   ${GREEN}✓${NC} AI Trading decisions: Every 5 minutes"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop all services${NC}"
echo ""

# Keep script running and show logs
#tail -f /tmp/nof1-app.log /tmp/nof1-cron.log
