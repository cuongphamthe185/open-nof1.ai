#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}       Open-NOF1.ai System Status Check${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}\n"

# 1. Check if Next.js app is running
echo -e "${BLUE}[1] Next.js Application Status:${NC}"
if pgrep -f "next-server" > /dev/null; then
    echo -e "   ${GREEN}✓ Next.js app is running${NC}"
else
    echo -e "   ${RED}✗ Next.js app is NOT running${NC}"
fi
echo ""

# 2. Check if Cron job is running
echo -e "${BLUE}[2] Cron Job Status:${NC}"
if pgrep -f "bun run cron.ts" > /dev/null; then
    echo -e "   ${GREEN}✓ Cron job is running${NC}"
    PID=$(pgrep -f "bun run cron.ts")
    echo -e "   ${YELLOW}PID: ${PID}${NC}"
else
    echo -e "   ${RED}✗ Cron job is NOT running${NC}"
fi
echo ""

# 3. Check PostgreSQL
echo -e "${BLUE}[3] PostgreSQL Status:${NC}"
if systemctl is-active --quiet postgresql; then
    echo -e "   ${GREEN}✓ PostgreSQL is running${NC}"
elif service postgresql status > /dev/null 2>&1; then
    echo -e "   ${GREEN}✓ PostgreSQL is running${NC}"
else
    echo -e "   ${RED}✗ PostgreSQL status unknown${NC}"
fi
echo ""

# 4. Check if port 3000 is in use
echo -e "${BLUE}[4] Port 3000 Status:${NC}"
if netstat -tuln 2>/dev/null | grep -q ":3000 " || ss -tuln 2>/dev/null | grep -q ":3000 "; then
    echo -e "   ${GREEN}✓ Port 3000 is in use (app is listening)${NC}"
else
    echo -e "   ${YELLOW}! Port 3000 is not in use${NC}"
fi
echo ""

# 5. Check recent cron activity
echo -e "${BLUE}[5] Recent Cron Activity:${NC}"
if [ -f /tmp/nof1-cron.log ]; then
    echo -e "   ${GREEN}Last 10 log entries:${NC}"
    tail -10 /tmp/nof1-cron.log | sed 's/^/   /'
else
    echo -e "   ${YELLOW}! No cron log file found at /tmp/nof1-cron.log${NC}"
fi
echo ""

# 6. Check AI decisions count
echo -e "${BLUE}[6] AI Trading Decisions Today:${NC}"
if [ -f /tmp/nof1-cron.log ]; then
    TODAY=$(date +%Y-%m-%d)
    COUNT=$(grep -c "AI Decision" /tmp/nof1-cron.log 2>/dev/null || echo "0")
    echo -e "   ${YELLOW}Total AI decisions in log: ${COUNT}${NC}"
else
    echo -e "   ${YELLOW}! No log file available${NC}"
fi
echo ""

# 7. Check last metrics update
echo -e "${BLUE}[7] Last Metrics Update:${NC}"
if [ -f /tmp/nof1-cron.log ]; then
    LAST_METRIC=$(grep "Metrics updated" /tmp/nof1-cron.log | tail -1)
    if [ -n "$LAST_METRIC" ]; then
        echo -e "   ${GREEN}${LAST_METRIC}${NC}" | sed 's/^/   /'
    else
        echo -e "   ${YELLOW}! No metrics updates found in log${NC}"
    fi
else
    echo -e "   ${YELLOW}! No log file available${NC}"
fi
echo ""

# 8. Database connectivity
echo -e "${BLUE}[8] Database Connectivity:${NC}"
if psql -U postgres -d nof1_dev -c "SELECT 1;" > /dev/null 2>&1; then
    echo -e "   ${GREEN}✓ Can connect to nof1_dev database${NC}"
else
    echo -e "   ${RED}✗ Cannot connect to nof1_dev database${NC}"
fi
echo ""

# 9. Resource usage
echo -e "${BLUE}[9] Resource Usage:${NC}"
if pgrep -f "bun" > /dev/null; then
    echo -e "   ${YELLOW}Bun processes:${NC}"
    ps aux | grep bun | grep -v grep | awk '{printf "   CPU: %s%% | MEM: %s%% | CMD: %s\n", $3, $4, $11}' | head -5
else
    echo -e "   ${RED}✗ No bun processes found${NC}"
fi
echo ""

# Summary
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}                    Summary${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
RUNNING=0
TOTAL=2

if pgrep -f "next-server" > /dev/null; then ((RUNNING++)); fi
if pgrep -f "bun run cron.ts" > /dev/null; then ((RUNNING++)); fi

if [ $RUNNING -eq $TOTAL ]; then
    echo -e "${GREEN}✓ All services are running ($RUNNING/$TOTAL)${NC}"
elif [ $RUNNING -gt 0 ]; then
    echo -e "${YELLOW}! Some services are running ($RUNNING/$TOTAL)${NC}"
else
    echo -e "${RED}✗ No services are running ($RUNNING/$TOTAL)${NC}"
fi
echo ""
