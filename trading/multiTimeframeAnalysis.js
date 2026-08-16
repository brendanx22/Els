const { fetchMarketData } = require("./marketData");

/**
 * Multi-Timeframe Analysis System
 * Analyzes multiple timeframes for confluence and divergence
 */
class MultiTimeframeAnalysis {
  constructor() {
    this.timeframes = ['1m', '5m', '15m', '1h', '4h', '1d', '1w'];
    this.analysisCache = new Map();
  }

  /**
   * Analyze all timeframes for a symbol
   */
  async analyzeAllTimeframes(symbol, primaryTimeframe = '1h') {
    const relevantTimeframes = this.getRelevantTimeframes(primaryTimeframe);
    
    const analyses = {};
    const confluence = {
      bullish: [],
      bearish: [],
      neutral: [],
      divergences: []
    };

    // Analyze each timeframe
    for (const tf of relevantTimeframes) {
      try {
        const analysis = await this.fetchTimeframeAnalysis(symbol, tf);
        analyses[tf] = analysis;

        // Categorize signals
        if (analysis.bias === 'bullish') {
          confluence.bullish.push({ timeframe: tf, strength: analysis.confidence });
        } else if (analysis.bias === 'bearish') {
          confluence.bearish.push({ timeframe: tf, strength: analysis.confidence });
        } else {
          confluence.neutral.push({ timeframe: tf });
        }
      } catch (error) {
        console.warn(`Failed to analyze ${symbol} on ${tf}:`, error.message);
      }
    }

    // Detect divergences between timeframes
    confluence.divergences = this.detectDivergences(analyses);

    // Calculate confluence score
    const confluenceScore = this.calculateConfluenceScore(confluence);

    // Attach confluence score and direction to confluence object
    confluence.confluenceScore = confluenceScore;
    confluence.direction = confluenceScore.direction;

    // Find aligned timeframes
    const alignedTimeframes = this.findAlignedTimeframes(analyses);

    // Generate hierarchy analysis
    const hierarchy = this.analyzeHierarchy(analyses);

    return {
      symbol,
      primaryTimeframe,
      analyses,
      confluence,
      confluenceScore,
      alignedTimeframes,
      hierarchy,
      recommendation: this.generateRecommendation(confluence, hierarchy),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get relevant timeframes based on primary
   */
  getRelevantTimeframes(primary) {
    const tfHierarchy = ['1m', '5m', '15m', '30m', '1h', '2h', '4h', '6h', '8h', '12h', '1d', '3d', '1w', '1M'];
    const primaryIndex = tfHierarchy.indexOf(primary);
    
    if (primaryIndex === -1) return ['1h', '4h', '1d'];

    // Get 1 higher and 2 lower timeframes
    const relevant = [];
    
    // Lower timeframes (more granular)
    for (let i = Math.max(0, primaryIndex - 2); i < primaryIndex; i++) {
      relevant.push(tfHierarchy[i]);
    }
    
    // Primary timeframe
    relevant.push(primary);
    
    // Higher timeframes (broader context)
    for (let i = primaryIndex + 1; i <= Math.min(tfHierarchy.length - 1, primaryIndex + 2); i++) {
      relevant.push(tfHierarchy[i]);
    }

    return relevant;
  }

  /**
   * Simple SMA calculation
   */
  calculateSMA(values, period) {
    if (values.length < period) return null;
    const sum = values.slice(-period).reduce((a, b) => a + b, 0);
    return sum / period;
  }

  /**
   * Fetch analysis for specific timeframe
   */
  async fetchTimeframeAnalysis(symbol, timeframe) {
    const cacheKey = `${symbol}-${timeframe}-mtf`;
    const cached = this.analysisCache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp) < 60000) {
      return cached.data;
    }

    try {
      // Fetch market data for this timeframe
      const marketData = await fetchMarketData(symbol, timeframe);
      
      if (!marketData || !marketData.candles || !Array.isArray(marketData.candles) || marketData.candles.length < 20) {
        throw new Error("Not enough candle data");
      }

      const candles = marketData.candles;
      const closes = candles.map(c => c.close);
      const latestClose = closes[closes.length - 1];
      
      // Calculate simple EMA-like values
      const sma20 = this.calculateSMA(closes, 20) || latestClose;
      const sma50 = this.calculateSMA(closes, 50) || latestClose;
      
      // Determine bias and confidence
      let bias = 'neutral';
      let confidence = 50;
      
      if (latestClose > sma20 && sma20 > sma50) {
        bias = 'bullish';
        confidence = 65;
      } else if (latestClose < sma20 && sma20 < sma50) {
        bias = 'bearish';
        confidence = 65;
      } else if (latestClose > sma50) {
        bias = 'bullish';
        confidence = 55;
      } else if (latestClose < sma50) {
        bias = 'bearish';
        confidence = 55;
      }

      const analysis = {
        symbol,
        timeframe,
        bias,
        confidence,
        trend: { 
          direction: bias === 'bullish' ? 'up' : bias === 'bearish' ? 'down' : 'sideways', 
          strength: confidence > 60 ? 'strong' : 'weak' 
        },
        support: Math.min(...closes.slice(-20)),
        resistance: Math.max(...closes.slice(-20)),
        keyLevels: [],
        patterns: [],
        indicators: {
          rsi: 50,
          macd: { histogram: 0, signal: 0 },
          ema20: sma20,
          ema50: sma50
        },
        structure: bias === 'neutral' ? 'ranging' : 'trending',
        momentum: bias === 'bullish' ? 1 : bias === 'bearish' ? -1 : 0,
        timestamp: new Date().toISOString()
      };

      this.analysisCache.set(cacheKey, { data: analysis, timestamp: Date.now() });
      return analysis;
    } catch (error) {
      console.warn(`Error in fetchTimeframeAnalysis for ${symbol} ${timeframe}:`, error.message);
      
      // Fallback to placeholder if real analysis fails
      const fallback = {
        symbol,
        timeframe,
        bias: 'neutral',
        confidence: 50,
        trend: { direction: 'sideways', strength: 'weak' },
        support: null,
        resistance: null,
        keyLevels: [],
        patterns: [],
        indicators: {
          rsi: 50,
          macd: { histogram: 0, signal: 0 },
          ema20: 0,
          ema50: 0
        },
        structure: 'ranging',
        momentum: 0,
        timestamp: new Date().toISOString()
      };
      
      this.analysisCache.set(cacheKey, { data: fallback, timestamp: Date.now() });
      return fallback;
    }
  }

  /**
   * Detect divergences between timeframes
   */
  detectDivergences(analyses) {
    const divergences = [];
    const timeframes = Object.keys(analyses);

    for (let i = 0; i < timeframes.length - 1; i++) {
      for (let j = i + 1; j < timeframes.length; j++) {
        const tf1 = timeframes[i];
        const tf2 = timeframes[j];
        const a1 = analyses[tf1];
        const a2 = analyses[tf2];

        // Check for bias divergence
        if (a1.bias !== a2.bias && a1.bias !== 'neutral' && a2.bias !== 'neutral') {
          divergences.push({
            type: 'bias',
            timeframes: [tf1, tf2],
            values: [a1.bias, a2.bias],
            significance: this.calculateDivergenceSignificance(tf1, tf2),
            message: `${tf1} shows ${a1.bias} while ${tf2} shows ${a2.bias}`
          });
        }

        // Check for momentum divergence
        if ((a1.momentum > 0 && a2.momentum < 0) || (a1.momentum < 0 && a2.momentum > 0)) {
          divergences.push({
            type: 'momentum',
            timeframes: [tf1, tf2],
            values: [a1.momentum, a2.momentum],
            significance: 'medium',
            message: `Momentum divergence between ${tf1} and ${tf2}`
          });
        }

        // Check for trend strength divergence
        if (Math.abs(a1.confidence - a2.confidence) > 30) {
          divergences.push({
            type: 'strength',
            timeframes: [tf1, tf2],
            values: [a1.confidence, a2.confidence],
            significance: 'high',
            message: `Confidence gap: ${a1.confidence}% vs ${a2.confidence}%`
          });
        }
      }
    }

    return divergences.sort((a, b) => this.significanceValue(b.significance) - this.significanceValue(a.significance));
  }

  /**
   * Calculate confluence score
   */
  calculateConfluenceScore(confluence) {
    const bullishWeight = confluence.bullish.reduce((sum, b) => sum + b.strength, 0);
    const bearishWeight = confluence.bearish.reduce((sum, b) => sum + b.strength, 0);
    const totalWeight = bullishWeight + bearishWeight;

    if (totalWeight === 0) return { score: 0, direction: 'neutral' };

    const score = Math.abs(bullishWeight - bearishWeight) / totalWeight * 100;
    const direction = bullishWeight > bearishWeight ? 'bullish' : 'bearish';

    // Penalize for divergences
    const divergencePenalty = confluence.divergences.length * 10;
    const adjustedScore = Math.max(0, score - divergencePenalty);

    return {
      score: Math.round(adjustedScore),
      direction,
      rawBullish: bullishWeight,
      rawBearish: bearishWeight,
      divergenceCount: confluence.divergences.length,
      strength: adjustedScore > 70 ? 'strong' : adjustedScore > 40 ? 'moderate' : 'weak'
    };
  }

  /**
   * Find aligned timeframes
   */
  findAlignedTimeframes(analyses) {
    const aligned = {
      bullish: [],
      bearish: [],
      all: []
    };

    for (const [tf, analysis] of Object.entries(analyses)) {
      if (analysis.bias === 'bullish') {
        aligned.bullish.push({ timeframe: tf, confidence: analysis.confidence });
      } else if (analysis.bias === 'bearish') {
        aligned.bearish.push({ timeframe: tf, confidence: analysis.confidence });
      }
      
      aligned.all.push({
        timeframe: tf,
        bias: analysis.bias,
        confidence: analysis.confidence,
        trend: analysis.trend.direction
      });
    }

    // Sort by confidence
    aligned.bullish.sort((a, b) => b.confidence - a.confidence);
    aligned.bearish.sort((a, b) => b.confidence - a.confidence);

    return aligned;
  }

  /**
   * Analyze timeframe hierarchy
   */
  analyzeHierarchy(analyses) {
    const tfOrder = ['1m', '5m', '15m', '30m', '1h', '2h', '4h', '6h', '8h', '12h', '1d', '3d', '1w', '1M'];
    
    const hierarchy = {
      higher: [],
      current: null,
      lower: []
    };

    const analyzedTfs = Object.keys(analyses);
    const sortedTfs = analyzedTfs.sort((a, b) => tfOrder.indexOf(a) - tfOrder.indexOf(b));

    const midIndex = Math.floor(sortedTfs.length / 2);

    for (let i = 0; i < sortedTfs.length; i++) {
      const tf = sortedTfs[i];
      const analysis = analyses[tf];

      if (i < midIndex) {
        hierarchy.lower.push({ timeframe: tf, ...analysis });
      } else if (i === midIndex) {
        hierarchy.current = { timeframe: tf, ...analysis };
      } else {
        hierarchy.higher.push({ timeframe: tf, ...analysis });
      }
    }

    // Determine dominant direction
    const higherBias = this.getDominantBias(hierarchy.higher);
    const lowerBias = this.getDominantBias(hierarchy.lower);

    return {
      ...hierarchy,
      higherBias,
      lowerBias,
      alignment: higherBias === lowerBias ? 'aligned' : 'divergent',
      recommendation: this.getHierarchyRecommendation(higherBias, lowerBias, hierarchy.current?.bias)
    };
  }

  /**
   * Generate trading recommendation
   */
  generateRecommendation(confluence, hierarchy) {
    const score = confluence.confluenceScore;
    const direction = confluence.direction;
    const divergences = confluence.divergences.length;
    
    let recommendation = {
      action: 'neutral',
      confidence: 0,
      reasons: [],
      caution: []
    };

    // High confluence scenario
    if (score.score > 70) {
      recommendation.action = direction;
      recommendation.confidence = score.score;
      recommendation.reasons.push(`Strong ${direction} confluence across timeframes`);
      
      if (hierarchy.alignment === 'aligned') {
        recommendation.reasons.push('Higher and lower timeframe alignment');
      }
    }
    // Moderate confluence
    else if (score.score > 40) {
      recommendation.action = direction;
      recommendation.confidence = score.score;
      recommendation.reasons.push(`Moderate ${direction} bias`);
    }
    // Low confluence - caution
    else {
      recommendation.action = 'wait';
      recommendation.reasons.push('Mixed signals across timeframes');
      recommendation.caution.push('Wait for clearer confluence');
    }

    // Add divergence warnings
    if (divergences > 0) {
      recommendation.caution.push(`${divergences} divergence(s) detected`);
      
      if (divergences > 2) {
        recommendation.action = 'avoid';
        recommendation.caution.push('Too many conflicting signals');
      }
    }

    // Timeframe specific advice
    if (hierarchy.higherBias !== hierarchy.current?.bias) {
      recommendation.caution.push('Higher timeframe disagreement - trade with caution');
    }

    return recommendation;
  }

  /**
   * Get dominant bias from array
   */
  getDominantBias(analyses) {
    if (!analyses || analyses.length === 0) return 'neutral';
    
    const bullish = analyses.filter(a => a.bias === 'bullish').length;
    const bearish = analyses.filter(a => a.bias === 'bearish').length;
    
    if (bullish > bearish) return 'bullish';
    if (bearish > bullish) return 'bearish';
    return 'neutral';
  }

  /**
   * Get recommendation based on hierarchy
   */
  getHierarchyRecommendation(higher, lower, current) {
    if (higher === lower && lower === current) {
      return 'strong_signal';
    } else if (higher === lower) {
      return 'watch_current';
    } else if (higher === current) {
      return 'counter_lower';
    } else if (lower === current) {
      return 'early_signal';
    } else {
      return 'mixed';
    }
  }

  /**
   * Calculate divergence significance
   */
  calculateDivergenceSignificance(tf1, tf2) {
    const tfHierarchy = ['1m', '5m', '15m', '1h', '4h', '1d', '1w'];
    const index1 = tfHierarchy.indexOf(tf1);
    const index2 = tfHierarchy.indexOf(tf2);
    
    const gap = Math.abs(index1 - index2);
    
    if (gap >= 3) return 'high';
    if (gap === 2) return 'medium';
    return 'low';
  }

  /**
   * Get significance numeric value
   */
  significanceValue(significance) {
    const values = { low: 1, medium: 2, high: 3 };
    return values[significance] || 0;
  }

  /**
   * Find confluence zones across timeframes
   */
  findConfluenceZones(analyses) {
    const zones = [];
    const allLevels = [];

    // Collect all levels from all timeframes
    for (const [tf, analysis] of Object.entries(analyses)) {
      if (analysis.support) {
        allLevels.push({ price: analysis.support, type: 'support', timeframe: tf });
      }
      if (analysis.resistance) {
        allLevels.push({ price: analysis.resistance, type: 'resistance', timeframe: tf });
      }
      if (analysis.keyLevels) {
        for (const level of analysis.keyLevels) {
          allLevels.push({ ...level, timeframe: tf });
        }
      }
    }

    // Find clusters
    for (let i = 0; i < allLevels.length; i++) {
      for (let j = i + 1; j < allLevels.length; j++) {
        const l1 = allLevels[i];
        const l2 = allLevels[j];
        
        // Check if prices are within 0.5%
        const diff = Math.abs(l1.price - l2.price) / l1.price;
        
        if (diff < 0.005) {
          const avgPrice = (l1.price + l2.price) / 2;
          const existingZone = zones.find(z => Math.abs(z.price - avgPrice) / avgPrice < 0.002);
          
          if (existingZone) {
            existingZone.timeframes.push(l1.timeframe, l2.timeframe);
            existingZone.timeframes = [...new Set(existingZone.timeframes)];
            existingZone.strength += 1;
          } else {
            zones.push({
              price: avgPrice,
              type: l1.type === l2.type ? l1.type : 'mixed',
              timeframes: [l1.timeframe, l2.timeframe],
              strength: 2
            });
          }
        }
      }
    }

    // Sort by strength
    zones.sort((a, b) => b.strength - a.strength);
    
    return zones;
  }

  /**
   * Get trend alignment score
   */
  getTrendAlignment(analyses) {
    const trends = Object.values(analyses).map(a => a.trend?.direction || 'neutral');
    
    const bullish = trends.filter(t => t === 'bullish' || t === 'up').length;
    const bearish = trends.filter(t => t === 'bearish' || t === 'down').length;
    const neutral = trends.filter(t => t === 'neutral' || t === 'sideways').length;
    
    const total = trends.length;
    
    return {
      bullish: (bullish / total) * 100,
      bearish: (bearish / total) * 100,
      neutral: (neutral / total) * 100,
      dominant: bullish > bearish ? 'bullish' : bearish > bullish ? 'bearish' : 'neutral',
      alignment: Math.max(bullish, bearish) / total
    };
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.analysisCache.clear();
  }
}

module.exports = { MultiTimeframeAnalysis };
