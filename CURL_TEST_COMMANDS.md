# 🧪 CURL Test Commands - Order Execution

## Prerequisites
```bash
# Make sure your dev server is running
npm run dev

# Set these in your .env file:
ENABLE_REAL_TRADING="false"  # Dry-run mode for safety
BINANCE_USE_SANDBOX="true"   # Use testnet
```

---

## 📋 Test Commands

### 1️⃣ Check Initial Balance & Position
```bash
curl http://localhost:3000/api/test/check-position
```

**Expected output:**
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

### 2️⃣ Buy $5 Worth of BTC (Leverage 1x)
```bash
curl -X POST http://localhost:3000/api/test/manual-buy \
  -H "Content-Type: application/json" \
  -d '{"amountUSD": 5, "leverage": 1}'
```

**Expected output:**
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

### 3️⃣ Check Position After Buy
```bash
curl http://localhost:3000/api/test/check-position
```

**Expected output (if ENABLE_REAL_TRADING=true):**
```json
{
  "balance": {
    "free": 45.00,
    "used": 5.00,
    "total": 50.00
  },
  "position": {
    "symbol": "BTC/USDT",
    "amount": 0.00005263,
    "entryPrice": 95000,
    "markPrice": 95050,
    "unrealizedPnl": 0.26,
    "leverage": 1
  },
  "sandboxMode": true,
  "realTradingEnabled": true
}
```

---

### 4️⃣ Set Stop Loss & Take Profit
```bash
# Assuming BTC price = $95,000
# Stop Loss at -5% = $90,250
# Take Profit at +10% = $104,500

curl -X POST http://localhost:3000/api/test/manual-sltp \
  -H "Content-Type: application/json" \
  -d '{"stopLoss": 90250, "takeProfit": 104500}'
```

**Expected output:**
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

### 5️⃣ Sell 50% of Position
```bash
curl -X POST http://localhost:3000/api/test/manual-sell \
  -H "Content-Type: application/json" \
  -d '{"percentage": 50}'
```

**Expected output:**
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

### 6️⃣ Check Position After Partial Sell
```bash
curl http://localhost:3000/api/test/check-position
```

---

### 7️⃣ Sell Remaining 100% (Close Position)
```bash
curl -X POST http://localhost:3000/api/test/manual-sell \
  -H "Content-Type: application/json" \
  -d '{"percentage": 100}'
```

---

### 8️⃣ View Order History
```bash
curl http://localhost:3000/api/test/order-history
```

**Expected output:**
```json
{
  "orders": [
    {
      "id": "cm123...",
      "symbol": "BTC",
      "opeartion": "Buy",
      "amount": 0.00005263,
      "pricing": 95000,
      "leverage": 1,
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

## 🧪 Complete Test Scenario

Copy and paste these commands one by one:

```bash
# Step 1: Check initial state
echo "=== Step 1: Check initial balance ==="
curl http://localhost:3000/api/test/check-position
echo -e "\n\n"

# Step 2: Buy $5 BTC
echo "=== Step 2: Buy $5 BTC ==="
curl -X POST http://localhost:3000/api/test/manual-buy \
  -H "Content-Type: application/json" \
  -d '{"amountUSD": 5, "leverage": 1}'
echo -e "\n\n"

# Wait 2 seconds
sleep 2

# Step 3: Check position
echo "=== Step 3: Check position after buy ==="
curl http://localhost:3000/api/test/check-position
echo -e "\n\n"

# Step 4: Set SL/TP
echo "=== Step 4: Set Stop Loss & Take Profit ==="
curl -X POST http://localhost:3000/api/test/manual-sltp \
  -H "Content-Type: application/json" \
  -d '{"stopLoss": 90250, "takeProfit": 104500}'
echo -e "\n\n"

# Step 5: View history
echo "=== Step 5: View order history ==="
curl http://localhost:3000/api/test/order-history
echo -e "\n\n"

# Step 6: Sell 50%
echo "=== Step 6: Sell 50% of position ==="
curl -X POST http://localhost:3000/api/test/manual-sell \
  -H "Content-Type: application/json" \
  -d '{"percentage": 50}'
echo -e "\n\n"

# Step 7: Check position
echo "=== Step 7: Check remaining position ==="
curl http://localhost:3000/api/test/check-position
echo -e "\n\n"

# Step 8: Close remaining
echo "=== Step 8: Close remaining position ==="
curl -X POST http://localhost:3000/api/test/manual-sell \
  -H "Content-Type: application/json" \
  -d '{"percentage": 100}'
echo -e "\n\n"

# Step 9: Final check
echo "=== Step 9: Final balance check ==="
curl http://localhost:3000/api/test/check-position
echo -e "\n\n"

echo "✅ All tests completed!"
```

---

## 🔧 Test with Different Amounts

### Small Test ($5)
```bash
curl -X POST http://localhost:3000/api/test/manual-buy \
  -H "Content-Type: application/json" \
  -d '{"amountUSD": 5, "leverage": 1}'
```

### Medium Test ($10)
```bash
curl -X POST http://localhost:3000/api/test/manual-buy \
  -H "Content-Type: application/json" \
  -d '{"amountUSD": 10, "leverage": 1}'
```

### With Leverage (2x)
```bash
curl -X POST http://localhost:3000/api/test/manual-buy \
  -H "Content-Type: application/json" \
  -d '{"amountUSD": 5, "leverage": 2}'
```

---

## 🎯 Test Different Sell Percentages

### Sell 25%
```bash
curl -X POST http://localhost:3000/api/test/manual-sell \
  -H "Content-Type: application/json" \
  -d '{"percentage": 25}'
```

### Sell 75%
```bash
curl -X POST http://localhost:3000/api/test/manual-sell \
  -H "Content-Type: application/json" \
  -d '{"percentage": 75}'
```

### Sell All
```bash
curl -X POST http://localhost:3000/api/test/manual-sell \
  -H "Content-Type: application/json" \
  -d '{"percentage": 100}'
```

---

## 🎨 Pretty Print with jq

If you have `jq` installed, use these for better formatting:

```bash
# Check position (pretty)
curl -s http://localhost:3000/api/test/check-position | jq '.'

# Buy with pretty output
curl -s -X POST http://localhost:3000/api/test/manual-buy \
  -H "Content-Type: application/json" \
  -d '{"amountUSD": 5, "leverage": 1}' | jq '.'

# Order history (pretty)
curl -s http://localhost:3000/api/test/order-history | jq '.'
```

---

## ⚠️ Important Notes

1. **Dry-run mode** (`ENABLE_REAL_TRADING="false"`):
   - No real API calls to Binance
   - Everything is simulated
   - Safe for testing logic

2. **Sandbox mode** (`BINANCE_USE_SANDBOX="true"`):
   - Real API calls to Binance testnet
   - No real money
   - Get testnet funds from Binance

3. **Production mode** (both set to `"true"` and `"false"`):
   - ⚠️ **REAL MONEY AT RISK**
   - Only after thorough testing

---

## 🐛 Troubleshooting

### Error: Connection refused
**Solution:** Make sure dev server is running: `npm run dev`

### Error: 500 Internal Server Error
**Solution:** Check terminal logs for details

### Error: "No position to sell"
**Solution:** Execute a buy order first

### Error: Database connection failed
**Solution:** Check DATABASE_URL in .env

---

## 📊 Monitor in Real-Time

Open another terminal and watch logs:
```bash
# Watch all requests
tail -f .next/server.log

# Or watch with grep
tail -f .next/server.log | grep -E "(BUY|SELL|FILLED)"
```

---

## ✅ Success Criteria

After running all tests, you should see:
- ✅ Balance correctly updated
- ✅ Positions tracked accurately
- ✅ Orders in database with status "FILLED"
- ✅ Order history showing all operations
- ✅ No errors in terminal logs

---

**Ready to test!** Start with the first command and work your way down. 🚀
