const { analyzeCandles } = require('./trading/analysis');
const { fetchMarketData } = require('./trading/marketData');

async function testAnalysis() {
  try {
    console.log('🔄 Fetching market data...');
    const market = await fetchMarketData('EURUSD', '1h');
    
    console.log('📊 Analyzing candles...');
    const result = await analyzeCandles(market.candles, {
      symbol: 'EURUSD', 
      timeframe: '1h'
    });
    
    console.log('✅ Analysis complete!');
    console.log('📰 News data:', result.news ? 'Present' : 'Missing');
    console.log('📈 Movement data:', result.movements ? 'Present' : 'Missing');
    
    if (result.news) {
      console.log('📰 News sentiment:', result.news.sentiment?.overall || 'N/A');
      console.log('📰 News impact:', result.news.impact || 'N/A');
      console.log('📰 Articles found:', result.news.totalArticles || 0);
    }
    
    if (result.movements) {
      console.log('📈 Movement trend:', result.movements.trend?.direction || 'N/A');
      console.log('📈 Movement volatility:', result.movements.volatility?.volatilityIndex || 'N/A');
      console.log('📈 Movement patterns:', result.movements.patterns?.length || 0);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

testAnalysis();
