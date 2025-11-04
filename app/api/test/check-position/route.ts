import { NextResponse } from "next/server";
import { binance } from "@/lib/trading/binance";

export async function GET() {
  try {
    // Fetch account balance
    const balance = await binance.fetchBalance();
    
    // Fetch positions
    const positions = await binance.fetchPositions(["BTC/USDT"]);
    const btcPosition = positions.find((p) => p.symbol === "BTC/USDT");

    return NextResponse.json({
      balance: {
        free: balance.USDT?.free || 0,
        used: balance.USDT?.used || 0,
        total: balance.USDT?.total || 0,
      },
      position: btcPosition
        ? {
            symbol: btcPosition.symbol,
            amount: btcPosition.contracts,
            entryPrice: btcPosition.entryPrice,
            markPrice: btcPosition.markPrice,
            unrealizedPnl: btcPosition.unrealizedPnl,
            leverage: btcPosition.leverage,
            side: btcPosition.side,
            percentage: btcPosition.percentage,
          }
        : null,
      sandboxMode: process.env.BINANCE_USE_SANDBOX === "true",
      realTradingEnabled: process.env.ENABLE_REAL_TRADING === "true",
    });
  } catch (error: any) {
    console.error("Check position error:", error);
    return NextResponse.json(
      { 
        error: error.message,
        sandboxMode: process.env.BINANCE_USE_SANDBOX === "true",
        realTradingEnabled: process.env.ENABLE_REAL_TRADING === "true",
      },
      { status: 500 }
    );
  }
}
