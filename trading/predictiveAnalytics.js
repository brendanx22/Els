/**
 * Predictive Analytics Engine
 * Forecasts price movements, volatility, and trend changes
 */
class PredictiveAnalytics {
  constructor() {
    this.models = new Map();
    this.forecastCache = new Map();
    this.cacheTtl = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Generate comprehensive forecast
   */
  async generateForecast(candles, symbol, timeframe, newsData = null, movementData = null) {
    const cacheKey = `${symbol}-${timeframe}-forecast`;
    const cached = this.forecastCache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp) < this.cacheTtl) {
      return cached.data;
    }

    const closes = candles.map(c => c.close);
    const highs = candles.map(c => c.high);
    const lows = candles.map(c => c.low);
    const volumes = candles.map(c => c.volume || 0);

    const forecast = {
      symbol,
      timeframe,
      timestamp: new Date().toISOString(),
      price: this.predictPriceMovement(closes, highs, lows, volumes),
      volatility: this.predictVolatility(closes, volumes),
      trend: this.predictTrendDirection(closes, volumes),
      supportResistance: this.predictSupportResistanceLevels(closes, highs, lows),
      probabilities: this.calculateOutcomeProbabilities(closes, newsData, movementData),
      scenarios: this.generateScenarios(closes, newsData, movementData),
      confidence: 0,
      timeHorizons: {
        short: this.forecastForHorizon(closes, 5),    // Next 5 candles
        medium: this.forecastForHorizon(closes, 20),  // Next 20 candles
        long: this.forecastForHorizon(closes, 50)     // Next 50 candles
      }
    };

    // Calculate overall confidence
    forecast.confidence = this.calculateForecastConfidence(forecast);

    // Cache result
    this.forecastCache.set(cacheKey, {
      data: forecast,
      timestamp: Date.now()
    });

    return forecast;
  }

  /**
   * Predict price movement
   */
  predictPriceMovement(closes, highs, lows, volumes) {
    const len = closes.length;
    
    // Calculate trend components
    const sma20 = this.calculateSMA(closes, 20);
    const sma50 = this.calculateSMA(closes, 50);
    const ema12 = this.calculateEMA(closes, 12);
    const ema26 = this.calculateEMA(closes, 26);

    const currentPrice = closes[closes.length - 1];
    const prevPrice = closes[closes.length - 2];

    // Momentum analysis
    const momentum = this.calculateMomentum(closes, 10);
    const momentumChange = momentum[momentum.length - 1] - momentum[momentum.length - 5];

    // Volume analysis
    const volumeTrend = this.analyzeVolumeTrend(volumes);

    // Predict next moves
    const predictions = {
      next1h: { target: 0, confidence: 0 },
      next4h: { target: 0, confidence: 0 },
      next1d: { target: 0, confidence: 0 },
      next1w: { target: 0, confidence: 0 }
    };

    // Simple linear regression for short term
    const recent = closes.slice(-20);
    const regression = this.linearRegression(recent);
    
    predictions.next1h.target = currentPrice + regression.slope * 1;
    predictions.next4h.target = currentPrice + regression.slope * 4;
    predictions.next1d.target = currentPrice + regression.slope * 24;
    predictions.next1w.target = currentPrice + regression.slope * 120;

    // Adjust based on momentum
    const momentumFactor = momentumChange > 0 ? 1.02 : momentumChange < 0 ? 0.98 : 1;
    for (const key in predictions) {
      predictions[key].target *= momentumFactor;
      predictions[key].changePercent = ((predictions[key].target - currentPrice) / currentPrice) * 100;
    }

    // Calculate confidence based on volatility
    const volatility = this.calculateVolatility(closes);
    const confidence = Math.max(0.3, 0.9 - (volatility / 100));
    
    for (const key in predictions) {
      predictions[key].confidence = confidence;
    }

    return {
      current: currentPrice,
      previous: prevPrice,
      change24h: ((currentPrice - closes[closes.length - 24]) / closes[closes.length - 24]) * 100,
      predictions,
      momentum: momentum[momentum.length - 1],
      volume: volumeTrend,
      regression: {
        slope: regression.slope,
        r2: regression.r2
      }
    };
  }

  /**
   * Predict volatility
   */
  predictVolatility(closes, volumes) {
    // Calculate historical volatility
    const returns = [];
    for (let i = 1; i < closes.length; i++) {
      returns.push((closes[i] - closes[i-1]) / closes[i-1]);
    }

    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
    const currentVolatility = Math.sqrt(variance) * Math.sqrt(365) * 100; // Annualized

    // Predict future volatility using GARCH-like approach
    const recentReturns = returns.slice(-20);
    const recentVariance = recentReturns.reduce((sum, r) => sum + r * r, 0) / recentReturns.length;
    
    // EWMA (Exponentially Weighted Moving Average)
    const lambda = 0.94;
    let ewmaVariance = recentVariance;
    for (let i = recentReturns.length - 1; i >= 0; i--) {
      ewmaVariance = lambda * ewmaVariance + (1 - lambda) * recentReturns[i] * recentReturns[i];
    }

    const predictedVolatility = Math.sqrt(ewmaVariance) * Math.sqrt(365) * 100;

    // Volatility regime
    let regime;
    if (predictedVolatility < 20) regime = 'low';
    else if (predictedVolatility < 40) regime = 'moderate';
    else if (predictedVolatility < 60) regime = 'high';
    else regime = 'extreme';

    // Volatility forecast
    const forecast = {
      current: currentVolatility,
      predicted: predictedVolatility,
      regime,
      change: ((predictedVolatility - currentVolatility) / currentVolatility) * 100,
      breakoutProbability: this.calculateBreakoutProbability(closes, predictedVolatility),
      timeToEvent: this.estimateTimeToVolatilityEvent(closes, volumes)
    };

    return forecast;
  }

  /**
   * Predict trend direction
   */
  predictTrendDirection(closes, volumes) {
    const len = closes.length;
    
    // Multiple timeframe analysis
    const shortTerm = this.analyzeTrend(closes.slice(-10));
    const mediumTerm = this.analyzeTrend(closes.slice(-30));
    const longTerm = this.analyzeTrend(closes.slice(-90));

    // Trend strength
    const adx = this.calculateADX(closes.slice(-20));
    
    // Moving average alignment
    const sma20 = this.calculateSMA(closes, 20);
    const sma50 = this.calculateSMA(closes, 50);
    const current = closes[closes.length - 1];
    
    const maAlignment = current > sma20[sma20.length - 1] && 
                       sma20[sma20.length - 1] > sma50[sma50.length - 1] ? 'bullish' :
                       current < sma20[sma20.length - 1] && 
                       sma20[sma20.length - 1] < sma50[sma50.length - 1] ? 'bearish' : 'neutral';

    // Trend prediction
    const predictions = {
      direction: this.combineTrendSignals([shortTerm, mediumTerm, longTerm]),
      strength: adx[adx.length - 1] > 25 ? 'strong' : adx[adx.length - 1] > 15 ? 'moderate' : 'weak',
      alignment: maAlignment,
      continuity: this.predictTrendContinuation(closes, volumes),
      reversalProbability: this.calculateReversalProbability(closes),
      timeframe: {
        short: shortTerm,
        medium: mediumTerm,
        long: longTerm
      }
    };

    return predictions;
  }

  /**
   * Predict support and resistance levels
   */
  predictSupportResistanceLevels(closes, highs, lows) {
    // Find significant levels
    const levels = [];
    
    // Pivot points
    const pivots = this.findPivotPoints(closes, highs, lows);
    
    // Psychological levels (round numbers)
    const current = closes[closes.length - 1];
    const magnitude = Math.pow(10, Math.floor(Math.log10(current)));
    const psychLevels = [
      Math.floor(current / magnitude) * magnitude,
      Math.ceil(current / magnitude) * magnitude,
      Math.floor(current / (magnitude / 10)) * (magnitude / 10),
      Math.ceil(current / (magnitude / 10)) * (magnitude / 10)
    ];

    // VWAP
    const vwap = this.calculateVWAP(closes, highs, lows);

    // Combine all levels
    const allLevels = [...pivots, ...psychLevels.filter(p => p > 0), vwap];
    
    // Score levels by touch frequency
    for (const level of allLevels) {
      const touches = this.countLevelTouches(level, closes, highs, lows);
      const strength = touches.count * (1 + touches.recency);
      
      levels.push({
        price: level,
        type: level > current ? 'resistance' : 'support',
        strength: strength,
        touches: touches.count,
        tested: touches.recent,
        probability: this.calculateLevelTestProbability(level, current, closes)
      });
    }

    // Sort by strength and remove duplicates
    levels.sort((a, b) => b.strength - a.strength);
    const uniqueLevels = [];
    for (const level of levels) {
      if (!uniqueLevels.some(l => Math.abs(l.price - level.price) / level.price < 0.005)) {
        uniqueLevels.push(level);
      }
    }

    return {
      current,
      levels: uniqueLevels.slice(0, 10),
      nearestSupport: uniqueLevels.filter(l => l.type === 'support')[0] || null,
      nearestResistance: uniqueLevels.filter(l => l.type === 'resistance')[0] || null,
      range: {
        high: Math.max(...highs.slice(-20)),
        low: Math.min(...lows.slice(-20)),
        width: Math.max(...highs.slice(-20)) - Math.min(...lows.slice(-20))
      }
    };
  }

  /**
   * Calculate outcome probabilities
   */
  calculateOutcomeProbabilities(closes, newsData = null, movementData = null) {
    const current = closes[closes.length - 1];
    
    // Historical probability calculation
    const bullCount = closes.filter((c, i) => i > 0 && c > closes[i-1]).length;
    const bearCount = closes.filter((c, i) => i > 0 && c < closes[i-1]).length;
    const total = bullCount + bearCount;
    
    let bullishProb = total > 0 ? (bullCount / total) * 100 : 50;
    let bearishProb = total > 0 ? (bearCount / total) * 100 : 50;
    let sidewaysProb = 0;

    // Adjust based on news sentiment
    if (newsData && newsData.sentiment) {
      const sentimentScore = newsData.sentiment.score;
      if (sentimentScore > 30) {
        bullishProb += 15;
        bearishProb -= 10;
      } else if (sentimentScore < -30) {
        bearishProb += 15;
        bullishProb -= 10;
      }
    }

    // Adjust based on movement analysis
    if (movementData) {
      if (movementData.trend?.direction === 'bullish') {
        bullishProb += 10;
        bearishProb -= 5;
      } else if (movementData.trend?.direction === 'bearish') {
        bearishProb += 10;
        bullishProb -= 5;
      }

      if (movementData.momentum?.direction === 'bullish') {
        bullishProb += 5;
      } else if (movementData.momentum?.direction === 'bearish') {
        bearishProb += 5;
      }
    }

    // Normalize probabilities
    const totalProb = bullishProb + bearishProb;
    bullishProb = (bullishProb / totalProb) * 100;
    bearishProb = (bearishProb / totalProb) * 100;
    sidewaysProb = 100 - bullishProb - bearishProb;

    return {
      bullish: Math.round(bullishProb * 10) / 10,
      bearish: Math.round(bearishProb * 10) / 10,
      sideways: Math.round(sidewaysProb * 10) / 10,
      breakoutUp: Math.round(bullishProb * 0.3 * 10) / 10,
      breakoutDown: Math.round(bearishProb * 0.3 * 10) / 10,
      rangeBound: Math.round(sidewaysProb * 10) / 10
    };
  }

  /**
   * Generate price scenarios
   */
  generateScenarios(closes, newsData = null, movementData = null) {
    const current = closes[closes.length - 1];
    const volatility = this.calculateVolatility(closes) / 100;
    
    // Bullish scenario
    const bullishTarget = current * (1 + volatility * 2);
    
    // Bearish scenario
    const bearishTarget = current * (1 - volatility * 2);
    
    // Base case
    const baseTarget = current;

    // News-adjusted scenarios
    let newsAdjustment = 0;
    if (newsData && newsData.impact) {
      newsAdjustment = newsData.impact.level === 'high' ? 0.02 : 
                      newsData.impact.level === 'medium' ? 0.01 : 0;
      if (newsData.sentiment?.overall === 'negative') newsAdjustment *= -1;
    }

    return {
      bullish: {
        target: bullishTarget * (1 + newsAdjustment),
        probability: 25,
        timeframe: '1-3 days',
        catalyst: 'Positive news + momentum continuation',
        risk: volatility * 100
      },
      bearish: {
        target: bearishTarget * (1 - newsAdjustment),
        probability: 25,
        timeframe: '1-3 days',
        catalyst: 'Negative sentiment + breakdown',
        risk: volatility * 100
      },
      base: {
        target: baseTarget,
        probability: 50,
        timeframe: 'Current range',
        catalyst: 'Consolidation within range',
        risk: volatility * 50
      }
    };
  }

  /**
   * Forecast for specific time horizon
   */
  forecastForHorizon(closes, periods) {
    const current = closes[closes.length - 1];
    const recent = closes.slice(-periods);
    
    const regression = this.linearRegression(recent);
    const predicted = current + regression.slope * periods;
    
    const volatility = this.calculateVolatility(closes);
    const confidenceInterval = {
      upper: predicted * (1 + volatility / 100),
      lower: predicted * (1 - volatility / 100)
    };

    return {
      periods,
      current,
      predicted,
      change: ((predicted - current) / current) * 100,
      confidence: Math.max(0.3, 0.9 - (volatility / 100)),
      range: confidenceInterval
    };
  }

  /**
   * Calculate forecast confidence
   */
  calculateForecastConfidence(forecast) {
    const factors = [
      forecast.price.predictions.next1h.confidence,
      forecast.volatility.current < 50 ? 0.8 : 0.5,
      forecast.trend.strength === 'strong' ? 0.9 : forecast.trend.strength === 'moderate' ? 0.7 : 0.5,
      forecast.probabilities.bullish > 60 || forecast.probabilities.bearish > 60 ? 0.8 : 0.6
    ];

    return factors.reduce((a, b) => a + b, 0) / factors.length;
  }

  // ============ HELPER METHODS ============

  calculateSMA(values, period) {
    const sma = [];
    for (let i = period - 1; i < values.length; i++) {
      const sum = values.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
      sma.push(sum / period);
    }
    return sma;
  }

  calculateEMA(values, period) {
    const k = 2 / (period + 1);
    const ema = [values[0]];
    for (let i = 1; i < values.length; i++) {
      ema.push(values[i] * k + ema[i-1] * (1 - k));
    }
    return ema;
  }

  calculateMomentum(values, period) {
    const momentum = [];
    for (let i = period; i < values.length; i++) {
      momentum.push(values[i] - values[i - period]);
    }
    return momentum;
  }

  linearRegression(values) {
    const n = values.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;

    for (let i = 0; i < n; i++) {
      sumX += i;
      sumY += values[i];
      sumXY += i * values[i];
      sumX2 += i * i;
    }

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Calculate R-squared
    const meanY = sumY / n;
    let ssTotal = 0, ssResidual = 0;
    for (let i = 0; i < n; i++) {
      const predicted = slope * i + intercept;
      ssTotal += Math.pow(values[i] - meanY, 2);
      ssResidual += Math.pow(values[i] - predicted, 2);
    }
    const r2 = 1 - (ssResidual / ssTotal);

    return { slope, intercept, r2 };
  }

  analyzeVolumeTrend(volumes) {
    const recent = volumes.slice(-5).reduce((a, b) => a + b, 0) / 5;
    const avg = volumes.slice(-20).reduce((a, b) => a + b, 0) / 20;
    
    if (recent > avg * 1.5) return 'spike';
    if (recent > avg * 1.2) return 'increasing';
    if (recent < avg * 0.8) return 'decreasing';
    return 'stable';
  }

  analyzeTrend(data) {
    const start = data[0];
    const end = data[data.length - 1];
    const change = ((end - start) / start) * 100;
    
    if (change > 2) return 'bullish';
    if (change < -2) return 'bearish';
    return 'sideways';
  }

  combineTrendSignals(signals) {
    const bullishCount = signals.filter(s => s === 'bullish').length;
    const bearishCount = signals.filter(s => s === 'bearish').length;
    
    if (bullishCount > bearishCount) return 'bullish';
    if (bearishCount > bullishCount) return 'bearish';
    return 'sideways';
  }

  calculateVolatility(closes) {
    const returns = [];
    for (let i = 1; i < closes.length; i++) {
      returns.push((closes[i] - closes[i-1]) / closes[i-1]);
    }
    
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
    return Math.sqrt(variance) * 100 * Math.sqrt(365); // Annualized
  }

  calculateADX(closes) {
    // Simplified ADX calculation
    const adx = [];
    for (let i = 1; i < closes.length; i++) {
      const tr = Math.abs(closes[i] - closes[i-1]);
      adx.push(tr);
    }
    return adx;
  }

  findPivotPoints(closes, highs, lows) {
    const pivots = [];
    const current = closes[closes.length - 1];
    
    // Simple pivot calculation
    for (let i = 2; i < highs.length - 2; i++) {
      if (highs[i] > highs[i-1] && highs[i] > highs[i-2] && 
          highs[i] > highs[i+1] && highs[i] > highs[i+2]) {
        pivots.push(highs[i]);
      }
      if (lows[i] < lows[i-1] && lows[i] < lows[i-2] && 
          lows[i] < lows[i+1] && lows[i] < lows[i+2]) {
        pivots.push(lows[i]);
      }
    }
    
    return pivots.filter(p => Math.abs(p - current) / current < 0.1);
  }

  countLevelTouches(level, closes, highs, lows) {
    const tolerance = level * 0.002;
    let count = 0;
    let recent = 0;
    
    for (let i = 0; i < closes.length; i++) {
      if (Math.abs(highs[i] - level) < tolerance || 
          Math.abs(lows[i] - level) < tolerance ||
          Math.abs(closes[i] - level) < tolerance) {
        count++;
        if (i > closes.length - 10) recent++;
      }
    }
    
    return { count, recent: recent / 10 };
  }

  calculateLevelTestProbability(level, current, closes) {
    const distance = Math.abs(level - current) / current;
    const volatility = this.calculateVolatility(closes);
    
    // Higher probability if closer and more volatile
    return Math.min(0.9, (1 - distance) * (volatility / 100) * 2);
  }

  calculateVWAP(closes, highs, lows) {
    let typicalSum = 0;
    let volumeSum = 0;
    
    for (let i = 0; i < closes.length; i++) {
      const typical = (highs[i] + lows[i] + closes[i]) / 3;
      typicalSum += typical;
      volumeSum += 1; // Assuming unit volume if not provided
    }
    
    return typicalSum / volumeSum;
  }

  calculateBreakoutProbability(closes, volatility) {
    const range = Math.max(...closes.slice(-20)) - Math.min(...closes.slice(-20));
    const avgRange = range / 20;
    const currentVolatility = volatility / 100;
    
    return Math.min(0.8, currentVolatility * 2 + (avgRange / closes[closes.length - 1]));
  }

  estimateTimeToVolatilityEvent(closes, volumes) {
    const recentVolatility = this.calculateVolatility(closes.slice(-20));
    const avgVolume = volumes.slice(-20).reduce((a, b) => a + b, 0) / 20;
    const recentVolume = volumes.slice(-5).reduce((a, b) => a + b, 0) / 5;
    
    if (recentVolume > avgVolume * 1.5) {
      return 'imminent (next 1-4 hours)';
    } else if (recentVolatility > 30) {
      return 'soon (next 4-12 hours)';
    } else {
      return 'uncertain (12+ hours)';
    }
  }

  predictTrendContinuation(closes, volumes) {
    const trend = closes[closes.length - 1] > closes[closes.length - 10] ? 'up' : 'down';
    const volumeIncreasing = volumes[volumes.length - 1] > volumes[volumes.length - 5];
    
    if (trend === 'up' && volumeIncreasing) return 'high';
    if (trend === 'down' && volumeIncreasing) return 'high';
    if (trend === 'up' && !volumeIncreasing) return 'moderate';
    if (trend === 'down' && !volumeIncreasing) return 'moderate';
    return 'low';
  }

  calculateReversalProbability(closes) {
    const recent = closes.slice(-10);
    const rsi = this.calculateRSI(closes);
    const currentRSI = rsi[rsi.length - 1];
    
    let prob = 0.3; // Base probability
    
    if (currentRSI > 70) prob += 0.2;
    if (currentRSI < 30) prob += 0.2;
    
    // Check for divergence
    const priceTrend = recent[recent.length - 1] > recent[0] ? 'up' : 'down';
    const rsiTrend = currentRSI > rsi[rsi.length - 5] ? 'up' : 'down';
    
    if (priceTrend !== rsiTrend) prob += 0.2;
    
    return Math.min(0.9, prob);
  }

  calculateRSI(closes, period = 14) {
    const rsi = [];
    let gains = 0, losses = 0;

    for (let i = 1; i <= period; i++) {
      const change = closes[i] - closes[i-1];
      if (change > 0) gains += change;
      else losses += Math.abs(change);
    }

    let avgGain = gains / period;
    let avgLoss = losses / period;

    for (let i = period + 1; i < closes.length; i++) {
      const change = closes[i] - closes[i-1];
      const gain = change > 0 ? change : 0;
      const loss = change < 0 ? Math.abs(change) : 0;

      avgGain = (avgGain * (period - 1) + gain) / period;
      avgLoss = (avgLoss * (period - 1) + loss) / period;

      const rs = avgGain / avgLoss;
      rsi.push(100 - (100 / (1 + rs)));
    }

    return rsi;
  }
}

module.exports = { PredictiveAnalytics };
