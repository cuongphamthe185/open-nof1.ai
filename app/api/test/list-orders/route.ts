import { NextRequest, NextResponse } from "next/server";
import { binance } from "@/lib/trading/binance";
import { validateSymbol, symbolToTradingPair } from "@/lib/utils/symbol-validator";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const inputSymbol = searchParams.get("symbol");
    
    let orders;
    if (inputSymbol) {
      // Get orders for specific symbol
      const symbol = validateSymbol(inputSymbol);
      const tradingPair = symbolToTradingPair(symbol);
      orders = await binance.fetchOpenOrders(tradingPair);
    } else {
      // Get all open orders
      orders = await binance.fetchOpenOrders();
    }

    const formattedOrders = orders.map((order) => ({
      id: order.id,
      symbol: order.symbol,
      type: order.type,
      side: order.side,
      price: order.price,
      amount: order.amount,
      stopPrice: order.stopPrice,
      status: order.status,
      timestamp: order.timestamp,
      datetime: order.datetime,
      reduceOnly: order.reduceOnly,
    }));

    return NextResponse.json({
      orders: formattedOrders,
      count: formattedOrders.length,
      symbol: inputSymbol || "ALL",
    });
  } catch (error: any) {
    console.error("List orders error:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
