#!/bin/bash
# ============================================
# ENVIRONMENT VARIABLES FOR PRODUCTION
# ============================================
# ⚠️  Copy this file, fill in your values, then:
#     source ./your-copy.sh
# ============================================

# ============================================
# AI CONFIGURATION
# ============================================
export DEEPSEEK_API_KEY="sk-your-deepseek-api-key-here"

# ============================================
# BINANCE PRODUCTION API
# ============================================
export BINANCE_API_KEY="your-binance-api-key-here"
export BINANCE_API_SECRET="your-binance-secret-here"
export BINANCE_USE_SANDBOX="false"  # ⚠️  PRODUCTION MODE

# ============================================
# DATABASE (Production)
# ============================================
export DATABASE_URL="postgresql://postgres:root@localhost:5432/nof1_prod"

# ============================================
# SECURITY
# ============================================
export CRON_SECRET_KEY="generate-random-string-here-$(date +%s)"

# ============================================
# TRADING CONFIGURATION
# ============================================
export START_MONEY="100"  # ⚠️  Start with 50-200 USDT recommended

# ============================================
# NEXT.JS
# ============================================
export NEXT_PUBLIC_URL="http://localhost:3000"

# ============================================
# VERIFICATION
# ============================================
echo "✅ Environment variables loaded"
echo ""
echo "🔑 DEEPSEEK_API_KEY: ${DEEPSEEK_API_KEY:0:6}...${DEEPSEEK_API_KEY: -4}"
echo "🔑 BINANCE_API_KEY: ${BINANCE_API_KEY:0:6}...${BINANCE_API_KEY: -4}"
echo "🔑 BINANCE_API_SECRET: ${BINANCE_API_SECRET:0:6}...${BINANCE_API_SECRET: -4}"
echo "🎯 Trading Mode: PRODUCTION (REAL MONEY)"
echo "💰 Starting Capital: $START_MONEY USDT"
echo ""
echo "⚠️  To apply these variables, run:"
echo "   source export-env-production.sh"
echo ""
echo "⚠️  To start the bot, run:"
echo "   ./start-production.sh"
echo ""
