import { prisma } from '../lib/prisma';

async function checkTimezone() {
  try {
    const result = await prisma.$queryRaw`SELECT NOW() as db_time, current_setting('TIMEZONE') as timezone`;
    console.log('PostgreSQL timezone:', result);
    
    const testRecord = await prisma.supportResistanceLevel.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { 
        calculatedAt: true, 
        validUntil: true, 
        createdAt: true,
        symbol: true,
        timeframe: true,
      },
    });
    
    console.log('\n=== Latest S/R Record ===');
    console.log('Symbol:', testRecord?.symbol);
    console.log('Timeframe:', testRecord?.timeframe);
    console.log('calculatedAt:', testRecord?.calculatedAt);
    console.log('validUntil:', testRecord?.validUntil);
    console.log('createdAt:', testRecord?.createdAt);
    
    console.log('\n=== Node.js Timezone ===');
    console.log('Current time:', new Date().toString());
    console.log('UTC:', new Date().toISOString());
    console.log('Offset:', new Date().getTimezoneOffset(), 'minutes');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTimezone();
