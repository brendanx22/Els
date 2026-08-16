const { EventEmitter } = require('events');
const { MultiSourceNewsAggregator } = require('./multiSourceNews');

/**
 * Smart News & Movement Alert System
 * Provides real-time alerts for news events and price movements
 */
class SmartAlertSystem extends EventEmitter {
  constructor() {
    super();
    this.newsAggregator = new MultiSourceNewsAggregator();
    this.activeAlerts = new Map();
    this.alertHistory = [];
    this.subscribers = new Map();
    this.thresholds = {
      sentiment: 60, // Alert when sentiment exceeds ±60%
      impact: 70, // Alert on high impact news
      priceChange: 2.0, // Alert on 2%+ price change
      volatility: 25, // Alert on high volatility
      pattern: true // Alert on pattern completion
    };
    this.monitoring = false;
    this.monitorInterval = null;
  }

  /**
   * Start monitoring for alerts
   */
  startMonitoring(symbol, timeframe = '1h', intervalMs = 60000) {
    if (this.monitoring) return;
    
    this.monitoring = true;
    console.log(`🔔 Smart Alert System started for ${symbol} on ${timeframe}`);
    
    this.monitorInterval = setInterval(async () => {
      await this.checkForAlerts(symbol, timeframe);
    }, intervalMs);
  }

  /**
   * Stop monitoring
   */
  stopMonitoring() {
    this.monitoring = false;
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
      this.monitorInterval = null;
    }
    console.log('🔔 Smart Alert System stopped');
  }

  /**
   * Check for new alerts
   */
  async checkForAlerts(symbol, timeframe) {
    try {
      // Get latest news
      const newsData = await this.newsAggregator.aggregateNews(symbol, timeframe);
      
      // Check for news-based alerts
      this.checkNewsAlerts(symbol, newsData);
      
      // Emit alert event
      this.emit('alert-check', { symbol, newsData, timestamp: Date.now() });
    } catch (error) {
      console.error('Alert check failed:', error.message);
    }
  }

  /**
   * Check for news-based alerts
   */
  checkNewsAlerts(symbol, newsData) {
    const alerts = [];

    // 1. Breaking News Alert
    if (newsData.impact.level === 'high' && newsData.impact.factors.includes('Breaking news')) {
      alerts.push({
        type: 'breaking_news',
        priority: 'high',
        symbol,
        title: '🚨 Breaking News Alert',
        message: `High-impact breaking news for ${symbol}: ${newsData.summary}`,
        data: newsData,
        timestamp: Date.now()
      });
    }

    // 2. Sentiment Shift Alert
    if (Math.abs(newsData.sentiment.score) > this.thresholds.sentiment) {
      const direction = newsData.sentiment.score > 0 ? 'Bullish' : 'Bearish';
      alerts.push({
        type: 'sentiment_shift',
        priority: 'medium',
        symbol,
        title: `📊 ${direction} Sentiment Alert`,
        message: `${direction} sentiment detected (${newsData.sentiment.score}%) with ${newsData.totalArticles} sources`,
        data: newsData.sentiment,
        timestamp: Date.now()
      });
    }

    // 3. Key Event Alert
    if (newsData.keyEvents && newsData.keyEvents.length > 0) {
      for (const event of newsData.keyEvents.slice(0, 2)) {
        alerts.push({
          type: 'key_event',
          priority: 'high',
          symbol,
          title: `🔔 ${event.name}`,
          message: `${event.name} mentioned ${event.mentions} times across ${event.sources.length} sources`,
          data: event,
          timestamp: Date.now()
        });
      }
    }

    // 4. High Impact Alert
    if (newsData.impact.score > this.thresholds.impact) {
      alerts.push({
        type: 'high_impact',
        priority: 'high',
        symbol,
        title: '⚠️ High Market Impact Expected',
        message: `Expected volatility: ${newsData.impact.volatilityExpected}. Factors: ${newsData.impact.factors.join(', ')}`,
        data: newsData.impact,
        timestamp: Date.now()
      });
    }

    // 5. Entity Mention Alert (if important entities detected)
    if (newsData.entities && newsData.entities.organizations) {
      const importantOrgs = ['Fed', 'ECB', 'SEC', 'FOMC', 'Bank of England'];
      const mentionedOrgs = newsData.entities.organizations.filter(org => 
        importantOrgs.some(io => org.toLowerCase().includes(io.toLowerCase()))
      );
      
      if (mentionedOrgs.length > 0) {
        alerts.push({
          type: 'entity_mention',
          priority: 'medium',
          symbol,
          title: '🏛️ Central Bank Mention',
          message: `${mentionedOrgs.join(', ')} mentioned in recent news`,
          data: { organizations: mentionedOrgs },
          timestamp: Date.now()
        });
      }
    }

    // Deduplicate and process alerts
    for (const alert of alerts) {
      const alertKey = `${alert.type}-${alert.symbol}-${Math.floor(Date.now() / 3600000)}`; // Hourly dedup
      
      if (!this.activeAlerts.has(alertKey)) {
        this.activeAlerts.set(alertKey, alert);
        this.alertHistory.push(alert);
        
        // Keep only last 100 alerts
        if (this.alertHistory.length > 100) {
          this.alertHistory.shift();
        }

        // Emit the alert
        this.emit('alert', alert);
        this.notifySubscribers(alert);
        
        console.log(`🔔 ${alert.title}: ${alert.message}`);
      }
    }

    return alerts;
  }

  /**
   * Create price-based movement alert
   */
  createPriceAlert(symbol, priceData, movementData) {
    const alerts = [];
    
    // Price change alert
    if (Math.abs(movementData.priceChange) >= this.thresholds.priceChange) {
      const direction = movementData.priceChange > 0 ? 'surged' : 'dropped';
      alerts.push({
        type: 'price_movement',
        priority: 'high',
        symbol,
        title: `📈 Price ${direction.toUpperCase()}`,
        message: `${symbol} has ${direction} ${Math.abs(movementData.priceChange).toFixed(2)}% to ${priceData.current}`,
        data: { priceChange: movementData.priceChange, current: priceData.current },
        timestamp: Date.now()
      });
    }

    // Volatility alert
    if (movementData.volatility > this.thresholds.volatility) {
      alerts.push({
        type: 'high_volatility',
        priority: 'medium',
        symbol,
        title: '⚡ High Volatility Detected',
        message: `Volatility at ${movementData.volatility.toFixed(1)}% - consider position sizing`,
        data: { volatility: movementData.volatility },
        timestamp: Date.now()
      });
    }

    // Pattern completion alert
    if (movementData.patterns && movementData.patterns.length > 0) {
      for (const pattern of movementData.patterns) {
        alerts.push({
          type: 'pattern_complete',
          priority: 'medium',
          symbol,
          title: `🎯 ${pattern.name} Pattern`,
          message: `${pattern.name} pattern detected - ${pattern.signal} signal (${pattern.reliability}% reliability)`,
          data: pattern,
          timestamp: Date.now()
        });
      }
    }

    // Support/Resistance break alert
    if (movementData.breakouts) {
      for (const breakout of movementData.breakouts) {
        alerts.push({
          type: 'breakout',
          priority: 'high',
          symbol,
          title: `🚀 ${breakout.type.toUpperCase()} BREAK`,
          message: `${symbol} has broken ${breakout.level} at ${breakout.price}`,
          data: breakout,
          timestamp: Date.now()
        });
      }
    }

    // Process alerts
    for (const alert of alerts) {
      const alertKey = `${alert.type}-${alert.symbol}-${Math.floor(Date.now() / 1800000)}`; // 30min dedup
      
      if (!this.activeAlerts.has(alertKey)) {
        this.activeAlerts.set(alertKey, alert);
        this.alertHistory.push(alert);
        
        if (this.alertHistory.length > 100) {
          this.alertHistory.shift();
        }

        this.emit('alert', alert);
        this.notifySubscribers(alert);
        
        console.log(`🔔 ${alert.title}: ${alert.message}`);
      }
    }

    return alerts;
  }

  /**
   * Subscribe to alerts
   */
  subscribe(userId, filters = {}) {
    this.subscribers.set(userId, {
      filters,
      createdAt: Date.now()
    });
    console.log(`👤 User ${userId} subscribed to alerts`);
  }

  /**
   * Unsubscribe from alerts
   */
  unsubscribe(userId) {
    this.subscribers.delete(userId);
    console.log(`👤 User ${userId} unsubscribed from alerts`);
  }

  /**
   * Notify subscribers of new alert
   */
  notifySubscribers(alert) {
    for (const [userId, subscription] of this.subscribers) {
      // Check if alert matches user's filters
      if (this.matchesFilters(alert, subscription.filters)) {
        this.emit('notify', { userId, alert });
      }
    }
  }

  /**
   * Check if alert matches filters
   */
  matchesFilters(alert, filters) {
    if (!filters || Object.keys(filters).length === 0) return true;

    if (filters.types && !filters.types.includes(alert.type)) return false;
    if (filters.symbols && !filters.symbols.includes(alert.symbol)) return false;
    if (filters.minPriority && this.priorityValue(alert.priority) < this.priorityValue(filters.minPriority)) return false;

    return true;
  }

  /**
   * Get priority numeric value
   */
  priorityValue(priority) {
    const values = { low: 1, medium: 2, high: 3 };
    return values[priority] || 0;
  }

  /**
   * Get recent alerts
   */
  getRecentAlerts(count = 10, type = null) {
    let alerts = [...this.alertHistory].reverse();
    
    if (type) {
      alerts = alerts.filter(a => a.type === type);
    }
    
    return alerts.slice(0, count);
  }

  /**
   * Get active alerts for symbol
   */
  getActiveAlerts(symbol) {
    return [...this.activeAlerts.values()].filter(a => a.symbol === symbol);
  }

  /**
   * Clear old alerts
   */
  clearOldAlerts(maxAgeHours = 24) {
    const cutoff = Date.now() - (maxAgeHours * 60 * 60 * 1000);
    
    this.alertHistory = this.alertHistory.filter(a => a.timestamp > cutoff);
    
    for (const [key, alert] of this.activeAlerts) {
      if (alert.timestamp < cutoff) {
        this.activeAlerts.delete(key);
      }
    }
  }

  /**
   * Update alert thresholds
   */
  updateThresholds(newThresholds) {
    this.thresholds = { ...this.thresholds, ...newThresholds };
    console.log('📊 Alert thresholds updated:', this.thresholds);
  }

  /**
   * Get alert statistics
   */
  getStats() {
    const last24h = Date.now() - (24 * 60 * 60 * 1000);
    const recentAlerts = this.alertHistory.filter(a => a.timestamp > last24h);

    return {
      totalAlerts: this.alertHistory.length,
      activeAlerts: this.activeAlerts.size,
      subscribers: this.subscribers.size,
      alerts24h: recentAlerts.length,
      byType: this.groupBy(recentAlerts, 'type'),
      byPriority: this.groupBy(recentAlerts, 'priority')
    };
  }

  /**
   * Group array by key
   */
  groupBy(array, key) {
    return array.reduce((acc, item) => {
      const value = item[key];
      acc[value] = (acc[value] || 0) + 1;
      return acc;
    }, {});
  }
}

module.exports = { SmartAlertSystem };
