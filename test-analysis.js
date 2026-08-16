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

    console.log('🎯 Advanced patterns:', result.advancedPatterns ? 'Present' : 'Missing');
    if (result.advancedPatterns) {
      console.log('   - Candlestick patterns count:', result.advancedPatterns.candlestick?.length || 0);
      console.log('   - Chart patterns count:', result.advancedPatterns.chart?.length || 0);
      console.log('   - Harmonic patterns count:', result.advancedPatterns.harmonic?.length || 0);
      console.log('   - SMC concepts count:', result.advancedPatterns.smartMoney?.length || 0);
      console.log('   - Divergences count:', result.advancedPatterns.divergences?.length || 0);
    }

    console.log('📊 MTF analysis:', result.mtf ? 'Present' : 'Missing');
    if (result.mtf) {
      console.log('   - Confluence direction:', result.mtf.confluenceScore?.direction || 'N/A');
      console.log('   - Confluence score:', result.mtf.confluenceScore?.score || 'N/A');
      console.log('   - Recommendation action:', result.mtf.recommendation?.action || 'N/A');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

testAnalysis();
