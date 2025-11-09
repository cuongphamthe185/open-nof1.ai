#!/usr/bin/env tsx
/**
 * Monitor Support/Resistance calculation system
 * Shows last calculation times and system health
 * Usage: npx tsx scripts/monitor-sr-system.ts
 */

import { prisma } from '../lib/prisma';

async function monitorSRSystem() {
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('📊 Support/Resistance System Monitor');
  console.log('═══════════════════════════════════════════════════════════\n');

  const symbols = ['BTC', 'BNB'];
  const timeframes = ['15m', '1h', '4h'];
  const now = new Date();

  try {
    for (const symbol of symbols) {
      console.log(`\n💰 ${symbol}:`);
      console.log('─'.repeat(60));

      for (const timeframe of timeframes) {
        const latest = await prisma.supportResistanceLevel.findFirst({
          where: { symbol, timeframe },
          orderBy: { calculatedAt: 'desc' },
        });

        if (latest) {
          const age = Math.floor((now.getTime() - latest.calculatedAt.getTime()) / 60000);
          const isValid = latest.validUntil > now;
          const status = isValid ? '✅' : '⏰';
          
          console.log(`${status} ${timeframe.padEnd(5)} | Last calculated: ${age} minutes ago`);
          console.log(`       | Support: $${Number(latest.support1).toFixed(2)} (${latest.support1Strength}/10)`);
          console.log(`       | Resistance: $${Number(latest.resistance1).toFixed(2)} (${latest.resistance1Strength}/10)`);
          console.log(`       | Valid until: ${latest.validUntil.toISOString()}`);
        } else {
          console.log(`❌ ${timeframe.padEnd(5)} | No data found`);
        }
      }
    }

    // Calculate total records
    const totalRecords = await prisma.supportResistanceLevel.count();
    const validRecords = await prisma.supportResistanceLevel.count({
      where: { validUntil: { gt: now } },
    });

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('📈 System Statistics:');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`Total records in database: ${totalRecords}`);
    console.log(`Currently valid records: ${validRecords}`);
    console.log(`Expired records: ${totalRecords - validRecords}`);

    // Check oldest and newest records
    const oldest = await prisma.supportResistanceLevel.findFirst({
      orderBy: { calculatedAt: 'asc' },
    });
    const newest = await prisma.supportResistanceLevel.findFirst({
      orderBy: { calculatedAt: 'desc' },
    });

    if (oldest && newest) {
      const dataAge = Math.floor((newest.calculatedAt.getTime() - oldest.calculatedAt.getTime()) / (24 * 60 * 60 * 1000));
      console.log(`Data range: ${dataAge} days`);
      console.log(`Oldest record: ${oldest.calculatedAt.toISOString()}`);
      console.log(`Newest record: ${newest.calculatedAt.toISOString()}`);
    }

    console.log('\n✅ Monitor complete\n');

  } catch (error: any) {
    console.error(`\n❌ Error: ${error.message}\n`);
    process.exit(1);
  }
}

monitorSRSystem();
