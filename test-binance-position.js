// Quick test to see raw Binance position data
require('dotenv').config({ path: '.env.local' });
const ccxt = require('ccxt');

async function testPositions() {
  console.log('Environment check:');
  console.log('- BINANCE_API_KEY:', process.env.BINANCE_API_KEY ? 'SET' : 'NOT SET');
  console.log('- BINANCE_API_SECRET:', process.env.BINANCE_API_SECRET ? 'SET' : 'NOT SET');
  console.log('- BINANCE_USE_SANDBOX:', process.env.BINANCE_USE_SANDBOX);
  console.log('');

  const binance = new ccxt.binance({
    apiKey: process.env.BINANCE_API_KEY,
    secret: process.env.BINANCE_API_SECRET,
    options: {
      defaultType: 'future',
      adjustForTimeDifference: true,
    },
  });

  if (process.env.BINANCE_USE_SANDBOX === 'true') {
    console.log('Using SANDBOX mode');
    binance.setSandboxMode(true);
  } else {
    console.log('Using PRODUCTION mode');
  }

  try {
    console.log('Fetching positions for BNB/USDT...');
    const positions = await binance.fetchPositions(['BNB/USDT']);
    
    console.log('\n=== RAW POSITION DATA ===');
    console.log(JSON.stringify(positions, null, 2));
    
    console.log('\n=== POSITION FIELDS ===');
    if (positions.length > 0) {
      const p = positions[0];
      console.log('id:', p.id);
      console.log('symbol:', p.symbol);
      console.log('contracts:', p.contracts, typeof p.contracts);
      console.log('side:', p.side);
      console.log('info keys:', Object.keys(p.info || {}));
      console.log('info.positionId:', p.info?.positionId);
      console.log('info.positionAmt:', p.info?.positionAmt);
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testPositions();
