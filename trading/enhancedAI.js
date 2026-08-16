/**
 * Enhanced AI Analysis System
 * Combines news, movement, patterns, and technical analysis for AI
 */
class EnhancedAIAnalysis {
  constructor() {
    this.modelPreferences = {
      gemini: 'gemini-2.5-flash',
      openai: 'gpt-4o'
    };
  }

  /**
   * Build comprehensive AI payload with all data sources
   */
  buildEnhancedPayload(marketData, technicalAnalysis, newsData, movementData, patternData, predictiveData, mtfData) {
    return {
      market: {
        symbol: marketData.symbol,
        timeframe: marketData.timeframe,
        price: marketData.price,
        change24h: marketData.change24h,
        volume24h: marketData.volume24h
      },

      technical: {
        trend: technicalAnalysis.bias,
        confidence: technicalAnalysis.confidence,
        structure: technicalAnalysis.structure,
        indicators: technicalAnalysis.indicators,
        scorecard: technicalAnalysis.scorecard,
        setups: technicalAnalysis.setups
      },

      news: {
        sentiment: newsData?.sentiment || { overall: 'neutral', score: 0 },
        impact: newsData?.impact || { level: 'low', score: 0 },
        keyEvents: newsData?.keyEvents || [],
        totalArticles: newsData?.totalArticles || 0,
        entities: newsData?.entities || {},
        summary: newsData?.summary || 'No news data available'
      },

      movement: {
        priceChange: movementData?.priceChange || { direction: 'neutral', percent: 0 },
        volatility: movementData?.volatility || { level: 'low', index: 0 },
        momentum: movementData?.momentum || { direction: 'neutral', strength: 'weak' },
        trend: movementData?.trend || { direction: 'sideways' },
        patterns: movementData?.patterns || [],
        supportResistance: movementData?.supportResistance || { support: [], resistance: [] }
      },

      patterns: {
        detected: patternData?.candlestick || [],
        chartPatterns: patternData?.chart || [],
        harmonic: patternData?.harmonic || [],
        smartMoney: patternData?.smartMoney || [],
        divergences: patternData?.divergences || []
      },

      predictive: {
        priceTarget: predictiveData?.price || {},
        volatilityForecast: predictiveData?.volatility || {},
        trendPrediction: predictiveData?.trend || {},
        probabilities: predictiveData?.probabilities || {},
        scenarios: predictiveData?.scenarios || {}
      },

      multiTimeframe: {
        confluence: mtfData?.confluenceScore || {},
        alignedTimeframes: mtfData?.alignedTimeframes || {},
        divergences: mtfData?.divergences || [],
        recommendation: mtfData?.recommendation || {}
      },

      context: {
        sessionTime: new Date().toISOString(),
        marketSession: this.getMarketSession(),
        economicEvents: this.getUpcomingEconomicEvents(),
        riskLevel: this.assessRiskLevel(newsData, movementData)
      }
    };
  }

  /**
   * Generate enhanced system prompt
   */
  generateEnhancedSystemPrompt() {
    return `You are an elite trading analyst combining technical analysis, news sentiment, and market psychology.

Your analysis framework:

1. NEWS & SENTIMENT ANALYSIS (Primary weight: 30%)
- Analyze news sentiment: positive/negative/neutral with confidence scores
- Identify key market-moving events (Fed decisions, earnings, geopolitical events)
- Consider news impact level and source reliability
- Factor in breaking news developments

2. TECHNICAL ANALYSIS (Weight: 35%)
- Structure: Evaluate market structure (trend, range, consolidation)
- Indicators: RSI, MACD, EMA alignment, ADX strength
- Patterns: Candlestick patterns, chart patterns, harmonic patterns
- SMC: Order blocks, FVGs, liquidity pools, break of structure
- Levels: Support/resistance, Fibonacci, key psychological levels

3. MOVEMENT & MOMENTUM ANALYSIS (Weight: 20%)
- Price action: Recent price movements and volatility
- Momentum: Direction and strength of current momentum
- Volume: Volume profile and trend confirmation
- Patterns: Detected patterns and their reliability

4. PREDICTIVE ANALYTICS (Weight: 15%)
- Probabilities: Bullish/bearish/sideways probability distribution
- Scenarios: Bullish, bearish, and base case scenarios
- Timeframes: Short, medium, and long-term forecasts
- Confidence: Overall forecast confidence level

5. MULTI-TIMEFRAME CONTEXT
- Higher timeframe trend direction
- Confluence across timeframes
- Divergence detection and implications
- Alignment or conflict between timeframes

ANALYSIS OUTPUT FORMAT:
{
  "marketState": "brief market context",
  "directionalBias": "bullish|bearish|neutral",
  "confidence": "0-100",
  "sentimentImpact": "how news affects the trade",
  "technicalSetup": "key technical factors",
  "confluence": {
    "score": "0-100",
    "factors": ["aligned indicators"]
  },
  "riskFlags": ["potential risks"],
  "invalidations": ["what would invalidate the thesis"],
  "entryPlan": {
    "entry": "price range",
    "stop": "stop loss",
    "target1": "first target",
    "target2": "second target",
    "rr": "risk:reward ratio"
  },
  "timeHorizon": "expected duration",
  "oneLineCall": "executive summary"
}

CRITICAL RULES:
- If news sentiment strongly contradicts technicals, favor sentiment for short-term (1-4h), technicals for longer-term
- High-impact news events override technical setups temporarily
- Low confidence (<40%) = No trade recommendation
- Always consider risk management first
- Provide specific price levels, not vague ranges`;
  }

  /**
   * Generate comprehensive analysis request
   */
  generateAnalysisRequest(payload) {
    const sections = [];

    // Market Overview
    sections.push(`## Market Overview
Symbol: ${payload.market.symbol}
Timeframe: ${payload.market.timeframe}
Current Price: ${payload.market.price}
24h Change: ${payload.market.change24h}%
Market Session: ${payload.context.marketSession}`);

    // News Analysis
    sections.push(`## News & Sentiment Analysis
Sentiment: ${payload.news.sentiment.overall} (${payload.news.sentiment.score}/100)
News Impact: ${payload.news.impact.level} (score: ${payload.news.impact.score}/100)
Articles Analyzed: ${payload.news.totalArticles}

Key Events:
${payload.news.keyEvents.map(e => `- ${e.name} (mentions: ${e.mentions}, sources: ${e.sources.length})`).join('\n')}

Detected Entities:
- Organizations: ${payload.news.entities.organizations?.join(', ') || 'None'}
- Events: ${payload.news.entities.events?.join(', ') || 'None'}

News Summary: ${payload.news.summary}`);

    // Technical Analysis
    sections.push(`## Technical Analysis
Bias: ${payload.technical.trend}
Confidence: ${payload.technical.confidence}%
Structure: ${JSON.stringify(payload.technical.structure)}

Indicators:
- RSI: ${payload.technical.indicators.rsi14}
- MACD Histogram: ${payload.technical.indicators.macdHistogram}
- ADX: ${payload.technical.indicators.adx}
- EMA20: ${payload.technical.indicators.ema20}
- EMA50: ${payload.technical.indicators.ema50}

Scorecard:
- Trend: ${payload.technical.scorecard.trend}/100
- Momentum: ${payload.technical.scorecard.momentum}/100
- Structure: ${payload.technical.scorecard.structure}/100
- Timing: ${payload.technical.scorecard.timing}/100
- Confluence: ${payload.technical.scorecard.confluence}/100`);

    // Movement Analysis
    sections.push(`## Movement Analysis
Price Change: ${payload.movement.priceChange.direction} ${payload.movement.priceChange.percent}%
Volatility: ${payload.movement.volatility.level} (index: ${payload.movement.volatility.index})
Momentum: ${payload.movement.momentum.direction} (strength: ${payload.movement.momentum.strength})
Trend: ${payload.movement.trend.direction}

Detected Patterns: ${payload.movement.patterns.length > 0 ? payload.movement.patterns.map(p => p.type).join(', ') : 'None'}

Support/Resistance:
- Support: ${payload.movement.supportResistance.support.slice(0, 3).map(s => s.price).join(', ')}
- Resistance: ${payload.movement.supportResistance.resistance.slice(0, 3).map(r => r.price).join(', ')}`);

    // Patterns
    if (payload.patterns.detected.length > 0 || payload.patterns.chartPatterns.length > 0) {
      sections.push(`## Pattern Analysis
Candlestick Patterns:
${payload.patterns.detected.slice(0, 5).map(p => `- ${p.name} (${p.type}, ${p.signal})`).join('\n')}

Chart Patterns:
${payload.patterns.chartPatterns.slice(0, 3).map(p => `- ${p.name} (${p.signal})`).join('\n')}

Divergences:
${payload.patterns.divergences.map(d => `- ${d.name} (${d.signal}, strength: ${d.strength})`).join('\n')}`);
    }

    // Predictive
    sections.push(`## Predictive Analytics
Price Targets:
- Next 1h: ${payload.predictive.priceTarget.predictions?.next1h?.target} (confidence: ${Math.round(payload.predictive.priceTarget.predictions?.next1h?.confidence * 100)}%)
- Next 4h: ${payload.predictive.priceTarget.predictions?.next4h?.target}
- Next 1d: ${payload.predictive.priceTarget.predictions?.next1d?.target}

Volatility Forecast:
- Current: ${payload.predictive.volatilityForecast.current}%
- Predicted: ${payload.predictive.volatilityForecast.predicted}%
- Regime: ${payload.predictive.volatilityForecast.regime}

Probabilities:
- Bullish: ${payload.predictive.probabilities.bullish}%
- Bearish: ${payload.predictive.probabilities.bearish}%
- Sideways: ${payload.predictive.probabilities.sideways}%

Scenarios:
- Bullish: ${payload.predictive.scenarios.bullish.target} (probability: ${payload.predictive.scenarios.bullish.probability}%)
- Bearish: ${payload.predictive.scenarios.bearish.target} (probability: ${payload.predictive.scenarios.bearish.probability}%)
- Base: ${payload.predictive.scenarios.base.target} (probability: ${payload.predictive.scenarios.base.probability}%)`);

    // Multi-Timeframe
    sections.push(`## Multi-Timeframe Analysis
Confluence Score: ${payload.multiTimeframe.confluence.score}/100
Direction: ${payload.multiTimeframe.confluence.direction}
Strength: ${payload.multiTimeframe.confluence.strength}

Timeframe Alignment:
- Bullish Timeframes: ${payload.multiTimeframe.alignedTimeframes.bullish.map(t => t.timeframe).join(', ') || 'None'}
- Bearish Timeframes: ${payload.multiTimeframe.alignedTimeframes.bearish.map(t => t.timeframe).join(', ') || 'None'}

Divergences: ${payload.multiTimeframe.divergences.length > 0 ? payload.multiTimeframe.divergences.map(d => d.message).join('; ') : 'None'}

MTF Recommendation: ${payload.multiTimeframe.recommendation.action} (${payload.multiTimeframe.recommendation.reasons.join(', ')})`);

    // Context
    sections.push(`## Market Context
Risk Level: ${payload.context.riskLevel}
Upcoming Events: ${payload.context.economicEvents.join(', ') || 'None'}
Analysis Time: ${payload.context.sessionTime}`);

    // Request
    sections.push(`## Analysis Request
Based on all the data above, provide a comprehensive trading analysis including:
1. Overall market state and directional bias
2. Confidence level (0-100) with explanation
3. How news sentiment impacts the trade
4. Key technical factors and confluence
5. Risk flags and invalidation points
6. Specific entry, stop, and target levels
7. Time horizon for the trade
8. One-line executive summary

Format your response as valid JSON.`);

    return sections.join('\n\n');
  }

  /**
   * Get current market session
   */
  getMarketSession() {
    const hour = new Date().getUTCHours();
    const day = new Date().getUTCDay();
    
    if (day === 0 || day === 6) return 'weekend';
    if (hour >= 0 && hour < 9) return 'asian';
    if (hour >= 9 && hour < 17) return 'london';
    if (hour >= 13 && hour < 22) return 'new_york';
    return 'overlap';
  }

  /**
   * Get upcoming economic events
   */
  getUpcomingEconomicEvents() {
    // This would normally fetch from an economic calendar API
    return [];
  }

  /**
   * Assess overall risk level
   */
  assessRiskLevel(newsData, movementData) {
    let riskScore = 0;

    // News risk
    if (newsData?.impact?.level === 'high') riskScore += 3;
    else if (newsData?.impact?.level === 'medium') riskScore += 2;
    else riskScore += 1;

    // Volatility risk
    if (movementData?.volatility?.level === 'high') riskScore += 3;
    else if (movementData?.volatility?.level === 'medium') riskScore += 2;
    else riskScore += 1;

    if (riskScore >= 5) return 'high';
    if (riskScore >= 3) return 'medium';
    return 'low';
  }

  /**
   * Calculate sentiment alignment with technicals
   */
  calculateSentimentTechnicalAlignment(newsData, technicalData) {
    const sentiment = newsData?.sentiment?.overall || 'neutral';
    const technical = technicalData?.bias || 'neutral';

    const alignment = {
      aligned: false,
      type: 'neutral',
      strength: 0
    };

    if ((sentiment === 'positive' && technical === 'bullish') ||
        (sentiment === 'negative' && technical === 'bearish')) {
      alignment.aligned = true;
      alignment.type = 'strong';
      alignment.strength = 100;
    } else if ((sentiment === 'positive' && technical === 'bearish') ||
               (sentiment === 'negative' && technical === 'bullish')) {
      alignment.aligned = false;
      alignment.type = 'conflict';
      alignment.strength = 100;
    } else {
      alignment.type = 'neutral';
      alignment.strength = 50;
    }

    return alignment;
  }
}

module.exports = { EnhancedAIAnalysis };
