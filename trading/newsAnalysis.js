require("dotenv").config();
const axios = require("axios");

// News API integration
class NewsAnalyzer {
  constructor() {
    this.newsApiKey = process.env.NEWS_API_KEY;
    this.cache = new Map();
    this.rateLimiter = {
      lastRequest: 0,
      minInterval: 1000, // 1 second between requests
      requestCount: 0,
      maxRequestsPerHour: 100,
      hourStart: Date.now()
    };
    this.cacheTtl = 5 * 60 * 1000; // 5 minutes
  }

  async waitForRateLimit() {
    const now = Date.now();
    
    // Reset counter every hour
    if (now - this.rateLimiter.hourStart > 60 * 60 * 1000) {
      this.rateLimiter.requestCount = 0;
      this.rateLimiter.hourStart = now;
    }
    
    // Check hourly limit
    if (this.rateLimiter.requestCount >= this.rateLimiter.maxRequestsPerHour) {
      const waitTime = 60 * 60 * 1000 - (now - this.rateLimiter.hourStart);
      console.warn(`News API hourly rate limit reached. Waiting ${Math.round(waitTime/1000)} seconds...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    // Check minimum interval
    const timeSinceLastRequest = now - this.rateLimiter.lastRequest;
    if (timeSinceLastRequest < this.rateLimiter.minInterval) {
      await new Promise(resolve => setTimeout(resolve, this.rateLimiter.minInterval - timeSinceLastRequest));
    }
    
    this.rateLimiter.lastRequest = Date.now();
    this.rateLimiter.requestCount++;
  }

  async fetchMarketNews(symbol, timeframe = '1h') {
    // Use longer cache for rate limiting
    const cacheKey = `${symbol}-${timeframe}`;
    const now = Date.now();
    
    // Check cache first
    for (const [key, value] of this.cache.entries()) {
      if (key.startsWith(cacheKey) && (now - value.timestamp) < this.cacheTtl) {
        return value.data;
      }
    }
    
    // Wait for rate limit
    await this.waitForRateLimit();
    
    try {
      // Convert symbol to news-friendly format
      const searchTerms = this.getNewsSearchTerms(symbol);
      
      // Fetch recent news (last 7 days to cover weekends and quiet sessions)
      const response = await axios.get(`https://newsapi.org/v2/everything`, {
        params: {
          q: searchTerms.join(' OR '),
          language: 'en',
          sortBy: 'publishedAt',
          from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          to: new Date().toISOString(),
          pageSize: 15,
          apiKey: this.newsApiKey
        },
        timeout: 8000
      });

      const news = response.data?.articles || [];
      if (news.length > 0) {
        const analysis = this.analyzeNewsImpact(news, symbol);
        this.cache.set(`${cacheKey}-${now}`, { data: analysis, timestamp: now });
        this.cleanCache();
        return analysis;
      }

      // If NewsAPI returned 0 articles, fallback to MultiSource RSS feeds
      const { MultiSourceNewsAggregator } = require("./multiSourceNews");
      const rssAggregator = new MultiSourceNewsAggregator();
      const rssResult = await rssAggregator.aggregateNews(symbol, timeframe);

      if (rssResult && rssResult.totalArticles > 0) {
        this.cache.set(`${cacheKey}-${now}`, { data: rssResult, timestamp: now });
        return rssResult;
      }

      return this.getDefaultNewsAnalysis(symbol);
      
    } catch (error) {
      // Fallback to RSS aggregator on error
      try {
        const { MultiSourceNewsAggregator } = require("./multiSourceNews");
        const rssAggregator = new MultiSourceNewsAggregator();
        const rssResult = await rssAggregator.aggregateNews(symbol, timeframe);
        if (rssResult && rssResult.totalArticles > 0) {
          return rssResult;
        }
      } catch (_rssErr) {}

      return this.getDefaultNewsAnalysis(symbol);
    }
  }

  cleanCache() {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.cacheTtl) {
        this.cache.delete(key);
      }
    }
  }

  getNewsSearchTerms(symbol) {
    const cleanSymbol = String(symbol || "").trim().toUpperCase();
    
    // Base global macro terms that affect all financial instruments generally
    const baseMacroTerms = ['Fed', 'inflation', 'interest rates', 'GDP', 'CPI', 'macro', 'yields', 'geopolitical'];
    
    // 1. Precious Metals & Commodities (Gold, Silver, Oil)
    if (cleanSymbol.includes('XAU') || cleanSymbol.includes('GOLD') || cleanSymbol === 'GC=F') {
      return ['Gold', 'XAU', 'precious metals', 'DXY', 'safe haven', 'commodities', ...baseMacroTerms];
    }
    if (cleanSymbol.includes('XAG') || cleanSymbol.includes('SILVER') || cleanSymbol === 'SI=F') {
      return ['Silver', 'XAG', 'precious metals', 'commodities', 'safe haven', ...baseMacroTerms];
    }
    if (cleanSymbol.includes('OIL') || cleanSymbol.includes('CRUDE') || cleanSymbol === 'CL=F' || cleanSymbol === 'USOIL') {
      return ['Oil', 'Crude', 'WTI', 'Brent', 'OPEC', 'energy', 'commodities', ...baseMacroTerms];
    }
    
    // 2. Cryptocurrencies
    if (cleanSymbol.includes('BTC') || cleanSymbol.includes('BITCOIN') || 
        cleanSymbol.includes('ETH') || cleanSymbol.includes('ETHEREUM') ||
        cleanSymbol.includes('SOL') || cleanSymbol.includes('DOGE') ||
        cleanSymbol.includes('XRP') || cleanSymbol.includes('ADA') ||
        ['CRYPTO', 'CRYPTOCURRENCY'].some(t => cleanSymbol.includes(t))) {
      
      const specific = [];
      if (cleanSymbol.includes('BTC') || cleanSymbol.includes('BITCOIN')) {
        specific.push('Bitcoin', 'BTC', 'satoshi');
      } else if (cleanSymbol.includes('ETH') || cleanSymbol.includes('ETHEREUM')) {
        specific.push('Ethereum', 'ETH', 'Vitalik');
      } else {
        specific.push('crypto', 'cryptocurrency', 'digital assets');
      }
      return [...specific, 'SEC', 'crypto regulation', 'Bitcoin ETF', 'stablecoin', ...baseMacroTerms];
    }
    
    // 3. Stock Indices & Equities (SPX, NAS100, DJI, Apple, etc.)
    if (['SPX', 'SPY', 'NAS', 'NDX', 'DJI', 'US30', 'AAPL', 'AMZN', 'MSFT', 'NVDA', 'TSLA', 'META'].some(t => cleanSymbol.includes(t)) || cleanSymbol.length <= 4) {
      const specific = [];
      if (cleanSymbol.includes('AAPL')) specific.push('Apple', 'AAPL');
      else if (cleanSymbol.includes('AMZN')) specific.push('Amazon', 'AMZN');
      else if (cleanSymbol.includes('MSFT')) specific.push('Microsoft', 'MSFT');
      else if (cleanSymbol.includes('NVDA')) specific.push('Nvidia', 'NVDA');
      else if (cleanSymbol.includes('TSLA')) specific.push('Tesla', 'TSLA');
      else if (cleanSymbol.includes('META')) specific.push('Meta', 'FB');
      else specific.push('S&P 500', 'Nasdaq', 'Dow Jones', 'stock market', 'Wall Street', 'equities');
      
      return [...specific, 'earnings', 'Federal Reserve', 'growth', ...baseMacroTerms];
    }
    
    // 4. Forex Pairs (e.g. EURUSD, GBPJPY, AUDNZD)
    if (/^[A-Z]{6}$/.test(cleanSymbol)) {
      const base = cleanSymbol.substring(0, 3);
      const quote = cleanSymbol.substring(3, 6);
      
      const currencyNames = {
        'EUR': ['EUR', 'Euro', 'Eurozone', 'ECB', 'Lagarde'],
        'USD': ['USD', 'Dollar', 'Federal Reserve', 'Fed', 'DXY', 'Powell'],
        'GBP': ['GBP', 'Pound', 'Sterling', 'Bank of England', 'BoE', 'Bailey'],
        'JPY': ['JPY', 'Yen', 'Bank of Japan', 'BoJ', 'Ueda'],
        'AUD': ['AUD', 'Aussie', 'Reserve Bank of Australia', 'RBA'],
        'NZD': ['NZD', 'Kiwi', 'Reserve Bank of New Zealand', 'RBNZ'],
        'CAD': ['CAD', 'Loonie', 'Bank of Canada', 'BoC'],
        'CHF': ['CHF', 'Swiss Franc', 'Swiss National Bank', 'SNB']
      };
      
      const terms = [];
      if (currencyNames[base]) terms.push(...currencyNames[base]);
      else terms.push(base);
      
      if (currencyNames[quote]) terms.push(...currencyNames[quote]);
      else terms.push(quote);
      
      return [...terms, 'forex', 'exchange rate', ...baseMacroTerms];
    }
    
    // Default fallback: search symbol plus base global macro terms
    return [symbol, 'market', ...baseMacroTerms];
  }

  analyzeNewsImpact(articles, symbol) {
    if (!articles.length) {
      return this.getDefaultNewsAnalysis(symbol);
    }

    const analysis = {
      symbol,
      totalArticles: articles.length,
      sentiment: this.calculateSentiment(articles),
      keyEvents: this.extractKeyEvents(articles),
      impact: 'neutral',
      timeframe: '24h',
      summary: '',
      articleSummaries: this.generateArticleSummaries(articles),
      sources: [...new Set(articles.map(a => a.source?.name).filter(Boolean))],
      lastUpdated: new Date().toISOString()
    };

    // Determine overall impact
    analysis.impact = this.determineImpact(analysis.sentiment, analysis.keyEvents);
    analysis.summary = this.generateSummary(analysis);

    return analysis;
  }

  calculateSentiment(articles) {
    const positiveWords = ['bullish', 'positive', 'growth', 'rise', 'increase', 'gain', 'strong', 'rally', 'surge', 'boom', 'recovery'];
    const negativeWords = ['bearish', 'negative', 'decline', 'fall', 'decrease', 'loss', 'weak', 'crash', 'slump', 'recession', 'crisis'];
    
    let positiveScore = 0;
    let negativeScore = 0;
    let neutralCount = 0;

    articles.forEach(article => {
      const title = (article.title || '').toLowerCase();
      const description = (article.description || '').toLowerCase();
      const content = title + ' ' + description;

      const positiveCount = positiveWords.reduce((count, word) => count + (content.split(word).length - 1), 0);
      const negativeCount = negativeWords.reduce((count, word) => count + (content.split(word).length - 1), 0);

      if (positiveCount > negativeCount) {
        positiveScore++;
      } else if (negativeCount > positiveCount) {
        negativeScore++;
      } else {
        neutralCount++;
      }
    });

    const total = positiveScore + negativeScore + neutralCount;
    return {
      positive: Math.round((positiveScore / total) * 100),
      negative: Math.round((negativeScore / total) * 100),
      neutral: Math.round((neutralCount / total) * 100),
      overall: positiveScore > negativeScore ? 'positive' : negativeScore > positiveScore ? 'negative' : 'neutral',
      score: (positiveScore - negativeScore) / total
    };
  }

  extractKeyEvents(articles) {
    const events = [];
    const eventKeywords = {
      'interest rate': 'Monetary Policy',
      'inflation': 'Economic Data',
      'gdp': 'Economic Data',
      'employment': 'Economic Data',
      'fed': 'Central Bank',
      'ecb': 'Central Bank',
      'bank of japan': 'Central Bank',
      'bank of england': 'Central Bank',
      'earnings': 'Corporate Earnings',
      'etf': 'Market Structure',
      'regulation': 'Regulatory',
      'sec': 'Regulatory'
    };

    articles.forEach(article => {
      const content = (article.title + ' ' + article.description).toLowerCase();
      
      Object.entries(eventKeywords).forEach(([keyword, event]) => {
        if (content.includes(keyword)) {
          events.push({
            type: event,
            keyword,
            title: article.title,
            source: article.source?.name,
            publishedAt: article.publishedAt,
            url: article.url
          });
        }
      });
    });

    return events.slice(0, 5); // Top 5 events
  }

  determineImpact(sentiment, keyEvents) {
    const hasHighImpactEvents = keyEvents.some(event => 
      ['Monetary Policy', 'Central Bank', 'Regulatory'].includes(event.type)
    );

    if (sentiment.overall === 'positive' && hasHighImpactEvents) {
      return 'strongly_positive';
    } else if (sentiment.overall === 'negative' && hasHighImpactEvents) {
      return 'strongly_negative';
    } else if (sentiment.overall === 'positive') {
      return 'positive';
    } else if (sentiment.overall === 'negative') {
      return 'negative';
    }

    return 'neutral';
  }

  generateSummary(analysis) {
    const { sentiment, keyEvents, impact } = analysis;
    
    let summary = `Market sentiment is ${sentiment.overall} (${sentiment.positive}% positive, ${sentiment.negative}% negative). `;
    
    if (keyEvents.length > 0) {
      summary += `Key drivers: ${keyEvents.slice(0, 3).map(e => e.type).join(', ')}. `;
    }
    
    switch (impact) {
      case 'strongly_positive':
        summary += 'Strong bullish bias expected from positive news catalysts.';
        break;
      case 'strongly_negative':
        summary += 'Strong bearish pressure from negative news flow.';
        break;
      case 'positive':
        summary += 'Moderate bullish bias from favorable news.';
        break;
      case 'negative':
        summary += 'Moderate bearish pressure from negative news.';
        break;
      default:
        summary += 'Neutral bias with mixed news signals.';
    }
    
    return summary;
  }

  generateArticleSummaries(articles) {
    // Generate quick summaries for top 5 most relevant articles
    const topArticles = articles.slice(0, 5);
    return topArticles.map(article => {
      const title = article.title || 'No title';
      const description = article.description || '';
      const source = article.source?.name || 'Unknown';
      const publishedAt = article.publishedAt ? new Date(article.publishedAt).toLocaleDateString() : 'Recent';
      
      // Create a concise summary combining title and key description points
      let summary = title;
      if (description && description.length > 50) {
        // Take first meaningful sentence from description
        const firstSentence = description.split(/[.!?]/)[0];
        if (firstSentence && firstSentence.length > 20) {
          summary += `. ${firstSentence.substring(0, 120)}${firstSentence.length > 120 ? '...' : ''}`;
        }
      }
      
      return {
        summary: summary,
        source: source,
        publishedAt: publishedAt,
        url: article.url || null,
        sentiment: this.classifyArticleSentiment(title + ' ' + description)
      };
    });
  }

  classifyArticleSentiment(text) {
    const positiveWords = ['bullish', 'positive', 'growth', 'rise', 'increase', 'gain', 'strong', 'rally', 'surge', 'boom', 'recovery', 'beat', 'exceed', 'profit'];
    const negativeWords = ['bearish', 'negative', 'decline', 'fall', 'decrease', 'loss', 'weak', 'crash', 'slump', 'recession', 'crisis', 'miss', 'below', 'concern', 'risk'];
    
    const content = text.toLowerCase();
    const positiveCount = positiveWords.reduce((count, word) => count + (content.split(word).length - 1), 0);
    const negativeCount = negativeWords.reduce((count, word) => count + (content.split(word).length - 1), 0);
    
    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  getDefaultNewsAnalysis(symbol) {
    return {
      symbol,
      totalArticles: 0,
      sentiment: {
        positive: 33,
        negative: 33,
        neutral: 34,
        overall: 'neutral',
        score: 0
      },
      keyEvents: [],
      impact: 'neutral',
      timeframe: '24h',
      summary: `No significant news found for ${symbol}. Market may be driven by technical factors.`,
      sources: [],
      lastUpdated: new Date().toISOString()
    };
  }
}

// Historical movement analyzer
class MovementAnalyzer {
  constructor() {
    this.cache = new Map();
    this.cacheTtl = 30 * 60 * 1000; // 30 minutes
  }

  analyzeHistoricalMovements(candles, symbol, timeframe) {
    const cacheKey = `${symbol}-${timeframe}-${candles.length}`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    if (!candles || candles.length < 50) {
      return this.getDefaultMovementAnalysis(symbol);
    }

    const analysis = {
      symbol,
      timeframe,
      period: `${candles.length} candles`,
      priceMovement: this.calculatePriceMovement(candles),
      volatility: this.calculateVolatility(candles),
      momentum: this.calculateMomentum(candles),
      patterns: this.identifyPatterns(candles),
      supportResistance: this.findSupportResistance(candles),
      trend: this.determineTrend(candles),
      volumeAnalysis: this.analyzeVolume(candles),
      lastUpdated: new Date().toISOString()
    };

    this.cache.set(cacheKey, analysis);
    return analysis;
  }

  calculatePriceMovement(candles) {
    const current = candles[candles.length - 1].close;
    const first = candles[0].open;
    const high = Math.max(...candles.map(c => c.high));
    const low = Math.min(...candles.map(c => c.low));
    const change = current - first;
    const changePercent = (change / first) * 100;
    const range = high - low;
    const rangePercent = (range / first) * 100;

    return {
      current,
      first,
      high,
      low,
      change,
      changePercent,
      range,
      rangePercent,
      direction: change > 0 ? 'up' : change < 0 ? 'down' : 'sideways'
    };
  }

  calculateVolatility(candles) {
    if (candles.length < 10) {
      return {
        standardDeviation: 0,
        averageTrueRange: 0,
        volatilityIndex: 'insufficient_data',
        recentVolatility: 0
      };
    }

    const closes = candles.map(c => c.close);
    const returns = [];
    
    for (let i = 1; i < closes.length; i++) {
      returns.push((closes[i] - closes[i-1]) / closes[i-1]);
    }

    const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
    const stdDev = Math.sqrt(variance);
    const avgTrueRange = this.calculateATR(candles);

    return {
      standardDeviation: stdDev * 100, // as percentage
      averageTrueRange: avgTrueRange,
      volatilityIndex: stdDev > 0.02 ? 'high' : stdDev > 0.01 ? 'medium' : 'low',
      recentVolatility: stdDev > 0 ? (stdDev / mean) * 100 : 0
    };
  }

  calculateATR(candles, period = 14) {
    if (candles.length < period) return 0;

    let sum = 0;
    for (let i = period; i < candles.length; i++) {
      const highLow = candles[i].high - candles[i].low;
      const highClose = Math.abs(candles[i].high - candles[i-1].close);
      const lowClose = Math.abs(candles[i].low - candles[i-1].close);
      sum += Math.max(highLow, highClose, lowClose);
    }

    return sum / (candles.length - period);
  }

  calculateMomentum(candles) {
    if (candles.length < 20) {
      return { strength: 'neutral', direction: 'insufficient_data' };
    }

    const recent = candles.slice(-10);
    const older = candles.slice(-20, -10);

    const recentAvg = recent.reduce((sum, c) => sum + c.close, 0) / recent.length;
    const olderAvg = older.reduce((sum, c) => sum + c.close, 0) / older.length;
    const momentum = (recentAvg - olderAvg) / olderAvg;

    let strength, direction;
    if (Math.abs(momentum) < 0.005) {
      strength = 'weak';
    } else if (Math.abs(momentum) < 0.015) {
      strength = 'moderate';
    } else {
      strength = 'strong';
    }

    direction = momentum > 0 ? 'bullish' : momentum < 0 ? 'bearish' : 'neutral';

    return { momentum, strength, direction };
  }

  identifyPatterns(candles) {
    const patterns = [];
    const recent = candles.slice(-20);

    // Simple pattern detection
    if (this.isHammer(recent[recent.length - 1])) {
      patterns.push({ type: 'hammer', signal: 'bullish', strength: 'moderate' });
    }

    if (this.isDoji(recent[recent.length - 1])) {
      patterns.push({ type: 'doji', signal: 'neutral', strength: 'weak' });
    }

    if (this.isEngulfing(recent.slice(-2))) {
      patterns.push({ type: 'engulfing', signal: 'strong', strength: 'high' });
    }

    return patterns;
  }

  isHammer(candle) {
    const body = Math.abs(candle.close - candle.open);
    const upperShadow = candle.high - Math.max(candle.open, candle.close);
    const lowerShadow = Math.min(candle.open, candle.close) - candle.low;
    
    return body < (candle.high - candle.low) * 0.3 && 
           lowerShadow > body * 2 && 
           upperShadow < body * 0.5;
  }

  isDoji(candle) {
    const body = Math.abs(candle.close - candle.open);
    const range = candle.high - candle.low;
    return body < range * 0.1;
  }

  isEngulfing(candles) {
    if (candles.length < 2) return false;
    
    const prev = candles[0];
    const curr = candles[1];
    
    const prevBullish = prev.close > prev.open;
    const currBullish = curr.close > curr.open;
    
    if (prevBullish && !currBullish) {
      // Bearish engulfing
      return curr.open > prev.high && curr.close < prev.low;
    } else if (!prevBullish && currBullish) {
      // Bullish engulfing
      return curr.open < prev.low && curr.close > prev.high;
    }
    
    return false;
  }

  findSupportResistance(candles) {
    const highs = candles.map(c => c.high);
    const lows = candles.map(c => c.low);
    
    const resistance = this.findLevels(highs, true);
    const support = this.findLevels(lows, false);
    
    return { resistance, support };
  }

  findLevels(prices, isResistance) {
    const levels = [];
    const lookback = Math.min(20, prices.length);
    
    for (let i = lookback; i < prices.length; i++) {
      const window = prices.slice(i - lookback, i + 1);
      const level = isResistance ? Math.max(...window) : Math.min(...window);
      
      if (this.isSignificantLevel(level, prices, i)) {
        levels.push({
          price: level,
          touches: this.countTouches(level, prices, i),
          strength: this.calculateLevelStrength(level, prices, i),
          type: isResistance ? 'resistance' : 'support'
        });
      }
    }

    return levels.sort((a, b) => b.strength - a.strength).slice(0, 5);
  }

  isSignificantLevel(level, prices, currentIndex) {
    const tolerance = 0.001; // 0.1% tolerance
    return prices.filter((p, i) => Math.abs(p - level) / level < tolerance).length >= 2;
  }

  countTouches(level, prices, currentIndex) {
    const tolerance = 0.001;
    return prices.slice(0, currentIndex + 1).filter(p => Math.abs(p - level) / level < tolerance).length;
  }

  calculateLevelStrength(level, prices, currentIndex) {
    const touches = this.countTouches(level, prices, currentIndex);
    const recency = currentIndex / prices.length;
    return touches * recency;
  }

  determineTrend(candles) {
    if (candles.length < 50) return { direction: 'insufficient_data', strength: 'weak' };

    const prices = candles.map(c => c.close);
    const sma20 = this.calculateSMA(prices, 20);
    const sma50 = this.calculateSMA(prices, 50);
    const current = prices[prices.length - 1];

    let direction, strength;
    
    if (current > sma20 && sma20 > sma50) {
      direction = 'bullish';
      strength = current > sma20 * 1.02 ? 'strong' : 'moderate';
    } else if (current < sma20 && sma20 < sma50) {
      direction = 'bearish';
      strength = current < sma20 * 0.98 ? 'strong' : 'moderate';
    } else {
      direction = 'sideways';
      strength = 'weak';
    }

    return { direction, strength };
  }

  calculateSMA(prices, period) {
    if (prices.length < period) return prices[prices.length - 1];
    
    const sum = prices.slice(-period).reduce((a, b) => a + b, 0);
    return sum / period;
  }

  analyzeVolume(candles) {
    const volumes = candles.map(c => c.volume || 0);
    const avgVolume = volumes.reduce((sum, v) => sum + v, 0) / volumes.length;
    const recentVolume = volumes.slice(-5).reduce((sum, v) => sum + v, 0) / 5;
    const volumeRatio = recentVolume / avgVolume;

    return {
      average: avgVolume,
      recent: recentVolume,
      ratio: volumeRatio,
      trend: volumeRatio > 1.2 ? 'increasing' : volumeRatio < 0.8 ? 'decreasing' : 'stable'
    };
  }

  getDefaultMovementAnalysis(symbol) {
    return {
      symbol,
      timeframe: 'unknown',
      period: 'insufficient data',
      priceMovement: { direction: 'unknown' },
      volatility: { volatilityIndex: 'unknown' },
      momentum: { strength: 'neutral' },
      patterns: [],
      supportResistance: { resistance: [], support: [] },
      trend: { direction: 'unknown' },
      volumeAnalysis: { trend: 'unknown' },
      lastUpdated: new Date().toISOString()
    };
  }
}

module.exports = {
  NewsAnalyzer,
  MovementAnalyzer
};
