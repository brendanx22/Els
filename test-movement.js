const { MovementAnalyzer } = require('./trading/newsAnalysis');
const analyzer = new MovementAnalyzer();

// Create 100 mock candles with realistic data
const mockCandles = Array.from({length: 100}, (_, i) => {
  const basePrice = 1.08;
  const variation = Math.sin(i * 0.1) * 0.01 + Math.random() * 0.005;
  const close = basePrice + variation;
  
  return {
    time: `2024-01-${String(i+1).padStart(2, '0')}`,
    open: close + (Math.random() - 0.5) * 0.002,
    high: close + Math.random() * 0.003,
    low: close - Math.random() * 0.003,
    close: close
  };
});

const result = analyzer.analyzeHistoricalMovements(mockCandles, 'EURUSD', '1h');

console.log('✅ Movement analysis with 100 candles:');
console.log('📈 Trend:', result.trend?.direction, result.trend?.strength);
console.log('📈 Volatility:', result.volatility?.volatilityIndex);
console.log('📈 Momentum:', result.momentum?.direction, result.momentum?.strength);
console.log('📈 Patterns:', result.patterns?.length, 'detected');
console.log('📈 Support/Resistance:', result.supportResistance?.support?.length || 0, 'support', result.supportResistance?.resistance?.length || 0, 'resistance');
