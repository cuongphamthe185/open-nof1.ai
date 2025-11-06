import { NextRequest, NextResponse } from "next/server";
import { binance } from "@/lib/trading/binance";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get("symbol") || "BNB";
    const tradingPair = `${symbol}/USDT`;

    console.log(`Fetching positions for ${tradingPair}...`);
    const positions = await binance.fetchPositions([tradingPair]);
    
    // Return complete raw data
    return NextResponse.json({
      tradingPair,
      positionsCount: positions.length,
      positions: positions.map(p => ({
        // Basic fields
        id: p.id,
        symbol: p.symbol,
        contracts: p.contracts,
        contractsType: typeof p.contracts,
        side: p.side,
        entryPrice: p.entryPrice,
        markPrice: p.markPrice,
        
        // Info object
        infoKeys: p.info ? Object.keys(p.info) : [],
        infoPositionId: p.info?.positionId,
        infoPositionAmt: p.info?.positionAmt,
        infoSymbol: p.info?.symbol,
        
        // Full info (truncated)
        infoSample: p.info ? JSON.stringify(p.info).substring(0, 500) : null,
        
        // Full position object keys
        positionKeys: Object.keys(p),
      }))
    });
  } catch (error: any) {
    console.error("Debug position error:", error);
    return NextResponse.json(
      { error: error.message, stack: error.stack },
      { status: 500 }
    );
  }
}
