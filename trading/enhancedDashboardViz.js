/**
 * Enhanced Dashboard Visualization System
 * Adds sentiment timeline, heatmaps, and advanced charts
 */
class EnhancedDashboardViz {
  constructor() {
    this.chartTypes = ['sentiment', 'heatmap', 'prediction', 'confluence', 'signal'];
    this.colorSchemes = {
      bullish: ['#089981', '#10b981', '#34d399'],
      bearish: ['#f23645', '#ef4444', '#f87171'],
      neutral: ['#6b7280', '#9ca3af', '#d1d5db']
    };
  }

  /**
   * Generate sentiment timeline data
   */
  generateSentimentTimeline(newsHistory, timeframe = '1d') {
    const timeline = [];
    const now = Date.now();
    const intervals = this.getTimelineIntervals(timeframe);

    for (let i = intervals - 1; i >= 0; i--) {
      const intervalStart = now - (i + 1) * this.getIntervalMs(timeframe);
      const intervalEnd = now - i * this.getIntervalMs(timeframe);

      // Get news in this interval
      const intervalNews = newsHistory.filter(n => {
        const newsTime = new Date(n.timestamp).getTime();
        return newsTime >= intervalStart && newsTime < intervalEnd;
      });

      if (intervalNews.length > 0) {
        const avgSentiment = intervalNews.reduce((sum, n) => sum + (n.sentiment?.score || 0), 0) / intervalNews.length;
        const articleCount = intervalNews.length;
        const impact = Math.max(...intervalNews.map(n => n.impact?.score || 0));

        timeline.push({
          timestamp: intervalEnd,
          sentiment: avgSentiment,
          articles: articleCount,
          impact,
          label: this.formatTimeLabel(intervalEnd, timeframe)
        });
      }
    }

    return {
      type: 'sentiment-timeline',
      data: timeline,
      ranges: {
        sentiment: { min: -100, max: 100 },
        articles: { min: 0, max: Math.max(...timeline.map(t => t.articles), 10) },
        impact: { min: 0, max: 100 }
      },
      colors: this.generateSentimentColors(timeline)
    };
  }

  /**
   * Generate market heatmap
   */
  generateMarketHeatmap(marketData, symbols = []) {
    const heatmapData = symbols.map(symbol => {
      const data = marketData[symbol] || {};
      const change = data.change24h || 0;
      const volume = data.volume24h || 0;
      const sentiment = data.sentiment || 0;
      
      // Calculate heat intensity (-100 to +100)
      const intensity = (change * 0.4) + (sentiment * 0.4) + (Math.min(volume / 1000000, 20) * 0.2);

      return {
        symbol,
        change,
        volume,
        sentiment,
        intensity: Math.max(-100, Math.min(100, intensity)),
        category: this.categorizeSymbol(symbol),
        size: Math.sqrt(volume) / 1000 // Bubble size
      };
    });

    // Sort by intensity
    heatmapData.sort((a, b) => Math.abs(b.intensity) - Math.abs(a.intensity));

    return {
      type: 'market-heatmap',
      data: heatmapData,
      sectors: this.groupBySector(heatmapData),
      extremes: {
        hottest: heatmapData.slice(0, 5),
        coldest: heatmapData.slice(-5)
      },
      statistics: {
        average: heatmapData.reduce((sum, d) => sum + d.intensity, 0) / heatmapData.length,
        bullish: heatmapData.filter(d => d.intensity > 20).length,
        bearish: heatmapData.filter(d => d.intensity < -20).length,
        neutral: heatmapData.filter(d => d.intensity >= -20 && d.intensity <= 20).length
      }
    };
  }

  /**
   * Generate prediction confidence chart
   */
  generatePredictionChart(predictiveData) {
    const scenarios = predictiveData?.scenarios || {};
    const probabilities = predictiveData?.probabilities || {};

    return {
      type: 'prediction-radial',
      data: [
        {
          name: 'Bullish',
          probability: probabilities.bullish || 33,
          target: scenarios.bullish?.target || 0,
          color: this.colorSchemes.bullish[0],
          radius: (probabilities.bullish || 33) / 100
        },
        {
          name: 'Bearish',
          probability: probabilities.bearish || 33,
          target: scenarios.bearish?.target || 0,
          color: this.colorSchemes.bearish[0],
          radius: (probabilities.bearish || 33) / 100
        },
        {
          name: 'Neutral',
          probability: probabilities.sideways || 34,
          target: scenarios.base?.target || 0,
          color: this.colorSchemes.neutral[0],
          radius: (probabilities.sideways || 34) / 100
        }
      ],
      confidence: predictiveData?.confidence || 0,
      timeframe: {
        short: predictiveData?.timeHorizons?.short || {},
        medium: predictiveData?.timeHorizons?.medium || {},
        long: predictiveData?.timeHorizons?.long || {}
      }
    };
  }

  /**
   * Generate multi-timeframe confluence chart
   */
  generateConfluenceChart(mtfData) {
    const timeframes = ['1m', '5m', '15m', '1h', '4h', '1d', '1w'];
    const analyses = mtfData?.analyses || {};

    const confluenceData = timeframes.map(tf => {
      const analysis = analyses[tf];
      return {
        timeframe: tf,
        bias: analysis?.bias || 'neutral',
        confidence: analysis?.confidence || 50,
        trend: analysis?.trend?.direction || 'sideways',
        strength: analysis?.trend?.strength || 'weak',
        alignment: this.calculateAlignment(analysis, mtfData?.confluence?.direction)
      };
    });

    return {
      type: 'confluence-matrix',
      data: confluenceData,
      overall: {
        score: mtfData?.confluenceScore?.score || 0,
        direction: mtfData?.confluenceScore?.direction || 'neutral',
        strength: mtfData?.confluenceScore?.strength || 'weak'
      },
      divergences: mtfData?.divergences || [],
      recommendation: mtfData?.recommendation || {}
    };
  }

  /**
   * Generate trading signal strength indicator
   */
  generateSignalIndicator(signalData) {
    if (!signalData || signalData.signal === 'none') {
      return {
        type: 'no-signal',
        message: 'No active trading signal',
        reason: signalData?.reason || 'Insufficient confluence'
      };
    }

    const components = [
      { name: 'Technical', score: signalData.scores?.technical || 50, weight: 0.35 },
      { name: 'News', score: signalData.scores?.news || 50, weight: 0.20 },
      { name: 'Movement', score: signalData.scores?.movement || 50, weight: 0.20 },
      { name: 'Patterns', score: signalData.scores?.patterns || 50, weight: 0.15 },
      { name: 'Predictive', score: signalData.scores?.predictive || 50, weight: 0.10 }
    ];

    const weightedScore = components.reduce((sum, c) => sum + (c.score * c.weight), 0);

    return {
      type: 'signal-gauge',
      direction: signalData.direction,
      strength: signalData.confidence || 0,
      weightedScore: Math.round(weightedScore),
      components,
      entry: signalData.entry,
      target: signalData.target1,
      stop: signalData.stopLoss,
      rr: signalData.riskReward,
      timeHorizon: signalData.timeHorizon,
      catalyst: signalData.catalyst,
      status: signalData.status,
      invalidation: signalData.invalidationConditions?.slice(0, 3)
    };
  }

  /**
   * Generate pattern detection visualization
   */
  generatePatternViz(patternData) {
    const patterns = [];

    // Candlestick patterns
    if (patternData?.detected) {
      patterns.push(...patternData.detected.map(p => ({
        type: 'candlestick',
        name: p.name,
        signal: p.signal,
        confidence: p.confidence || 0.7,
        position: p.index,
        color: p.signal === 'bullish' ? this.colorSchemes.bullish[0] : 
               p.signal === 'bearish' ? this.colorSchemes.bearish[0] : this.colorSchemes.neutral[0]
      })));
    }

    // Chart patterns
    if (patternData?.chartPatterns) {
      patterns.push(...patternData.chartPatterns.map(p => ({
        type: 'chart',
        name: p.name,
        signal: p.signal,
        target: p.target,
        neckline: p.neckline,
        color: p.signal === 'bullish' ? this.colorSchemes.bullish[1] : 
               p.signal === 'bearish' ? this.colorSchemes.bearish[1] : this.colorSchemes.neutral[1]
      })));
    }

    // Smart money concepts
    if (patternData?.smartMoney) {
      patterns.push(...patternData.smartMoney.map(p => ({
        type: 'smart-money',
        name: p.name,
        signal: p.signal,
        price: p.price,
        strength: p.strength,
        color: '#8b5cf6' // Purple for SMC
      })));
    }

    return {
      type: 'pattern-overlay',
      patterns: patterns.slice(0, 10), // Limit to 10 patterns
      counts: {
        candlestick: patternData?.detected?.length || 0,
        chart: patternData?.chartPatterns?.length || 0,
        harmonic: patternData?.harmonic?.length || 0,
        smartMoney: patternData?.smartMoney?.length || 0,
        divergences: patternData?.divergences?.length || 0
      }
    };
  }

  /**
   * Generate volatility surface
   */
  generateVolatilitySurface(volatilityData) {
    return {
      type: 'volatility-surface',
      current: volatilityData?.current || 0,
      predicted: volatilityData?.predicted || 0,
      regime: volatilityData?.regime || 'low',
      change: volatilityData?.change || 0,
      breakoutProbability: volatilityData?.breakoutProbability || 0,
      timeToEvent: volatilityData?.timeToEvent || 'unknown',
      forecast: {
        short: volatilityData?.shortTerm || 0,
        medium: volatilityData?.mediumTerm || 0,
        long: volatilityData?.longTerm || 0
      }
    };
  }

  /**
   * Generate news sentiment word cloud data
   */
  generateSentimentWordCloud(newsData) {
    const words = [];

    // Extract keywords from news
    if (newsData?.articles) {
      const keywordMap = new Map();

      for (const article of newsData.articles.slice(0, 20)) {
        const text = (article.title + ' ' + article.description).toLowerCase();
        
        // Extract significant words
        const significantWords = text.match(/\b[a-z]{4,}\b/g) || [];
        
        for (const word of significantWords) {
          if (this.isSignificantWord(word)) {
            const sentiment = article.sentiment?.score > 0 ? 1 : article.sentiment?.score < 0 ? -1 : 0;
            const weight = (keywordMap.get(word)?.weight || 0) + 1;
            const currentSentiment = (keywordMap.get(word)?.sentiment || 0) + sentiment;
            
            keywordMap.set(word, { weight, sentiment: currentSentiment });
          }
        }
      }

      // Convert to array and sort
      for (const [word, data] of keywordMap) {
        words.push({
          text: word,
          weight: data.weight,
          sentiment: data.sentiment / data.weight, // Average sentiment
          color: data.sentiment > 0 ? this.colorSchemes.bullish[0] :
                 data.sentiment < 0 ? this.colorSchemes.bearish[0] : this.colorSchemes.neutral[0]
        });
      }
    }

    words.sort((a, b) => b.weight - a.weight);

    return {
      type: 'word-cloud',
      words: words.slice(0, 50),
      topPositive: words.filter(w => w.sentiment > 0).slice(0, 10),
      topNegative: words.filter(w => w.sentiment < 0).slice(0, 10)
    };
  }

  /**
   * Generate support/resistance levels visualization
   */
  generateLevelsViz(supportResistanceData, currentPrice) {
    const levels = [];

    if (supportResistanceData?.levels) {
      for (const level of supportResistanceData.levels.slice(0, 8)) {
        const distance = Math.abs(level.price - currentPrice) / currentPrice * 100;
        
        levels.push({
          price: level.price,
          type: level.type,
          strength: level.strength,
          touches: level.touches,
          distance: distance.toFixed(2),
          tested: level.tested,
          color: level.type === 'support' ? this.colorSchemes.bullish[0] : this.colorSchemes.bearish[0]
        });
      }
    }

    // Sort by distance from current price
    levels.sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));

    return {
      type: 'levels-chart',
      currentPrice,
      levels,
      range: {
        support: levels.filter(l => l.type === 'support').slice(0, 3),
        resistance: levels.filter(l => l.type === 'resistance').slice(0, 3)
      }
    };
  }

  /**
   * Generate complete dashboard data package
   */
  generateDashboardPackage(symbol, timeframe, data) {
    return {
      timestamp: new Date().toISOString(),
      symbol,
      timeframe,
      visualizations: {
        sentimentTimeline: this.generateSentimentTimeline(data.newsHistory || [], timeframe),
        marketHeatmap: this.generateMarketHeatmap(data.marketData || {}, [symbol]),
        prediction: this.generatePredictionChart(data.predictive),
        confluence: this.generateConfluenceChart(data.mtf),
        signal: this.generateSignalIndicator(data.signal),
        patterns: this.generatePatternViz(data.patterns),
        volatility: this.generateVolatilitySurface(data.movement?.volatility),
        wordCloud: this.generateSentimentWordCloud(data.news),
        levels: this.generateLevelsViz(data.movement?.supportResistance, data.market?.price)
      },
      summary: {
        overallBias: this.calculateOverallBias(data),
        confidence: this.calculateOverallConfidence(data),
        keyLevels: this.extractKeyLevels(data),
        alerts: this.extractActiveAlerts(data),
        recommendation: this.generateRecommendation(data)
      }
    };
  }

  // ============ HELPER METHODS ============

  getTimelineIntervals(timeframe) {
    const intervals = {
      '1h': 24,   // Last 24 hours
      '4h': 24,   // Last 4 days
      '1d': 30,   // Last 30 days
      '1w': 12    // Last 12 weeks
    };
    return intervals[timeframe] || 24;
  }

  getIntervalMs(timeframe) {
    const intervals = {
      '1h': 60 * 60 * 1000,       // 1 hour
      '4h': 4 * 60 * 60 * 1000,  // 4 hours
      '1d': 24 * 60 * 60 * 1000, // 1 day
      '1w': 7 * 24 * 60 * 60 * 1000 // 1 week
    };
    return intervals[timeframe] || 60 * 60 * 1000;
  }

  formatTimeLabel(timestamp, timeframe) {
    const date = new Date(timestamp);
    
    if (timeframe === '1h') {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else if (timeframe === '1d') {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  }

  generateSentimentColors(timeline) {
    return timeline.map(t => {
      if (t.sentiment > 30) return this.colorSchemes.bullish[0];
      if (t.sentiment < -30) return this.colorSchemes.bearish[0];
      return this.colorSchemes.neutral[0];
    });
  }

  categorizeSymbol(symbol) {
    if (symbol.includes('BTC') || symbol.includes('ETH')) return 'crypto';
    if (symbol.includes('EUR') || symbol.includes('GBP') || symbol.includes('JPY')) return 'forex';
    if (symbol.includes('SPY') || symbol.includes('QQQ')) return 'equity';
    if (symbol.includes('GOLD') || symbol.includes('OIL')) return 'commodity';
    return 'other';
  }

  groupBySector(data) {
    const sectors = {};
    
    for (const item of data) {
      if (!sectors[item.category]) {
        sectors[item.category] = [];
      }
      sectors[item.category].push(item);
    }
    
    return sectors;
  }

  calculateAlignment(analysis, confluenceDirection) {
    if (!analysis || !confluenceDirection) return 'neutral';
    
    if (analysis.bias === confluenceDirection) return 'aligned';
    if (analysis.bias === 'neutral') return 'neutral';
    return 'divergent';
  }

  isSignificantWord(word) {
    const stopWords = new Set(['this', 'that', 'with', 'from', 'they', 'have', 'been', 'were', 'said', 'time', 'than', 'them', 'into', 'just', 'also', 'know', 'take', 'year', 'good', 'some', 'come', 'make', 'well', 'very', 'when', 'much', 'would', 'there', 'their', 'what', 'your', 'could', 'other', 'after', 'first', 'never', 'these', 'think', 'where', 'being', 'every', 'great', 'might', 'shall', 'still', 'those', 'while', 'over', 'back', 'only', 'more', 'before', 'should', 'really']);
    
    return word.length >= 4 && !stopWords.has(word) && !/^\d+$/.test(word);
  }

  calculateOverallBias(data) {
    const scores = [
      data.technical?.bias === 'bullish' ? 1 : data.technical?.bias === 'bearish' ? -1 : 0,
      (data.news?.sentiment?.score || 0) / 100,
      data.movement?.trend?.direction === 'bullish' ? 0.5 : data.movement?.trend?.direction === 'bearish' ? -0.5 : 0
    ];
    
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    
    if (avg > 0.2) return 'bullish';
    if (avg < -0.2) return 'bearish';
    return 'neutral';
  }

  calculateOverallConfidence(data) {
    const confidences = [
      data.technical?.confidence || 50,
      data.news?.impact?.score || 50,
      data.predictive?.confidence || 50,
      data.mtf?.confluenceScore?.score || 50
    ];
    
    return Math.round(confidences.reduce((a, b) => a + b, 0) / confidences.length);
  }

  extractKeyLevels(data) {
    const levels = [];
    
    if (data.movement?.supportResistance?.levels) {
      levels.push(...data.movement.supportResistance.levels.slice(0, 3));
    }
    
    if (data.signal?.entry) {
      levels.push({ price: data.signal.entry, type: 'entry', label: 'Entry' });
    }
    
    if (data.signal?.stopLoss) {
      levels.push({ price: data.signal.stopLoss, type: 'stop', label: 'Stop Loss' });
    }
    
    if (data.signal?.target1) {
      levels.push({ price: data.signal.target1, type: 'target', label: 'Target 1' });
    }
    
    return levels;
  }

  extractActiveAlerts(data) {
    const alerts = [];
    
    if (data.news?.keyEvents) {
      alerts.push(...data.news.keyEvents.map(e => ({
        type: 'news',
        title: e.name,
        severity: e.mentions > 10 ? 'high' : 'medium'
      })));
    }
    
    if (data.patterns?.divergences) {
      alerts.push(...data.patterns.divergences.slice(0, 2).map(d => ({
        type: 'technical',
        title: d.name,
        severity: d.strength === 'strong' ? 'high' : 'medium'
      })));
    }
    
    return alerts.slice(0, 5);
  }

  generateRecommendation(data) {
    if (data.signal?.signal === 'active') {
      return {
        action: data.signal.direction,
        confidence: data.signal.confidence,
        entry: data.signal.entry,
        reason: data.signal.catalyst
      };
    }
    
    return {
      action: 'wait',
      confidence: data.technical?.confidence || 50,
      reason: data.signal?.reason || 'Insufficient confluence'
    };
  }
}

module.exports = { EnhancedDashboardViz };
