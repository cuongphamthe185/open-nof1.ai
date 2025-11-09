import { generateObject } from "ai";
import { generateUserPrompt, tradingPrompt } from "./prompt";
import { getCurrentMarketState } from "../trading/current-market-state";
import { z } from "zod";
import { deepseek } from "./model"; // ✅ CHANGED: Dùng deepseek-chat (tiết kiệm)
import { getAccountInformationAndPerformance } from "../trading/account-information-and-performance";
import { prisma } from "../prisma";
import { Opeartion, Symbol } from "@prisma/client";

/**
 * Run AI trading analysis for a specific symbol
 */
async function runForSymbol(
  symbol: 'BTC' | 'BNB',
  initialCapital: number,
  invocationCount: number,
  startTime: Date
) {
  const tradingPair = `${symbol}/USDT`;
  
  console.log(`\n[AI Trading] Analyzing ${symbol}...`);
  
  const currentMarketState = await getCurrentMarketState(tradingPair);
  const accountInformationAndPerformance =
    await getAccountInformationAndPerformance(initialCapital);

  const userPrompt = await generateUserPrompt({
    currentMarketState,
    accountInformationAndPerformance,
    startTime,
    invocationCount,
    symbol,
  });

  console.log(`[AI Trading] Calling DeepSeek for ${symbol}...`);
  
  let object: any;
  let rawResponse: any;
  try {
    const result = await generateObject({
      model: deepseek,
      system: tradingPrompt,
      prompt: userPrompt,
      output: "object",
      mode: "json",
      schema: z.object({
        operation: z.enum(['Buy', 'Sell', 'Hold']).describe("Trading operation: Buy, Sell, or Hold"),
        buy: z
          .object({
            pricing: z.number().describe("The pricing of you want to buy in."),
            amount: z.number(),
            leverage: z.number().min(1).max(20),
          })
          .optional()
          .describe("If operation is Buy, generate object"),
        sell: z
          .object({
            percentage: z
              .number()
              .min(0)
              .max(100)
              .describe("Percentage of position to sell"),
          })
          .optional()
          .describe("If operation is Sell, generate object"),
        adjustProfit: z
          .object({
            stopLoss: z
              .number()
              .optional()
              .describe("The stop loss of you want to set."),
            takeProfit: z
              .number()
              .optional()
              .describe("The take profit of you want to set."),
          })
          .optional()
          .describe(
            "If operation is Hold and you want to adjust the profit, generate object"
          ),
        chat: z
          .string()
          .describe(
            "Brief summary of your decision (max 200 chars). Example: Price between S/R levels. Confluence 4/10 < required 7/10. WAIT for clear entry."
          ),
        // Accept additional analysis fields from AI
        confluenceScore: z.number().optional(),
        riskRewardRatio: z.number().optional(),
        priceAtLevel: z.boolean().optional(),
        reasoning: z.any().optional(),
      }),
    });
    
    rawResponse = result.object;
    
    // Map "operation" (correct) to "opeartion" (DB typo)
    object = {
      opeartion: rawResponse.operation as 'Buy' | 'Sell' | 'Hold',
      buy: rawResponse.buy,
      sell: rawResponse.sell,
      adjustProfit: rawResponse.adjustProfit,
      chat: rawResponse.chat,
      // Store analysis in chat for reference
      fullAnalysis: rawResponse.reasoning ? JSON.stringify(rawResponse.reasoning) : undefined,
    };
    
    console.log(`[AI Trading] ✅ DeepSeek response received for ${symbol}:`);
    console.log(`  Operation: ${object.opeartion}`);
    console.log(`  Confluence: ${rawResponse.confluenceScore}/10`);
    console.log(`  R:R Ratio: ${rawResponse.riskRewardRatio}`);
    console.log(`  Chat: ${object.chat.substring(0, 100)}...`);
  } catch (error: any) {
    console.error(`[AI Trading] ❌ DeepSeek API error for ${symbol}:`, error.message);
    console.error(`[AI Trading] Error details:`, JSON.stringify({
      name: error.name,
      message: error.message,
      cause: error.cause,
      stack: error.stack?.split('\n').slice(0, 5).join('\n')
    }, null, 2));
    throw error;
  }  // Map symbol string to Prisma enum
  const prismaSymbol = symbol === 'BTC' ? Symbol.BTC : Symbol.BNB;

  if (object.opeartion === Opeartion.Buy) {
    await prisma.chat.create({
      data: {
        reasoning: object.chat || "<no reasoning>",
        chat: object.chat || "<no chat>",
        userPrompt,
        tradings: {
          createMany: {
            data: {
              symbol: prismaSymbol,
              opeartion: object.opeartion,
              pricing: object.buy?.pricing,
              amount: object.buy?.amount,
              leverage: object.buy?.leverage,
            },
          },
        },
      },
    });
  }

  if (object.opeartion === Opeartion.Sell) {
    await prisma.chat.create({
      data: {
        reasoning: object.chat || "<no reasoning>",
        chat: object.chat || "<no chat>",
        userPrompt,
        tradings: {
          createMany: {
            data: {
              symbol: prismaSymbol,
              opeartion: object.opeartion,
            },
          },
        },
      },
    });
  }

  if (object.opeartion === Opeartion.Hold) {
    const shouldAdjustProfit =
      object.adjustProfit?.stopLoss && object.adjustProfit?.takeProfit;
    await prisma.chat.create({
      data: {
        reasoning: object.chat || "<no reasoning>",
        chat: object.chat || "<no chat>",
        userPrompt,
        tradings: {
          createMany: {
            data: {
              symbol: prismaSymbol,
              opeartion: object.opeartion,
              stopLoss: shouldAdjustProfit
                ? object.adjustProfit?.stopLoss
                : undefined,
              takeProfit: shouldAdjustProfit
                ? object.adjustProfit?.takeProfit
                : undefined,
            },
          },
        },
      },
    });
  }

  console.log(`[AI Trading] ✅ ${symbol} analysis complete: ${object.opeartion}`);
  return object;
}

/**
 * Main function: Run AI trading for all symbols
 */
export async function run(initialCapital: number) {
  const startTime = new Date();
  const invocationCount = await prisma.chat.count();
  
  console.log(`\n${'='.repeat(60)}`);
  console.log(`[AI Trading] Starting analysis for BTC + BNB`);
  console.log(`[AI Trading] Invocation #${invocationCount + 1}`);
  console.log(`${'='.repeat(60)}`);

  try {
    // Run both symbols in parallel for efficiency
    const [btcResult, bnbResult] = await Promise.all([
      runForSymbol('BTC', initialCapital, invocationCount, startTime),
      runForSymbol('BNB', initialCapital, invocationCount, startTime),
    ]);

    console.log(`\n${'='.repeat(60)}`);
    console.log(`[AI Trading] ✅ Completed`);
    console.log(`  BTC: ${btcResult.opeartion}`);
    console.log(`  BNB: ${bnbResult.opeartion}`);
    console.log(`${'='.repeat(60)}\n`);

    return { btc: btcResult, bnb: bnbResult };
  } catch (error) {
    console.error(`[AI Trading] ❌ Error:`, error);
    throw error;
  }
}
