/**
 * Complete Trading System Integration
 * Wires together all new modules: News, Patterns, Predictions, Alerts, Signals, AI
 */

const { MultiSourceNewsAggregator } = require('./multiSourceNews');
const { SmartAlertSystem } = require('./smartAlerts');
const { AdvancedPatternRecognition } = require('./advancedPatterns');
const { PredictiveAnalytics } = require('./predictiveAnalytics');
const { MultiTimeframeAnalysis } = require('./multiTimeframeAnalysis');
const { RealtimeWebSocketServer } = require('./websocketServer');
const { EnhancedAIAnalysis } = require('./enhancedAI');
const { AutomatedTradingSignals } = require('./automatedSignals');
const { EnhancedDashboardViz } = require('./enhancedDashboardViz');

class CompleteTradingSystem {
  constructor() {
    // Initialize all subsystems
    this.newsAggregator = new MultiSourceNewsAggregator();
    this.alertSystem = new SmartAlertSystem();
    this.patternRecognizer = new AdvancedPatternRecognition();
    this.predictor = new PredictiveAnalytics();
    this.mtfAnalyzer = new MultiTimeframeAnalysis();
    this.aiAnalyzer = new EnhancedAIAnalysis();
    this.signalGenerator = new AutomatedTradingSignals();
    this.visualizer = new EnhancedDashboardViz();
    
    this.wsServer = null;
    this.isInitialized = false;
    
    // Setup alert forwarding to WebSocket
    this.setupAlertForwarding();
  }

  /**
   * Initialize the complete system
   */
  async initialize() {
    if (this.isInitialized) return;
    
    console.log('🚀 Initializing Complete Trading System...');
    
    // Start WebSocket server
    this.wsServer = new RealtimeWebSocketServer(3003);
    await this.wsServer.start();
    
    // Setup alert forwarding
    this.alertSystem.on('alert', (alert) => {
      this.wsServer.broadcast(alert.symbol, alert, 'alert');
    });
    
    this.isInitialized = true;
    console.log('✅ Complete Trading System initialized');
    console.log('📡 WebSocket server running on port 3003');
    console.log('🔔 Alert system active');
  }

  /**
   * Perform complete market analysis
   */
  async analyzeMarket(symbol, timeframe, candles, marketInfo = {}) {
    console.log(`🔍 Analyzing ${symbol} on ${timeframe}...`);
    
    try {
      // 1. Fetch multi-source news
      console.log('  📰 Fetching news...');
      const newsData = await this.newsAggregator.aggregateNews(symbol, timeframe);
      
      // 2. Detect advanced patterns
      console.log('  🎯 Detecting patterns...');
      const patternData = this.patternRecognizer.detectPatterns(candles, symbol, timeframe);
      
      // 3. Generate predictive analytics
      console.log('  🔮 Generating predictions...');
      const predictiveData = await this.predictor.generateForecast(
        candles, symbol, timeframe, newsData, null
      );
      
      // 4. Multi-timeframe analysis
      console.log('  📊 Analyzing timeframes...');
      const mtfData = await this.mtfAnalyzer.analyzeAllTimeframes(symbol, timeframe);
      
      // 5. Movement analysis (existing)
      const { MovementAnalyzer } = require('./newsAnalysis');
      const movementAnalyzer = new MovementAnalyzer();
      const movementData = movementAnalyzer.analyzeHistoricalMovements(candles, symbol, timeframe);
      
      // 6. Generate trading signal
      console.log('  🎯 Generating signal...');
      const signal = this.signalGenerator.generateSignal(symbol, timeframe, {
        technical: marketInfo.technical || {},
        news: newsData,
        movement: movementData,
        patterns: patternData,
        predictive: predictiveData,
        mtf: mtfData
      });
      
      // 7. Check for alerts
      console.log('  🔔 Checking alerts...');
      this.alertSystem.checkForAlerts(symbol, timeframe);
      
      // 8. Start monitoring if signal is active
      if (signal.signal === 'active') {
        this.alertSystem.startMonitoring(symbol, timeframe, 60000);
      }
      
      // 9. Generate enhanced AI payload
      console.log('  🤖 Building AI payload...');
      const aiPayload = this.aiAnalyzer.buildEnhancedPayload(
        { symbol, timeframe, price: candles[candles.length - 1]?.close },
        marketInfo.technical || {},
        newsData,
        movementData,
        patternData,
        predictiveData,
        mtfData
      );
      
      // 10. Create dashboard visualization package
      console.log('  📊 Creating visualizations...');
      const vizPackage = this.visualizer.generateDashboardPackage(symbol, timeframe, {
        technical: marketInfo.technical,
        news: newsData,
        newsHistory: [],
        movement: movementData,
        patterns: patternData,
        predictive: predictiveData,
        mtf: mtfData,
        signal: signal,
        market: { price: candles[candles.length - 1]?.close }
      });
      
      console.log(`✅ Analysis complete for ${symbol}`);
      
      return {
        symbol,
        timeframe,
        timestamp: new Date().toISOString(),
        news: newsData,
        patterns: patternData,
        movement: movementData,
        predictive: predictiveData,
        mtf: mtfData,
        signal: signal,
        aiPayload: aiPayload,
        visualizations: vizPackage,
        complete: true
      };
      
    } catch (error) {
      console.error(`❌ Analysis failed for ${symbol}:`, error.message);
      throw error;
    }
  }

  /**
   * Setup alert forwarding to WebSocket
   */
  setupAlertForwarding() {
    this.alertSystem.on('alert', (alert) => {
      if (this.wsServer) {
        // Broadcast to symbol subscribers
        this.wsServer.broadcast(alert.symbol, {
          type: 'alert',
          alert: alert,
          timestamp: Date.now()
        }, 'alert');
        
        console.log(`📡 Alert broadcast: ${alert.title}`);
      }
    });
  }

  /**
   * Subscribe client to symbol updates
   */
  subscribeClient(clientId, symbol, filters = {}) {
    if (this.wsServer) {
      // Add to WebSocket subscriptions
      this.wsServer.handleSubscribe(clientId, { symbol, channels: ['price', 'news', 'alerts'] });
      
      // Add to alert system
      this.alertSystem.subscribe(clientId, filters);
      
      console.log(`👤 Client ${clientId} subscribed to ${symbol}`);
    }
  }

  /**
   * Get enhanced AI prompt
   */
  getEnhancedAIPrompt() {
    return this.aiAnalyzer.generateEnhancedSystemPrompt();
  }

  /**
   * Generate AI analysis request
   */
  generateAIRequest(analysisData) {
    return this.aiAnalyzer.generateAnalysisRequest(analysisData.aiPayload);
  }

  /**
   * Get active signals
   */
  getActiveSignals(symbol = null) {
    return this.signalGenerator.getActiveSignals(symbol);
  }

  /**
   * Get recent alerts
   */
  getRecentAlerts(count = 10, symbol = null) {
    let alerts = this.alertSystem.getRecentAlerts(count);
    if (symbol) {
      alerts = alerts.filter(a => a.symbol === symbol);
    }
    return alerts;
  }

  /**
   * Get system stats
   */
  getStats() {
    return {
      websocket: this.wsServer?.getStats(),
      alerts: this.alertSystem.getStats(),
      signals: this.signalGenerator.getPerformanceStats(),
      initialized: this.isInitialized
    };
  }

  /**
   * Shutdown system
   */
  async shutdown() {
    console.log('🛑 Shutting down Complete Trading System...');
    
    this.alertSystem.stopMonitoring();
    
    if (this.wsServer) {
      await this.wsServer.stop();
    }
    
    this.isInitialized = false;
    console.log('✅ System shutdown complete');
  }
}

// Export singleton instance
const tradingSystem = new CompleteTradingSystem();

module.exports = { 
  CompleteTradingSystem,
  tradingSystem
};
