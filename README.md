# Open-NOF1.ai - Quick Start Guide

## Setup Aliases

Run once to setup convenient command aliases:
```bash
./setup-aliases.sh
source ~/.bashrc  # or ~/.zshrc
```

## Available Commands

### Core Operations
```bash
nof1           # Navigate to project directory
nof1-start     # Start the trading bot (dev mode)
nof1-stop      # Stop all running processes
nof1-status    # Check bot status
nof1-health    # Run comprehensive system health check
```

### Development Tools
```bash
nof1-env       # Check environment configuration
nof1-scan      # Scan for secrets in code
nof1-verify    # Verify network configuration
nof1-prisma    # Regenerate Prisma Client (after schema changes)
```

### Manual Triggers
```bash
nof1-trigger metrics   # Trigger metrics update
nof1-trigger ai        # Trigger AI trading decision
nof1-trigger sr        # Trigger Support/Resistance calculator
```

## Quick Start

1. **First time setup:**
```bash
cd /mnt/c/cuongpt/vide_code/open-nof1.ai
./setup-aliases.sh
source ~/.bashrc
nof1-health  # Check system is ready
```

2. **Start trading bot:**
```bash
# Terminal 1: Start Next.js app
bun dev

# Terminal 2: Start cron jobs
bun run cron.ts
```

3. **Verify everything is running:**
```bash
nof1-status   # or nof1-health for detailed check
```

## Database Management

### Check Database
```bash
# View Support/Resistance levels
echo "SELECT symbol, timeframe, support1, resistance1, calculated_at FROM support_resistance_levels ORDER BY calculated_at DESC LIMIT 5;" | psql "postgresql://postgres:root@localhost:5432/nof1_dev" -t -A

# Count records
echo "SELECT COUNT(*) FROM support_resistance_levels;" | psql "postgresql://postgres:root@localhost:5432/nof1_dev" -t -A
```

### Regenerate Prisma Client
After updating `prisma/schema.prisma`:
```bash
nof1-prisma
# Then restart the app
```

### Manual trigger cron jobs for testing:
```bash
nof1-trigger sr      # Test S/R calculator
nof1-trigger metrics # Test metrics update
nof1-trigger ai      # Test AI decision (may hit rate limits)
```

## Project Structure

```
open-nof1.ai/
├── app/                    # Next.js app routes
│   ├── api/               # API endpoints
│   └── page.tsx           # Main dashboard
├── lib/                   # Core logic
│   ├── ai/               # AI trading logic
│   ├── cron/             # Cron job services
│   └── trading/          # Trading algorithms
├── prisma/               # Database schema
├── scripts/              # Utility scripts
└── cron.ts               # Cron scheduler
```

## Environment Variables

Required in `.env.local`:
```bash
DATABASE_URL="postgresql://postgres:root@localhost:5432/nof1_dev"
DEEPSEEK_API_KEY="your-api-key"
BINANCE_API_KEY="your-api-key"
BINANCE_API_SECRET="your-secret"
BINANCE_USE_SANDBOX="false"
CRON_SECRET_KEY="your-secret"
START_MONEY="50"
ENABLE_REAL_TRADING="true"
```

## Cron Schedule

- **Metrics**: Every 10 seconds
- **AI Decision**: Every 5 minutes (at :00, :05, :10, :15, :20, :25, :30, :35, :40, :45, :50, :55)
- **S/R Calculator**: Every 10 minutes (at :00, :10, :20, :30, :40, :50)

## Logs

View logs:
```bash
tail -f /tmp/nof1-app.log     # App logs
tail -f /tmp/nof1-cron.log    # Cron logs

# Search for errors
grep -i error /tmp/nof1-app.log | tail -20
```

## API Testing

### Check Position & Balance
```bash
# Check position
curl http://localhost:3000/api/test/check-position

# List all open positions
curl http://localhost:3000/api/test/list-positions
```

### Manual Test Trading
```bash
# Buy $5 worth of BTC (1x leverage)
curl -X POST http://localhost:3000/api/test/manual-buy \
  -H "Content-Type: application/json" \
  -d '{"amountUSD": 5, "leverage": 1}'

# Set Stop Loss & Take Profit
curl -X POST http://localhost:3000/api/test/manual-sltp \
  -H "Content-Type: application/json" \
  -d '{"stopLoss": 90250, "takeProfit": 104500, "symbol": "BTC"}'

# Sell 50% of position
curl -X POST http://localhost:3000/api/test/manual-sell \
  -H "Content-Type: application/json" \
  -d '{"percentage": 50}'

# View order history
curl http://localhost:3000/api/test/order-history
```

## Git Aliases (also available)

```bash
ga            # git add .
gb            # git branch
gc            # git checkout
gm            # git commit -m
gst           # git status
gpull/gpush   # git pull/push
```
