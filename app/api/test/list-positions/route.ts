import { NextResponse } from "next/server";
import { binance } from "@/lib/trading/binance";

export async function GET() {
  try {
    // Fetch all positions for all supported pairs
    const supportedPairs = ["BTC/USDT", "ETH/USDT", "SOL/USDT", "BNB/USDT", "DOGE/USDT"];
    const positions = await binance.fetchPositions(supportedPairs);
    
    console.log("DEBUG - All fetched positions:", JSON.stringify(positions.map(p => ({
      symbol: p.symbol,
      contracts: p.contracts,
      contractsType: typeof p.contracts,
      side: p.side,
      id: p.id,
      infoPositionId: p.info?.positionId,
      rawInfo: p.info
    })), null, 2));
    
    // Filter open positions
    const openPositions = positions
      .filter((p) => {
        const hasContracts = p.contracts && Number(p.contracts) > 0;
        return hasContracts;
      })
      .map((p) => ({
        // Binance Futures doesn't return position ID, use symbol as identifier
        positionId: p.info?.symbol || p.symbol.replace('/', '').replace(':USDT', ''),
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
      supportedPairs,
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
