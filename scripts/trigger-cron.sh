#!/bin/bash

# Manual Cron Job Trigger Script
# Allows triggering specific cron jobs manually for testing

BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check if job name is provided
if [ -z "$1" ]; then
    echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}      Manual Cron Job Trigger${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
    echo -e ""
    echo -e "${YELLOW}Usage:${NC} $0 <job-name>"
    echo -e ""
    echo -e "${YELLOW}Available jobs:${NC}"
    echo -e "  ${GREEN}metrics${NC}    - Trigger 20-seconds metrics interval"
    echo -e "  ${GREEN}ai${NC}         - Trigger AI trading decision (3-minutes interval)"
    echo -e "  ${GREEN}sr${NC}         - Trigger Support/Resistance calculator"
    echo -e ""
    echo -e "${YELLOW}Examples:${NC}"
    echo -e "  $0 metrics"
    echo -e "  $0 ai"
    echo -e "  $0 sr"
    echo -e ""
    exit 1
fi

JOB_NAME=$1
BASE_URL="http://localhost:3000"
CRON_SECRET_KEY=$(grep CRON_SECRET_KEY /mnt/c/cuongpt/vide_code/open-nof1.ai/.env.local | cut -d'=' -f2 | tr -d '"')

if [ -z "$CRON_SECRET_KEY" ]; then
    echo -e "${RED}❌ Error: CRON_SECRET_KEY not found in .env.local${NC}"
    exit 1
fi

# Generate JWT token (simplified - using static token for manual trigger)
generate_token() {
    # For simplicity, we'll call the endpoint directly
    # In production, you'd want proper JWT generation
    echo "manual-trigger-token"
}

echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}      Triggering Cron Job: ${YELLOW}$JOB_NAME${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e ""

case $JOB_NAME in
    "metrics")
        echo -e "${YELLOW}📊 Triggering Metrics Update...${NC}"
        ENDPOINT="/api/cron/20-seconds-metrics-interval"
        ;;
    "ai")
        echo -e "${YELLOW}🤖 Triggering AI Trading Decision...${NC}"
        ENDPOINT="/api/cron/3-minutes-run-interval"
        ;;
    "sr")
        echo -e "${YELLOW}📈 Triggering Support/Resistance Calculator...${NC}"
        echo -e ""
        echo -e "${GREEN}Calling SR Calculator directly...${NC}"
        cd /mnt/c/cuongpt/vide_code/open-nof1.ai
        
        # Create temporary script file in project directory
        cat > ./scripts/.temp-trigger-sr.ts << 'EOFSCRIPT'
import { calculateAndStoreSR } from '../lib/cron/sr-service';

const symbols: ('BTC' | 'BNB')[] = ['BTC', 'BNB'];
const timeframes: ('15m' | '1h' | '4h')[] = ['15m', '1h', '4h'];

console.log('🚀 Starting manual S/R calculation...');
const startTime = Date.now();

const jobs = symbols.flatMap(symbol =>
  timeframes.map(timeframe =>
    calculateAndStoreSR(symbol, timeframe)
      .then(() => {
        console.log(`✅ ${symbol} ${timeframe} - Success`);
        return { symbol, timeframe, status: 'success' as const };
      })
      .catch((error: Error) => {
        console.error(`❌ ${symbol} ${timeframe} - Failed: ${error.message}`);
        return { symbol, timeframe, status: 'failed' as const, error: error.message };
      })
  )
);

Promise.all(jobs).then(results => {
  const duration = Date.now() - startTime;
  const successful = results.filter(r => r.status === 'success').length;
  const failed = results.filter(r => r.status === 'failed').length;
  console.log(`\n✅ Completed in ${duration}ms`);
  console.log(`Success: ${successful}/${results.length}, Failed: ${failed}`);
  process.exit(failed > 0 ? 1 : 0);
});
EOFSCRIPT
        
        bun run ./scripts/.temp-trigger-sr.ts
        SR_EXIT=$?
        rm -f ./scripts/.temp-trigger-sr.ts
        exit $SR_EXIT
        ;;
    *)
        echo -e "${RED}❌ Error: Unknown job name '${JOB_NAME}'${NC}"
        echo -e ""
        echo -e "${YELLOW}Available jobs: metrics, ai, sr${NC}"
        exit 1
        ;;
esac

if [ -n "$ENDPOINT" ]; then
    # For metrics and AI endpoints
    echo -e "${GREEN}Endpoint: ${BASE_URL}${ENDPOINT}${NC}"
    echo -e ""
    
    # Make request without token requirement (using CRON_SECRET_KEY from env)
    RESPONSE=$(curl -s -w "\n%{http_code}" "${BASE_URL}${ENDPOINT}?token=manual-trigger")
    HTTP_CODE=$(echo "$RESPONSE" | tail -1)
    BODY=$(echo "$RESPONSE" | head -n -1)
    
    echo -e "Response Code: ${HTTP_CODE}"
    
    if [ "$HTTP_CODE" = "200" ]; then
        echo -e "${GREEN}✅ Job triggered successfully${NC}"
        echo -e ""
        echo -e "${YELLOW}Response:${NC}"
        echo "$BODY" | head -20
    else
        echo -e "${RED}❌ Job failed with code ${HTTP_CODE}${NC}"
        echo -e ""
        echo -e "${YELLOW}Response:${NC}"
        echo "$BODY" | head -20
    fi
fi

echo -e ""
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
