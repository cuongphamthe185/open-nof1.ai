import { NextResponse } from "next/server";
import { binance } from "@/lib/trading/binance";

export async function GET() {
  try {
    // Fetch all positions
    const positions = await binance.fetchPositions(["BTC/USDT"]);
    
    // Filter open positions
    const openPositions = positions
      .filter((p) => p.contracts && p.contracts > 0)
      .map((p) => ({
        positionId: p.id,
        symbol: p.symbol,
        amount: p.contracts,
        entryPrice: p.entryPrice,
        markPrice: p.markPrice,
        unrealizedPnl: p.unrealizedPnl,
        leverage: p.leverage,
        side: p.side,
        percentage: p.percentage,
      }));

    return NextResponse.json({
      openPositions,
      count: openPositions.length,
      sandboxMode: process.env.BINANCE_USE_SANDBOX === "true",
      realTradingEnabled: process.env.ENABLE_REAL_TRADING === "true",
    });
  } catch (error: any) {
    console.error("List positions error:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
