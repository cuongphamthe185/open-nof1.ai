# 🧪 Order Execution Testing Guide

## 📋 Prerequisites

1. **Update Environment Variables**
```bash
# Add to your .env file
ENABLE_REAL_TRADING="false"  # Start with dry-run mode
BINANCE_USE_SANDBOX="true"   # Use testnet
```

2. **Run Database Migration**
```bash
# If you have DATABASE_URL set
npx prisma migrate dev --name add_order_execution_fields

# Or just generate the client
npx prisma generate
```

3. **Start Development Server**
```bash
npm run dev
```

---

## 🎯 Test Endpoints

### 1. Check Position & Balance
```bash
curl http://localhost:3000/api/test/check-position
```

**Expected Response:**
```json
{
  "balance": {
    "free": 50.00,
    "used": 0,
    "total": 50.00
  },
  "position": null,
  "sandboxMode": true,
  "realTradingEnabled": false
}
```

---

### 2. Buy $5 Worth of BTC
```bash
curl -X POST http://localhost:3000/api/test/manual-buy \
  -H "Content-Type: application/json" \
  -d '{"amountUSD": 5, "leverage": 1}'
```

**Expected Response:**
```json
{
  "success": true,
  "chatId": "cm123abc...",
  "message": "Bought 0.00005263 BTC (~$5)",
  "details": {
    "amountBTC": 0.00005263,
    "btcPrice": 95000,
    "leverage": 1,
    "estimatedCost": 5
  }
}
```

---

### 3. Set Stop Loss & Take Profit
```bash
# Assuming current BTC price = $95,000
# Set SL at -5% = $90,250
# Set TP at +10% = $104,500

curl -X POST http://localhost:3000/api/test/manual-sltp \
  -H "Content-Type: application/json" \
  -d '{"stopLoss": 90250, "takeProfit": 104500}'
```

**Expected Response:**
```json
{
  "success": true,
  "chatId": "cm456def...",
  "message": "Set SL: 90250, TP: 104500",
  "details": {
    "stopLoss": 90250,
    "takeProfit": 104500
  }
}
```

---

### 4. Sell 50% of Position
```bash
curl -X POST http://localhost:3000/api/test/manual-sell \
  -H "Content-Type: application/json" \
  -d '{"percentage": 50}'
```

**Expected Response:**
```json
{
  "success": true,
  "chatId": "cm789ghi...",
  "message": "Sold 50% of BTC position",
  "details": {
    "percentage": 50
  }
}
```

---

### 5. Sell All (Close Position)
```bash
curl -X POST http://localhost:3000/api/test/manual-sell \
  -H "Content-Type: application/json" \
  -d '{"percentage": 100}'
```

---

### 6. View Order History
```bash
curl http://localhost:3000/api/test/order-history
```

**Expected Response:**
```json
{
  "orders": [
    {
      "id": "cm123...",
      "symbol": "BTC",
      "opeartion": "Buy",
      "amount": 0.00005263,
      "pricing": 95000,
      "status": "FILLED",
      "executedAt": "2025-11-04T10:30:00Z",
      "executedPrice": 95100,
      "executedAmount": 0.00005,
      "fee": 0.05,
      "Chat": {
        "chat": "Testing buy 5 USD worth of BTC",
        "reasoning": "Manual test buy"
      }
    }
  ],
  "summary": {
    "total": 5,
    "pending": 0,
    "filled": 4,
    "failed": 1,
    "totalFees": 0.25
  }
}
```

---

## 🧪 Test Scenarios

### Scenario 1: Complete Buy-Hold-Sell Cycle
```bash
# 1. Check initial balance
curl http://localhost:3000/api/test/check-position

# 2. Buy $5 BTC
curl -X POST http://localhost:3000/api/test/manual-buy \
  -H "Content-Type: application/json" \
  -d '{"amountUSD": 5, "leverage": 1}'

# 3. Verify position opened
curl http://localhost:3000/api/test/check-position

# 4. Set SL/TP
curl -X POST http://localhost:3000/api/test/manual-sltp \
  -H "Content-Type: application/json" \
  -d '{"stopLoss": 90250, "takeProfit": 104500}'

# 5. Wait for price movement or close manually
curl -X POST http://localhost:3000/api/test/manual-sell \
  -H "Content-Type: application/json" \
  -d '{"percentage": 100}'

# 6. Check final balance
curl http://localhost:3000/api/test/check-position

# 7. Review order history
curl http://localhost:3000/api/test/order-history
```

---

### Scenario 2: Partial Sell Test
```bash
# 1. Buy $10 BTC
curl -X POST http://localhost:3000/api/test/manual-buy \
  -H "Content-Type: application/json" \
  -d '{"amountUSD": 10, "leverage": 1}'

# 2. Sell 30%
curl -X POST http://localhost:3000/api/test/manual-sell \
  -H "Content-Type: application/json" \
  -d '{"percentage": 30}'

# 3. Check remaining position
curl http://localhost:3000/api/test/check-position

# 4. Sell another 40%
curl -X POST http://localhost:3000/api/test/manual-sell \
  -H "Content-Type: application/json" \
  -d '{"percentage": 40}'

# 5. Close remaining
curl -X POST http://localhost:3000/api/test/manual-sell \
  -H "Content-Type: application/json" \
  -d '{"percentage": 100}'
```

---

## ⚙️ Modes

### 🧪 Dry-Run Mode (Default - Safe)
```bash
ENABLE_REAL_TRADING="false"
BINANCE_USE_SANDBOX="true"
```
- ✅ No real orders executed
- ✅ All operations logged
- ✅ Database records created
- ✅ Perfect for testing logic

### 🔧 Sandbox Mode (Binance Testnet)
```bash
ENABLE_REAL_TRADING="true"
BINANCE_USE_SANDBOX="true"
```
- ✅ Real orders on testnet
- ✅ No real money
- ✅ Full API testing
- ✅ Get testnet funds from Binance

### 💰 Production Mode (Real Trading)
```bash
ENABLE_REAL_TRADING="true"
BINANCE_USE_SANDBOX="false"
```
- ⚠️ **DANGER**: Real money!
- ⚠️ Only enable after thorough testing
- ⚠️ Start with small amounts

---

## 🐛 Troubleshooting

### Error: "Environment variable not found: DATABASE_URL"
**Solution:** Set DATABASE_URL in your .env file

### Error: "Property 'status' does not exist"
**Solution:** Run `npx prisma generate` to regenerate client

### Error: "No position to sell"
**Solution:** Buy first, then try to sell

### Error: "Sell amount less than minimum"
**Solution:** Increase buy amount or sell higher percentage

---

## 📊 Monitoring

View all test operations in your database:
```sql
-- Check recent trades
SELECT * FROM "Trading" ORDER BY "createdAt" DESC LIMIT 10;

-- Check order status summary
SELECT status, COUNT(*) FROM "Trading" GROUP BY status;

-- Check total fees paid
SELECT SUM(fee) as total_fees FROM "Trading" WHERE status = 'FILLED';
```

---

## 🎯 Next Steps

1. ✅ Test all endpoints in **dry-run mode**
2. ✅ Enable **sandbox mode** with Binance testnet
3. ✅ Run 24-48h of automated AI trading (dry-run)
4. ✅ Analyze results and adjust parameters
5. ✅ Enable real trading with **small amounts** ($5-10)
6. ✅ Gradually increase capital after proven success

---

## 📝 Notes

- All amounts are in BTC (not USDT)
- Prices are in USDT per BTC
- Leverage: 1x-20x (start with 1x for safety)
- Fees: ~0.05% maker/taker on Binance Futures
- Minimum order size: ~0.001 BTC (~$95 at $95k BTC)

For smaller tests, use amounts divisible by minimum order size.
