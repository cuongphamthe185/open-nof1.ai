# 📝 Support/Resistance System - Quick Summary

## ✅ Đã Hoàn Thành

### 1. Database (PostgreSQL)
- ✅ Table `support_resistance_levels` với 2 support + 2 resistance levels
- ✅ Strength scores (1-10)
- ✅ Validity tracking (calculatedAt, validUntil)

### 2. Algorithms
- ✅ **Volume Profile** (50%): Tìm High Volume Nodes
- ✅ **Pivot Points** (30%): Tìm swing highs/lows
- ✅ **Price Action** (20%): Rejection wicks & patterns
- ✅ **Hybrid**: Kết hợp 3 thuật toán trên

### 3. Configuration
```typescript
Candles:  15m=50, 1h=75, 4h=100
Weights:  VP=50%, PP=30%, PA=20%
Validity: 15m=60min, 1h=240min, 4h=960min
minStrength: 1 (accept weaker signals)
```

### 4. Cron Jobs
```
15m: XX:02, XX:17, XX:32, XX:47 (mỗi giờ)
1h:  XX:02 (mỗi giờ)
4h:  00:02, 04:02, 08:02, 12:02, 16:02, 20:02
```

### 5. AI Integration
- ✅ Fetch S/R từ database
- ✅ Format thành text với trading guidelines
- ✅ Include trong AI prompt

### 6. Bugs Fixed
1. ✅ Strength scores vượt 10 → Removed `* 20` multiplier
2. ✅ Support levels không realistic → Dùng `Math.min(lows)` thay vì `currentPrice * 0.95`

### 7. Timezone
- ✅ PostgreSQL: **Asia/Bangkok (UTC+7)**
- ✅ Node.js: **GMT+0700**
- ✅ Storage: **UTC** (best practice)
- ✅ Display: **UTC+7** (auto-convert)

## 🚀 Cách Sử Dụng

### Start Production
```bash
npm start  # Cron tự động chạy
```

### Testing
```bash
# Test calculation
npx tsx scripts/test-sr-system.ts BTC 15m
npx tsx scripts/test-sr-system.ts BNB 1h

# View current levels
npx tsx scripts/view-sr-levels.ts BTC
npx tsx scripts/view-sr-levels.ts BNB

# Check timezone
npx tsx scripts/check-timezone.ts

# Monitor system
npx tsx scripts/monitor-sr-system.ts
```

## 📊 Kết Quả Test (BTC - Nov 8, 2025)

**Current Price:** $101,664

| Timeframe | Support | Resistance | Status |
|-----------|---------|------------|--------|
| **15m** | $101,400 (1/10) | $101,964 (10/10) | ✅ Realistic |
| **1h** | $101,186 (3/10) | $101,716 (7/10) | ✅ Realistic |
| **4h** | $100,637 (2/10) → $99,044 (2/10) | $102,037 (2/10) | ✅ Realistic |

**So sánh TradingView:**
- Chart range: $99,500 - $104,700
- ✅ Tất cả levels nằm trong range
- ✅ 4h support $99,044 ≈ chart bottom $99,500
- ✅ Không còn levels "bay ngoài"

## 📁 Files Quan Trọng

### Algorithms
- `lib/trading/algorithms/config.ts` - Configuration
- `lib/trading/algorithms/hybrid-sr.ts` - Main algorithm

### Cron
- `lib/cron/sr-calculator.ts` - Scheduler
- `lib/cron/sr-service.ts` - Service
- `cron.ts` - Entry point

### AI
- `lib/ai/support-resistance.ts` - Fetch & format S/R
- `lib/ai/prompt.ts` - Include S/R in prompt

### Scripts
- `scripts/test-sr-system.ts` - Manual test
- `scripts/view-sr-levels.ts` - View current levels
- `scripts/check-timezone.ts` - Verify timezone
- `scripts/monitor-sr-system.ts` - Real-time monitor

### Documentation
- `SUPPORT_RESISTANCE_IMPLEMENTATION.md` - Full documentation (this file)

## 🎯 Next Steps

1. **Deploy to Production:**
   ```bash
   npm start
   # Hoặc: pm2 start npm -- start
   ```

2. **Monitor for 24h:**
   - Check cron execution
   - Verify S/R accuracy
   - Watch for errors

3. **Future Enhancements:**
   - Backtest accuracy
   - Add more symbols (ETH, SOL, DOGE)
   - Chart visualization
   - Machine learning for dynamic weights

## 📞 Support

Nếu gặp vấn đề:
1. Check logs: `tail -f logs/*.log`
2. Test manually: `npx tsx scripts/test-sr-system.ts BTC 15m`
3. Verify database: `npx tsx scripts/view-sr-levels.ts BTC`
4. Check timezone: `npx tsx scripts/check-timezone.ts`

---

**Status:** ✅ PRODUCTION READY
**Version:** 1.0.0
**Date:** November 8, 2025
**Timezone:** UTC+7 (Asia/Bangkok)
