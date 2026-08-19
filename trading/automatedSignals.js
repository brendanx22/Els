/**
 * Automated Trading Signal System
 * Generates trading signals based on confluence of all data sources
 */
class AutomatedTradingSignals {
  constructor() {
    this.signalHistory = [];
    this.activeSignals = new Map();
    this.performance = new Map();
    this.minConfidence = 65;
    this.minConfluence = 60;
    // Lower timeframes throw off more (and noisier) signals per hour, so a flat
    // 65/60 threshold lets weak setups through. Sniper mode raises the bar
    // specifically for 1m/5m/15m so only the tightest confluence fires an alert.
    this.ltfThresholds = {
      "1m": { minConfidence: 78, minConfluence: 74 },
      "5m": { minConfidence: 75, minConfluence: 71 },
      "15m": { minConfidence: 72, minConfluence: 68 },
    };
  }

  /**
   * Resolve the confidence/confluence bar for a given timeframe.
   */
  getThresholdsForTimeframe(timeframe) {
    return this.ltfThresholds[timeframe] || { minConfidence: this.minConfidence, minConfluence: this.minConfluence };
  }

  /**
   * Generate comprehensive trading signal
   */
  generateSignal(symbol, timeframe, data) {
    const {
      technical,
      news,
      movement,
      patterns,
      predictive,
      mtf
    } = data;

    // Calculate component scores
    const scores = {
      technical: this.scoreTechnical(technical),
      news: this.scoreNews(news),
      movement: this.scoreMovement(movement),
      patterns: this.scorePatterns(patterns),
      predictive: this.scorePredictive(predictive),
      mtf: this.scoreMTF(mtf)
    };

    // Calculate overall confluence
    const confluence = this.calculateConfluence(scores);

    // Determine signal
    const signal = this.determineSignal(scores, confluence, data);

    // If signal meets thresholds, create and store it
    const { minConfidence, minConfluence } = this.getThresholdsForTimeframe(timeframe);
    if (signal.confidence >= minConfidence && confluence.score >= minConfluence) {
      const signalId = `${symbol}-${timeframe}-${Date.now()}`;
      const fullSignal = {
        id: signalId,
        timestamp: new Date().toISOString(),
        symbol,
        timeframe,
        ...signal,
        scores,
        confluence,
        data,
        status: 'active',
        performance: null
      };

      this.activeSignals.set(signalId, fullSignal);
      this.signalHistory.push(fullSignal);

      // Keep only last 100 signals
      if (this.signalHistory.length > 100) {
        this.signalHistory.shift();
      }

      return fullSignal;
    }

    // Return no-signal result
    return {
      symbol,
      timeframe,
      signal: 'none',
      direction: 'neutral',
      confidence: confluence.score,
      reason: confluence.score < minConfluence ? 'Insufficient confluence' : 'Low confidence',
      scores,
      confluence,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Score technical analysis (0-100)
   */
  scoreTechnical(technical) {
    let score = 0;

    // Trend alignment
    if (technical.bias === 'bullish' || technical.bias === 'bearish') {
      score += 20;
    }

    // Confidence level
    score += (technical.confidence / 100) * 20;

    // Scorecard
    const avgScore = (technical.scorecard.trend + 
                     technical.scorecard.momentum + 
                     technical.scorecard.structure + 
                     technical.scorecard.timing) / 4;
    score += (avgScore / 100) * 20;

    // Setup quality
    if (technical.setups && technical.setups.length > 0) {
      score += 20;
    }

    // Confluence
    score += (technical.scorecard.confluence / 100) * 20;

    return Math.round(score);
  }

  /**
   * Score news sentiment (0-100)
   */
  scoreNews(news) {
    if (!news || !news.sentiment) return 50;

    let score = 50;

    // Sentiment strength
    const sentimentStrength = Math.abs(news.sentiment.score);
    score += (sentimentStrength / 100) * 25;

    // Impact level
    if (news.impact?.level === 'high') score += 20;
    else if (news.impact?.level === 'medium') score += 10;

    // Article volume (more data = more reliable)
    if (news.totalArticles > 20) score += 5;

    // Key events
    if (news.keyEvents && news.keyEvents.length > 0) {
      score += Math.min(10, news.keyEvents.length * 2);
    }

    return Math.min(100, Math.round(score));
  }

  /**
   * Score movement analysis (0-100)
   */
  scoreMovement(movement) {
    if (!movement) return 50;

    let score = 50;

    // Trend strength
    if (movement.trend?.strength === 'strong') score += 20;
    else if (movement.trend?.strength === 'moderate') score += 10;

    // Momentum
    if (movement.momentum?.strength === 'strong') score += 15;
    else if (movement.momentum?.strength === 'moderate') score += 7;

    // Volatility (not too high, not too low)
    if (movement.volatility?.level === 'moderate') score += 10;
    else if (movement.volatility?.level === 'high') score += 5;

    // Patterns
    if (movement.patterns && movement.patterns.length > 0) {
      score += Math.min(15, movement.patterns.length * 3);
    }

    return Math.min(100, Math.round(score));
  }

  /**
   * Score pattern recognition (0-100)
   */
  scorePatterns(patterns) {
    if (!patterns) return 50;

    let score = 50;

    // Candlestick patterns
    if (patterns.detected && patterns.detected.length > 0) {
      const highConfidence = patterns.detected.filter(p => p.confidence > 0.8).length;
      score += Math.min(20, highConfidence * 5);
    }

    // Chart patterns
    if (patterns.chartPatterns && patterns.chartPatterns.length > 0) {
      score += Math.min(15, patterns.chartPatterns.length * 5);
    }

    // Smart money concepts
    if (patterns.smartMoney && patterns.smartMoney.length > 0) {
      score += Math.min(15, patterns.smartMoney.length * 3);
    }

    // Divergences
    if (patterns.divergences && patterns.divergences.length > 0) {
      score += Math.min(10, patterns.divergences.length * 5);
    }

    return Math.min(100, Math.round(score));
  }

  /**
   * Score predictive analytics (0-100)
   */
  scorePredictive(predictive) {
    if (!predictive) return 50;

    let score = 50;

    // Probability clarity
    const probs = predictive.probabilities;
    if (probs) {
      const maxProb = Math.max(probs.bullish || 0, probs.bearish || 0, probs.sideways || 0);
      score += (maxProb / 100) * 20;
    }

    // Forecast confidence
    if (predictive.priceTarget?.predictions?.next1h?.confidence) {
      score += predictive.priceTarget.predictions.next1h.confidence * 15;
    }

    // Trend prediction
    if (predictive.trendPrediction?.strength === 'strong') score += 10;
    else if (predictive.trendPrediction?.strength === 'moderate') score += 5;

    // Scenario clarity
    if (predictive.scenarios) {
      const totalProb = (predictive.scenarios.bullish?.probability || 0) +
                       (predictive.scenarios.bearish?.probability || 0) +
                       (predictive.scenarios.base?.probability || 0);
      if (totalProb > 80) score += 5;
    }

    return Math.min(100, Math.round(score));
  }

  /**
   * Score multi-timeframe analysis (0-100)
   */
  scoreMTF(mtf) {
    if (!mtf) return 50;

    let score = 50;

    // Confluence score
    if (mtf.confluenceScore) {
      score += (mtf.confluenceScore.score / 100) * 30;
    }

    // Alignment
    if (mtf.alignedTimeframes) {
      const aligned = mtf.alignedTimeframes.bullish.length + mtf.alignedTimeframes.bearish.length;
      score += Math.min(20, aligned * 5);
    }

    // Divergence penalty
    if (mtf.divergences) {
      score -= Math.min(20, mtf.divergences.length * 5);
    }

    // Recommendation quality
    if (mtf.recommendation?.action === 'neutral' || mtf.recommendation?.action === 'avoid') {
      score -= 10;
    }

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  /**
   * Calculate overall confluence
   */
  calculateConfluence(scores) {
    const values = Object.values(scores);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    // Alignment score (lower std dev = better alignment)
    const alignment = Math.max(0, 100 - stdDev);

    // Overall score
    const score = Math.round((avg + alignment) / 2);

    // Strength rating
    let strength;
    if (score >= 80) strength = 'excellent';
    else if (score >= 65) strength = 'good';
    else if (score >= 50) strength = 'moderate';
    else strength = 'poor';

    return {
      score,
      alignment: Math.round(alignment),
      average: Math.round(avg),
      standardDeviation: Math.round(stdDev),
      strength,
      individual: scores
    };
  }

  /**
   * Determine trading signal
   */
  determineSignal(scores, confluence, data) {
    // Determine direction based on majority of scores
    const bullishCount = Object.values(scores).filter(s => s > 60).length;
    const bearishCount = Object.values(scores).filter(s => s < 40).length;

    let direction;
    if (bullishCount > bearishCount) direction = 'bullish';
    else if (bearishCount > bullishCount) direction = 'bearish';
    else direction = 'neutral';

    // Adjust based on specific data
    if (data.technical?.bias === 'bullish') direction = 'bullish';
    if (data.technical?.bias === 'bearish') direction = 'bearish';

    // Override with news if high impact
    if (data.news?.impact?.level === 'high') {
      if (data.news.sentiment?.overall === 'positive') direction = 'bullish';
      if (data.news.sentiment?.overall === 'negative') direction = 'bearish';
    }

    // Calculate confidence
    const confidence = confluence.score;

    // Determine entry, stop, targets
    const levels = this.calculateLevels(direction, data);

    // Risk assessment
    const risk = this.assessRisk(data);

    // Time horizon
    const timeHorizon = this.estimateTimeHorizon(data);

    // Signal type
    const signalType = this.classifySignalType(direction, data, confluence);

    return {
      signal: direction === 'neutral' ? 'none' : 'active',
      direction,
      type: signalType,
      confidence,
      entry: levels.entry,
      stopLoss: levels.stop,
      target1: levels.target1,
      target2: levels.target2,
      riskReward: levels.rr,
      positionSize: risk.positionSize,
      riskPercent: risk.riskPercent,
      timeHorizon,
      invalidationConditions: this.getInvalidationConditions(direction, data),
      catalyst: this.identifyCatalyst(data)
    };
  }

  /**
   * Calculate entry/stop/target levels
   */
  calculateLevels(direction, data) {
    const current = data.technical?.indicators?.close || 0;
    const atr = data.technical?.indicators?.atr14 || current * 0.01;
    const support = data.movement?.supportResistance?.support?.[0]?.price || current * 0.99;
    const resistance = data.movement?.supportResistance?.resistance?.[0]?.price || current * 1.01;

    let entry, stop, target1, target2;

    if (direction === 'bullish') {
      entry = current;
      stop = Math.min(current - (atr * 1.5), support * 0.995);
      target1 = current + (atr * 2);
      target2 = resistance;
    } else if (direction === 'bearish') {
      entry = current;
      stop = Math.max(current + (atr * 1.5), resistance * 1.005);
      target1 = current - (atr * 2);
      target2 = support;
    } else {
      entry = current;
      stop = current - (atr * 2);
      target1 = current + (atr * 2);
      target2 = current + (atr * 3);
    }

    const risk = Math.abs(entry - stop);
    const reward1 = Math.abs(target1 - entry);
    const reward2 = Math.abs(target2 - entry);

    return {
      entry: entry.toFixed(5),
      stop: stop.toFixed(5),
      target1: target1.toFixed(5),
      target2: target2.toFixed(5),
      rr1: (reward1 / risk).toFixed(2),
      rr2: (reward2 / risk).toFixed(2),
      rr: (reward1 / risk).toFixed(2)
    };
  }

  /**
   * Assess risk for position sizing
   */
  assessRisk(data) {
    const volatility = data.movement?.volatility?.level || 'low';
    const newsImpact = data.news?.impact?.level || 'low';

    let riskPercent = 1; // Base 1% risk

    if (volatility === 'high') riskPercent = 0.5;
    else if (volatility === 'medium') riskPercent = 0.75;

    if (newsImpact === 'high') riskPercent *= 0.5;

    return {
      riskPercent,
      positionSize: 'calculated-based-on-account',
      volatility,
      newsImpact
    };
  }

  /**
   * Estimate trade time horizon
   */
  estimateTimeHorizon(data) {
    const timeframe = data.timeframe || '1h';
    const patterns = data.patterns?.detected || [];
    
    const timeframeMultipliers = {
      '1m': 1, '5m': 5, '15m': 15, '30m': 30,
      '1h': 60, '2h': 120, '4h': 240, '6h': 360,
      '8h': 480, '12h': 720, '1d': 1440, '3d': 4320, '1w': 10080
    };

    let multiplier = timeframeMultipliers[timeframe] || 60;
    
    // Adjust for patterns
    if (patterns.some(p => ['Morning Star', 'Evening Star'].includes(p.name))) {
      multiplier *= 2;
    }

    const hours = Math.round(multiplier / 60);

    if (hours < 4) return 'scalp (1-4h)';
    if (hours < 24) return 'intraday (4-24h)';
    if (hours < 72) return 'swing (1-3 days)';
    return 'position (3+ days)';
  }

  /**
   * Classify signal type
   */
  classifySignalType(direction, data, confluence) {
    const patterns = data.patterns?.detected || [];
    const newsImpact = data.news?.impact?.level;

    if (newsImpact === 'high' && confluence.score > 70) {
      return 'momentum_breakout';
    }

    if (patterns.some(p => ['Hammer', 'Shooting Star', 'Engulfing'].includes(p.name))) {
      return 'pattern_reversal';
    }

    if (confluence.score > 75) {
      return 'high_confluence';
    }

    if (data.mtf?.confluenceScore?.strength === 'strong') {
      return 'mtf_aligned';
    }

    return 'standard';
  }

  /**
   * Get invalidation conditions
   */
  getInvalidationConditions(direction, data) {
    const conditions = [];
    const current = data.technical?.indicators?.close || 0;
    const atr = data.technical?.indicators?.atr14 || current * 0.01;

    if (direction === 'bullish') {
      conditions.push(`Price breaks below ${(current - atr * 2).toFixed(5)}`);
      conditions.push('Bearish engulfing pattern on 1h');
      conditions.push('RSI drops below 30 with increasing volume');
    } else if (direction === 'bearish') {
      conditions.push(`Price breaks above ${(current + atr * 2).toFixed(5)}`);
      conditions.push('Bullish engulfing pattern on 1h');
      conditions.push('RSI rises above 70 with increasing volume');
    }

    conditions.push('News sentiment shifts dramatically');
    conditions.push('Market structure changes (BOS/CHoCH)');

    return conditions;
  }

  /**
   * Identify trade catalyst
   */
  identifyCatalyst(data) {
    const catalysts = [];

    if (data.news?.keyEvents?.length > 0) {
      catalysts.push(...data.news.keyEvents.map(e => e.name));
    }

    if (data.patterns?.detected?.length > 0) {
      catalysts.push(...data.patterns.detected.slice(0, 2).map(p => p.name));
    }

    if (data.technical?.structure?.sequence) {
      catalysts.push(data.technical.structure.sequence);
    }

    return catalysts.length > 0 ? catalysts.join(' + ') : 'Technical confluence';
  }

  /**
   * Get active signals
   */
  getActiveSignals(symbol = null) {
    if (symbol) {
      return [...this.activeSignals.values()].filter(s => s.symbol === symbol);
    }
    return [...this.activeSignals.values()];
  }

  /**
   * Update signal status (when hit target/stop)
   */
  updateSignalStatus(signalId, status, exitPrice = null) {
    const signal = this.activeSignals.get(signalId);
    if (!signal) return null;

    signal.status = status;
    signal.exitPrice = exitPrice;
    signal.exitTime = new Date().toISOString();

    // Calculate P&L
    if (exitPrice) {
      const entry = parseFloat(signal.entry);
      const exit = parseFloat(exitPrice);
      
      if (signal.direction === 'bullish') {
        signal.pnl = ((exit - entry) / entry) * 100;
      } else {
        signal.pnl = ((entry - exit) / entry) * 100;
      }

      // Track performance
      this.trackPerformance(signal);
    }

    // Move to history if completed
    if (status === 'target_hit' || status === 'stop_hit' || status === 'expired') {
      this.activeSignals.delete(signalId);
    }

    return signal;
  }

  /**
   * Track signal performance
   */
  trackPerformance(signal) {
    const key = `${signal.symbol}-${signal.timeframe}`;
    
    if (!this.performance.has(key)) {
      this.performance.set(key, {
        total: 0,
        wins: 0,
        losses: 0,
        pnl: 0,
        avgWin: 0,
        avgLoss: 0
      });
    }

    const perf = this.performance.get(key);
    perf.total++;
    perf.pnl += signal.pnl || 0;

    if (signal.pnl > 0) {
      perf.wins++;
      perf.avgWin = (perf.avgWin * (perf.wins - 1) + signal.pnl) / perf.wins;
    } else {
      perf.losses++;
      perf.avgLoss = (perf.avgLoss * (perf.losses - 1) + signal.pnl) / perf.losses;
    }
  }

  /**
   * Get performance stats
   */
  getPerformanceStats(symbol = null, timeframe = null) {
    if (symbol && timeframe) {
      return this.performance.get(`${symbol}-${timeframe}`);
    }

    const allStats = [...this.performance.values()];
    
    return {
      totalSignals: allStats.reduce((sum, p) => sum + p.total, 0),
      winRate: allStats.reduce((sum, p) => sum + p.wins, 0) / allStats.reduce((sum, p) => sum + p.total, 0) * 100,
      totalPnL: allStats.reduce((sum, p) => sum + p.pnl, 0),
      avgPnL: allStats.reduce((sum, p) => sum + p.pnl, 0) / allStats.reduce((sum, p) => sum + p.total, 0) || 0,
      bySymbol: Object.fromEntries(this.performance)
    };
  }

  /**
   * Clear expired signals
   */
  clearExpiredSignals(maxAgeHours = 24) {
    const cutoff = Date.now() - (maxAgeHours * 60 * 60 * 1000);
    
    for (const [id, signal] of this.activeSignals) {
      if (new Date(signal.timestamp).getTime() < cutoff) {
        this.updateSignalStatus(id, 'expired');
      }
    }
  }
}

module.exports = { AutomatedTradingSignals };
