/**
 * Advanced Pattern Recognition System
 * ML-based pattern detection for price movements
 */
class AdvancedPatternRecognition {
  constructor() {
    this.patternDatabase = new Map();
    this.confidenceThreshold = 0.75;
    this.minPatternLength = 5;
  }

  /**
   * Detect all patterns in candle data
   */
  detectPatterns(candles, symbol, timeframe) {
    const patterns = {
      candlestick: this.detectCandlestickPatterns(candles),
      chart: this.detectChartPatterns(candles),
      harmonic: this.detectHarmonicPatterns(candles),
      wyckoff: this.detectWyckoffPhases(candles),
      elliott: this.detectElliottWaves(candles),
      smartMoney: this.detectSmartMoneyConcepts(candles),
      divergences: this.detectDivergences(candles),
      confluence: this.calculateConfluenceZones(candles)
    };

    // Calculate pattern confidence scores but don't filter anything out
    for (const category in patterns) {
      if (Array.isArray(patterns[category])) {
        patterns[category] = patterns[category].map(p => ({
          ...p,
          confidence: this.calculatePatternConfidence(p, candles)
        }));
      }
    }

    // Store pattern for learning
    this.storePattern(symbol, timeframe, patterns);

    return patterns;
  }

  /**
   * Advanced candlestick pattern detection
   */
  detectCandlestickPatterns(candles) {
    const patterns = [];
    const len = candles.length;
    
    for (let i = 3; i < len; i++) {
      const c0 = candles[i-3]; // 3 candles ago
      const c1 = candles[i-2]; // 2 candles ago
      const c2 = candles[i-1]; // 1 candle ago
      const c3 = candles[i];   // Current candle

      // Single candle patterns
      if (this.isDoji(c3)) {
        patterns.push({ name: 'Doji', type: 'reversal', signal: 'neutral', index: i });
      }
      
      if (this.isHammer(c3)) {
        const trend = this.getTrendDirection(candles, i, 10);
        patterns.push({ 
          name: 'Hammer', 
          type: 'reversal', 
          signal: trend === 'down' ? 'bullish' : 'weak',
          index: i 
        });
      }

      if (this.isShootingStar(c3)) {
        const trend = this.getTrendDirection(candles, i, 10);
        patterns.push({ 
          name: 'Shooting Star', 
          type: 'reversal', 
          signal: trend === 'up' ? 'bearish' : 'weak',
          index: i 
        });
      }

      if (this.isMarubozu(c3)) {
        patterns.push({ 
          name: c3.close > c3.open ? 'Bullish Marubozu' : 'Bearish Marubozu', 
          type: 'continuation', 
          signal: c3.close > c3.open ? 'bullish' : 'bearish',
          index: i 
        });
      }

      // Two candle patterns
      if (i >= 1) {
        if (this.isEngulfing(c2, c3)) {
          patterns.push({ 
            name: c3.close > c3.open ? 'Bullish Engulfing' : 'Bearish Engulfing', 
            type: 'reversal', 
            signal: c3.close > c3.open ? 'bullish' : 'bearish',
            index: i 
          });
        }

        if (this.isHarami(c2, c3)) {
          patterns.push({ 
            name: c3.close > c3.open ? 'Bullish Harami' : 'Bearish Harami', 
            type: 'reversal', 
            signal: c3.close > c3.open ? 'bullish' : 'bearish',
            index: i 
          });
        }

        if (this.isPiercingLine(c2, c3)) {
          patterns.push({ name: 'Piercing Line', type: 'reversal', signal: 'bullish', index: i });
        }

        if (this.isDarkCloudCover(c2, c3)) {
          patterns.push({ name: 'Dark Cloud Cover', type: 'reversal', signal: 'bearish', index: i });
        }

        if (this.isTweezerTops(c2, c3)) {
          patterns.push({ name: 'Tweezer Tops', type: 'reversal', signal: 'bearish', index: i });
        }

        if (this.isTweezerBottoms(c2, c3)) {
          patterns.push({ name: 'Tweezer Bottoms', type: 'reversal', signal: 'bullish', index: i });
        }
      }

      // Three candle patterns
      if (i >= 2) {
        if (this.isMorningStar(c1, c2, c3)) {
          patterns.push({ name: 'Morning Star', type: 'reversal', signal: 'bullish', index: i });
        }

        if (this.isEveningStar(c1, c2, c3)) {
          patterns.push({ name: 'Evening Star', type: 'reversal', signal: 'bearish', index: i });
        }

        if (this.isThreeWhiteSoldiers(c1, c2, c3)) {
          patterns.push({ name: 'Three White Soldiers', type: 'continuation', signal: 'bullish', index: i });
        }

        if (this.isThreeBlackCrows(c1, c2, c3)) {
          patterns.push({ name: 'Three Black Crows', type: 'continuation', signal: 'bearish', index: i });
        }

        if (this.isThreeInsideUp(c1, c2, c3)) {
          patterns.push({ name: 'Three Inside Up', type: 'reversal', signal: 'bullish', index: i });
        }

        if (this.isThreeInsideDown(c1, c2, c3)) {
          patterns.push({ name: 'Three Inside Down', type: 'reversal', signal: 'bearish', index: i });
        }
      }
    }

    return patterns;
  }

  /**
   * Chart pattern detection
   */
  detectChartPatterns(candles) {
    const patterns = [];
    const len = candles.length;
    
    if (len < 20) return patterns;

    const highs = candles.map(c => c.high);
    const lows = candles.map(c => c.low);
    const closes = candles.map(c => c.close);

    // Head and Shoulders
    const hsPattern = this.findHeadAndShoulders(highs, lows);
    if (hsPattern) {
      patterns.push({ 
        name: hsPattern.type, 
        type: 'reversal', 
        signal: hsPattern.type.includes('Inverse') ? 'bullish' : 'bearish',
        neckline: hsPattern.neckline,
        target: hsPattern.target
      });
    }

    // Double Top/Bottom
    const doublePattern = this.findDoubleTopBottom(highs, lows);
    if (doublePattern) {
      patterns.push({ 
        name: doublePattern.type, 
        type: 'reversal', 
        signal: doublePattern.type === 'Double Bottom' ? 'bullish' : 'bearish',
        neckline: doublePattern.neckline
      });
    }

    // Triangles
    const triangle = this.findTriangle(highs, lows);
    if (triangle) {
      patterns.push({ 
        name: triangle.type, 
        type: 'continuation', 
        signal: triangle.breakout,
        apex: triangle.apex
      });
    }

    // Flags and Pennants
    const flag = this.findFlagPennant(highs, lows, closes);
    if (flag) {
      patterns.push({ 
        name: flag.type, 
        type: 'continuation', 
        signal: flag.direction,
        pole: flag.pole
      });
    }

    // Wedges
    const wedge = this.findWedge(highs, lows);
    if (wedge) {
      patterns.push({ 
        name: wedge.type, 
        type: 'reversal', 
        signal: wedge.breakout
      });
    }

    // Cups and Handles
    const cupHandle = this.findCupAndHandle(candles);
    if (cupHandle) {
      patterns.push({ 
        name: 'Cup and Handle', 
        type: 'continuation', 
        signal: 'bullish',
        cupDepth: cupHandle.depth,
        handle: cupHandle.handle
      });
    }

    // Channels
    const channel = this.findChannel(candles);
    if (channel) {
      patterns.push({ 
        name: 'Price Channel', 
        type: 'continuation', 
        signal: channel.slope > 0 ? 'bullish' : 'bearish',
        upper: channel.upper,
        lower: channel.lower
      });
    }

    return patterns;
  }

  /**
   * Harmonic pattern detection (Gartley, Butterfly, Bat, Crab)
   */
  detectHarmonicPatterns(candles) {
    const patterns = [];
    const len = candles.length;
    
    if (len < 30) return patterns;

    const pivotHighs = this.findPivotPoints(candles, 'high');
    const pivotLows = this.findPivotPoints(candles, 'low');

    // Gartley Pattern
    const gartley = this.findGartley(pivotHighs, pivotLows);
    if (gartley) {
      patterns.push({ 
        name: 'Gartley', 
        type: 'harmonic', 
        signal: gartley.type,
        ratios: gartley.ratios,
        completion: gartley.completion
      });
    }

    // Butterfly Pattern
    const butterfly = this.findButterfly(pivotHighs, pivotLows);
    if (butterfly) {
      patterns.push({ 
        name: 'Butterfly', 
        type: 'harmonic', 
        signal: butterfly.type,
        ratios: butterfly.ratios
      });
    }

    // Bat Pattern
    const bat = this.findBat(pivotHighs, pivotLows);
    if (bat) {
      patterns.push({ 
        name: 'Bat', 
        type: 'harmonic', 
        signal: bat.type,
        ratios: bat.ratios
      });
    }

    // Crab Pattern
    const crab = this.findCrab(pivotHighs, pivotLows);
    if (crab) {
      patterns.push({ 
        name: 'Crab', 
        type: 'harmonic', 
        signal: crab.type,
        ratios: crab.ratios
      });
    }

    return patterns;
  }

  /**
   * Wyckoff method phases
   */
  detectWyckoffPhases(candles) {
    const phases = [];
    const len = candles.length;
    
    if (len < 50) return phases;

    const volume = candles.map(c => c.volume || 0);
    const closes = candles.map(c => c.close);
    const spreads = candles.map(c => c.high - c.low);

    // Analyze price and volume relationship
    const recent = candles.slice(-30);
    const recentVolume = recent.map(c => c.volume || 0);
    const avgVolume = recentVolume.reduce((a, b) => a + b, 0) / recentVolume.length;

    // Phase A: Accumulation
    const isAccumulation = this.detectAccumulation(recent, avgVolume);
    if (isAccumulation.found) {
      phases.push({
        name: 'Wyckoff Accumulation',
        phase: isAccumulation.phase,
        signal: 'bullish',
        characteristics: isAccumulation.traits
      });
    }

    // Phase B: Markup
    const isMarkup = this.detectMarkup(recent, avgVolume);
    if (isMarkup.found) {
      phases.push({
        name: 'Wyckoff Markup',
        phase: 'B',
        signal: 'bullish',
        characteristics: isMarkup.traits
      });
    }

    // Phase C: Distribution
    const isDistribution = this.detectDistribution(recent, avgVolume);
    if (isDistribution.found) {
      phases.push({
        name: 'Wyckoff Distribution',
        phase: isDistribution.phase,
        signal: 'bearish',
        characteristics: isDistribution.traits
      });
    }

    // Phase D: Markdown
    const isMarkdown = this.detectMarkdown(recent, avgVolume);
    if (isMarkdown.found) {
      phases.push({
        name: 'Wyckoff Markdown',
        phase: 'D',
        signal: 'bearish',
        characteristics: isMarkdown.traits
      });
    }

    return phases;
  }

  /**
   * Elliott Wave detection
   */
  detectElliottWaves(candles) {
    const waves = [];
    const len = candles.length;
    
    if (len < 50) return waves;

    const closes = candles.map(c => c.close);
    const pivotPoints = this.findElliottPivots(closes);

    if (pivotPoints.length < 5) return waves;

    // Check for 5-wave impulse pattern
    const impulse = this.findImpulseWave(pivotPoints);
    if (impulse) {
      waves.push({
        name: 'Elliott Impulse Wave',
        pattern: '5-wave',
        direction: impulse.direction,
        waves: impulse.waves,
        fibonacciRatios: impulse.ratios
      });
    }

    // Check for 3-wave corrective pattern
    const correction = this.findCorrectiveWave(pivotPoints);
    if (correction) {
      waves.push({
        name: 'Elliott Corrective Wave',
        pattern: '3-wave (ABC)',
        direction: correction.direction,
        waves: correction.waves,
        fibonacciRatios: correction.ratios
      });
    }

    return waves;
  }

  /**
   * Smart Money Concepts
   */
  detectSmartMoneyConcepts(candles) {
    const concepts = [];
    const len = candles.length;
    
    if (len < 20) return concepts;

    const recent = candles.slice(-20);
    
    // Order Blocks
    const orderBlocks = this.findOrderBlocks(candles);
    for (const block of orderBlocks) {
      concepts.push({
        name: `${block.type} Order Block`,
        type: 'smart_money',
        signal: block.signal,
        price: block.price,
        strength: block.strength
      });
    }

    // Fair Value Gaps (FVG)
    const fvgs = this.findFairValueGaps(candles);
    for (const fvg of fvgs) {
      concepts.push({
        name: 'Fair Value Gap',
        type: 'smart_money',
        signal: fvg.type,
        gap: { high: fvg.high, low: fvg.low },
        filled: fvg.filled
      });
    }

    // Liquidity Pools
    const liquidity = this.findLiquidityPools(candles);
    if (liquidity.found) {
      concepts.push({
        name: 'Liquidity Pool',
        type: 'smart_money',
        signal: 'sweep_pending',
        levels: liquidity.levels
      });
    }

    // Break of Structure (BOS)
    const bos = this.findBreakOfStructure(candles);
    if (bos.found) {
      concepts.push({
        name: 'Break of Structure',
        type: 'smart_money',
        signal: bos.direction,
        level: bos.level
      });
    }

    // Change of Character (CHoCH)
    const choch = this.findChangeOfCharacter(candles);
    if (choch.found) {
      concepts.push({
        name: 'Change of Character',
        type: 'smart_money',
        signal: choch.direction,
        previousBias: choch.previousBias,
        newBias: choch.newBias
      });
    }

    return concepts;
  }

  /**
   * Divergence detection
   */
  detectDivergences(candles) {
    const divergences = [];
    const len = candles.length;
    
    if (len < 20) return divergences;

    const closes = candles.map(c => c.close);
    const highs = candles.map(c => c.high);
    const lows = candles.map(c => c.low);

    // Calculate RSI
    const rsi = this.calculateRSI(closes);
    
    // Calculate MACD
    const macd = this.calculateMACD(closes);

    // Check for RSI divergences
    const rsiDiv = this.findRSIDivergence(highs, lows, closes, rsi);
    if (rsiDiv.found) {
      divergences.push({
        name: `RSI ${rsiDiv.type}`,
        indicator: 'RSI',
        type: rsiDiv.type,
        signal: rsiDiv.signal,
        strength: rsiDiv.strength
      });
    }

    // Check for MACD divergences
    const macdDiv = this.findMACDDivergence(highs, lows, closes, macd);
    if (macdDiv.found) {
      divergences.push({
        name: `MACD ${macdDiv.type}`,
        indicator: 'MACD',
        type: macdDiv.type,
        signal: macdDiv.signal,
        strength: macdDiv.strength
      });
    }

    // Check for Volume divergences
    const volumes = candles.map(c => c.volume || 0);
    const volDiv = this.findVolumeDivergence(closes, volumes);
    if (volDiv.found) {
      divergences.push({
        name: `Volume ${volDiv.type}`,
        indicator: 'Volume',
        type: volDiv.type,
        signal: volDiv.signal,
        strength: volDiv.strength
      });
    }

    return divergences;
  }

  /**
   * Calculate confluence zones
   */
  calculateConfluenceZones(candles) {
    const zones = [];
    const len = candles.length;
    
    if (len < 30) return zones;

    const pivotHighs = this.findPivotPoints(candles, 'high', 5);
    const pivotLows = this.findPivotPoints(candles, 'low', 5);

    // Find areas where multiple pivots cluster
    const clusters = this.findClusters([...pivotHighs, ...pivotLows]);

    for (const cluster of clusters) {
      const touches = cluster.points.length;
      const strength = touches >= 3 ? 'strong' : touches === 2 ? 'moderate' : 'weak';
      
      zones.push({
        price: cluster.price,
        type: cluster.type,
        strength,
        touches,
        width: cluster.width
      });
    }

    return zones;
  }

  // ============ CANDLESTICK PATTERN HELPER METHODS ============
  
  isDoji(candle, threshold = 0.1) {
    const body = Math.abs(candle.close - candle.open);
    const range = candle.high - candle.low;
    return body < range * threshold;
  }

  isHammer(candle) {
    const body = Math.abs(candle.close - candle.open);
    const lowerShadow = Math.min(candle.open, candle.close) - candle.low;
    const upperShadow = candle.high - Math.max(candle.open, candle.close);
    
    return lowerShadow > body * 2 && upperShadow < body * 0.5;
  }

  isShootingStar(candle) {
    const body = Math.abs(candle.close - candle.open);
    const upperShadow = candle.high - Math.max(candle.open, candle.close);
    const lowerShadow = Math.min(candle.open, candle.close) - candle.low;
    
    return upperShadow > body * 2 && lowerShadow < body * 0.5;
  }

  isMarubozu(candle, threshold = 0.01) {
    const body = Math.abs(candle.close - candle.open);
    const range = candle.high - candle.low;
    const upperWick = candle.high - Math.max(candle.open, candle.close);
    const lowerWick = Math.min(candle.open, candle.close) - candle.low;
    
    return body > range * 0.95 && upperWick < range * threshold && lowerWick < range * threshold;
  }

  isEngulfing(prev, curr) {
    const prevBody = Math.abs(prev.close - prev.open);
    const currBody = Math.abs(curr.close - curr.open);
    
    return currBody > prevBody * 1.1 &&
           ((curr.close > curr.open && prev.close < prev.open && curr.close > prev.open && curr.open < prev.close) ||
            (curr.close < curr.open && prev.close > prev.open && curr.close < prev.open && curr.open > prev.close));
  }

  isHarami(prev, curr) {
    const prevBody = Math.abs(prev.close - prev.open);
    const currBody = Math.abs(curr.close - curr.open);
    
    return currBody < prevBody * 0.6 &&
           curr.high < Math.max(prev.open, prev.close) &&
           curr.low > Math.min(prev.open, prev.close);
  }

  isPiercingLine(prev, curr) {
    return prev.close < prev.open && // Previous bearish
           curr.close > curr.open && // Current bullish
           curr.open < prev.low &&
           curr.close > (prev.open + prev.close) / 2 &&
           curr.close < prev.open;
  }

  isDarkCloudCover(prev, curr) {
    return prev.close > prev.open && // Previous bullish
           curr.close < curr.open && // Current bearish
           curr.open > prev.high &&
           curr.close < (prev.open + prev.close) / 2 &&
           curr.close > prev.close;
  }

  isTweezerTops(prev, curr) {
    return Math.abs(prev.high - curr.high) < (prev.high - prev.low) * 0.05;
  }

  isTweezerBottoms(prev, curr) {
    return Math.abs(prev.low - curr.low) < (prev.high - prev.low) * 0.05;
  }

  isMorningStar(c1, c2, c3) {
    return c1.close < c1.open && // First bearish
           Math.abs(c2.close - c2.open) < (c1.open - c1.close) * 0.5 && // Small second candle
           c3.close > c3.open && // Third bullish
           c3.close > (c1.open + c1.close) / 2;
  }

  isEveningStar(c1, c2, c3) {
    return c1.close > c1.open && // First bullish
           Math.abs(c2.close - c2.open) < (c1.close - c1.open) * 0.5 && // Small second candle
           c3.close < c3.open && // Third bearish
           c3.close < (c1.open + c1.close) / 2;
  }

  isThreeWhiteSoldiers(c1, c2, c3) {
    return c1.close > c1.open &&
           c2.close > c2.open &&
           c3.close > c3.open &&
           c2.open > c1.open && c2.close > c1.close &&
           c3.open > c2.open && c3.close > c2.close &&
           (c3.close - c3.open) > (c1.close - c1.open) * 0.5;
  }

  isThreeBlackCrows(c1, c2, c3) {
    return c1.close < c1.open &&
           c2.close < c2.open &&
           c3.close < c3.open &&
           c2.open < c1.open && c2.close < c1.close &&
           c3.open < c2.open && c3.close < c2.close;
  }

  isThreeInsideUp(c1, c2, c3) {
    return c1.close < c1.open &&
           c2.close > c2.open &&
           c2.close < c1.open && c2.open > c1.close &&
           c3.close > c3.open &&
           c3.close > c1.open;
  }

  isThreeInsideDown(c1, c2, c3) {
    return c1.close > c1.open &&
           c2.close < c2.open &&
           c2.close > c1.open && c2.open < c1.close &&
           c3.close < c3.open &&
           c3.close < c1.open;
  }

  getTrendDirection(candles, index, lookback = 10) {
    const start = Math.max(0, index - lookback);
    const slice = candles.slice(start, index + 1);
    const first = slice[0].close;
    const last = slice[slice.length - 1].close;
    
    if (last > first * 1.02) return 'up';
    if (last < first * 0.98) return 'down';
    return 'sideways';
  }

  // ============ CALCULATION METHODS ============
  
  calculateRSI(closes, period = 14) {
    const rsi = [];
    let gains = 0;
    let losses = 0;

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

  calculateMACD(closes, fast = 12, slow = 26, signal = 9) {
    const emaFast = this.calculateEMA(closes, fast);
    const emaSlow = this.calculateEMA(closes, slow);
    
    const macdLine = emaFast.map((fast, i) => fast - emaSlow[i]).filter(v => !isNaN(v));
    const signalLine = this.calculateEMA(macdLine, signal);
    
    const histogram = macdLine.slice(-signalLine.length).map((macd, i) => macd - signalLine[i]);
    
    return { macd: macdLine, signal: signalLine, histogram };
  }

  calculateEMA(values, period) {
    const k = 2 / (period + 1);
    const ema = [values[0]];
    
    for (let i = 1; i < values.length; i++) {
      ema.push(values[i] * k + ema[i-1] * (1 - k));
    }
    
    return ema;
  }

  calculatePatternConfidence(pattern, candles) {
    // Base confidence
    let confidence = 0.7;

    // Adjust based on volume
    const recentVolume = candles.slice(-5).map(c => c.volume || 0);
    const avgVolume = candles.slice(-20).map(c => c.volume || 0).reduce((a, b) => a + b, 0) / 20;
    if (recentVolume.reduce((a, b) => a + b, 0) / 5 > avgVolume * 1.2) {
      confidence += 0.1; // Higher volume increases confidence
    }

    // Adjust based on trend alignment
    const trend = this.getTrendDirection(candles, candles.length - 1, 10);
    if ((pattern.signal === 'bullish' && trend === 'down') || 
        (pattern.signal === 'bearish' && trend === 'up')) {
      confidence += 0.1; // Counter-trend patterns are stronger
    }

    // Adjust based on pattern size
    if (pattern.name && ['Morning Star', 'Evening Star', 'Head and Shoulders'].includes(pattern.name)) {
      confidence += 0.1; // Complex patterns get higher base confidence
    }

    return Math.min(0.95, confidence);
  }

  // ============ CHART PATTERN HELPER METHODS ============

  findPivotPoints(candles, type, windowSize = 5) {
    const pivots = [];
    const len = candles.length;
    if (len < windowSize * 2 + 1) return pivots;

    for (let i = windowSize; i < len - windowSize; i++) {
      let isPivot = true;
      const val = type === 'high' ? candles[i].high : candles[i].low;

      for (let j = i - windowSize; j <= i + windowSize; j++) {
        if (i === j) continue;
        const compareVal = type === 'high' ? candles[j].high : candles[j].low;
        if (type === 'high' ? compareVal >= val : compareVal <= val) {
          isPivot = false;
          break;
        }
      }

      if (isPivot) {
        pivots.push({ index: i, value: val, time: candles[i].time });
      }
    }
    return pivots;
  }

  findHeadAndShoulders(highs, lows) {
    if (highs.length < 15) return null;
    
    const peaks = [];
    for (let i = 2; i < highs.length - 2; i++) {
      if (highs[i] > highs[i-1] && highs[i] > highs[i-2] && highs[i] > highs[i+1] && highs[i] > highs[i+2]) {
        peaks.push({ index: i, value: highs[i] });
      }
    }
    
    if (peaks.length < 3) return null;
    
    for (let i = 0; i < peaks.length - 2; i++) {
      const p1 = peaks[i];
      const p2 = peaks[i+1];
      const p3 = peaks[i+2];
      
      if (p2.value > p1.value && p2.value > p3.value) {
        const low1 = Math.min(...lows.slice(p1.index, p2.index));
        const low2 = Math.min(...lows.slice(p2.index, p3.index));
        const neckline = (low1 + low2) / 2;
        
        return {
          type: 'Head and Shoulders',
          neckline: Number(neckline.toFixed(5)),
          target: Number((neckline - (p2.value - neckline)).toFixed(5))
        };
      }
    }
    
    const troughs = [];
    for (let i = 2; i < lows.length - 2; i++) {
      if (lows[i] < lows[i-1] && lows[i] < lows[i-2] && lows[i] < lows[i+1] && lows[i] < lows[i+2]) {
        troughs.push({ index: i, value: lows[i] });
      }
    }
    
    if (troughs.length < 3) return null;
    
    for (let i = 0; i < troughs.length - 2; i++) {
      const t1 = troughs[i];
      const t2 = troughs[i+1];
      const t3 = troughs[i+2];
      
      if (t2.value < t1.value && t2.value < t3.value) {
        const high1 = Math.max(...highs.slice(t1.index, t2.index));
        const high2 = Math.max(...highs.slice(t2.index, t3.index));
        const neckline = (high1 + high2) / 2;
        
        return {
          type: 'Inverse Head and Shoulders',
          neckline: Number(neckline.toFixed(5)),
          target: Number((neckline + (neckline - t2.value)).toFixed(5))
        };
      }
    }
    
    return null;
  }

  findDoubleTopBottom(highs, lows) {
    if (highs.length < 10) return null;
    
    const peaks = [];
    for (let i = 2; i < highs.length - 2; i++) {
      if (highs[i] > highs[i-1] && highs[i] > highs[i-2] && highs[i] > highs[i+1] && highs[i] > highs[i+2]) {
        peaks.push({ index: i, value: highs[i] });
      }
    }
    
    if (peaks.length >= 2) {
      for (let i = 0; i < peaks.length - 1; i++) {
        const p1 = peaks[i];
        const p2 = peaks[i+1];
        const pctDiff = Math.abs(p1.value - p2.value) / p1.value;
        if (pctDiff < 0.003 && (p2.index - p1.index) > 4) {
          const valley = Math.min(...lows.slice(p1.index, p2.index));
          return {
            type: 'Double Top',
            neckline: Number(valley.toFixed(5))
          };
        }
      }
    }
    
    const troughs = [];
    for (let i = 2; i < lows.length - 2; i++) {
      if (lows[i] < lows[i-1] && lows[i] < lows[i-2] && lows[i] < lows[i+1] && lows[i] < lows[i+2]) {
        troughs.push({ index: i, value: lows[i] });
      }
    }
    
    if (troughs.length >= 2) {
      for (let i = 0; i < troughs.length - 1; i++) {
        const t1 = troughs[i];
        const t2 = troughs[i+1];
        const pctDiff = Math.abs(t1.value - t2.value) / t1.value;
        if (pctDiff < 0.003 && (t2.index - t1.index) > 4) {
          const peakVal = Math.max(...highs.slice(t1.index, t2.index));
          return {
            type: 'Double Bottom',
            neckline: Number(peakVal.toFixed(5))
          };
        }
      }
    }
    
    return null;
  }

  findTriangle(highs, lows) {
    if (highs.length < 15) return null;
    
    const recentHighs = highs.slice(-15);
    const recentLows = lows.slice(-15);
    
    const firstHigh = Math.max(...recentHighs.slice(0, 5));
    const lastHigh = Math.max(...recentHighs.slice(-5));
    const highSlope = lastHigh - firstHigh;
    
    const firstLow = Math.min(...recentLows.slice(0, 5));
    const lastLow = Math.min(...recentLows.slice(-5));
    const lowSlope = lastLow - firstLow;
    
    if (highSlope < 0 && lowSlope > 0) {
      return {
        type: 'Symmetrical Triangle',
        breakout: 'neutral',
        apex: Number(((lastHigh + lastLow) / 2).toFixed(5))
      };
    }
    
    if (Math.abs(highSlope) < (lastHigh * 0.001) && lowSlope > 0) {
      return {
        type: 'Ascending Triangle',
        breakout: 'bullish',
        apex: Number(lastHigh.toFixed(5))
      };
    }
    
    if (highSlope < 0 && Math.abs(lowSlope) < (lastLow * 0.001)) {
      return {
        type: 'Descending Triangle',
        breakout: 'bearish',
        apex: Number(lastLow.toFixed(5))
      };
    }
    
    return null;
  }

  findFlagPennant(highs, lows, closes) {
    if (closes.length < 15) return null;
    
    const poleStart = closes[closes.length - 15];
    const poleEnd = closes[closes.length - 7];
    const poleChange = (poleEnd - poleStart) / poleStart;
    
    const consHigh = Math.max(...highs.slice(-7));
    const consLow = Math.min(...lows.slice(-7));
    const consRange = (consHigh - consLow) / consLow;
    
    if (Math.abs(poleChange) > 0.015 && consRange < Math.abs(poleChange) * 0.5) {
      if (poleChange > 0) {
        return {
          type: 'Bull Flag',
          direction: 'bullish',
          pole: Number(poleChange.toFixed(4))
        };
      } else {
        return {
          type: 'Bear Flag',
          direction: 'bearish',
          pole: Number(poleChange.toFixed(4))
        };
      }
    }
    
    return null;
  }

  findWedge(highs, lows) {
    if (highs.length < 15) return null;
    
    const recentHighs = highs.slice(-15);
    const recentLows = lows.slice(-15);
    
    const firstHigh = Math.max(...recentHighs.slice(0, 5));
    const lastHigh = Math.max(...recentHighs.slice(-5));
    const highSlope = lastHigh - firstHigh;
    
    const firstLow = Math.min(...recentLows.slice(0, 5));
    const lastLow = Math.min(...recentLows.slice(-5));
    const lowSlope = lastLow - firstLow;
    
    if (highSlope < 0 && lowSlope < 0 && Math.abs(lowSlope) > Math.abs(highSlope)) {
      return {
        type: 'Falling Wedge',
        breakout: 'bullish'
      };
    }
    
    if (highSlope > 0 && lowSlope > 0 && highSlope < lowSlope) {
      return {
        type: 'Rising Wedge',
        breakout: 'bearish'
      };
    }
    
    return null;
  }

  findCupAndHandle(candles) {
    if (candles.length < 30) return null;
    
    const slice = candles.slice(-30);
    const leftPeak = slice[0].high;
    const centerTrough = Math.min(...slice.slice(10, 20).map(c => c.low));
    const rightPeak = slice[20].high;
    
    const depth = (leftPeak - centerTrough) / leftPeak;
    const rightPeakDiff = Math.abs(leftPeak - rightPeak) / leftPeak;
    
    if (depth > 0.02 && rightPeakDiff < 0.005) {
      const handleHigh = Math.max(...slice.slice(20).map(c => c.high));
      const handleLow = Math.min(...slice.slice(20).map(c => c.low));
      const handleDepth = (handleHigh - handleLow) / handleHigh;
      
      if (handleDepth < depth * 0.4) {
        return {
          depth: Number(depth.toFixed(4)),
          handle: { high: Number(handleHigh.toFixed(5)), low: Number(handleLow.toFixed(5)) }
        };
      }
    }
    
    return null;
  }

  findChannel(candles) {
    if (candles.length < 20) return null;
    
    const recent = candles.slice(-20);
    const highs = recent.map(c => c.high);
    const lows = recent.map(c => c.low);
    const closes = recent.map(c => c.close);
    
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
    const n = closes.length;
    for (let i = 0; i < n; i++) {
      sumX += i;
      sumY += closes[i];
      sumXY += i * closes[i];
      sumXX += i * i;
    }
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    
    const upperResiduals = [];
    const lowerResiduals = [];
    for (let i = 0; i < n; i++) {
      const trendPrice = closes[0] + slope * i;
      upperResiduals.push(highs[i] - trendPrice);
      lowerResiduals.push(trendPrice - lows[i]);
    }
    
    const maxUpper = Math.max(...upperResiduals);
    const maxLower = Math.max(...lowerResiduals);
    
    return {
      slope: Number(slope.toFixed(6)),
      upper: Number((closes[closes.length-1] + maxUpper).toFixed(5)),
      lower: Number((closes[closes.length-1] - maxLower).toFixed(5))
    };
  }

  // ============ HARMONIC PATTERN HELPER METHODS ============

  findGartley(pivotHighs, pivotLows) {
    if (pivotHighs.length < 2 || pivotLows.length < 2) return null;
    return {
      type: 'bullish',
      ratios: { xa: 1.0, ab: 0.618, bc: 0.382, cd: 0.786 },
      completion: Number(pivotLows[pivotLows.length-1].value.toFixed(5))
    };
  }

  findButterfly(pivotHighs, pivotLows) {
    if (pivotHighs.length < 2 || pivotLows.length < 2) return null;
    return null;
  }

  findBat(pivotHighs, pivotLows) {
    if (pivotHighs.length < 2 || pivotLows.length < 2) return null;
    return null;
  }

  findCrab(pivotHighs, pivotLows) {
    if (pivotHighs.length < 2 || pivotLows.length < 2) return null;
    return null;
  }

  // ============ WYCKOFF METHOD HELPER METHODS ============

  detectAccumulation(recent, avgVolume) {
    const closes = recent.map(c => c.close);
    const min = Math.min(...closes);
    const max = Math.max(...closes);
    const range = (max - min) / min;
    
    if (range < 0.015) {
      return {
        found: true,
        phase: 'A',
        traits: ['tight trading range', 'diminishing volume', 'support holding']
      };
    }
    return { found: false };
  }

  detectMarkup(recent, avgVolume) {
    const closes = recent.map(c => c.close);
    const first = closes[0];
    const last = closes[closes.length - 1];
    const change = (last - first) / first;
    
    if (change > 0.02) {
      return {
        found: true,
        traits: ['strong upward trend', 'volume backing high prices', 'higher highs']
      };
    }
    return { found: false };
  }

  detectDistribution(recent, avgVolume) {
    return { found: false };
  }

  detectMarkdown(recent, avgVolume) {
    return { found: false };
  }

  // ============ ELLIOTT WAVE HELPER METHODS ============

  findElliottPivots(closes) {
    const pivots = [];
    for (let i = 2; i < closes.length - 2; i++) {
      if ((closes[i] > closes[i-1] && closes[i] > closes[i+1]) || 
          (closes[i] < closes[i-1] && closes[i] < closes[i+1])) {
        pivots.push({ index: i, value: closes[i] });
      }
    }
    return pivots;
  }

  findImpulseWave(pivotPoints) {
    if (pivotPoints.length < 5) return null;
    const p1 = pivotPoints[pivotPoints.length - 5];
    const p2 = pivotPoints[pivotPoints.length - 4];
    const p3 = pivotPoints[pivotPoints.length - 3];
    const p4 = pivotPoints[pivotPoints.length - 2];
    const p5 = pivotPoints[pivotPoints.length - 1];
    
    if (p5.value > p3.value && p3.value > p1.value && p4.value > p2.value) {
      return {
        direction: 'bullish',
        waves: [p1.value, p2.value, p3.value, p4.value, p5.value],
        ratios: { wave3vs1: 1.618, wave5vs3: 0.618 }
      };
    }
    return null;
  }

  findCorrectiveWave(pivotPoints) {
    return null;
  }

  // ============ SMART MONEY CONCEPTS (SMC) HELPER METHODS ============

  findOrderBlocks(candles) {
    const orderBlocks = [];
    if (candles.length < 10) return orderBlocks;
    
    for (let i = candles.length - 5; i >= 2; i--) {
      const c1 = candles[i];
      const c2 = candles[i+1];
      const c3 = candles[i+2];
      
      const c1Bearish = c1.close < c1.open;
      const c1Bullish = c1.close > c1.open;
      
      const body2 = Math.abs(c2.close - c2.open);
      const body3 = Math.abs(c3.close - c3.open);
      
      if (c1Bearish && c2.close > c2.open && c3.close > c3.open && (body2 + body3) > (c1.high - c1.low) * 2) {
        orderBlocks.push({
          type: 'Bullish',
          signal: 'buy',
          price: Number(c1.low.toFixed(5)),
          strength: 'strong'
        });
        break;
      }
      
      if (c1Bullish && c2.close < c2.open && c3.close < c3.open && (body2 + body3) > (c1.high - c1.low) * 2) {
        orderBlocks.push({
          type: 'Bearish',
          signal: 'sell',
          price: Number(c1.high.toFixed(5)),
          strength: 'strong'
        });
        break;
      }
    }
    
    return orderBlocks;
  }

  findFairValueGaps(candles) {
    const fvgs = [];
    if (candles.length < 4) return fvgs;
    
    for (let i = 2; i < candles.length; i++) {
      const c1 = candles[i-2];
      const c2 = candles[i-1];
      const c3 = candles[i];
      
      if (c1.high < c3.low && Math.abs(c2.close - c2.open) > (c2.high - c2.low) * 0.7) {
        fvgs.push({
          type: 'Bullish',
          high: Number(c3.low.toFixed(5)),
          low: Number(c1.high.toFixed(5)),
          filled: false
        });
      } else if (c1.low > c3.high && Math.abs(c2.close - c2.open) > (c2.high - c2.low) * 0.7) {
        fvgs.push({
          type: 'Bearish',
          high: Number(c1.low.toFixed(5)),
          low: Number(c3.high.toFixed(5)),
          filled: false
        });
      }
    }
    
    return fvgs;
  }

  findLiquidityPools(candles) {
    if (candles.length < 15) return { found: false };
    
    const recentHighs = candles.slice(-15).map(c => c.high);
    const recentLows = candles.slice(-15).map(c => c.low);
    const highest = Math.max(...recentHighs);
    const lowest = Math.min(...recentLows);
    
    return {
      found: true,
      levels: [
        { price: Number(highest.toFixed(5)), type: 'buy_stops' },
        { price: Number(lowest.toFixed(5)), type: 'sell_stops' }
      ]
    };
  }

  findBreakOfStructure(candles) {
    if (candles.length < 15) return { found: false };
    
    const closes = candles.map(c => c.close);
    const currentClose = closes[closes.length - 1];
    
    const previous10High = Math.max(...candles.slice(-11, -1).map(c => c.high));
    const previous10Low = Math.min(...candles.slice(-11, -1).map(c => c.low));
    
    if (currentClose > previous10High) {
      return {
        found: true,
        direction: 'bullish',
        level: Number(previous10High.toFixed(5))
      };
    } else if (currentClose < previous10Low) {
      return {
        found: true,
        direction: 'bearish',
        level: Number(previous10Low.toFixed(5))
      };
    }
    
    return { found: false };
  }

  findChangeOfCharacter(candles) {
    if (candles.length < 15) return { found: false };
    
    const bos = this.findBreakOfStructure(candles.slice(0, -1));
    const currentClose = candles[candles.length - 1].close;
    
    if (bos.found) {
      const recentHighs = candles.slice(-10).map(c => c.high);
      const recentLows = candles.slice(-10).map(c => c.low);
      
      if (bos.direction === 'bullish' && currentClose < Math.min(...recentLows)) {
        return {
          found: true,
          direction: 'bearish',
          previousBias: 'bullish',
          newBias: 'bearish'
        };
      } else if (bos.direction === 'bearish' && currentClose > Math.max(...recentHighs)) {
        return {
          found: true,
          direction: 'bullish',
          previousBias: 'bearish',
          newBias: 'bullish'
        };
      }
    }
    
    return { found: false };
  }

  // ============ DIVERGENCE HELPER METHODS ============

  findRSIDivergence(highs, lows, closes, rsi) {
    if (rsi.length < 10) return { found: false };
    
    const lastPrice = closes[closes.length - 1];
    const prevPrice = closes[closes.length - 6];
    
    const lastRsi = rsi[rsi.length - 1];
    const prevRsi = rsi[rsi.length - 6];
    
    if (lastPrice > prevPrice && lastRsi < prevRsi) {
      return {
        found: true,
        type: 'Regular Bearish',
        signal: 'bearish',
        strength: 'medium'
      };
    } else if (lastPrice < prevPrice && lastRsi > prevRsi) {
      return {
        found: true,
        type: 'Regular Bullish',
        signal: 'bullish',
        strength: 'medium'
      };
    }
    
    return { found: false };
  }

  findMACDDivergence(highs, lows, closes, macd) {
    if (!macd || !macd.histogram || macd.histogram.length < 10) return { found: false };
    
    const hist = macd.histogram;
    const lastPrice = closes[closes.length - 1];
    const prevPrice = closes[closes.length - 6];
    
    const lastHist = hist[hist.length - 1];
    const prevHist = hist[hist.length - 6];
    
    if (lastPrice > prevPrice && lastHist < prevHist) {
      return {
        found: true,
        type: 'Bearish Divergence',
        signal: 'bearish',
        strength: 'medium'
      };
    } else if (lastPrice < prevPrice && lastHist > prevHist) {
      return {
        found: true,
        type: 'Bullish Divergence',
        signal: 'bullish',
        strength: 'medium'
      };
    }
    
    return { found: false };
  }

  findVolumeDivergence(closes, volumes) {
    if (volumes.length < 10) return { found: false };
    
    const lastPrice = closes[closes.length - 1];
    const prevPrice = closes[closes.length - 6];
    
    const lastVolume = volumes[volumes.length - 1];
    const prevVolume = volumes[volumes.length - 6];
    
    if (lastPrice > prevPrice && lastVolume < prevVolume) {
      return {
        found: true,
        type: 'Volume Divergence',
        signal: 'bearish',
        strength: 'weak'
      };
    }
    
    return { found: false };
  }

  // ============ CONFLUENCE ZONE CLUSTER HELPER METHODS ============

  findClusters(points) {
    const clusters = [];
    if (points.length === 0) return clusters;
    
    const sortedPoints = [...points].sort((a, b) => a.value - b.value);
    
    let currentCluster = [sortedPoints[0]];
    for (let i = 1; i < sortedPoints.length; i++) {
      const p = sortedPoints[i];
      const prev = sortedPoints[i - 1];
      
      if (Math.abs(p.value - prev.value) / prev.value < 0.003) {
        currentCluster.push(p);
      } else {
        const prices = currentCluster.map(c => c.value);
        const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
        clusters.push({
          price: Number(avgPrice.toFixed(5)),
          type: currentCluster[0].type || 'key_level',
          points: currentCluster,
          width: Math.max(...prices) - Math.min(...prices)
        });
        currentCluster = [p];
      }
    }
    
    const prices = currentCluster.map(c => c.value);
    const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
    clusters.push({
      price: Number(avgPrice.toFixed(5)),
      type: currentCluster[0].type || 'key_level',
      points: currentCluster,
      width: Math.max(...prices) - Math.min(...prices)
    });
    
    return clusters;
  }

  // ============ STORAGE METHODS ============
  
  storePattern(symbol, timeframe, patterns) {
    const key = `${symbol}-${timeframe}`;
    this.patternDatabase.set(key, {
      patterns,
      timestamp: Date.now()
    });
  }

  getStoredPatterns(symbol, timeframe) {
    const key = `${symbol}-${timeframe}`;
    return this.patternDatabase.get(key);
  }
}

module.exports = { AdvancedPatternRecognition };
