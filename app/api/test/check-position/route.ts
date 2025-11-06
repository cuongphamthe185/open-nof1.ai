import { NextRequest, NextResponse } from "next/server";
import { binance } from "@/lib/trading/binance";
import { validateSymbol, symbolToTradingPair } from "@/lib/utils/symbol-validator";

export async function GET(request: NextRequest) {
  try {
    // Get symbol from query params
    const { searchParams } = new URL(request.url);
    const inputSymbol = searchParams.get("symbol");
    
    const symbol = validateSymbol(inputSymbol || undefined);
    const tradingPair = symbolToTradingPair(symbol);

    // Fetch account balance
    const balance = await binance.fetchBalance();
    
    // Fetch positions for specific symbol
    const positions = await binance.fetchPositions([tradingPair]);
    
    console.log("DEBUG - All positions:", JSON.stringify(positions.map(p => ({
      symbol: p.symbol,
      contracts: p.contracts,
      contractsType: typeof p.contracts,
      side: p.side,
      info: p.info?.positionId
    })), null, 2));
    
    // Find position - Handle both "BNB/USDT" and "BNB/USDT:USDT" formats
    const position = positions.find((p) => {
      const symbolMatch = p.symbol === tradingPair || p.symbol === `${tradingPair}:USDT`;
      const hasContracts = p.contracts && Number(p.contracts) > 0;
      console.log(`DEBUG - Checking ${p.symbol}: symbolMatch=${symbolMatch}, contracts=${p.contracts}, hasContracts=${hasContracts}`);
      return symbolMatch && hasContracts;
    });

    console.log("DEBUG - Found position:", position ? {
      symbol: position.symbol,
      contracts: position.contracts,
      entryPrice: position.entryPrice,
      positionId: position.info?.positionId || position.id
    } : "NONE");

    return NextResponse.json({
      symbol,
      tradingPair,
      balance: {
        free: balance.USDT?.free || 0,
        used: balance.USDT?.used || 0,
        total: balance.USDT?.total || 0,
      },
      position: position
        ? {
            // Binance Futures doesn't return position ID, use symbol as identifier
            positionId: position.info?.symbol || position.symbol.replace('/', '').replace(':USDT', ''),
            symbol: position.symbol,
            amount: position.contracts,
            entryPrice: position.entryPrice,
            markPrice: position.markPrice,
            unrealizedPnl: position.unrealizedPnl,
            leverage: position.leverage,
            side: position.side,
            percentage: position.percentage,
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
