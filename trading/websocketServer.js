/**
 * Real-time WebSocket Server for Live Updates
 * Provides WebSocket connections for real-time dashboard updates
 */
const { WebSocketServer } = require('ws');
const http = require('http');
const { SmartAlertSystem } = require('./smartAlerts');

class RealtimeWebSocketServer {
  constructor(port = 3003) {
    this.port = port;
    this.clients = new Map();
    this.alertSystem = new SmartAlertSystem();
    this.subscriptions = new Map();
    this.heartbeatInterval = null;
    this.server = null;
    this.wss = null;
  }

  /**
   * Start WebSocket server
   */
  start() {
    return new Promise((resolve, reject) => {
      // Create HTTP server
      this.server = http.createServer();
      
      // Create WebSocket server
      this.wss = new WebSocketServer({ server: this.server });

      // Handle connections
      this.wss.on('connection', (ws, req) => {
        this.handleConnection(ws, req);
      });

      // Start listening
      this.server.listen(this.port, () => {
        console.log(`🔌 WebSocket server running on port ${this.port}`);
        this.startHeartbeat();
        this.startAlertBroadcast();
        resolve();
      });

      this.server.on('error', (error) => {
        console.error('WebSocket server error:', error);
        reject(error);
      });
    });
  }

  /**
   * Handle new WebSocket connection
   */
  handleConnection(ws, req) {
    const clientId = this.generateClientId();
    const clientInfo = {
      id: clientId,
      ws,
      connectedAt: Date.now(),
      lastPing: Date.now(),
      subscriptions: new Set(),
      filters: {}
    };

    this.clients.set(clientId, clientInfo);
    console.log(`👤 Client ${clientId} connected. Total: ${this.clients.size}`);

    // Send welcome message
    this.sendToClient(clientId, {
      type: 'connection',
      status: 'connected',
      clientId,
      timestamp: Date.now()
    });

    // Handle messages
    ws.on('message', (data) => {
      this.handleMessage(clientId, data);
    });

    // Handle close
    ws.on('close', () => {
      this.handleDisconnection(clientId);
    });

    // Handle errors
    ws.on('error', (error) => {
      console.error(`WebSocket error for client ${clientId}:`, error);
      this.handleDisconnection(clientId);
    });
  }

  /**
   * Handle incoming message
   */
  handleMessage(clientId, data) {
    try {
      const message = JSON.parse(data);
      const client = this.clients.get(clientId);

      if (!client) return;

      switch (message.type) {
        case 'subscribe':
          this.handleSubscribe(clientId, message);
          break;

        case 'unsubscribe':
          this.handleUnsubscribe(clientId, message);
          break;

        case 'ping':
          this.handlePing(clientId);
          break;

        case 'pong':
          // Just acknowledge pong without logging
          if (client) {
            client.lastPing = Date.now();
          }
          break;

        case 'alert-filter':
          this.handleAlertFilter(clientId, message);
          break;

        case 'request-data':
          this.handleDataRequest(clientId, message);
          break;

        default:
          console.warn(`Unknown message type: ${message.type}`);
      }
    } catch (error) {
      console.error('Error handling message:', error);
      this.sendToClient(clientId, {
        type: 'error',
        message: 'Invalid message format'
      });
    }
  }

  /**
   * Handle subscription request
   */
  handleSubscribe(clientId, message) {
    const { symbol, channels = ['price', 'news', 'alerts'] } = message;
    const client = this.clients.get(clientId);

    if (!client) return;

    // Add to subscriptions
    if (!this.subscriptions.has(symbol)) {
      this.subscriptions.set(symbol, new Set());
    }
    this.subscriptions.get(symbol).add(clientId);

    // Track client subscriptions
    client.subscriptions.add(symbol);

    console.log(`📊 Client ${clientId} subscribed to ${symbol} (${channels.join(', ')})`);

    // Send confirmation
    this.sendToClient(clientId, {
      type: 'subscribed',
      symbol,
      channels,
      timestamp: Date.now()
    });

    // Send initial data
    this.broadcastToClient(clientId, symbol);
  }

  /**
   * Handle unsubscribe request
   */
  handleUnsubscribe(clientId, message) {
    const { symbol } = message;
    const client = this.clients.get(clientId);

    if (!client) return;

    // Remove from subscriptions
    if (this.subscriptions.has(symbol)) {
      this.subscriptions.get(symbol).delete(clientId);
    }

    client.subscriptions.delete(symbol);

    console.log(`📊 Client ${clientId} unsubscribed from ${symbol}`);

    this.sendToClient(clientId, {
      type: 'unsubscribed',
      symbol,
      timestamp: Date.now()
    });
  }

  /**
   * Handle ping
   */
  handlePing(clientId) {
    const client = this.clients.get(clientId);
    if (client) {
      client.lastPing = Date.now();
      this.sendToClient(clientId, { type: 'pong', timestamp: Date.now() });
    }
  }

  /**
   * Handle alert filter settings
   */
  handleAlertFilter(clientId, message) {
    const client = this.clients.get(clientId);
    if (!client) return;

    client.filters = message.filters || {};
    
    console.log(`🔔 Client ${clientId} updated alert filters`);
    
    this.sendToClient(clientId, {
      type: 'filter-updated',
      filters: client.filters
    });
  }

  /**
   * Handle data request
   */
  handleDataRequest(clientId, message) {
    const { symbol, dataType } = message;
    
    // Fetch and send requested data
    this.sendToClient(clientId, {
      type: 'data',
      dataType,
      symbol,
      timestamp: Date.now()
    });
  }

  /**
   * Handle disconnection
   */
  handleDisconnection(clientId) {
    const client = this.clients.get(clientId);
    if (!client) return;

    // Remove from all subscriptions
    for (const symbol of client.subscriptions) {
      if (this.subscriptions.has(symbol)) {
        this.subscriptions.get(symbol).delete(clientId);
      }
    }

    this.clients.delete(clientId);
    console.log(`👤 Client ${clientId} disconnected. Total: ${this.clients.size}`);
  }

  /**
   * Broadcast data to all subscribed clients
   */
  broadcast(symbol, data, type = 'update') {
    const subscribers = this.subscriptions.get(symbol);
    if (!subscribers || subscribers.size === 0) return;

    const message = {
      type,
      symbol,
      data,
      timestamp: Date.now()
    };

    for (const clientId of subscribers) {
      this.sendToClient(clientId, message);
    }
  }

  /**
   * Send to specific client
   */
  sendToClient(clientId, message) {
    const client = this.clients.get(clientId);
    if (!client || client.ws.readyState !== 1) return; // 1 = OPEN

    try {
      client.ws.send(JSON.stringify(message));
    } catch (error) {
      console.error(`Error sending to client ${clientId}:`, error);
      this.handleDisconnection(clientId);
    }
  }

  /**
   * Broadcast to specific client
   */
  broadcastToClient(clientId, symbol) {
    // This would fetch actual data and send it
    this.sendToClient(clientId, {
      type: 'initial-data',
      symbol,
      timestamp: Date.now()
    });
  }

  /**
   * Start heartbeat to check connections
   */
  startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      const now = Date.now();
      const timeout = 60000; // 60 seconds

      for (const [clientId, client] of this.clients) {
        if (now - client.lastPing > timeout) {
          console.log(`💔 Client ${clientId} timed out`);
          client.ws.terminate();
          this.handleDisconnection(clientId);
        } else {
          // Send ping
          this.sendToClient(clientId, { type: 'ping' });
        }
      }
    }, 5000); // Every 5 seconds for faster latency updates
  }

  /**
   * Start broadcasting alerts
   */
  startAlertBroadcast() {
    this.alertSystem.on('alert', (alert) => {
      // Find clients subscribed to this symbol
      const subscribers = this.subscriptions.get(alert.symbol);
      if (!subscribers) return;

      for (const clientId of subscribers) {
        const client = this.clients.get(clientId);
        if (!client) continue;

        // Check if alert matches client's filters
        if (this.alertMatchesFilters(alert, client.filters)) {
          this.sendToClient(clientId, {
            type: 'alert',
            alert,
            timestamp: Date.now()
          });
        }
      }
    });
  }

  /**
   * Check if alert matches client filters
   */
  alertMatchesFilters(alert, filters) {
    if (!filters || Object.keys(filters).length === 0) return true;

    if (filters.minPriority && alert.priority !== filters.minPriority) {
      const priorityOrder = { low: 1, medium: 2, high: 3 };
      if (priorityOrder[alert.priority] < priorityOrder[filters.minPriority]) {
        return false;
      }
    }

    if (filters.types && !filters.types.includes(alert.type)) {
      return false;
    }

    return true;
  }

  /**
   * Broadcast market update
   */
  broadcastMarketUpdate(symbol, marketData) {
    this.broadcast(symbol, marketData, 'market-update');
  }

  /**
   * Broadcast news update
   */
  broadcastNewsUpdate(symbol, newsData) {
    this.broadcast(symbol, newsData, 'news-update');
  }

  /**
   * Broadcast pattern detection
   */
  broadcastPatternDetection(symbol, patternData) {
    this.broadcast(symbol, patternData, 'pattern-detected');
  }

  /**
   * Generate client ID
   */
  generateClientId() {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Stop server
   */
  stop() {
    return new Promise((resolve) => {
      if (this.heartbeatInterval) {
        clearInterval(this.heartbeatInterval);
      }

      // Close all client connections
      for (const [clientId, client] of this.clients) {
        client.ws.close();
      }
      this.clients.clear();

      // Close server
      if (this.server) {
        this.server.close(() => {
          console.log('🔌 WebSocket server stopped');
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  /**
   * Get server stats
   */
  getStats() {
    return {
      clients: this.clients.size,
      subscriptions: [...this.subscriptions.entries()].map(([symbol, clients]) => ({
        symbol,
        clientCount: clients.size
      })),
      uptime: process.uptime()
    };
  }
}

module.exports = { RealtimeWebSocketServer };
