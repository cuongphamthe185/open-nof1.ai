#!/bin/bash

# Comprehensive system check for Open-NOF1.ai

GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}      Open-NOF1.ai System Health Check${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}\n"

# 1. Database Check
echo -e "${BLUE}[1] Database Status:${NC}"
DB_URL="postgresql://postgres:root@localhost:5432/nof1_dev"

if psql "$DB_URL" -c "SELECT 1;" > /dev/null 2>&1; then
    echo -e "   ${GREEN}✓ Database connected${NC}"
    
    # Check tables
    TABLES=$(echo "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" | psql "$DB_URL" -t -A)
    echo -e "   ${GREEN}✓ Tables: $TABLES${NC}"
    
    # Check S/R data
    SR_COUNT=$(echo "SELECT COUNT(*) FROM support_resistance_levels;" | psql "$DB_URL" -t -A)
    echo -e "   ${YELLOW}  S/R Levels stored: $SR_COUNT${NC}"
    
else
    echo -e "   ${RED}✗ Database connection failed${NC}"
fi
echo ""

# 2. Application Processes
echo -e "${BLUE}[2] Application Processes:${NC}"

if pgrep -f "next dev" > /dev/null; then
    PID=$(pgrep -f "next dev" | head -1)
    echo -e "   ${GREEN}✓ Next.js app running (PID: $PID)${NC}"
else
    echo -e "   ${RED}✗ Next.js app NOT running${NC}"
fi

if pgrep -f "bun run cron" > /dev/null; then
    PID=$(pgrep -f "bun run cron" | head -1)
    echo -e "   ${GREEN}✓ Cron service running (PID: $PID)${NC}"
else
    echo -e "   ${RED}✗ Cron service NOT running${NC}"
fi
echo ""

# 3. Port Status
echo -e "${BLUE}[3] Network Status:${NC}"
if ss -tuln | grep -q ":3000 "; then
    echo -e "   ${GREEN}✓ Port 3000 listening${NC}"
    WSL_IP=$(hostname -I | awk '{print $1}')
    echo -e "   ${YELLOW}  WSL IP: $WSL_IP${NC}"
else
    echo -e "   ${RED}✗ Port 3000 NOT listening${NC}"
fi
echo ""

# 4. Prisma Client Status
echo -e "${BLUE}[4] Prisma Client Status:${NC}"
PRISMA_DATE=$(stat -c %y /mnt/c/cuongpt/vide_code/open-nof1.ai/node_modules/.prisma/client/index.d.ts 2>/dev/null | cut -d' ' -f1,2 | cut -d'.' -f1)
if [ -n "$PRISMA_DATE" ]; then
    echo -e "   ${GREEN}✓ Prisma Client exists${NC}"
    echo -e "   ${YELLOW}  Generated: $PRISMA_DATE${NC}"
    
    # Check if supportResistanceLevel exists
    if grep -q "supportResistanceLevel" /mnt/c/cuongpt/vide_code/open-nof1.ai/node_modules/.prisma/client/index.d.ts; then
        echo -e "   ${GREEN}✓ supportResistanceLevel model present${NC}"
    else
        echo -e "   ${RED}✗ supportResistanceLevel model MISSING${NC}"
    fi
else
    echo -e "   ${RED}✗ Prisma Client not found${NC}"
fi
echo ""

# 5. Cron Jobs Status
echo -e "${BLUE}[5] Scheduled Cron Jobs:${NC}"
if [ -f /tmp/nof1-cron.log ]; then
    echo -e "   ${YELLOW}Cron configuration:${NC}"
    grep -E "Schedule:|Every|Next run" /tmp/nof1-cron.log | tail -6 | sed 's/^/   /'
else
    echo -e "   ${YELLOW}No cron log available${NC}"
fi
echo ""

# 6. Recent Activity
echo -e "${BLUE}[6] Recent Activity (last 5 minutes):${NC}"
if [ -f /tmp/nof1-app.log ]; then
    # Metrics updates
    METRICS_COUNT=$(grep -c "20 seconds metrics interval executed" /tmp/nof1-app.log | tail -1)
    echo -e "   ${YELLOW}Metrics updates: $METRICS_COUNT total${NC}"
    
    # AI decisions
    AI_COUNT=$(grep -c "Running task every" /tmp/nof1-cron.log)
    echo -e "   ${YELLOW}AI decision runs: $AI_COUNT total${NC}"
    
    # S/R calculations
    SR_CALC=$(grep -c "S/R Calculator" /tmp/nof1-cron.log)
    echo -e "   ${YELLOW}S/R calculations: $SR_CALC total${NC}"
    
    # Last S/R run
    LAST_SR=$(grep "S/R Calculator" /tmp/nof1-app.log | tail -1)
    if [ -n "$LAST_SR" ]; then
        echo -e "   ${GREEN}Last S/R: $(echo $LAST_SR | cut -d']' -f1 | cut -d'[' -f2)${NC}"
    fi
else
    echo -e "   ${YELLOW}No app log available${NC}"
fi
echo ""

# 7. Recent Errors
echo -e "${BLUE}[7] Recent Errors (last 5):${NC}"
if [ -f /tmp/nof1-app.log ]; then
    ERRORS=$(grep -i "error\|failed\|exception" /tmp/nof1-app.log | tail -5)
    if [ -n "$ERRORS" ]; then
        echo "$ERRORS" | sed 's/^/   /' | cut -c1-100
    else
        echo -e "   ${GREEN}✓ No recent errors${NC}"
    fi
else
    echo -e "   ${YELLOW}No app log available${NC}"
fi
echo ""

# 8. Next S/R Calculation
echo -e "${BLUE}[8] Next S/R Calculator Run:${NC}"
CURRENT_MIN=$(date +%M)
NEXT_RUNS=(0 10 20 30 40 50)
NEXT_MIN=""

for min in "${NEXT_RUNS[@]}"; do
    if [ $min -gt $CURRENT_MIN ]; then
        NEXT_MIN=$min
        break
    fi
done

if [ -z "$NEXT_MIN" ]; then
    NEXT_MIN=0
    NEXT_HOUR=$(($(date +%H) + 1))
else
    NEXT_HOUR=$(date +%H)
fi

echo -e "   ${YELLOW}Current time: $(date +%H:%M)${NC}"
echo -e "   ${GREEN}Next S/R run: ${NEXT_HOUR}:$(printf "%02d" $NEXT_MIN)${NC}"
echo ""

# Summary
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}                    Summary${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"

CHECKS_PASSED=0
TOTAL_CHECKS=5

psql "$DB_URL" -c "SELECT 1;" > /dev/null 2>&1 && ((CHECKS_PASSED++))
pgrep -f "next dev" > /dev/null && ((CHECKS_PASSED++))
pgrep -f "bun run cron" > /dev/null && ((CHECKS_PASSED++))
ss -tuln | grep -q ":3000 " && ((CHECKS_PASSED++))
grep -q "supportResistanceLevel" /mnt/c/cuongpt/vide_code/open-nof1.ai/node_modules/.prisma/client/index.d.ts 2>/dev/null && ((CHECKS_PASSED++))

if [ $CHECKS_PASSED -eq $TOTAL_CHECKS ]; then
    echo -e "${GREEN}✅ All systems operational ($CHECKS_PASSED/$TOTAL_CHECKS)${NC}"
    echo -e "${GREEN}   System is ready for trading!${NC}"
elif [ $CHECKS_PASSED -gt 2 ]; then
    echo -e "${YELLOW}⚠️  Most systems operational ($CHECKS_PASSED/$TOTAL_CHECKS)${NC}"
    echo -e "${YELLOW}   System is partially ready${NC}"
else
    echo -e "${RED}❌ Critical issues detected ($CHECKS_PASSED/$TOTAL_CHECKS)${NC}"
    echo -e "${RED}   System needs attention${NC}"
fi
echo ""
