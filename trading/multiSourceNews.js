require("dotenv").config();
const axios = require("axios");
const cheerio = require("cheerio");

/**
 * Multi-Source News Aggregator
 * Aggregates news from NewsAPI, RSS feeds, Twitter, and financial sources
 */
class MultiSourceNewsAggregator {
  constructor() {
    this.newsApiKey = process.env.NEWS_API_KEY;
    this.cache = new Map();
    this.cacheTtl = 5 * 60 * 1000; // 5 minutes
    
    // Rate limiters for each source
    this.rateLimiters = {
      newsapi: { lastRequest: 0, minInterval: 1000, count: 0, maxPerHour: 100 },
      rss: { lastRequest: 0, minInterval: 5000, count: 0 },
      twitter: { lastRequest: 0, minInterval: 2000, count: 0, maxPerHour: 300 }
    };

    // Live high-speed RSS Feed sources
    this.rssSources = {
      fxstreet: 'https://www.fxstreet.com/rss/news',
      cnbc: 'https://www.cnbc.com/id/10000664/device/rss/rss.html',
      yahoo: 'https://finance.yahoo.com/news/rssindex',
      marketwatch: 'https://feeds.content.dowjones.io/public/rss/mw_topstories',
      coindesk: 'https://www.coindesk.com/arc/outboundfeeds/rss/'
    };

    // Source reliability scores
    this.sourceReliability = {
      'yahoo': 0.95,
      'cnbc': 0.92,
      'marketwatch': 0.90,
      'fxstreet': 0.90,
      'coindesk': 0.90,
      'newsapi': 0.85
    };
  }

  /**
   * Aggregate news from all sources
   */
  async aggregateNews(symbol, timeframe = '1h') {
    const cacheKey = `${symbol}-aggregate-${Date.now()}`;
    const now = Date.now();

    // Check cache
    for (const [key, value] of this.cache.entries()) {
      if (key.startsWith(`${symbol}-aggregate`) && (now - value.timestamp) < this.cacheTtl) {
        return value.data;
      }
    }

    // Fetch from all sources in parallel
    const [newsApiData, rssData] = await Promise.allSettled([
      this.fetchNewsAPI(symbol),
      this.fetchRSSFeeds(symbol),
      // this.fetchTwitterSentiment(symbol) // Requires Twitter API key
    ]);

    // Combine results
    const allArticles = [];
    
    if (newsApiData.status === 'fulfilled') {
      allArticles.push(...newsApiData.value.map(article => ({
        ...article,
        source: 'newsapi',
        reliability: this.sourceReliability.newsapi
      })));
    }

    if (rssData.status === 'fulfilled') {
      allArticles.push(...rssData.value.map(article => ({
        ...article,
        reliability: this.sourceReliability[article.source] || 0.7
      })));
    }

    // Deduplicate articles by title similarity
    const uniqueArticles = this.deduplicateArticles(allArticles);

    // Sort by reliability and recency
    uniqueArticles.sort((a, b) => {
      const scoreA = a.reliability * (new Date(a.publishedAt).getTime() / 1000000000000);
      const scoreB = b.reliability * (new Date(b.publishedAt).getTime() / 1000000000000);
      return scoreB - scoreA;
    });

    // Analyze combined sentiment
    const sentiment = this.analyzeAdvancedSentiment(uniqueArticles);
    
    // Extract entities
    const entities = this.extractEntities(uniqueArticles);
    
    // Calculate market impact
    const impact = this.calculateMarketImpact(uniqueArticles, sentiment);

    const result = {
      symbol,
      totalArticles: uniqueArticles.length,
      sources: [...new Set(uniqueArticles.map(a => a.source))],
      sentiment,
      entities,
      impact,
      articles: uniqueArticles.slice(0, 20), // Top 20 articles
      articleSummaries: this.generateArticleSummaries(uniqueArticles.slice(0, 5)),
      keyEvents: this.identifyKeyEvents(uniqueArticles),
      summary: this.generateSummary(uniqueArticles, sentiment, impact),
      lastUpdated: new Date().toISOString()
    };

    // Cache result
    this.cache.set(cacheKey, { data: result, timestamp: now });
    this.cleanCache();

    return result;
  }

  /**
   * Fetch from NewsAPI
   */
  async fetchNewsAPI(symbol) {
    await this.waitForRateLimit('newsapi');

    const searchTerms = this.getSearchTerms(symbol);
    
    try {
      const response = await axios.get('https://newsapi.org/v2/everything', {
        params: {
          q: searchTerms.join(' OR '),
          language: 'en',
          sortBy: 'publishedAt',
          from: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          to: new Date().toISOString(),
          pageSize: 20,
          apiKey: this.newsApiKey
        },
        timeout: 5000
      });

      return (response.data.articles || []).map(article => ({
        title: article.title,
        description: article.description,
        url: article.url,
        source: article.source?.name?.toLowerCase().replace(/\s+/g, '') || 'newsapi',
        publishedAt: article.publishedAt,
        content: article.content
      }));
    } catch (error) {
      console.warn('NewsAPI fetch failed:', error.message);
      return [];
    }
  }

  /**
   * Fetch from RSS feeds
   */
  async fetchRSSFeeds(symbol) {
    await this.waitForRateLimit('rss');

    const articles = [];
    const searchTerms = this.getSearchTerms(symbol).map(t => t.toLowerCase());

    // Fetch from multiple RSS feeds
    const feedPromises = Object.entries(this.rssSources).map(async ([sourceName, url]) => {
      try {
        const response = await axios.get(url, {
          timeout: 4000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          }
        });

        // Parse RSS XML
        const $ = cheerio.load(response.data, { xmlMode: true });
        
        $('item').each((i, elem) => {
          if (i >= 8) return false;

          const title = $(elem).find('title').text() || '';
          const description = $(elem).find('description').text() || '';
          const pubDate = $(elem).find('pubDate').text();
          const link = $(elem).find('link').text();

          // Check if article matches symbol or macro financial market terms
          const content = (title + ' ' + description).toLowerCase();
          const macroTerms = ['market', 'rate', 'inflation', 'fed', 'dollar', 'economy', 'yield', 'currency', 'stocks', 'forex', 'crypto', 'central bank'];
          const matches = searchTerms.some(term => content.includes(term.toLowerCase())) ||
            macroTerms.some(t => content.includes(t));

          if (matches && title.trim()) {
            let publishedAt = new Date().toISOString();
            try {
              if (pubDate) publishedAt = new Date(pubDate).toISOString();
            } catch (_) {}

            articles.push({
              title: title.trim(),
              description: description.replace(/<[^>]+>/g, '').trim(),
              url: link || null,
              source: sourceName,
              publishedAt,
              content: description
            });
          }
        });
      } catch (error) {
        // Silently skip failed feed
      }
    });

    await Promise.allSettled(feedPromises);
    return articles;
  }

  /**
   * Advanced sentiment analysis with NLP
   */
  analyzeAdvancedSentiment(articles) {
    const positiveWords = [
      'bullish', 'surge', 'rally', 'gain', 'rise', 'growth', 'strong', 'outperform',
      'breakthrough', 'milestone', 'success', 'profit', 'boom', 'soar', 'moon',
      'positive', 'optimistic', 'confident', 'upgrade', 'buy', 'accumulate',
      'support', 'recovery', 'rebound', 'rally', 'uptrend', ' ATH', 'all-time high'
    ];

    const negativeWords = [
      'bearish', 'crash', 'plunge', 'drop', 'fall', 'decline', 'weak', 'underperform',
      'crisis', 'concern', 'worry', 'fear', 'panic', 'sell-off', 'dump', 'bear',
      'negative', 'pessimistic', 'downgrade', 'sell', 'avoid', 'resistance',
      'recession', 'downtrend', 'correction', 'pullback', 'capitulation', 'ATL'
    ];

    let positiveScore = 0;
    let negativeScore = 0;
    let neutralScore = 0;
    const articleScores = [];

    for (const article of articles) {
      const content = (article.title + ' ' + article.description + ' ' + (article.content || '')).toLowerCase();
      let articlePositive = 0;
      let articleNegative = 0;

      // Weight by source reliability
      const weight = article.reliability || 0.7;

      positiveWords.forEach(word => {
        const matches = (content.match(new RegExp(word, 'g')) || []).length;
        articlePositive += matches * weight;
      });

      negativeWords.forEach(word => {
        const matches = (content.match(new RegExp(word, 'g')) || []).length;
        articleNegative += matches * weight;
      });

      // Exclamation marks and caps indicate stronger sentiment
      const exclamationCount = (content.match(/!/g) || []).length;
      const capsRatio = (content.match(/[A-Z]{3,}/g) || []).length / content.length;
      
      if (exclamationCount > 0) {
        articlePositive *= (1 + exclamationCount * 0.1);
        articleNegative *= (1 + exclamationCount * 0.1);
      }

      if (capsRatio > 0.1) {
        articlePositive *= 1.2;
        articleNegative *= 1.2;
      }

      articleScores.push({
        title: article.title,
        positive: articlePositive,
        negative: articleNegative,
        source: article.source
      });

      positiveScore += articlePositive;
      negativeScore += articleNegative;
    }

    // Calculate neutral
    const totalScore = positiveScore + negativeScore;
    if (articles.length > 0) {
      const avgContentLength = articles.reduce((sum, a) => sum + (a.title + a.description).length, 0) / articles.length;
      neutralScore = Math.max(0, articles.length - totalScore / avgContentLength * 10);
    }

    // Calculate overall sentiment
    let overall, score;
    if (positiveScore > negativeScore * 1.3) {
      overall = 'positive';
      score = Math.min(100, (positiveScore / (positiveScore + negativeScore + neutralScore)) * 100);
    } else if (negativeScore > positiveScore * 1.3) {
      overall = 'negative';
      score = -Math.min(100, (negativeScore / (positiveScore + negativeScore + neutralScore)) * 100);
    } else {
      overall = 'neutral';
      score = 0;
    }

    return {
      overall,
      score: Math.round(score * 100) / 100,
      positive: Math.round((positiveScore / (positiveScore + negativeScore + neutralScore || 1)) * 100),
      negative: Math.round((negativeScore / (positiveScore + negativeScore + neutralScore || 1)) * 100),
      neutral: Math.round((neutralScore / (positiveScore + negativeScore + neutralScore || 1)) * 100),
      articleCount: articles.length,
      topPositive: articleScores.sort((a, b) => b.positive - a.positive).slice(0, 3),
      topNegative: articleScores.sort((a, b) => b.negative - a.negative).slice(0, 3)
    };
  }

  /**
   * Extract named entities from articles
   */
  extractEntities(articles) {
    const entities = {
      persons: new Set(),
      organizations: new Set(),
      events: new Set(),
      markets: new Set()
    };

    const eventKeywords = ['Fed', 'ECB', 'NFP', 'CPI', 'FOMC', 'earnings', 'announcement', 'decision', 'meeting'];
    const marketKeywords = ['forex', 'stocks', 'crypto', 'commodities', 'gold', 'oil', 'bitcoin', 'ethereum'];

    for (const article of articles) {
      const content = article.title + ' ' + article.description;

      // Simple regex-based entity extraction
      // Capitalized words are potential entities
      const capitalizedWords = content.match(/\b[A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)*\b/g) || [];
      
      for (const word of capitalizedWords) {
        if (word.length > 3 && !['The', 'And', 'For', 'But', 'This'].includes(word)) {
          // Check if it's an organization (contains common suffixes)
          if (/\b(Bank|Corp|Inc|Ltd|Company|Exchange|Reserve|Commission|Committee)\b/.test(word)) {
            entities.organizations.add(word);
          } else if (/\b(Fed|ECB|SEC|FOMC|NFP|CPI)\b/.test(word)) {
            entities.organizations.add(word);
          } else {
            entities.persons.add(word);
          }
        }
      }

      // Extract events
      for (const keyword of eventKeywords) {
        if (content.toLowerCase().includes(keyword.toLowerCase())) {
          entities.events.add(keyword);
        }
      }

      // Extract markets
      for (const keyword of marketKeywords) {
        if (content.toLowerCase().includes(keyword.toLowerCase())) {
          entities.markets.add(keyword);
        }
      }
    }

    return {
      persons: [...entities.persons].slice(0, 10),
      organizations: [...entities.organizations].slice(0, 10),
      events: [...entities.events],
      markets: [...entities.markets]
    };
  }

  /**
   * Calculate market impact score
   */
  calculateMarketImpact(articles, sentiment) {
    let impactScore = 0;
    const factors = [];

    // Volume of news
    if (articles.length > 20) {
      impactScore += 30;
      factors.push('High news volume');
    } else if (articles.length > 10) {
      impactScore += 20;
      factors.push('Moderate news volume');
    } else if (articles.length > 5) {
      impactScore += 10;
      factors.push('Low news volume');
    }

    // Sentiment strength
    const sentimentStrength = Math.abs(sentiment.score);
    if (sentimentStrength > 60) {
      impactScore += 30;
      factors.push('Strong sentiment');
    } else if (sentimentStrength > 30) {
      impactScore += 15;
      factors.push('Moderate sentiment');
    }

    // Source quality
    const avgReliability = articles.reduce((sum, a) => sum + (a.reliability || 0.7), 0) / (articles.length || 1);
    impactScore += avgReliability * 20;
    if (avgReliability > 0.85) {
      factors.push('High-quality sources');
    }

    // Recent news (within last hour)
    const recentCount = articles.filter(a => {
      const pubDate = new Date(a.publishedAt);
      return (Date.now() - pubDate.getTime()) < 60 * 60 * 1000;
    }).length;
    
    if (recentCount > 5) {
      impactScore += 20;
      factors.push('Breaking news');
    } else if (recentCount > 0) {
      impactScore += 10;
      factors.push('Recent news');
    }

    // Determine impact level
    let level;
    if (impactScore >= 70) level = 'high';
    else if (impactScore >= 40) level = 'medium';
    else level = 'low';

    return {
      score: Math.min(100, Math.round(impactScore)),
      level,
      factors,
      volatilityExpected: level === 'high' ? 'significant' : level === 'medium' ? 'moderate' : 'minimal'
    };
  }

  /**
   * Identify key market events
   */
  identifyKeyEvents(articles) {
    const events = [];
    const eventKeywords = {
      'Fed Decision': ['fed decision', 'fomc', 'interest rate', 'fed meeting'],
      'ECB Policy': ['ecb', 'european central bank', 'eurozone'],
      'Earnings Report': ['earnings', 'revenue', 'profit', 'quarterly', 'EPS'],
      'Economic Data': ['NFP', 'non-farm', 'CPI', 'inflation', 'GDP', 'unemployment'],
      'Geopolitical': ['war', 'conflict', 'sanctions', 'trade war', 'election'],
      'Crypto Regulation': ['sec', 'regulation', 'crypto ban', 'bitcoin etf', 'approval'],
      'Market Crash': ['crash', 'collapse', 'plunge', 'sell-off', 'bear market'],
      'Market Rally': ['rally', 'surge', 'breakout', 'bull market', 'ATH']
    };

    for (const article of articles) {
      const content = (article.title + ' ' + article.description).toLowerCase();

      for (const [eventName, keywords] of Object.entries(eventKeywords)) {
        if (keywords.some(kw => content.includes(kw.toLowerCase()))) {
          const existingEvent = events.find(e => e.name === eventName);
          
          if (existingEvent) {
            existingEvent.mentions++;
            existingEvent.sources.add(article.source);
            if (article.reliability > existingEvent.reliability) {
              existingEvent.reliability = article.reliability;
            }
          } else {
            events.push({
              name: eventName,
              mentions: 1,
              sources: new Set([article.source]),
              reliability: article.reliability || 0.7,
              timestamp: article.publishedAt
            });
          }
        }
      }
    }

    return events
      .map(e => ({ ...e, sources: [...e.sources] }))
      .sort((a, b) => b.mentions - a.mentions)
      .slice(0, 5);
  }

  /**
   * Generate summary text
   */
  generateSummary(articles, sentiment, impact) {
    const parts = [];

    // Sentiment summary
    if (sentiment.overall === 'positive') {
      parts.push(`Predominantly bullish sentiment (${sentiment.positive}% positive coverage) from ${articles.length} sources.`);
    } else if (sentiment.overall === 'negative') {
      parts.push(`Predominantly bearish sentiment (${sentiment.negative}% negative coverage) from ${articles.length} sources.`);
    } else {
      parts.push(`Mixed/Neutral sentiment with ${articles.length} sources reporting.`);
    }

    // Impact summary
    if (impact.level === 'high') {
      parts.push(`High market impact expected due to ${impact.factors.join(', ')}.`);
    } else if (impact.level === 'medium') {
      parts.push(`Moderate market influence from recent news.`);
    }

    // Key events
    if (impact.factors.includes('Breaking news')) {
      parts.push('Breaking news developments in the last hour.');
    }

    return parts.join(' ');
  }

  /**
   * Deduplicate articles by title similarity
   */
  deduplicateArticles(articles) {
    const unique = [];
    const seenTitles = new Set();

    for (const article of articles) {
      const normalizedTitle = article.title.toLowerCase().replace(/[^a-z0-9]/g, '');
      
      // Check for similar titles
      let isDuplicate = false;
      for (const seen of seenTitles) {
        if (this.similarity(normalizedTitle, seen) > 0.7) {
          isDuplicate = true;
          break;
        }
      }

      if (!isDuplicate) {
        unique.push(article);
        seenTitles.add(normalizedTitle);
      }
    }

    return unique;
  }

  /**
   * Calculate string similarity
   */
  similarity(str1, str2) {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const costs = [];
    for (let i = 0; i <= shorter.length; i++) {
      let lastValue = i;
      for (let j = 0; j <= longer.length; j++) {
        if (i === 0) {
          costs[j] = j;
        } else if (j > 0) {
          let newValue = costs[j - 1];
          if (shorter[i - 1] !== longer[j - 1]) {
            newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
          }
          costs[j - 1] = lastValue;
          lastValue = newValue;
        }
      }
      if (i > 0) costs[longer.length] = lastValue;
    }
    
    return (longer.length - costs[longer.length]) / longer.length;
  }

  getSearchTerms(symbol) {
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

  /**
   * Generate quick summaries for articles
   */
  generateArticleSummaries(articles) {
    return articles.map(article => {
      const title = article.title || 'No title';
      const description = article.description || article.content || '';
      const source = article.source || 'Unknown';
      const publishedAt = article.publishedAt ? new Date(article.publishedAt).toLocaleDateString() : 'Recent';
      
      // Create a concise summary
      let summary = title;
      if (description && description.length > 50) {
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

  /**
   * Classify article sentiment
   */
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

  /**
   * Wait for rate limit
   */
  async waitForRateLimit(source) {
    const limiter = this.rateLimiters[source];
    const now = Date.now();

    // Reset hourly counter
    if (now - limiter.hourStart > 60 * 60 * 1000) {
      limiter.count = 0;
      limiter.hourStart = now;
    }

    // Check hourly limit
    if (limiter.maxPerHour && limiter.count >= limiter.maxPerHour) {
      const waitTime = 60 * 60 * 1000 - (now - limiter.hourStart);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      limiter.count = 0;
      limiter.hourStart = Date.now();
    }

    // Check minimum interval
    const timeSinceLast = now - limiter.lastRequest;
    if (timeSinceLast < limiter.minInterval) {
      await new Promise(resolve => setTimeout(resolve, limiter.minInterval - timeSinceLast));
    }

    limiter.lastRequest = Date.now();
    limiter.count++;
  }

  /**
   * Clean old cache entries
   */
  cleanCache() {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.cacheTtl) {
        this.cache.delete(key);
      }
    }
  }
}

module.exports = { MultiSourceNewsAggregator };
