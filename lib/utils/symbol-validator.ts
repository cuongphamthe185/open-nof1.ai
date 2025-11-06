import { Symbol } from "@prisma/client";

/**
 * List of supported trading symbols
 */
export const SUPPORTED_SYMBOLS = ["BTC", "ETH", "SOL", "BNB", "DOGE"] as const;

/**
 * Validate and normalize a trading symbol
 * @param symbol - Input symbol (case-insensitive)
 * @returns Validated Symbol enum value
 * @throws Error if symbol is invalid
 */
export function validateSymbol(symbol?: string): Symbol {
  const normalizedSymbol = (symbol || "BTC").toUpperCase();
  
  if (!SUPPORTED_SYMBOLS.includes(normalizedSymbol as any)) {
    throw new Error(
      `Invalid symbol '${symbol}'. Must be one of: ${SUPPORTED_SYMBOLS.join(", ")}`
    );
  }
  
  return normalizedSymbol as Symbol;
}

/**
 * Convert symbol to trading pair format (COIN/USDT)
 * @param symbol - Symbol enum value
 * @returns Trading pair string (e.g., "BTC/USDT")
 */
export function symbolToTradingPair(symbol: Symbol): string {
  return `${symbol}/USDT`;
}

/**
 * Extract symbol from trading pair
 * @param tradingPair - Trading pair (e.g., "BTC/USDT")
 * @returns Symbol enum value
 */
export function tradingPairToSymbol(tradingPair: string): Symbol {
  const symbol = tradingPair.split("/")[0].toUpperCase();
  return validateSymbol(symbol);
}
