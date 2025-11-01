import { Position } from "ccxt";
import { binance } from "./binance";

export interface AccountInformationAndPerformance {
  currentPositionsValue: number;
  contractValue: number;
  totalCashValue: number;
  availableCash: number;
  currentTotalReturn: number;
  positions: Position[];
  sharpeRatio: number;
}

export async function getAccountInformationAndPerformance(
  initialCapital: number
): Promise<AccountInformationAndPerformance> {
  try {
    console.log("🔍 Fetching account information from Binance...");
    
    const positions = await binance.fetchPositions(["BTC/USDT"]);
    console.log(`✅ Positions fetched: ${positions.length} positions`);
    
    const currentPositionsValue = positions.reduce((acc, position) => {
      return acc + (position.initialMargin || 0) + (position.unrealizedPnl || 0);
    }, 0);
    
    const contractValue = positions.reduce((acc, position) => {
      return acc + (position.contracts || 0);
    }, 0);
    
    const currentCashValue = await binance.fetchBalance({ type: "future" });
    console.log(`✅ Balance fetched: ${currentCashValue.USDT?.total || 0} USDT`);
    
    const totalCashValue = currentCashValue.USDT?.total || 0;
    const availableCash = currentCashValue.USDT?.free || 0;
    const currentTotalReturn = (totalCashValue - initialCapital) / initialCapital;
    const sharpeRatio =
      currentTotalReturn /
      (positions.reduce((acc, position) => {
        return acc + (position.unrealizedPnl || 0);
      }, 0) /
        initialCapital);

    return {
      currentPositionsValue,
      contractValue,
      totalCashValue,
      availableCash,
      currentTotalReturn,
      positions,
      sharpeRatio,
    };
  } catch (error) {
    console.error("❌ Error fetching account information:", error);
    
    // Fallback to zero state if API fails
    console.warn("⚠️  Using fallback data (zeros) due to API error");
    return {
      currentPositionsValue: 0,
      contractValue: 0,
      totalCashValue: initialCapital,
      availableCash: initialCapital,
      currentTotalReturn: 0,
      positions: [],
      sharpeRatio: 0,
    };
  }
}

export function formatAccountPerformance(
  accountPerformance: AccountInformationAndPerformance
) {
  const { currentTotalReturn, availableCash, totalCashValue, positions } =
    accountPerformance;

  const output = `## HERE IS YOUR ACCOUNT INFORMATION & PERFORMANCE
Current Total Return (percent): ${currentTotalReturn * 100}%
Available Cash: ${availableCash}
Current Account Value: ${totalCashValue}
Positions: ${positions
    .map((position) =>
      JSON.stringify({
        symbol: position.symbol,
        quantity: position.contracts,
        entry_price: position.entryPrice,
        current_price: position.markPrice,
        liquidation_price: position.liquidationPrice,
        unrealized_pnl: position.unrealizedPnl,
        leverage: position.leverage,
        notional_usd: position.notional,
        side: position.side,
        stopLoss: position.stopLossPrice,
        takeProfit: position.takeProfitPrice,
      })
    )
    .join("\n")}`;
  return output;
}
