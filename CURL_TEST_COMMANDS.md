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

**Check default symbol (BTC):**
```bash
curl http://localhost:3000/api/test/check-position
```

**Check specific symbol:**
```bash
# Check BNB position
curl "http://localhost:3000/api/test/check-position?symbol=BNB"

# Check ETH position
curl "http://localhost:3000/api/test/check-position?symbol=ETH"
```

**List ALL open positions (recommended):**
```bash
curl http://localhost:3000/api/test/list-positions
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

**Option 1: Set SL/TP for specific symbol (finds first open position)**

```bash
# For BTC position
curl -X POST http://localhost:3000/api/test/manual-sltp \
  -H "Content-Type: application/json" \
  -d '{"stopLoss": 90250, "takeProfit": 104500, "symbol": "BTC"}'

# For BNB position  
curl -X POST http://localhost:3000/api/test/manual-sltp \
  -H "Content-Type: application/json" \
  -d '{"stopLoss": 900, "takeProfit": 1000, "symbol": "BNB"}'
```

**Option 2: Set SL/TP for specific position by ID (recommended for multiple positions)**

```bash
# Step 1: Get positionId from buy response or list-positions
curl http://localhost:3000/api/test/list-positions | jq

# Step 2: Use the positionId (example: "80297250758")
curl -X POST http://localhost:3000/api/test/manual-sltp \
  -H "Content-Type: application/json" \
  -d '{"stopLoss": 900, "takeProfit": 1000, "positionId": "80297250758", "symbol": "BNB"}'
```

**Expected output:**
```json
{
  "success": true,
  "chatId": "cm456def...",
  "positionId": "80297250758",
  "message": "Set SL: 900, TP: 1000 for BNB (position 80297250758)",
  "details": {
    "symbol": "BNB",
    "tradingPair": "BNB/USDT",
    "stopLoss": 900,
    "takeProfit": 1000,
    "positionId": "80297250758"
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

## 🪙 Test with Different Symbols

### Buy Different Coins
```bash
# Buy BTC
curl -X POST http://localhost:3000/api/test/manual-buy \
  -H "Content-Type: application/json" \
  -d '{"amountUSD": 10, "leverage": 1, "symbol": "BTC"}'

# Buy ETH
curl -X POST http://localhost:3000/api/test/manual-buy \
  -H "Content-Type: application/json" \
  -d '{"amountUSD": 10, "leverage": 1, "symbol": "ETH"}'

# Buy BNB
curl -X POST http://localhost:3000/api/test/manual-buy \
  -H "Content-Type: application/json" \
  -d '{"amountUSD": 15, "leverage": 2, "symbol": "BNB"}'

# Buy SOL
curl -X POST http://localhost:3000/api/test/manual-buy \
  -H "Content-Type: application/json" \
  -d '{"amountUSD": 20, "leverage": 1, "symbol": "SOL"}'

# Buy DOGE
curl -X POST http://localhost:3000/api/test/manual-buy \
  -H "Content-Type: application/json" \
  -d '{"amountUSD": 5, "leverage": 1, "symbol": "DOGE"}'
```

### Check Specific Symbol Position
```bash
# Check BTC
curl "http://localhost:3000/api/test/check-position?symbol=BTC" | jq

# Check ETH
curl "http://localhost:3000/api/test/check-position?symbol=ETH" | jq

# Check BNB
curl "http://localhost:3000/api/test/check-position?symbol=BNB" | jq

# Check all positions
curl http://localhost:3000/api/test/list-positions | jq
```

### Set SL/TP for Different Symbols
```bash
# SL/TP for BTC
curl -X POST http://localhost:3000/api/test/manual-sltp \
  -H "Content-Type: application/json" \
  -d '{"stopLoss": 90000, "takeProfit": 105000, "symbol": "BTC"}'

# SL/TP for ETH
curl -X POST http://localhost:3000/api/test/manual-sltp \
  -H "Content-Type: application/json" \
  -d '{"stopLoss": 3000, "takeProfit": 3500, "symbol": "ETH"}'

# SL/TP for BNB by positionId
curl -X POST http://localhost:3000/api/test/manual-sltp \
  -H "Content-Type: application/json" \
  -d '{"stopLoss": 900, "takeProfit": 1000, "positionId": "80297250758", "symbol": "BNB"}'
```

### Sell Different Symbols
```bash
# Sell 50% BTC
curl -X POST http://localhost:3000/api/test/manual-sell \
  -H "Content-Type: application/json" \
  -d '{"percentage": 50, "symbol": "BTC"}'

# Sell 100% ETH
curl -X POST http://localhost:3000/api/test/manual-sell \
  -H "Content-Type: application/json" \
  -d '{"percentage": 100, "symbol": "ETH"}'

# Sell 75% BNB
curl -X POST http://localhost:3000/api/test/manual-sell \
  -H "Content-Type: application/json" \
  -d '{"percentage": 75, "symbol": "BNB"}'
```

---

## 🧪 Multi-Symbol Test Scenario

Test trading with multiple symbols simultaneously:

```bash
# Step 1: Buy multiple coins
echo "=== Step 1: Buy BTC, ETH, and BNB ==="
curl -s -X POST http://localhost:3000/api/test/manual-buy \
  -H "Content-Type: application/json" \
  -d '{"amountUSD": 10, "leverage": 1, "symbol": "BTC"}' | jq '.message'

curl -s -X POST http://localhost:3000/api/test/manual-buy \
  -H "Content-Type: application/json" \
  -d '{"amountUSD": 10, "leverage": 1, "symbol": "ETH"}' | jq '.message'

curl -s -X POST http://localhost:3000/api/test/manual-buy \
  -H "Content-Type: application/json" \
  -d '{"amountUSD": 15, "leverage": 2, "symbol": "BNB"}' | jq '.message'

sleep 2

# Step 2: List all positions
echo -e "\n=== Step 2: List all open positions ==="
curl -s http://localhost:3000/api/test/list-positions | jq '.openPositions[] | {symbol, amount, entryPrice, positionId}'

# Step 3: Set SL/TP for each
echo -e "\n=== Step 3: Set SL/TP for each position ==="
curl -s -X POST http://localhost:3000/api/test/manual-sltp \
  -H "Content-Type: application/json" \
  -d '{"stopLoss": 90000, "takeProfit": 105000, "symbol": "BTC"}' | jq '.message'

curl -s -X POST http://localhost:3000/api/test/manual-sltp \
  -H "Content-Type: application/json" \
  -d '{"stopLoss": 3000, "takeProfit": 3500, "symbol": "ETH"}' | jq '.message'

# For BNB, use positionId from Step 2
# Replace "YOUR_BNB_POSITION_ID" with actual ID from list-positions
curl -s -X POST http://localhost:3000/api/test/manual-sltp \
  -H "Content-Type: application/json" \
  -d '{"stopLoss": 900, "takeProfit": 1000, "positionId": "YOUR_BNB_POSITION_ID", "symbol": "BNB"}' | jq '.message'

# Step 4: Check individual positions
echo -e "\n=== Step 4: Check individual positions ==="
curl -s "http://localhost:3000/api/test/check-position?symbol=BTC" | jq '.position'
curl -s "http://localhost:3000/api/test/check-position?symbol=ETH" | jq '.position'
curl -s "http://localhost:3000/api/test/check-position?symbol=BNB" | jq '.position'

# Step 5: Partial sell
echo -e "\n=== Step 5: Sell 50% of each position ==="
curl -s -X POST http://localhost:3000/api/test/manual-sell \
  -H "Content-Type: application/json" \
  -d '{"percentage": 50, "symbol": "BTC"}' | jq '.message'

curl -s -X POST http://localhost:3000/api/test/manual-sell \
  -H "Content-Type: application/json" \
  -d '{"percentage": 50, "symbol": "ETH"}' | jq '.message'

curl -s -X POST http://localhost:3000/api/test/manual-sell \
  -H "Content-Type: application/json" \
  -d '{"percentage": 50, "symbol": "BNB"}' | jq '.message'

# Step 6: Final positions check
echo -e "\n=== Step 6: Final check ==="
curl -s http://localhost:3000/api/test/list-positions | jq '{count, positions: .openPositions}'

echo -e "\n✅ Multi-symbol test completed!"
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
