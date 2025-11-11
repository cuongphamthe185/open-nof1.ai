/**
 * Support/Resistance data fetcher for AI
 * Retrieves latest S/R levels from database to enhance trading decisions
 */

import { prisma } from '../prisma';
import type { Symbol } from '../trading/algorithms/config';

export interface SRLevels {
  '15m'?: {
    support1: number;
    support1Strength: number;
    support2?: number;
    support2Strength?: number;
    resistance1: number;
    resistance1Strength: number;
    resistance2?: number;
    resistance2Strength?: number;
    currentPrice: number;
    calculatedAt: Date;
  };
  '1h'?: {
    support1: number;
    support1Strength: number;
    support2?: number;
    support2Strength?: number;
    resistance1: number;
    resistance1Strength: number;
    resistance2?: number;
    resistance2Strength?: number;
    currentPrice: number;
    calculatedAt: Date;
  };
  '4h'?: {
    support1: number;
    support1Strength: number;
    support2?: number;
    support2Strength?: number;
    resistance1: number;
    resistance1Strength: number;
    resistance2?: number;
    resistance2Strength?: number;
    currentPrice: number;
    calculatedAt: Date;
  };
}

/**
 * Get latest S/R levels for a symbol across all timeframes
 * 
 * Note: With unified cron schedule (every 10 min), all timeframes are calculated
 * together, ensuring consistent timestamps and no stale data concerns.
 */
export async function getLatestSupportResistance(
  symbol: Symbol
): Promise<SRLevels> {
  const timeframes = ['15m', '1h', '4h'];
  const result: SRLevels = {};

  for (const timeframe of timeframes) {
    const latest = await prisma.supportResistanceLevel.findFirst({
      where: {
        symbol,
        timeframe,
        validUntil: {
          gt: new Date(),  // Only fetch valid (not expired) levels
        },
      },
      orderBy: {
        calculatedAt: 'desc',  // Latest calculation first
      },
    });

    if (latest) {
      result[timeframe as '15m' | '1h' | '4h'] = {
        support1: Number(latest.support1),
        support1Strength: latest.support1Strength,
        support2: latest.support2 ? Number(latest.support2) : undefined,
        support2Strength: latest.support2Strength ?? undefined,
        resistance1: Number(latest.resistance1),
        resistance1Strength: latest.resistance1Strength,
        resistance2: latest.resistance2 ? Number(latest.resistance2) : undefined,
        resistance2Strength: latest.resistance2Strength ?? undefined,
        currentPrice: Number(latest.currentPrice),
        calculatedAt: latest.calculatedAt,
      };
    }
  }

  return result;
}

/**
 * Format S/R levels as text for AI prompt
 */
export function formatSRForAI(symbol: Symbol, srLevels: SRLevels): string {
  const lines: string[] = [];

  lines.push('═══════════════════════════════════════════════════════════');
  lines.push(`📊 SUPPORT & RESISTANCE ANALYSIS FOR ${symbol}`);
  lines.push('═══════════════════════════════════════════════════════════\n');

  // 15m timeframe
  if (srLevels['15m']) {
    const tf = srLevels['15m'];
    lines.push('⏱️  15-MINUTE TIMEFRAME (Primary Trading):');
    lines.push(`   Current Price: $${tf.currentPrice.toFixed(2)}`);
    lines.push(`   🟢 Strong Support:  $${tf.support1.toFixed(2)} (Strength: ${tf.support1Strength}/10)`);
    if (tf.support2) {
      lines.push(`   🟢 Support Level 2: $${tf.support2.toFixed(2)} (Strength: ${tf.support2Strength}/10)`);
    }
    lines.push(`   🔴 Resistance:      $${tf.resistance1.toFixed(2)} (Strength: ${tf.resistance1Strength}/10)`);
    if (tf.resistance2) {
      lines.push(`   🔴 Resistance 2:    $${tf.resistance2.toFixed(2)} (Strength: ${tf.resistance2Strength}/10)`);
    }
    lines.push('');
  } else {
    lines.push('⏱️  15-MINUTE TIMEFRAME: No data available\n');
  }

  // 1h timeframe
  if (srLevels['1h']) {
    const tf = srLevels['1h'];
    lines.push('⏱️  1-HOUR TIMEFRAME (Trend Filter):');
    lines.push(`   Current Price: $${tf.currentPrice.toFixed(2)}`);
    lines.push(`   🟢 Support:    $${tf.support1.toFixed(2)} (Strength: ${tf.support1Strength}/10)`);
    if (tf.support2) {
      lines.push(`   🟢 Support 2:  $${tf.support2.toFixed(2)} (Strength: ${tf.support2Strength}/10)`);
    }
    lines.push(`   🔴 Resistance: $${tf.resistance1.toFixed(2)} (Strength: ${tf.resistance1Strength}/10)`);
    if (tf.resistance2) {
      lines.push(`   🔴 Resistance 2: $${tf.resistance2.toFixed(2)} (Strength: ${tf.resistance2Strength}/10)`);
    }
    lines.push('');
  } else {
    lines.push('⏱️  1-HOUR TIMEFRAME: No data available\n');
  }

  // 4h timeframe
  if (srLevels['4h']) {
    const tf = srLevels['4h'];
    lines.push('⏱️  4-HOUR TIMEFRAME (Big Picture):');
    lines.push(`   Current Price: $${tf.currentPrice.toFixed(2)}`);
    lines.push(`   🟢 Major Support:    $${tf.support1.toFixed(2)} (Strength: ${tf.support1Strength}/10)`);
    if (tf.support2) {
      lines.push(`   🟢 Support 2:        $${tf.support2.toFixed(2)} (Strength: ${tf.support2Strength}/10)`);
    }
    lines.push(`   🔴 Major Resistance: $${tf.resistance1.toFixed(2)} (Strength: ${tf.resistance1Strength}/10)`);
    if (tf.resistance2) {
      lines.push(`   🔴 Resistance 2:     $${tf.resistance2.toFixed(2)} (Strength: ${tf.resistance2Strength}/10)`);
    }
    lines.push('');
  } else {
    lines.push('⏱️  4-HOUR TIMEFRAME: No data available\n');
  }

  // Trading guidelines
  lines.push('💡 TRADING GUIDELINES:');
  lines.push('');
  
  if (srLevels['15m'] && srLevels['1h'] && srLevels['4h']) {
    const price15m = srLevels['15m'].currentPrice;
    const support15m = srLevels['15m'].support1;
    const resistance15m = srLevels['15m'].resistance1;
    const support1h = srLevels['1h'].support1;
    const resistance1h = srLevels['1h'].resistance1;
    const support4h = srLevels['4h'].support1;
    const resistance4h = srLevels['4h'].resistance1;

    lines.push('   🎯 BUY Signal Conditions:');
    lines.push(`      ✓ Price near 15m support ($${support15m.toFixed(2)})`);
    lines.push(`      ✓ Price above 1h support ($${support1h.toFixed(2)})`);
    lines.push(`      ✓ Price above 4h support ($${support4h.toFixed(2)})`);
    lines.push('      → High probability long position\n');

    lines.push('   🎯 SELL Signal Conditions:');
    lines.push(`      ✓ Price near 15m resistance ($${resistance15m.toFixed(2)})`);
    lines.push(`      ✓ Price below 1h resistance ($${resistance1h.toFixed(2)})`);
    lines.push(`      ✓ Price below 4h resistance ($${resistance4h.toFixed(2)})`);
    lines.push('      → High probability short/exit position\n');

    lines.push('   ⚠️  Risk Management:');
    lines.push(`      • Set stop-loss below nearest strong support`);
    lines.push(`      • Set take-profit near nearest strong resistance`);
    lines.push(`      • Increase position size near 4h strong support (9-10 strength)`);
    lines.push(`      • Reduce position size in middle of range`);
  } else {
    lines.push('   ⚠️  Insufficient data for detailed guidelines');
    lines.push('   • Wait for S/R calculations to complete');
    lines.push('   • Use general technical analysis meanwhile');
  }

  lines.push('');
  lines.push('═══════════════════════════════════════════════════════════\n');

  return lines.join('\n');
}
