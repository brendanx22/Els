(function bootstrapTradingDesk() {
  const config = window.TRADING_APP_CONFIG || {};
  const exportButton = document.getElementById("export-button");
  const snapshotArea = document.getElementById("snapshot-area");
  const statusCard = document.getElementById("status-card");
  const statusLabel = document.getElementById("status-label");
  const statusDetail = document.getElementById("status-detail");
  const sessionSymbol = document.getElementById("session-symbol");
  const sessionTimeframe = document.getElementById("session-timeframe");
  const headlinePrice = document.getElementById("headline-price");
  const headlineChange = document.getElementById("headline-change");
  const lastCommand = document.getElementById("last-command");
  const lastCommandTime = document.getElementById("last-command-time");
  const headlineSymbol = document.getElementById("headline-symbol");
  const headlineMeta = document.getElementById("headline-meta");
  const providerLabel = document.getElementById("provider-label");
  const updatedStat = document.getElementById("updated-stat");
  const watchState = document.getElementById("watch-state");
  const nextRefresh = document.getElementById("next-refresh");
  const layerTags = document.getElementById("layer-tags");
  const biasStat = document.getElementById("bias-stat");
  const confidenceStat = document.getElementById("confidence-stat");
  const momentumStat = document.getElementById("momentum-stat");
  const patternStat = document.getElementById("pattern-stat");
  const breakoutValue = document.getElementById("breakout-value");
  const rangeLocationValue = document.getElementById("range-location-value");
  const confluenceValue = document.getElementById("confluence-value");
  const confluenceFill = document.getElementById("confluence-fill");
  const thesisValue = document.getElementById("thesis-value");
  const aiProviderValue = document.getElementById("ai-provider-value");
  const aiVerdictValue = document.getElementById("ai-verdict-value");
  const aiStatusValue = document.getElementById("ai-status-value");
  const aiConfidenceLabel = document.getElementById("ai-confidence-label");
  const structureEventValue = document.getElementById("structure-event-value");
  const locationValue = document.getElementById("location-value");
  const fibZoneValue = document.getElementById("fib-zone-value");
  const rsiRuleValue = document.getElementById("rsi-rule-value");
  const regimeValue = document.getElementById("regime-value");
  const volatilityValue = document.getElementById("volatility-value");
  const setupStack = document.getElementById("setup-stack");
  const trendScoreValue = document.getElementById("trend-score-value");
  const momentumScoreValue = document.getElementById("momentum-score-value");
  const structureScoreValue = document.getElementById("structure-score-value");
  const timingScoreValue = document.getElementById("timing-score-value");
  const volatilityScoreValue = document.getElementById("volatility-score-value");
  const adxValue = document.getElementById("adx-value");
  const riskList = document.getElementById("risk-list");
  const nextActionsList = document.getElementById("next-actions-list");
  const invalidationList = document.getElementById("invalidation-list");
  const ema20Value = document.getElementById("ema20-value");
  const ema50Value = document.getElementById("ema50-value");
  const ema200Value = document.getElementById("ema200-value");
  const rsiValue = document.getElementById("rsi-value");
  const macdValue = document.getElementById("macd-value");
  const supportValue = document.getElementById("support-value");
  const resistanceValue = document.getElementById("resistance-value");
  const supportZoneValue = document.getElementById("support-zone-value");
  const resistanceZoneValue = document.getElementById("resistance-zone-value");
  const fibEntryValue = document.getElementById("fib-entry-value");
  const fibInvalidValue = document.getElementById("fib-invalid-value");
  const rangeMidpointValue = document.getElementById("range-midpoint-value");
  const commandLog = document.getElementById("command-log");
  const chartContainer = document.getElementById("chart-container");
  const chartAnnotationLayer = document.getElementById("chart-annotation-layer");
  const chartLegend = document.getElementById("chart-legend");
  const chartModeLocalButton = document.getElementById("chart-mode-local");
  const chartModeTradingViewButton = document.getElementById("chart-mode-tradingview");
  const tvChartLoading = document.getElementById("tv-chart-loading");
  const tvChartContainer = document.getElementById("tv-chart-container");
  const tvChartWidget = document.getElementById("tv-chart-widget");

  // News Analysis elements
  const newsSentimentValue = document.getElementById("news-sentiment-value");
  const newsImpactValue = document.getElementById("news-impact-value");
  const newsArticlesValue = document.getElementById("news-articles-value");
  const newsEventsValue = document.getElementById("news-events-value");
  const newsSummaryValue = document.getElementById("news-summary-value");

  // Historical Movements elements
  const movementChangeValue = document.getElementById("movement-change-value");
  const movementVolatilityValue = document.getElementById("movement-volatility-value");
  const movementMomentumValue = document.getElementById("movement-momentum-value");
  const movementTrendValue = document.getElementById("movement-trend-value");
  const movementPatternsValue = document.getElementById("movement-patterns-value");
  const movementSupportValue = document.getElementById("movement-support-value");
  const movementResistanceValue = document.getElementById("movement-resistance-value");
  const movementVolumeValue = document.getElementById("movement-volume-value");

  // Advanced Patterns elements
  const patternCandlestickValue = document.getElementById("pattern-candlestick-value");
  const patternChartValue = document.getElementById("pattern-chart-value");
  const patternHarmonicValue = document.getElementById("pattern-harmonic-value");
  const patternSmcValue = document.getElementById("pattern-smc-value");
  const patternList = document.getElementById("pattern-list");

  // Predictive Analytics elements
  const prediction1hValue = document.getElementById("prediction-1h-value");
  const prediction4hValue = document.getElementById("prediction-4h-value");
  const predictionVolValue = document.getElementById("prediction-vol-value");
  const predictionConfidenceValue = document.getElementById("prediction-confidence-value");
  const probBullishValue = document.getElementById("prob-bullish-value");
  const probBearishValue = document.getElementById("prob-bearish-value");
  const probSidewaysValue = document.getElementById("prob-sideways-value");
  const probBullishFill = document.getElementById("prob-bullish");
  const probBearishFill = document.getElementById("prob-bearish");
  const probSidewaysFill = document.getElementById("prob-sideways");

  // Multi-Timeframe elements
  const mtfScoreValue = document.getElementById("mtf-score-value");
  const mtfDirectionValue = document.getElementById("mtf-direction-value");
  const mtfStrengthValue = document.getElementById("mtf-strength-value");
  const mtfAlignmentValue = document.getElementById("mtf-alignment-value");
  const mtfDivergencesValue = document.getElementById("mtf-divergences-value");

  // Trading Signal elements
  const signalPanel = document.getElementById("signal-panel");
  const signalDirection = document.getElementById("signal-direction");
  const signalConfidence = document.getElementById("signal-confidence");
  const signalEntryValue = document.getElementById("signal-entry-value");
  const signalStopValue = document.getElementById("signal-stop-value");
  const signalTarget1Value = document.getElementById("signal-target1-value");
  const signalRrValue = document.getElementById("signal-rr-value");
  const signalCatalyst = document.getElementById("signal-catalyst");

  // Alerts elements
  const alertsContainer = document.getElementById("alerts-container");

  // WebSocket elements
  const wsStatusValue = document.getElementById("ws-status-value");
  const wsLatencyValue = document.getElementById("ws-latency-value");
  const wsUpdatesValue = document.getElementById("ws-updates-value");
  const wsAlertsValue = document.getElementById("ws-alerts-value");

  // Feature indicators
  const featureNews = document.getElementById("feature-news");
  const featurePatterns = document.getElementById("feature-patterns");
  const featurePredictive = document.getElementById("feature-predictive");
  const featureMtf = document.getElementById("feature-mtf");
  const featureAlerts = document.getElementById("feature-alerts");
  const featureWs = document.getElementById("feature-ws");

  const CHART_MODE_ANNOTATED = "annotated";
  const CHART_MODE_TRADINGVIEW = "tradingview";
  let chartMode = (() => {
    try {
      const stored = window.localStorage.getItem("els-chart-mode");
      return stored === CHART_MODE_ANNOTATED ? CHART_MODE_ANNOTATED : (config.defaultChartMode || CHART_MODE_TRADINGVIEW);
    } catch (_error) {
      return config.defaultChartMode || CHART_MODE_TRADINGVIEW;
    }
  })();

  const chartState = {
    applyingViewport: false,
    instance: null,
    lastMarketKey: "",
    lastTradingViewKey: "",
    plotBounds: null,
    ready: false,
    renderQueued: false,
    viewport: null,
  };

  // WebSocket Client for real-time updates
  const wsState = {
    socket: null,
    connected: false,
    reconnectAttempts: 0,
    maxReconnectAttempts: 5,
    reconnectDelay: 3000,
    updateCount: 0,
    alertCount: 0,
    lastPingTime: 0,
    latency: 0,
    pingInterval: null
  };

  // Initialize WebSocket connection
  function initWebSocket() {
    const wsProto = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsPort = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" ? ":3003" : "";
    const wsUrl = `${wsProto}//${window.location.hostname}${wsPort}`;
    
    try {
      wsState.socket = new WebSocket(wsUrl);
      
      wsState.socket.onopen = () => {
        console.log("🔌 WebSocket connected");
        wsState.connected = true;
        wsState.reconnectAttempts = 0;
        updateWsStatus("connected");
        
        // Start client-side pings for accurate latency
        if (wsState.pingInterval) clearInterval(wsState.pingInterval);
        wsState.pingInterval = setInterval(() => {
          if (wsState.socket && wsState.connected) {
            wsState.lastPingTime = Date.now();
            wsState.socket.send(JSON.stringify({ type: "ping" }));
          }
        }, 3000);
        
        // Subscribe to current symbol if available
        const symbol = sessionSymbol?.textContent;
        if (symbol && symbol !== "--") {
          subscribeToSymbol(symbol);
        }
      };
      
      wsState.socket.onmessage = (event) => {
        const message = JSON.parse(event.data);
        handleWebSocketMessage(message);
      };
      
      wsState.socket.onclose = () => {
        console.log("🔌 WebSocket disconnected");
        wsState.connected = false;
        updateWsStatus("disconnected");
        
        // Clear ping interval
        if (wsState.pingInterval) {
          clearInterval(wsState.pingInterval);
          wsState.pingInterval = null;
        }
        
        // Attempt reconnection (local dev only)
        const _isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
        if (_isLocal && wsState.reconnectAttempts < wsState.maxReconnectAttempts) {
          wsState.reconnectAttempts++;
          setTimeout(initWebSocket, wsState.reconnectDelay);
        }
      };
      
      wsState.socket.onerror = (error) => {
        console.error("WebSocket error:", error);
        updateWsStatus("error");
      };
      
    } catch (error) {
      console.error("Failed to initialize WebSocket:", error);
      updateWsStatus("error");
    }
  }

  // Subscribe to symbol updates
  function subscribeToSymbol(symbol) {
    if (wsState.socket && wsState.connected) {
      wsState.socket.send(JSON.stringify({
        type: "subscribe",
        symbol: symbol,
        channels: ["price", "news", "alerts"]
      }));
    }
  }

  // Handle WebSocket messages
  function handleWebSocketMessage(message) {
    switch (message.type) {
      case "connection":
        console.log("WebSocket connection confirmed:", message.status);
        break;
        
      case "market-update":
        wsState.updateCount++;
        if (wsUpdatesValue) wsUpdatesValue.textContent = wsState.updateCount;
        break;
        
      case "news-update":
        updateNewsDisplay(message.data);
        break;
        
      case "alert":
        wsState.alertCount++;
        if (wsAlertsValue) wsAlertsValue.textContent = wsState.alertCount;
        addAlertToDashboard(message.alert);
        break;
        
      case "pattern-detected":
        updatePatternDisplay(message.data);
        break;
        
      case "ping":
        wsState.lastPingTime = Date.now();
        if (wsState.socket) {
          wsState.socket.send(JSON.stringify({ type: "pong" }));
        }
        break;
        
      case "pong":
        const latency = Date.now() - wsState.lastPingTime;
        wsState.latency = latency;
        if (wsLatencyValue) wsLatencyValue.textContent = `${latency}ms`;
        break;
    }
  }

  // Update WebSocket status display
  function updateWsStatus(status) {
    if (!wsStatusValue) return;
    
    wsStatusValue.className = "";
    wsStatusValue.classList.add(status);
    
    switch (status) {
      case "connected":
        wsStatusValue.textContent = "Connected";
        wsStatusValue.style.color = "var(--green)";
        if (featureWs) featureWs.classList.add("active");
        break;
      case "connecting":
        wsStatusValue.textContent = "Connecting...";
        wsStatusValue.style.color = "var(--gold)";
        break;
      case "disconnected":
        wsStatusValue.textContent = "Disconnected";
        wsStatusValue.style.color = "var(--red)";
        if (featureWs) featureWs.classList.remove("active");
        break;
      case "error":
        wsStatusValue.textContent = "Error";
        wsStatusValue.style.color = "var(--red)";
        if (featureWs) featureWs.classList.remove("active");
        break;
    }
  }

  // Add alert to dashboard
  function addAlertToDashboard(alert) {
    if (!alertsContainer) return;
    
    // Remove "No alerts yet" message
    const emptyMessage = alertsContainer.querySelector(".thesis-copy");
    if (emptyMessage) {
      emptyMessage.remove();
    }
    
    const alertItem = document.createElement("div");
    alertItem.className = `alert-item ${alert.priority}-priority new`;
    alertItem.innerHTML = `
      <span class="alert-icon">${getAlertIcon(alert.type)}</span>
      <div class="alert-content">
        <div class="alert-title">${escapeHtml(alert.title)}</div>
        <div class="alert-message">${escapeHtml(alert.message)}</div>
      </div>
      <span class="alert-time">${new Date(alert.timestamp).toLocaleTimeString()}</span>
    `;
    
    alertsContainer.insertBefore(alertItem, alertsContainer.firstChild);
    
    // Keep only last 10 alerts
    while (alertsContainer.children.length > 10) {
      alertsContainer.removeChild(alertsContainer.lastChild);
    }
    
    // Remove animation class after animation completes
    setTimeout(() => {
      alertItem.classList.remove("new");
    }, 300);
  }

  // Get alert icon based on type
  function getAlertIcon(type) {
    const icons = {
      "breaking_news": "🚨",
      "sentiment_shift": "📊",
      "key_event": "🔔",
      "high_impact": "⚠️",
      "entity_mention": "🏛️",
      "price_movement": "📈",
      "high_volatility": "⚡",
      "pattern_complete": "🎯",
      "breakout": "🚀"
    };
    return icons[type] || "📢";
  }

  // Update news display
  function updateNewsDisplay(newsData) {
    if (!newsData) return;
    
    if (newsSentimentValue && newsData.sentiment) {
      newsSentimentValue.textContent = newsData.sentiment.overall || "--";
    }
    if (newsImpactValue && newsData.impact) {
      newsImpactValue.textContent = newsData.impact.level || newsData.impact || "--";
    }
    if (featureNews) featureNews.classList.add("active");
    
    // Display article summaries if available
    if (newsSummaryValue && newsData.articleSummaries && newsData.articleSummaries.length > 0) {
      const summariesHtml = newsData.articleSummaries.map(article => `
        <div style="margin-bottom: 12px; padding: 8px; background: rgba(255,255,255,0.03); border-left: 2px solid ${article.sentiment === 'positive' ? '#4caf50' : article.sentiment === 'negative' ? '#f44336' : '#9e9e9e'}; border-radius: 2px;">
          <div style="font-size: 11px; font-weight: 600; color: var(--ink-bright); margin-bottom: 4px;">${article.summary}</div>
          <div style="font-size: 9px; color: var(--ink-dim); display: flex; gap: 8px;">
            <span>${article.source}</span>
            <span>${article.publishedAt}</span>
            <span style="color: ${article.sentiment === 'positive' ? '#4caf50' : article.sentiment === 'negative' ? '#f44336' : '#9e9e9e'}">${article.sentiment}</span>
          </div>
        </div>
      `).join('');
      newsSummaryValue.innerHTML = summariesHtml;
    } else if (newsSummaryValue) {
      newsSummaryValue.textContent = newsData.summary || "No news data available.";
    }
  }

  // Update pattern display
  function updatePatternDisplay(patternData) {
    if (!patternData || !patternList) return;
    
    patternList.innerHTML = "";
    
    const patterns = [
      ...(patternData.candlestick || []).map(p => ({ ...p, name: p.name || 'Candlestick Pattern' })),
      ...(patternData.chart || []).map(p => ({ ...p, name: p.name || 'Chart Pattern' })),
      ...(patternData.smartMoney || []).map(p => ({ ...p, name: p.name || 'SMC Concept' })),
      ...(patternData.divergences || []).map(p => ({ ...p, name: p.name || 'Divergence' })),
      ...(patternData.harmonic || []).map(p => ({ ...p, name: p.name || 'Harmonic Pattern' })),
      ...(patternData.wyckoff || []).map(p => ({ ...p, name: p.name || 'Wyckoff Phase' })),
      ...(patternData.elliott || []).map(p => ({ ...p, name: p.name || 'Elliott Wave' }))
    ].slice(0, 10);
    
    if (patterns.length === 0) {
      patternList.innerHTML = "<p class='thesis-copy'>No patterns detected.</p>";
      return;
    }
    
    patterns.forEach(pattern => {
      const item = document.createElement("div");
      item.className = "pattern-item";
      item.innerHTML = `
        <span class="pattern-name">${escapeHtml(pattern.name)}</span>
        <span class="pattern-signal ${pattern.signal}">${pattern.signal}</span>
      `;
      patternList.appendChild(item);
    });
    
    const patternCandlestickValue = document.getElementById("pattern-candlestick-value");
    const patternChartValue = document.getElementById("pattern-chart-value");
    const patternHarmonicValue = document.getElementById("pattern-harmonic-value");
    const patternSmcValue = document.getElementById("pattern-smc-value");

    if (patternCandlestickValue) {
      const candleCount = (patternData.candlestick || []).length;
      patternCandlestickValue.textContent = candleCount > 0 ? `${candleCount} found` : "--";
    }
    
    if (patternChartValue) {
      const chartCount = (patternData.chart || []).length;
      patternChartValue.textContent = chartCount > 0 ? `${chartCount} found` : "--";
    }
    
    if (patternHarmonicValue) {
      const harmonicCount = (patternData.harmonic || []).length;
      patternHarmonicValue.textContent = harmonicCount > 0 ? `${harmonicCount} found` : "--";
    }
    
    if (patternSmcValue) {
      const smcCount = (patternData.smartMoney || []).length;
      patternSmcValue.textContent = smcCount > 0 ? `${smcCount} found` : "--";
    }
    
    if (featurePatterns) featurePatterns.classList.add("active");
  }

  // Update enhanced dashboard data
  function updateEnhancedDashboard(payload) {
    if (!payload) return;
    
    const analysis = payload.analysis || {};
    
    // Update patterns
    if (analysis.advancedPatterns) {
      updatePatternDisplay(analysis.advancedPatterns);
    }
    
    // Update predictive analytics
    if (analysis.predictive) {
      updatePredictiveDisplay(analysis.predictive);
    }
    
    // Update MTF analysis
    if (analysis.mtf) {
      updateMtfDisplay(analysis.mtf);
    }
    
    // Update signals
    if (payload.signal && payload.signal.signal === "active") {
      updateSignalDisplay(payload.signal);
    } else if (signalPanel) {
      signalPanel.hidden = true;
    }
  }

  // Update predictive display
  function updatePredictiveDisplay(predictive) {
    if (!predictive) return;
    
    if (prediction1hValue && predictive.price?.predictions?.next1h) {
      prediction1hValue.textContent = formatPrice(predictive.price.predictions.next1h.target);
    }
    
    if (prediction4hValue && predictive.price?.predictions?.next4h) {
      prediction4hValue.textContent = formatPrice(predictive.price.predictions.next4h.target);
    }
    
    if (predictionVolValue && predictive.volatility) {
      predictionVolValue.textContent = predictive.volatility.regime || "--";
    }
    
    if (predictionConfidenceValue) {
      const conf = Math.round((predictive.confidence || 0) * 100);
      predictionConfidenceValue.textContent = `${conf}%`;
    }
    
    // Update probability bars
    if (predictive.probabilities) {
      const probs = predictive.probabilities;
      
      if (probBullishValue && probBullishFill) {
        probBullishValue.textContent = `${Math.round(probs.bullish || 0)}%`;
        probBullishFill.style.setProperty("--fill-percent", `${probs.bullish || 0}%`);
      }
      
      if (probBearishValue && probBearishFill) {
        probBearishValue.textContent = `${Math.round(probs.bearish || 0)}%`;
        probBearishFill.style.setProperty("--fill-percent", `${probs.bearish || 0}%`);
      }
      
      if (probSidewaysValue && probSidewaysFill) {
        probSidewaysValue.textContent = `${Math.round(probs.sideways || 0)}%`;
        probSidewaysFill.style.setProperty("--fill-percent", `${probs.sideways || 0}%`);
      }
    }
    
    if (featurePredictive) featurePredictive.classList.add("active");
  }

  // Update MTF display
  function updateMtfDisplay(mtf) {
    if (!mtf) return;
    
    if (mtfScoreValue && mtf.confluenceScore) {
      mtfScoreValue.textContent = `${mtf.confluenceScore.score || 0}/100`;
    }
    
    if (mtfDirectionValue && mtf.confluenceScore) {
      mtfDirectionValue.textContent = mtf.confluenceScore.direction || "--";
    }
    
    if (mtfStrengthValue && mtf.confluenceScore) {
      mtfStrengthValue.textContent = mtf.confluenceScore.strength || "--";
    }
    
    if (mtfAlignmentValue && mtf.hierarchy) {
      mtfAlignmentValue.textContent = mtf.hierarchy.alignment || "--";
    }
    
    if (mtfDivergencesValue) {
      const divCount = (mtf.divergences || []).length;
      mtfDivergencesValue.textContent = divCount > 0 ? `${divCount} found` : "None";
    }
    
    if (featureMtf) featureMtf.classList.add("active");
  }

  // Draw sentiment timeline
  function drawSentimentTimeline(sentimentData) {
    const canvas = document.getElementById('sentiment-canvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const container = document.getElementById('sentiment-timeline-chart');
    if (!container) return;
    
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    
    // Draw background
    ctx.fillStyle = '#141b24';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw grid lines
    ctx.strokeStyle = '#252b36';
    ctx.lineWidth = 1;
    for (let i = 0; i < 5; i++) {
      const y = (canvas.height / 5) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }
    
    // Generate dummy sentiment data if none provided
    const data = sentimentData || [
      { time: Date.now() - 3600000 * 5, sentiment: 50 },
      { time: Date.now() - 3600000 * 4, sentiment: 45 },
      { time: Date.now() - 3600000 * 3, sentiment: 60 },
      { time: Date.now() - 3600000 * 2, sentiment: 70 },
      { time: Date.now() - 3600000, sentiment: 65 },
      { time: Date.now(), sentiment: 75 }
    ];
    
    if (data.length < 2) return;
    
    // Draw the line
    ctx.beginPath();
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2;
    
    const minTime = data[0].time;
    const maxTime = data[data.length - 1].time;
    const timeRange = maxTime - minTime || 1;
    
    data.forEach((point, index) => {
      const x = ((point.time - minTime) / timeRange) * (canvas.width - 20) + 10;
      const y = canvas.height - ((point.sentiment / 100) * (canvas.height - 20) + 10);
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();
    
    // Draw points
    ctx.fillStyle = '#10b981';
    data.forEach((point) => {
      const x = ((point.time - minTime) / timeRange) * (canvas.width - 20) + 10;
      const y = canvas.height - ((point.sentiment / 100) * (canvas.height - 20) + 10);
      
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  // Update signal display
  function updateSignalDisplay(signal) {
    if (!signal || !signalPanel) return;
    
    signalPanel.hidden = false;
    
    if (signalDirection) {
      signalDirection.textContent = signal.direction?.toUpperCase() || "--";
      signalDirection.className = `signal-direction ${signal.direction}`;
    }
    
    if (signalConfidence) {
      signalConfidence.textContent = `${signal.confidence || 0}%`;
    }
    
    if (signalEntryValue) {
      signalEntryValue.textContent = formatPrice(signal.entry);
    }
    
    if (signalStopValue) {
      signalStopValue.textContent = formatPrice(signal.stopLoss);
    }
    
    if (signalTarget1Value) {
      signalTarget1Value.textContent = formatPrice(signal.target1);
    }
    
    if (signalRrValue) {
      signalRrValue.textContent = signal.riskReward || "--";
    }
    
    if (signalCatalyst) {
      signalCatalyst.textContent = signal.catalyst || "--";
    }
    
    if (featureAlerts) featureAlerts.classList.add("active");
  }

  // Initialize WebSocket only on localhost — Vercel serverless does not
  // support persistent WebSocket connections. SSE + polling handles real-time
  // updates on production automatically.
  const isLocalDev = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
  if (isLocalDev) initWebSocket();

  let renderedSnapshot = null;
  let renderedPayload = null;
  let stream = null;
  let streamRetryCount = 0;
  let lastRenderKey = "";
  let lastStreamEventAt = 0;

  // ── Client-side selection persistence (survives SSE/serverless resets) ──
  const LS_KEY = "els_user_selection";
  let userSelection = null; // { symbol, timeframe } — set by user action

  function saveUserSelection(symbol, timeframe) {
    userSelection = { symbol, timeframe };
    try { localStorage.setItem(LS_KEY, JSON.stringify(userSelection)); } catch (_) {}
  }

  function loadUserSelection() {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) userSelection = JSON.parse(raw);
    } catch (_) {}
    return userSelection;
  }

  // Load saved selection immediately
  loadUserSelection();

  function sanitizeRiskFlags(items) {
    const blockedPrefixes = [
      "Gemini analysis failed:",
      "OpenAI analysis failed:",
      "Gemini unavailable:",
      "OpenAI unavailable:",
    ];

    return (Array.isArray(items) ? items : []).filter((item) => {
      if (!item) return false;
      return !blockedPrefixes.some((prefix) => String(item).startsWith(prefix));
    });
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function formatPrice(value) {
    if (value == null || Number.isNaN(Number(value))) return "--";
    const numeric = Number(value);
    if (Math.abs(numeric) >= 1000) return numeric.toFixed(2);
    if (Math.abs(numeric) >= 10) return numeric.toFixed(3);
    return numeric.toFixed(5);
  }

  function formatTimestamp(value) {
    if (!value) return "--";
    return new Date(value).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  }

  function formatZone(zone) {
    if (!zone || zone.low == null || zone.high == null) return "--";
    return `${formatPrice(zone.low)} - ${formatPrice(zone.high)}`;
  }

  function formatChange(change, percent) {
    if (change == null || percent == null) return "--";
    const sign = change >= 0 ? "+" : "";
    return `${sign}${formatPrice(change)} (${sign}${Number(percent).toFixed(2)}%)`;
  }

  function formatCountdown(nextTimestamp, label = "update") {
    if (!nextTimestamp) return "Enable live watch in terminal.";
    const remainingMs = Math.max(0, nextTimestamp - Date.now());
    const remainingSeconds = remainingMs / 1000;
    const minutes = Math.floor(remainingSeconds / 60);
    const seconds = remainingSeconds % 60;
    if (minutes <= 0 && remainingSeconds < 10) return `${label} ${remainingSeconds.toFixed(1)}s`;
    if (minutes <= 0) return `${label} ${Math.ceil(seconds)}s`;
    return `${label} ${String(minutes).padStart(2, "0")}:${String(Math.ceil(seconds)).padStart(2, "0")}`;
  }

  function formatUpdateAge(updatedAt) {
    if (!updatedAt) return "--";
    const elapsedMs = Math.max(0, Date.now() - updatedAt);
    const elapsedSeconds = elapsedMs / 1000;
    if (elapsedSeconds < 10) return `${elapsedSeconds.toFixed(1)}s ago`;
    if (elapsedSeconds < 60) return `${Math.floor(elapsedSeconds)}s ago`;
    const minutes = Math.floor(elapsedSeconds / 60);
    const seconds = Math.floor(elapsedSeconds) % 60;
    return `${minutes}m ${String(seconds).padStart(2, "0")}s ago`;
  }

  function formatTimingSummary(watch) {
    if (!watch || !watch.active) return "Enable live watch in terminal.";
    const parts = [
      formatCountdown(watch.nextQuoteAt, "Tick in"),
      formatCountdown(watch.nextRefreshAt, "Scan in"),
    ];

    if (watch.nextAiAt) {
      parts.push(formatCountdown(watch.nextAiAt, "AI in"));
    }

    return parts.join(" | ");
  }

  function formatUpdatedStat(updatedAt) {
    if (!updatedAt) return "--";
    return `Updated ${formatTimestamp(updatedAt)} | ${formatUpdateAge(updatedAt)}`;
  }

  function formatAxisTime(value, timeframeKey) {
    if (!Number.isFinite(Number(value))) return "";
    const date = new Date(Number(value) * 1000);
    if (["1m", "5m", "15m", "1h", "4h"].includes(timeframeKey)) {
      return date.toLocaleDateString([], { month: "short", day: "numeric" });
    }
    return date.toLocaleDateString([], { month: "short", day: "numeric", year: "2-digit" });
  }

  function formatTooltipTime(value, timeframeKey) {
    if (!Number.isFinite(Number(value))) return "--";
    const date = new Date(Number(value) * 1000);
    if (["1m", "5m", "15m", "1h", "4h"].includes(timeframeKey)) {
      return date.toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
    }
    return date.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
  }

  function buildRenderKey(snapshot) {
    if (!snapshot) return "empty";
    const latest = snapshot.latest || {};
    const analysis = latest.analysis || {};
    const indicators = analysis.indicators || {};
    const smc = indicators.smc || {};
    const primarySetup = (analysis.setups || [])[0] || {};
    return JSON.stringify({
      active: snapshot.watch?.active || false,
      aiCall: analysis.ai?.oneLineCall || analysis.aiAnalysis || "",
      bias: analysis.bias || "",
      command: snapshot.history?.[0]?.command || "",
      confidence: analysis.confidence || null,
      confluence: analysis.scorecard?.confluence || null,
      entry: primarySetup.entry || null,
      fib05: smc.fib?.level05 || null,
      fib0705: smc.fib?.level0705 || null,
      latestSymbol: latest.displaySymbol || null,
      price: latest.snapshot?.price || null,
      rsi: indicators.rsi14 || null,
      selectionSymbol: snapshot.selection?.symbol || "",
      status: snapshot.status?.label || "",
      structure: smc.internalStructure || analysis.structure?.sequence || "",
      timeframe: snapshot.selection?.timeframe || "",
      updatedAt: latest.updatedAt || null,
      version: snapshot.version || 0,
      watchAi: snapshot.watch?.nextAiAt || null,
      watchRefresh: snapshot.watch?.nextRefreshAt || null,
      watchTick: snapshot.watch?.nextQuoteAt || null,
    });
  }

  function getMarketKey(payload) {
    if (!payload) return "";
    return `${payload.providerSymbol || payload.displaySymbol || ""}:${payload.timeframe?.key || ""}`;
  }

  function normalizeTradingViewBaseSymbol(value) {
    return String(value || "")
      .trim()
      .toUpperCase()
      .replace(/\s+/g, "");
  }

  function sanitizeTradingViewCandidate(value) {
    const raw = normalizeTradingViewBaseSymbol(value);
    if (!raw) return "";

    return raw
      .replace(/^FX:/, "")
      .replace(/^OANDA:/, "")
      .replace(/^FPMARKETS:/, "")
      .replace(/^BITSTAMP:/, "")
      .replace(/^NASDAQ:/, "")
      .replace(/^NYSE:/, "")
      .replace(/^CAPITALCOM:/, "")
      .replace(/^COMEX:/, "")
      .replace(/^NYMEX:/, "")
      .replace(/^CME_MINI:/, "")
      .replace(/^TVC:/, "")
      .replace(/^INDEX:/, "")
      .replace(/^FOREXCOM:/, "")
      .replace(/^FX_IDC:/, "")
      .replace(/\//g, "")
      .replace(/=X$/, "")
      .replace(/-USD$/, "USD")
      .replace(/-USDT$/, "USDT")
      .replace(/-EUR$/, "EUR")
      .replace(/-GBP$/, "GBP")
      .replace(/\^/g, "");
  }

  function mapTradingViewCandidate(value) {
    const raw = normalizeTradingViewBaseSymbol(value);
    if (!raw) return null;

    if (raw.includes(":")) {
      return raw;
    }

    const explicitMap = {
      "AAPL": "NASDAQ:AAPL",
      "AMZN": "NASDAQ:AMZN",
      "AUDUSD": "FX_IDC:AUDUSD",
      "BTC-USD": "BITSTAMP:BTCUSD",
      "BTCUSD": "BITSTAMP:BTCUSD",
      "CL=F": "TVC:USOIL",
      "ES=F": "CME_MINI:ES1!",
      "ETH-USD": "BITSTAMP:ETHUSD",
      "ETHUSD": "BITSTAMP:ETHUSD",
      "EURGBP": "FX_IDC:EURGBP",
      "EURJPY": "FX_IDC:EURJPY",
      "EURUSD": "FX_IDC:EURUSD",
      "EURUSD=X": "FX_IDC:EURUSD",
      "GBPJPY": "FX_IDC:GBPJPY",
      "GBPUSD": "FX_IDC:GBPUSD",
      "GBPUSD=X": "FX_IDC:GBPUSD",
      "GC=F": "OANDA:XAUUSD",
      "GER40": "CAPITALCOM:DE40",
      "META": "NASDAQ:META",
      "MSFT": "NASDAQ:MSFT",
      "NAS100": "TVC:NDX",
      "NQ=F": "CME_MINI:NQ1!",
      "NVDA": "NASDAQ:NVDA",
      "NZDUSD": "FX_IDC:NZDUSD",
      "SI=F": "OANDA:XAGUSD",
      "SPX500": "TVC:SPX",
      "TSLA": "NASDAQ:TSLA",
      "US30": "TVC:DJI",
      "US500": "TVC:SPX",
      "USDCAD": "FX_IDC:USDCAD",
      "USDCHF": "FX_IDC:USDCHF",
      "USDJPY": "FX_IDC:USDJPY",
      "USDJPY=X": "FX_IDC:USDJPY",
      "XAGUSD": "OANDA:XAGUSD",
      "XAUUSD": "OANDA:XAUUSD",
    };

    if (explicitMap[raw]) {
      return explicitMap[raw];
    }

    const cleaned = sanitizeTradingViewCandidate(raw);
    if (explicitMap[cleaned]) {
      return explicitMap[cleaned];
    }

    if (/^[A-Z]{6}$/.test(cleaned)) {
      return `FX_IDC:${cleaned}`;
    }

    if (/^[A-Z]{1,5}$/.test(cleaned)) {
      return cleaned;
    }

    if (cleaned) {
      return cleaned;
    }

    return null;
  }

  function toTradingViewSymbol(value, options = {}) {
    const candidates = [
      options.selectionSymbol,
      options.displaySymbol,
      options.providerSymbol,
      value,
      config.defaultSymbol,
      "EURUSD",
    ];

    for (const candidate of candidates) {
      const mapped = mapTradingViewCandidate(candidate);
      if (mapped) {
        return mapped;
      }
    }

    return "FPMARKETS:EURUSD";
  }

  function toTradingViewInterval(timeframe) {
    const map = {
      "1m": "1",
      "5m": "5",
      "15m": "15",
      "1h": "60",
      "4h": "240",
      "1d": "D",
      "1wk": "W",
    };

    return map[timeframe] || "60";
  }

  function persistChartMode(mode) {
    try {
      window.localStorage.setItem("els-chart-mode", mode);
    } catch (_error) {
      return;
    }
  }

  function applyChartModeUi() {
    const annotated = chartMode === CHART_MODE_ANNOTATED;

    if (chartModeLocalButton) {
      chartModeLocalButton.classList.toggle("active", annotated);
      chartModeLocalButton.setAttribute("aria-pressed", annotated ? "true" : "false");
    }

    if (chartModeTradingViewButton) {
      chartModeTradingViewButton.classList.toggle("active", !annotated);
      chartModeTradingViewButton.setAttribute("aria-pressed", annotated ? "false" : "true");
    }

    if (chartContainer) {
      chartContainer.hidden = !annotated;
    }

    if (chartAnnotationLayer) {
      chartAnnotationLayer.hidden = !annotated;
    }

    if (chartLegend) {
      chartLegend.hidden = !annotated;
    }

    if (tvChartContainer) {
      tvChartContainer.hidden = annotated;
    }

    if (tvChartLoading) {
      tvChartLoading.hidden = annotated;
    }
  }

  function clearTradingViewSurface() {
    if (!tvChartWidget) return;
    tvChartWidget.innerHTML = "";
  }

  function sanitizePageUri(value) {
    return String(value || window.location.href || "").replace(/^https?:\/\//i, "");
  }

  function buildTradingViewIframeSrc(settings) {
    const url = new URL("https://www.tradingview-widget.com/embed-widget/advanced-chart/");
    url.searchParams.set("locale", settings.locale || "en");

    const hashSettings = {
      ...settings,
      "page-uri": sanitizePageUri(window.location.href),
    };

    delete hashSettings.locale;
    url.hash = encodeURIComponent(JSON.stringify(hashSettings));
    return url.toString();
  }

  function setChartMode(nextMode, options = {}) {
    chartMode = nextMode === CHART_MODE_ANNOTATED ? CHART_MODE_ANNOTATED : CHART_MODE_TRADINGVIEW;
    persistChartMode(chartMode);
    applyChartModeUi();

    if (options.rerender !== false && renderedSnapshot) {
      if (renderedSnapshot.latest) {
        renderMarket(renderedSnapshot);
      } else {
        renderEmpty(renderedSnapshot);
      }
    }
  }

  function clearLegacyWidgetLocation() {
    try {
      const url = new URL(window.location.href);
      let changed = false;

      ["tvwidgetsymbol", "symbol", "interval"].forEach((key) => {
        if (url.searchParams.has(key)) {
          url.searchParams.delete(key);
          changed = true;
        }
      });

      if (changed) {
        window.history.replaceState({}, "", url);
      }
    } catch (_error) {
      return;
    }
  }

  function clearChartSurface() {
    if (window.Plotly && chartContainer?.data) {
      try {
        window.Plotly.purge(chartContainer);
      } catch (_error) {
        // Ignore cleanup issues and fall back to clearing the container.
      }
    }
    chartContainer.__elsKlineBound = false;
    chartContainer.innerHTML = "";
    clearChartUi();
  }

  function estimateTimeSpacingSeconds(candles) {
    if (!Array.isArray(candles) || candles.length < 2) return 3600;
    const deltas = [];
    for (let index = Math.max(1, candles.length - 20); index < candles.length; index += 1) {
      const delta = Number(candles[index].time) - Number(candles[index - 1].time);
      if (Number.isFinite(delta) && delta > 0) deltas.push(delta);
    }
    if (!deltas.length) return 3600;
    deltas.sort((left, right) => left - right);
    return deltas[Math.floor(deltas.length / 2)];
  }

  function normalizeOverlayPoints(points) {
    return (Array.isArray(points) ? points : [])
      .filter((point) => point && point.time != null && point.value != null && Number.isFinite(Number(point.value)))
      .map((point) => ({ time: Number(point.time), value: Number(point.value) }))
      .sort((left, right) => left.time - right.time);
  }

  function toDashArray(lineStyle) {
    if (lineStyle === "dashed") return 6;
    if (lineStyle === "dotted") return 2;
    return 0;
  }

  function toEpochMs(time) {
    const numeric = Number(time);
    return Number.isFinite(numeric) ? numeric * 1000 : null;
  }

  function getBaseDataRange(payload) {
    const candles = Array.isArray(payload?.candles) ? payload.candles : [];
    const visuals = payload?.analysis?.visuals || {};
    const annotations = visuals.annotations || {};
    const spacingMs = estimateTimeSpacingSeconds(candles) * 1000;
    const overlayTimes = [];

    (annotations.regions || []).forEach((region) => {
      overlayTimes.push(toEpochMs(region.startTime), toEpochMs(region.endTime));
    });

    (annotations.labels || []).forEach((label) => {
      overlayTimes.push(toEpochMs(label.time));
    });

    (visuals.lineOverlays || []).forEach((overlay) => {
      normalizeOverlayPoints(overlay.points).forEach((point) => {
        overlayTimes.push(toEpochMs(point.time));
      });
    });

    const finiteOverlayTimes = overlayTimes.filter((value) => Number.isFinite(value));
    const firstTime = candles.length ? toEpochMs(candles[0].time) : Date.now() - spacingMs * 120;
    const latestTime = candles.length ? toEpochMs(candles[candles.length - 1].time) : Date.now();
    const minTime = finiteOverlayTimes.length ? Math.min(firstTime, ...finiteOverlayTimes) : firstTime;
    const maxTime = finiteOverlayTimes.length ? Math.max(latestTime, ...finiteOverlayTimes) : latestTime;

    return {
      max: maxTime + spacingMs * 2,
      min: minTime,
      spacingMs,
    };
  }

  function getDefaultViewport(payload) {
    const candles = Array.isArray(payload?.candles) ? payload.candles : [];
    const baseRange = getBaseDataRange(payload);
    const visibleBars = Math.min(Math.max(90, candles.length ? Math.min(candles.length, 120) : 90), 140);
    const startIndex = Math.max(0, candles.length - visibleBars);
    const min = candles[startIndex] ? toEpochMs(candles[startIndex].time) : baseRange.min;
    return {
      max: baseRange.max,
      min,
    };
  }

  function normalizeViewport(viewport, payload) {
    const baseRange = getBaseDataRange(payload);
    const requestedMin = Number(viewport?.min ?? baseRange.min);
    const requestedMax = Number(viewport?.max ?? baseRange.max);
    const min = Math.max(baseRange.min, requestedMin);
    const max = Math.max(min + Math.max(baseRange.spacingMs, 60000), Math.min(requestedMax, baseRange.max));
    return { max, min };
  }

  function getVisibleYFallback(payload) {
    const snapshotPrice = Number(payload?.snapshot?.price);
    const pivot = Number.isFinite(snapshotPrice) ? snapshotPrice : 1;
    const padding = Math.max(Math.abs(pivot) * 0.01, 1);
    return {
      max: pivot + padding,
      min: pivot - padding,
    };
  }

  function computeVisibleYRange(payload, viewport) {
    const visuals = payload?.analysis?.visuals || {};
    const annotations = visuals.annotations || {};
    const values = [];
    const viewMin = Number(viewport?.min);
    const viewMax = Number(viewport?.max);
    const lowerBound = viewMin / 1000;
    const upperBound = viewMax / 1000;

    (payload?.candles || []).forEach((candle) => {
      const time = Number(candle.time);
      if (time < lowerBound || time > upperBound) return;
      values.push(Number(candle.open), Number(candle.high), Number(candle.low), Number(candle.close));
    });

    (visuals.ema200 || []).forEach((point) => {
      const time = Number(point.time);
      if (time >= lowerBound && time <= upperBound) values.push(Number(point.value));
    });

    (visuals.lineOverlays || []).forEach((overlay) => {
      normalizeOverlayPoints(overlay.points).forEach((point) => {
        if (point.time >= lowerBound && point.time <= upperBound) values.push(point.value);
      });
    });

    (visuals.priceLines || []).forEach((line) => values.push(Number(line.value)));

    (annotations.regions || []).forEach((region) => {
      if (Number(region.endTime) < lowerBound || Number(region.startTime) > upperBound) return;
      values.push(Number(region.top), Number(region.bottom));
    });

    (annotations.labels || []).forEach((label) => {
      if (label.anchor === "right-edge" || (Number(label.time) >= lowerBound && Number(label.time) <= upperBound)) {
        values.push(Number(label.price));
      }
    });

    if (Number.isFinite(Number(payload?.snapshot?.price))) values.push(Number(payload.snapshot.price));
    const numericValues = values.filter((value) => Number.isFinite(value));
    if (!numericValues.length) return getVisibleYFallback(payload);

    const min = Math.min(...numericValues);
    const max = Math.max(...numericValues);
    const padding = Math.max((max - min) * 0.08, Math.abs(max || 1) * 0.0025, 0.0001);
    return {
      max: max + padding,
      min: min - padding,
    };
  }

  function getVisibleYRange(payload) {
    const globals = chartState.instance?.w?.globals;
    const min = Number(globals?.minYArr?.[0]);
    const max = Number(globals?.maxYArr?.[0]);
    if (Number.isFinite(min) && Number.isFinite(max) && max > min) {
      return { max, min };
    }
    return computeVisibleYRange(payload, chartState.viewport || getDefaultViewport(payload));
  }

  function clearChartUi() {
    chartAnnotationLayer.innerHTML = "";
    chartLegend.innerHTML = "";
  }

  function resetChartState() {
    chartState.applyingViewport = false;
    chartState.plotBounds = null;
    chartState.ready = false;
    clearChartUi();
  }

  function syncPlotBounds() {
    if (chartState.instance) {
      try {
        const apexGlobals = chartState.instance.w?.globals;
        if (apexGlobals && apexGlobals.grid) {
          const grid = apexGlobals.grid;
          const padding = apexGlobals.padding;
          
          chartState.plotBounds = {
            left: grid.left + (padding?.left || 0),
            top: grid.top + (padding?.top || 0),
            width: grid.width,
            height: grid.height
          };
          return chartState.plotBounds;
        }
      } catch (_err) {
        // Fall back to manual calculation
      }
    }

    const containerRect = chartContainer.getBoundingClientRect();
    if (!containerRect.width || !containerRect.height) {
      chartState.plotBounds = null;
      return null;
    }

    const compact = containerRect.width < 760;
    const topInset = compact ? 54 : 66;
    const rightInset = compact ? 74 : 86;
    const bottomInset = compact ? 32 : 38;
    const leftInset = compact ? 12 : 16;

    chartState.plotBounds = {
      height: Math.max(120, containerRect.height - topInset - bottomInset),
      left: leftInset,
      top: topInset,
      width: Math.max(120, containerRect.width - leftInset - rightInset),
    };
    return chartState.plotBounds;
  }

  function buildApexSeries(payload) {
    const visuals = payload?.analysis?.visuals || {};
    const candles = Array.isArray(payload?.candles) ? payload.candles : [];
    const baseRange = getBaseDataRange(payload);
    const series = [
      {
        data: candles.map((candle) => ({
          x: toEpochMs(candle.time),
          y: [Number(candle.open), Number(candle.high), Number(candle.low), Number(candle.close)],
        })),
        name: payload.displaySymbol || "Market",
        type: "candlestick",
      },
    ];
    const styleMeta = [{ color: "#2962ff", dash: 0, width: 1 }];

    const ema200Points = normalizeOverlayPoints(visuals.ema200);
    if (ema200Points.length) {
      series.push({
        data: ema200Points.map((point) => ({ x: toEpochMs(point.time), y: point.value })),
        name: "EMA 200",
        type: "line",
      });
      styleMeta.push({ color: "#f23645", dash: 0, width: 1 });
    }

    (visuals.lineOverlays || []).forEach((overlay, index) => {
      const points = normalizeOverlayPoints(overlay.points);
      if (points.length < 2) return;
      series.push({
        data: points.map((point) => ({ x: toEpochMs(point.time), y: point.value })),
        name: overlay.label || `Overlay ${index + 1}`,
        type: "line",
      });
      styleMeta.push({
        color: overlay.color || "#4b5563",
        dash: toDashArray(overlay.lineStyle),
        width: overlay.lineWidth || 1,
      });
    });

    (visuals.priceLines || []).forEach((line, index) => {
      const value = Number(line.value);
      if (!Number.isFinite(value)) return;
      series.push({
        data: [
          { x: baseRange.min, y: value },
          { x: baseRange.max, y: value },
        ],
        name: line.label || `Level ${index + 1}`,
        type: "line",
      });
      styleMeta.push({
        color: line.color || "#6b7280",
        dash: 6,
        width: 1,
      });
    });

    return { series, styleMeta };
  }

  function buildLivePriceAnnotation(payload) {
    const price = Number(payload?.snapshot?.price);
    if (!Number.isFinite(price)) return [];
    const tone = Number(payload.snapshot.change) >= 0 ? "#089981" : "#f23645";
    return [
      {
        borderColor: tone,
        label: {
          borderColor: tone,
          offsetX: 8,
          style: {
            background: tone,
            color: "#ffffff",
          },
          text: `${payload.displaySymbol || "Live"} ${formatPrice(price)}`,
        },
        strokeDashArray: 4,
        y: price,
      },
    ];
  }

  function handleViewportEvent(xaxis) {
    if (!renderedPayload || !xaxis) return;
    chartState.viewport = normalizeViewport({ min: xaxis.min, max: xaxis.max }, renderedPayload);
    const yRange = getVisibleYRange(renderedPayload);

    if (!chartState.instance || chartState.applyingViewport) {
      syncPlotBounds();
      queueAnnotationRender();
      return;
    }

    chartState.applyingViewport = true;
    chartState.instance.updateOptions({
      yaxis: {
        forceNiceScale: true,
        labels: {
          formatter: (value) => formatPrice(value),
          style: {
            colors: "#4b5563",
          },
        },
        max: yRange.max,
        min: yRange.min,
        opposite: true,
      },
    }, false, false, false).finally(() => {
      chartState.applyingViewport = false;
      syncPlotBounds();
      queueAnnotationRender();
    });
  }

  function buildChartOption(payload) {
    const { series, styleMeta } = buildApexSeries(payload);
    const preserveView = getMarketKey(payload) === chartState.lastMarketKey && chartState.viewport;
    const viewport = normalizeViewport(preserveView ? chartState.viewport : getDefaultViewport(payload), payload);
    const yRange = computeVisibleYRange(payload, viewport);

    chartState.viewport = viewport;

    return {
      annotations: {
        yaxis: buildLivePriceAnnotation(payload),
      },
      chart: {
        animations: {
          enabled: false,
          dynamicAnimation: {
            enabled: false,
          },
        },
        background: "#ffffff",
        events: {
          beforeResetZoom: () => ({
            xaxis: getDefaultViewport(payload),
          }),
          mounted: () => {
            chartState.ready = true;
            syncPlotBounds();
            renderChartLegend();
            queueAnnotationRender();
          },
          scrolled: (_chart, { xaxis }) => handleViewportEvent(xaxis),
          updated: () => {
            chartState.ready = true;
            syncPlotBounds();
            renderChartLegend();
            queueAnnotationRender();
          },
          zoomed: (_chart, { xaxis }) => handleViewportEvent(xaxis),
        },
        foreColor: "#4b5563",
        height: "100%",
        id: "market-chart",
        parentHeightOffset: 0,
        toolbar: {
          show: true,
          offsetX: -4,
          offsetY: 6,
          tools: {
            download: false,
            pan: true,
            reset: true,
            selection: false,
            zoom: true,
            zoomin: true,
            zoomout: true,
          },
        },
        type: "line",
        zoom: {
          autoScaleYaxis: true,
          enabled: true,
          type: "x",
        },
      },
      colors: styleMeta.map((item) => item.color),
      dataLabels: {
        enabled: false,
      },
      fill: {
        opacity: styleMeta.map((_, index) => (index === 0 ? 1 : 0.96)),
      },
      grid: {
        borderColor: "rgba(117, 126, 140, 0.18)",
        row: {
          colors: ["transparent"],
          opacity: 0,
        },
        strokeDashArray: 0,
        padding: {
          bottom: -6,
          left: 8,
          right: 8,
          top: 4,
        },
      },
      legend: {
        show: false,
      },
      markers: {
        hover: {
          sizeOffset: 0,
        },
        size: 0,
      },
      noData: {
        text: "Waiting for market data",
      },
      plotOptions: {
        candlestick: {
          colors: {
            downward: "#787b86",
            upward: "#2962ff",
          },
          wick: {
            useFillColor: true,
          },
        },
      },
      series,
      stroke: {
        curve: "straight",
        dashArray: styleMeta.map((item) => item.dash),
        width: styleMeta.map((item) => item.width),
      },
      tooltip: {
        intersect: false,
        shared: true,
        theme: "dark",
        x: {
          formatter: (value) => formatTooltipTime(Number(value) / 1000, payload.timeframe?.key),
        },
        y: {
          formatter: (value) => formatPrice(value),
        },
      },
      xaxis: {
        axisBorder: {
          color: "rgba(143, 151, 165, 0.42)",
        },
        axisTicks: {
          show: false,
        },
        crosshairs: {
          show: true,
          stroke: {
            color: "rgba(88, 98, 115, 0.4)",
            dashArray: 4,
            width: 1,
          },
        },
        labels: {
          datetimeUTC: false,
          offsetY: -2,
          style: {
            colors: "#6b7280",
          },
        },
        max: viewport.max,
        min: viewport.min,
        tooltip: {
          enabled: false,
        },
        type: "datetime",
      },
      yaxis: {
        forceNiceScale: true,
        labels: {
          formatter: (value) => formatPrice(value),
          offsetX: -4,
          style: {
            colors: "#4b5563",
          },
        },
        max: yRange.max,
        min: yRange.min,
        opposite: true,
      },
    };
  }

  function ensureChart() {
    return chartState.instance;
  }

  function inferPricePrecision(payload) {
    const values = (payload?.candles || [])
      .slice(-80)
      .flatMap((candle) => [candle.open, candle.high, candle.low, candle.close])
      .filter((value) => Number.isFinite(Number(value)))
      .map((value) => String(value));

    const precision = values.reduce((max, value) => {
      const decimals = value.includes(".") ? value.split(".")[1].length : 0;
      return Math.max(max, decimals);
    }, 2);

    return Math.min(Math.max(precision, 2), 6);
  }

  function buildKLineData(payload) {
    return (payload?.candles || []).map((candle) => ({
      close: Number(candle.close),
      high: Number(candle.high),
      low: Number(candle.low),
      open: Number(candle.open),
      timestamp: Number(candle.time) * 1000,
      volume: Number(candle.volume || 0),
    }));
  }

  function getKLineStyles() {
    const isLightMode = document.body.classList.contains('light-mode');
    
    // Light mode chart colors
    const lightModeColors = {
      grid: "rgba(200, 200, 200, 0.3)",
      crosshair: "rgba(100, 100, 100, 0.5)",
      text: "#374151",
      tooltipBg: "rgba(255, 255, 255, 0.95)",
      tooltipBorder: "rgba(200, 200, 200, 0.8)",
      tooltipText: "#1f2937"
    };
    
    // Dark mode chart colors (default)
    const darkModeColors = {
      grid: "rgba(123, 134, 158, 0.14)",
      crosshair: "rgba(88, 98, 115, 0.38)",
      text: "#6b7280",
      tooltipBg: "rgba(19, 23, 34, 0.92)",
      tooltipBorder: "rgba(37, 43, 54, 0.95)",
      tooltipText: "#d1d4dc"
    };
    
    const colors = isLightMode ? lightModeColors : darkModeColors;
    
    return {
      candle: {
        type: "candle_solid",
        bar: {
          downBorderColor: "#ef5350",  // Red for bearish
          downColor: "#ef5350",      // Red for bearish
          downWickColor: "#ef5350",  // Red for bearish
          noChangeBorderColor: "#9e9e9e",
          noChangeColor: "#9e9e9e",
          noChangeWickColor: "#9e9e9e",
          upBorderColor: "#26a69a",    // Green for bullish
          upColor: "#26a69a",        // Green for bullish
          upWickColor: "#26a69a",    // Green for bullish
        },
        priceMark: {
          high: { show: false },
          last: {
            downColor: "#f23645",
            line: { dashedValue: [4, 4], show: true, size: 1, style: "dashed" },
            noChangeColor: "#6b7280",
            show: true,
            text: {
              backgroundColor: "#131722",
              borderColor: "#252b36",
              borderDashedValue: [0, 0],
              borderRadius: 4,
              borderSize: 0,
              borderStyle: "solid",
              color: "#ffffff",
              family: "Trebuchet MS, Segoe UI, sans-serif",
              paddingBottom: 2,
              paddingLeft: 6,
              paddingRight: 6,
              paddingTop: 2,
              show: true,
              size: 11,
              style: "fill",
              weight: 600,
            },
            upColor: "#089981",
          },
          low: { show: false },
          show: true,
        },
        tooltip: {
          custom: [],
          defaultValue: "--",
          icons: [],
          offsetLeft: 12,
          offsetTop: 12,
          rect: {
            backgroundColor: colors.tooltipBg,
            borderColor: colors.tooltipBorder,
            borderDashedValue: [0, 0],
            borderRadius: 10,
            borderSize: 1,
            borderStyle: "solid",
            color: colors.tooltipText,
            marginBottom: 0,
            marginLeft: 0,
            marginRight: 0,
            marginTop: 0,
            offsetLeft: 0,
            offsetTop: 0,
            paddingBottom: 8,
            paddingLeft: 10,
            paddingRight: 10,
            paddingTop: 8,
            position: "fixed",
            style: "stroke_fill",
          },
          showRule: "none",
          showType: "rect",
          text: {
            color: colors.tooltipText,
            family: "Trebuchet MS, Segoe UI, sans-serif",
            marginBottom: 0,
            marginLeft: 0,
            marginRight: 6,
            marginTop: 0,
            size: 11,
            weight: 500,
          },
        },
      },
      crosshair: {
        horizontal: {
          line: { color: colors.crosshair, dashedValue: [4, 4], show: true, size: 1, style: "dashed" },
          show: true,
          text: {
            backgroundColor: colors.tooltipBg,
            borderColor: colors.tooltipBorder,
            borderDashedValue: [0, 0],
            borderRadius: 4,
            borderSize: 0,
            borderStyle: "solid",
            color: colors.tooltipText,
            family: "Trebuchet MS, Segoe UI, sans-serif",
            paddingBottom: 2,
            paddingLeft: 6,
            paddingRight: 6,
            paddingTop: 2,
            show: true,
            size: 11,
            style: "fill",
            weight: 600,
          },
        },
        show: true,
        vertical: {
          line: { color: "rgba(88, 98, 115, 0.38)", dashedValue: [4, 4], show: true, size: 1, style: "dashed" },
          show: true,
          text: {
            backgroundColor: "#131722",
            borderColor: "#252b36",
            borderDashedValue: [0, 0],
            borderRadius: 4,
            borderSize: 0,
            borderStyle: "solid",
            color: "#ffffff",
            family: "Trebuchet MS, Segoe UI, sans-serif",
            paddingBottom: 2,
            paddingLeft: 6,
            paddingRight: 6,
            paddingTop: 2,
            show: true,
            size: 11,
            style: "fill",
            weight: 600,
          },
        },
        show: true,
        vertical: {
          line: { color: colors.crosshair, dashedValue: [4, 4], show: true, size: 1, style: "dashed" },
          show: true,
          text: {
            backgroundColor: colors.tooltipBg,
            borderColor: colors.tooltipBorder,
            borderDashedValue: [0, 0],
            borderRadius: 4,
            borderSize: 0,
            borderStyle: "solid",
            color: colors.tooltipText,
            family: "Trebuchet MS, Segoe UI, sans-serif",
            paddingBottom: 2,
            paddingLeft: 6,
            paddingRight: 6,
            paddingTop: 2,
            show: true,
            size: 11,
            style: "fill",
            weight: 600,
          },
        },
      },
      grid: {
        horizontal: { color: colors.grid, dashedValue: [0, 0], show: true, size: 1, style: "solid" },
        show: true,
        vertical: { color: colors.grid, dashedValue: [0, 0], show: true, size: 1, style: "solid" },
      },
      overlay: {
        arc: { color: isLightMode ? "#374151" : "#111827", dashedValue: [0, 0], size: 1, style: "solid" },
        circle: { borderColor: isLightMode ? "#374151" : "#111827", borderDashedValue: [0, 0], borderSize: 1, borderStyle: "solid", color: isLightMode ? "rgba(55, 65, 81, 0.04)" : "rgba(17,24,39,0.06)", style: "stroke_fill" },
        line: { color: isLightMode ? "#374151" : "#111827", dashedValue: [0, 0], size: 1.25, smooth: false, style: "solid" },
        point: {
          activeBorderColor: "#2962ff",
          activeBorderSize: 1,
          activeColor: "#ffffff",
          activeRadius: 4,
          borderColor: "#2962ff",
          borderSize: 1,
          color: "#ffffff",
          radius: 3,
        },
        polygon: { borderColor: isLightMode ? "#374151" : "#111827", borderDashedValue: [0, 0], borderSize: 1, borderStyle: "solid", color: isLightMode ? "rgba(55, 65, 81, 0.04)" : "rgba(17,24,39,0.06)", style: "stroke_fill" },
        rect: { borderColor: isLightMode ? "#374151" : "#111827", borderDashedValue: [0, 0], borderRadius: 0, borderSize: 1, borderStyle: "solid", color: isLightMode ? "rgba(55, 65, 81, 0.04)" : "rgba(17,24,39,0.06)", style: "stroke_fill" },
        text: {
          backgroundColor: "rgba(255,255,255,0.84)",
          borderColor: "rgba(148,163,184,0.22)",
          borderDashedValue: [0, 0],
          borderRadius: 999,
          borderSize: 1,
          borderStyle: "solid",
          color: "#111827",
          family: "Trebuchet MS, Segoe UI, sans-serif",
          paddingBottom: 2,
          paddingLeft: 6,
          paddingRight: 6,
          paddingTop: 2,
          size: 11,
          style: "stroke_fill",
          weight: 600,
        },
      },
      separator: {
        activeBackgroundColor: "rgba(41, 98, 255, 0.08)",
        color: "rgba(123, 134, 158, 0.18)",
        fill: true,
        size: 1,
      },
      xAxis: {
        axisLine: { color: colors.crosshair, dashedValue: [0, 0], show: false, size: 1, style: "solid" },
        show: true,
        size: 30,
        tickLine: { color: colors.crosshair, dashedValue: [0, 0], length: 0, show: false, size: 1, style: "solid" },
        tickText: {
          color: colors.text,
          family: "Trebuchet MS, Segoe UI, sans-serif",
          marginEnd: 8,
          marginStart: 8,
          show: true,
          size: 11,
          weight: 500,
        },
      },
      yAxis: {
        axisLine: { color: colors.crosshair, dashedValue: [0, 0], show: false, size: 1, style: "solid" },
        inside: false,
        position: "right",
        reverse: false,
        show: true,
        size: 72,
        tickLine: { color: colors.crosshair, dashedValue: [0, 0], length: 0, show: false, size: 1, style: "solid" },
        tickText: {
          color: colors.text,
          family: "Trebuchet MS, Segoe UI, sans-serif",
          marginEnd: 8,
          marginStart: 8,
          show: true,
          size: 11,
          weight: 500,
        },
        type: "normal",
      },
    };
  }

  function bindKLineChartActions(chart) {
    if (!chart || chartContainer.__elsKlineBound) return;

    const refreshOverlay = () => {
      syncPlotBounds();
      renderChartLegend(renderedPayload);
      renderChartAnnotations(renderedPayload);
    };

    chart.subscribeAction("onVisibleRangeChange", refreshOverlay);
    chart.subscribeAction("onZoom", refreshOverlay);
    chart.subscribeAction("onScroll", refreshOverlay);
    chart.subscribeAction("onCrosshairChange", refreshOverlay);
    chartContainer.__elsKlineBound = true;
  }

  function toPlotlyDate(time) {
    const epochMs = toEpochMs(time);
    return Number.isFinite(epochMs) ? new Date(epochMs).toISOString() : null;
  }

  function toPlotlyDash(lineStyle) {
    if (lineStyle === "dashed") return "dash";
    if (lineStyle === "dotted") return "dot";
    return "solid";
  }

  function getPlotlyViewport(payload, preserveView = false) {
    const viewport = normalizeViewport(preserveView && chartState.viewport ? chartState.viewport : getDefaultViewport(payload), payload);
    const yRange = computeVisibleYRange(payload, viewport);

    chartState.viewport = viewport;
    return { viewport, yRange };
  }

  function buildPlotlyTraces(payload) {
    const candles = Array.isArray(payload?.candles) ? payload.candles : [];
    const visuals = payload?.analysis?.visuals || {};
    const traces = [
      {
        close: candles.map((candle) => Number(candle.close)),
        decreasing: {
          fillcolor: "#787b86",
          line: { color: "#787b86", width: 1 },
        },
        high: candles.map((candle) => Number(candle.high)),
        hoverlabel: { bgcolor: "#131722", bordercolor: "#252b36", font: { color: "#d1d4dc" } },
        increasing: {
          fillcolor: "#2962ff",
          line: { color: "#2962ff", width: 1 },
        },
        low: candles.map((candle) => Number(candle.low)),
        name: payload.displaySymbol || "Market",
        open: candles.map((candle) => Number(candle.open)),
        showlegend: false,
        type: "candlestick",
        whiskerwidth: 0.22,
        x: candles.map((candle) => toPlotlyDate(candle.time)),
      },
    ];

    const emaPoints = normalizeOverlayPoints(visuals.ema200);
    if (emaPoints.length) {
      traces.push({
        hoverinfo: "skip",
        line: { color: "#f23645", width: 1.2 },
        mode: "lines",
        name: "EMA 200",
        showlegend: false,
        type: "scatter",
        x: emaPoints.map((point) => toPlotlyDate(point.time)),
        y: emaPoints.map((point) => point.value),
      });
    }

    (visuals.lineOverlays || []).forEach((overlay, index) => {
      const points = normalizeOverlayPoints(overlay.points);
      if (points.length < 2) return;

      traces.push({
        hoverinfo: "skip",
        line: {
          color: overlay.color || "#4b5563",
          dash: toPlotlyDash(overlay.lineStyle),
          width: overlay.lineWidth || 1.25,
        },
        mode: "lines",
        name: overlay.label || `Overlay ${index + 1}`,
        showlegend: false,
        type: "scatter",
        x: points.map((point) => toPlotlyDate(point.time)),
        y: points.map((point) => point.value),
      });
    });

    return traces;
  }

  function buildPlotlyShapes(payload) {
    const visuals = payload?.analysis?.visuals || {};
    const annotations = visuals.annotations || {};
    const shapes = [];

    (annotations.regions || []).forEach((region) => {
      const x0 = toPlotlyDate(region.startTime);
      const x1 = toPlotlyDate(region.endTime);
      if (!x0 || !x1) return;

      shapes.push({
        fillcolor: region.color || "rgba(148, 163, 184, 0.08)",
        layer: "below",
        line: {
          color: region.borderColor || "rgba(148, 163, 184, 0.24)",
          dash: region.borderStyle === "dashed" ? "dot" : "solid",
          width: 1,
        },
        opacity: 1,
        type: "rect",
        x0,
        x1,
        xref: "x",
        y0: Math.min(Number(region.top), Number(region.bottom)),
        y1: Math.max(Number(region.top), Number(region.bottom)),
        yref: "y",
      });
    });

    (visuals.priceLines || []).forEach((line) => {
      if (!Number.isFinite(Number(line.value))) return;
      shapes.push({
        layer: "above",
        line: {
          color: line.color || "#6b7280",
          dash: "dot",
          width: 1,
        },
        type: "line",
        x0: 0,
        x1: 1,
        xref: "paper",
        y0: Number(line.value),
        y1: Number(line.value),
        yref: "y",
      });
    });

    return shapes;
  }

  function buildPlotlyAnnotations(payload) {
    const visuals = payload?.analysis?.visuals || {};
    const annotations = visuals.annotations || {};
    const baseRange = getBaseDataRange(payload);
    const plotlyAnnotations = [];

    (annotations.regions || []).forEach((region) => {
      if (!region.label) return;

      const x0 = toEpochMs(region.startTime);
      const x1 = toEpochMs(region.endTime);
      if (!Number.isFinite(x0) || !Number.isFinite(x1)) return;

      const anchorTime = region.labelAlign === "center" ? (x0 + x1) / 2 : x0 + (x1 - x0) * 0.08;
      plotlyAnnotations.push({
        bgcolor: "rgba(255,255,255,0.82)",
        bordercolor: "rgba(148, 163, 184, 0.22)",
        borderpad: 2,
        font: {
          color: region.labelColor || "#111827",
          family: '"Trebuchet MS", "Segoe UI", sans-serif',
          size: 11,
        },
        showarrow: false,
        text: region.label,
        x: new Date(anchorTime).toISOString(),
        xanchor: region.labelAlign === "center" ? "center" : "left",
        xref: "x",
        y: Math.max(Number(region.top), Number(region.bottom)),
        yanchor: "bottom",
        yref: "y",
      });
    });

    (annotations.labels || []).forEach((label) => {
      let x = null;

      if (label.variant === "fib") {
        const fibOverlay = (visuals.lineOverlays || []).find((overlay) => overlay.label === `Fib ${label.text}`);
        const fibPoints = normalizeOverlayPoints(fibOverlay?.points);
        if (fibPoints.length >= 2) {
          x = toPlotlyDate((fibPoints[0].time + fibPoints[fibPoints.length - 1].time) / 2);
        }
      }

      if (!x) {
        x = label.anchor === "right-edge"
          ? new Date(Math.min(baseRange.max, baseRange.min + (baseRange.max - baseRange.min) * 0.96)).toISOString()
          : toPlotlyDate(label.time);
      }

      if (!x || !Number.isFinite(Number(label.price))) return;

      plotlyAnnotations.push({
        bgcolor: "rgba(255,255,255,0.86)",
        bordercolor: "rgba(148, 163, 184, 0.22)",
        borderpad: 2,
        font: {
          color: label.color || "#111827",
          family: '"Trebuchet MS", "Segoe UI", sans-serif',
          size: label.variant === "fib" ? 11 : 12,
        },
        showarrow: false,
        text: label.text,
        x,
        xanchor: label.variant === "fib" ? "center" : label.align === "right" || label.anchor === "right-edge" ? "right" : "left",
        xref: "x",
        y: Number(label.price),
        yanchor: "middle",
        yref: "y",
      });
    });

    return plotlyAnnotations;
  }

  function buildPlotlyLayout(payload, widgetKey, preserveView = false) {
    const { viewport, yRange } = getPlotlyViewport(payload, preserveView);

    return {
      annotations: buildPlotlyAnnotations(payload),
      autosize: true,
      dragmode: "pan",
      hovermode: "x",
      margin: { b: 34, l: 12, r: 72, t: 16 },
      paper_bgcolor: "#ffffff",
      plot_bgcolor: "#ffffff",
      shapes: buildPlotlyShapes(payload),
      showlegend: false,
      uirevision: widgetKey,
      xaxis: {
        gridcolor: "rgba(123, 134, 158, 0.14)",
        linecolor: "rgba(123, 134, 158, 0.18)",
        rangeslider: { visible: false },
        range: [new Date(viewport.min).toISOString(), new Date(viewport.max).toISOString()],
        showgrid: true,
        showline: false,
        showspikes: true,
        spikecolor: "rgba(88, 98, 115, 0.38)",
        spikesnap: "cursor",
        spikemode: "across",
        tickfont: { color: "#6b7280", family: '"Trebuchet MS", "Segoe UI", sans-serif', size: 11 },
        type: "date",
        zeroline: false,
      },
      yaxis: {
        fixedrange: false,
        gridcolor: "rgba(123, 134, 158, 0.14)",
        linecolor: "rgba(123, 134, 158, 0.18)",
        range: [yRange.min, yRange.max],
        showgrid: true,
        side: "right",
        showline: false,
        showspikes: true,
        spikecolor: "rgba(88, 98, 115, 0.38)",
        spikemode: "across",
        tickfont: { color: "#6b7280", family: '"Trebuchet MS", "Segoe UI", sans-serif', size: 11 },
        tickformat: ".5f",
        zeroline: false,
      },
    };
  }

  function bindPlotlyViewportTracking() {
    if (!chartContainer || chartContainer.__elsPlotlyRelayoutBound || !chartContainer.on) return;

    chartContainer.on("plotly_relayout", (eventData) => {
      if (!eventData || !renderedPayload) return;
      const rangeStart = eventData["xaxis.range[0]"];
      const rangeEnd = eventData["xaxis.range[1]"];

      if (!rangeStart || !rangeEnd) return;

      const min = new Date(rangeStart).getTime();
      const max = new Date(rangeEnd).getTime();
      if (!Number.isFinite(min) || !Number.isFinite(max)) return;

      chartState.viewport = normalizeViewport({ min, max }, renderedPayload);
    });

    chartContainer.__elsPlotlyRelayoutBound = true;
  }

  function renderAnnotatedChart(payload, selection = {}) {
    renderedPayload = payload;
    resetChartState();
    const symbolKey = selection.symbol || payload.displaySymbol || payload.providerSymbol || config.defaultSymbol;
    const intervalKey = selection.timeframe || payload.timeframe?.key || config.defaultTimeframe;
    const widgetKey = `${symbolKey}:${intervalKey}`;
    const marketChanged = widgetKey !== chartState.lastMarketKey;
    const klinechartsApi = window.klinecharts;

    if (!klinechartsApi?.init) {
      throw new Error("KLineCharts is not available.");
    }

    if (!chartState.instance || chartState.instance.kind !== "klinecharts") {
      clearChartSurface();
      const chart = klinechartsApi.init(chartContainer);
      chart.setStyles(getKLineStyles());
      chart.setTimezone("Etc/UTC");
      chart.setOffsetRightDistance(28);
      chart.setLeftMinVisibleBarCount(12);
      chart.setRightMinVisibleBarCount(6);
      chart.setBarSpace(8);
      bindKLineChartActions(chart);
      chartState.instance = chart;
      chartState.instance.kind = "klinecharts";
    }

    const chart = chartState.instance;
    chart.setStyles(getKLineStyles());
    chart.setPriceVolumePrecision(inferPricePrecision(payload), 0);

    // Only do full rebuild when market actually changes
    if (marketChanged || !chartState.lastMarketKey) {
      chart.clearData();
      chart.applyNewData(buildKLineData(payload));
      chart.scrollToRealTime(0);
      chartState.viewport = null;
    } else {
      // Incremental update for live ticks - preserves viewport
      const klineData = buildKLineData(payload);
      if (klineData.length > 0) {
        chart.updateData(klineData[klineData.length - 1]);
      }
    }

    chartState.lastMarketKey = widgetKey;
    chartState.ready = true;
    syncPlotBounds();
    renderChartLegend(payload);
    renderChartAnnotations(payload);
  }

  function renderTradingViewChart(payload, selection = {}) {
    applyChartModeUi();

    if (!tvChartWidget) {
      throw new Error("TradingView container is not available.");
    }

    const symbol = toTradingViewSymbol(
      selection.symbol || payload.displaySymbol || payload.providerSymbol || config.defaultSymbol,
      {
        displaySymbol: payload.displaySymbol,
        providerSymbol: payload.providerSymbol,
        selectionSymbol: selection.symbol,
      }
    );
    const interval = toTradingViewInterval(selection.timeframe || payload.timeframe?.key || config.defaultTimeframe);
    const widgetKey = `${symbol}:${interval}`;

    if (chartState.lastTradingViewKey === widgetKey && tvChartWidget.childElementCount) {
      return;
    }

    clearTradingViewSurface();

    const iframe = document.createElement("iframe");
    iframe.className = "tv-chart-iframe";
    iframe.setAttribute("allowtransparency", "true");
    iframe.setAttribute("frameborder", "0");
    iframe.setAttribute("scrolling", "no");
    iframe.setAttribute("loading", "eager");
    iframe.title = `${symbol} TradingView chart`;
    if (tvChartLoading) {
      tvChartLoading.hidden = false;
    }
    iframe.addEventListener("load", () => {
      if (tvChartLoading) {
        tvChartLoading.hidden = true;
      }
    }, { once: true });
    iframe.src = buildTradingViewIframeSrc({
      allow_symbol_change: false,
      autosize: true,
      backgroundColor: "#ffffff",
      calendar: false,
      details: false,
      hide_side_toolbar: false,
      hide_top_toolbar: false,
      hotlist: false,
      interval,
      locale: "en",
      save_image: true,
      style: "1",
      support_host: "https://www.tradingview.com",
      symbol,
      theme: "light",
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "Etc/UTC",
      withdateranges: true,
    });
    tvChartWidget.appendChild(iframe);
    chartState.lastTradingViewKey = widgetKey;
    chartState.ready = true;
  }

  function renderChart(payload, selection = {}) {
    applyChartModeUi();

    if (chartMode === CHART_MODE_TRADINGVIEW) {
      renderTradingViewChart(payload, selection);
      return;
    }

    renderAnnotatedChart(payload, selection);
  }

  function queueAnnotationRender() {
    if (chartMode !== CHART_MODE_ANNOTATED) {
      return;
    }

    if (chartState.renderQueued) return;
    chartState.renderQueued = true;

    window.requestAnimationFrame(() => {
      chartState.renderQueued = false;
      if (chartState.instance?.kind === "klinecharts" && typeof chartState.instance.resize === "function") {
        chartState.instance.resize();
        syncPlotBounds();
        renderChartLegend(renderedPayload);
        renderChartAnnotations(renderedPayload);
        return;
      }

      syncPlotBounds();
      renderChartLegend(renderedPayload);
      renderChartAnnotations(renderedPayload);
    });
  }

  function toXCoordinate(time) {
    if (chartState.instance?.kind === "klinecharts" && renderedPayload) {
      const point = chartState.instance.convertToPixel({
        timestamp: Number(time) * 1000,
        value: Number(renderedPayload.snapshot?.price || renderedPayload.candles?.[renderedPayload.candles.length - 1]?.close || 0),
      }, {});
      const bounds = chartState.plotBounds || syncPlotBounds();
      if (bounds && Number.isFinite(point?.x)) {
        return Math.max(bounds.left, Math.min(bounds.left + bounds.width, Number(point.x)));
      }
      return Number(point?.x);
    }

    const bounds = chartState.plotBounds || syncPlotBounds();
    if (!bounds || !renderedPayload) return null;

    const viewport = normalizeViewport(chartState.viewport || getDefaultViewport(renderedPayload), renderedPayload);
    const min = Number(viewport.min);
    const max = Number(viewport.max);
    const epochTime = toEpochMs(time);

    if (!Number.isFinite(epochTime) || !Number.isFinite(min) || !Number.isFinite(max) || max <= min) {
      return null;
    }

    const normalized = Math.max(0, Math.min(1, (epochTime - min) / (max - min)));
    const x = bounds.left + normalized * bounds.width;
    return Math.max(bounds.left, Math.min(bounds.left + bounds.width, x));
  }

  function toYCoordinate(price) {
    if (chartState.instance?.kind === "klinecharts" && renderedPayload) {
      const latestTime = Number(renderedPayload.candles?.[renderedPayload.candles.length - 1]?.time || 0) * 1000;
      const point = chartState.instance.convertToPixel({
        timestamp: latestTime,
        value: Number(price),
      }, {});
      const bounds = chartState.plotBounds || syncPlotBounds();
      if (bounds && Number.isFinite(point?.y)) {
        return Math.max(bounds.top, Math.min(bounds.top + bounds.height, Number(point.y)));
      }
      return Number(point?.y);
    }

    const bounds = chartState.plotBounds || syncPlotBounds();
    if (!bounds || !renderedPayload) return null;

    const yRange = getVisibleYRange(renderedPayload);
    const min = Number(yRange.min);
    const max = Number(yRange.max);
    const numericPrice = Number(price);

    if (!Number.isFinite(numericPrice) || !Number.isFinite(min) || !Number.isFinite(max) || max <= min) {
      return null;
    }

    const normalized = Math.max(0, Math.min(1, (numericPrice - min) / (max - min)));
    const y = bounds.top + (1 - normalized) * bounds.height;
    return Math.max(bounds.top, Math.min(bounds.top + bounds.height, y));
  }

  function buildLabelNode(text, color, left, top, variant = "") {
    const node = document.createElement("div");
    node.className = `annotation-label${variant ? ` ${variant}` : ""}`;
    node.textContent = text;
    node.style.color = color || "#2f3a4d";
    node.style.left = `${Math.max(8, left)}px`;
    node.style.top = `${Math.max(8, top)}px`;
    return node;
  }

  function createSvgNode(name) {
    return document.createElementNS("http://www.w3.org/2000/svg", name);
  }

  function renderSvgLine(svg, points, options = {}) {
    if (!svg || !Array.isArray(points) || points.length < 2) return;

    const normalizedPoints = points
      .map((point) => {
        const x = toXCoordinate(point.time);
        const y = toYCoordinate(point.value);
        return Number.isFinite(x) && Number.isFinite(y) ? `${x},${y}` : null;
      })
      .filter(Boolean);

    if (normalizedPoints.length < 2) return;

    const polyline = createSvgNode("polyline");
    polyline.setAttribute("class", options.className || "annotation-line");
    polyline.setAttribute("fill", "none");
    polyline.setAttribute("points", normalizedPoints.join(" "));
    polyline.setAttribute("stroke", options.color || "#111827");
    polyline.setAttribute("stroke-linecap", "round");
    polyline.setAttribute("stroke-linejoin", "round");
    polyline.setAttribute("stroke-width", String(options.width || 1.25));

    const dashArray = toDashArray(options.lineStyle);
    if (dashArray > 0) {
      polyline.setAttribute("stroke-dasharray", String(dashArray));
    }

    svg.appendChild(polyline);
  }

  function getBiasTone(value) {
    const label = String(value || "").toLowerCase();
    if (label.includes("bull")) return "bullish";
    if (label.includes("bear")) return "bearish";
    return "neutral";
  }

  function isWithinZone(price, low, high) {
    const numericPrice = Number(price);
    const numericLow = Number(low);
    const numericHigh = Number(high);
    if (!Number.isFinite(numericPrice) || !Number.isFinite(numericLow) || !Number.isFinite(numericHigh)) {
      return false;
    }
    return numericPrice >= Math.min(numericLow, numericHigh) && numericPrice <= Math.max(numericLow, numericHigh);
  }

  function buildOverlayCard({ detail = "", eyebrow = "", status = "", title = "", tone = "neutral" }) {
    const article = document.createElement("article");
    article.className = `tv-overlay-card ${tone}`;
    article.innerHTML = `
      <span class="tv-overlay-eyebrow">${escapeHtml(eyebrow)}</span>
      <strong>${escapeHtml(title)}</strong>
      <p>${escapeHtml(detail)}</p>
      <small>${escapeHtml(status)}</small>
    `;
    return article;
  }

  function buildIndicatorPill(label, value) {
    const node = document.createElement("span");
    node.className = "tv-indicator-pill";
    node.innerHTML = `<span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong>`;
    return node;
  }

  function renderChartLegend(payload = renderedPayload) {
    chartLegend.innerHTML = "";
    if (!payload?.analysis) return;

    const legend = payload.analysis.visuals?.annotations?.legend || [];
    const row = document.createElement("div");
    row.className = "chart-legend-row";

    const head = document.createElement("span");
    head.className = "chart-legend-head";
    head.textContent = `${payload.displaySymbol || "--"} · ${payload.timeframe?.label || "--"}`;
    row.appendChild(head);

    legend.forEach((item) => {
      if (!item?.text) return;
      const chip = document.createElement("span");
      chip.className = "legend-chip";
      chip.style.setProperty("--legend-color", item.color || "#2f3a4d");
      chip.textContent = item.text;
      row.appendChild(chip);
    });

    chartLegend.appendChild(row);
  }

  function renderChartAnnotations(payload = renderedPayload) {
    chartAnnotationLayer.innerHTML = "";
    if (!payload?.analysis) return;

    const analysis = payload.analysis;
    const indicators = analysis.indicators || {};
    const smc = indicators.smc || {};
    const primarySetup = (analysis.setups || [])[0] || null;
    const latestPrice = payload.snapshot?.price;
    const activeZone = smc.demandZones?.[0] || smc.supplyZones?.[0] || null;
    const activeZoneType = smc.demandZones?.[0] ? "Demand zone" : smc.supplyZones?.[0] ? "Supply zone" : "Origin zone";
    const fib = smc.fib || null;
    const fvg = smc.selectedFvg || (smc.fvgs && smc.fvgs[0]) || null;
    const structureEvent = smc.bos?.[0] || smc.choch?.[0] || null;
    const overlay = document.createElement("div");
    overlay.className = "tv-overlay-grid";

    const leftStack = document.createElement("section");
    leftStack.className = "tv-overlay-stack";

    const mapPanel = document.createElement("div");
    mapPanel.className = "tv-overlay-panel";

    const title = document.createElement("div");
    title.className = "tv-overlay-title";
    title.textContent = "Confluence map";
    mapPanel.appendChild(title);

    const cards = [];
    cards.push(buildOverlayCard({
      eyebrow: "Structure",
      title: structureEvent ? `${structureEvent.type} ${structureEvent.direction || analysis.bias}` : analysis.bias || "No structure read",
      detail: structureEvent ? `Break level ${formatPrice(structureEvent.value)}.` : "Waiting for a fresh BOS or CHoCH read.",
      status: analysis.bias || "Neutral structure",
      tone: getBiasTone(structureEvent?.direction || analysis.bias),
    }));

    cards.push(buildOverlayCard({
      eyebrow: activeZoneType,
      title: activeZone ? formatZone(activeZone) : "No refined zone yet",
      detail: activeZone
        ? `${activeZoneType} refined from candle body.`
        : "Need a clean supply or demand body from the impulse origin.",
      status: activeZone && isWithinZone(latestPrice, activeZone.low, activeZone.high) ? "Price is inside the zone" : "Waiting for price to revisit the zone",
      tone: getBiasTone(activeZoneType.includes("Demand") ? "bullish" : activeZoneType.includes("Supply") ? "bearish" : ""),
    }));

    cards.push(buildOverlayCard({
      eyebrow: "Fibonacci pocket",
      title: fib ? `${formatPrice(fib.level05)} - ${formatPrice(fib.level0705)}` : "No Fib pocket yet",
      detail: fib
        ? `Execution zone with invalidation at ${formatPrice(fib.level0786)}.`
        : "Need the impulse leg that caused the structural break.",
      status: fib && isWithinZone(latestPrice, fib.level05, fib.level0705) ? "Price is inside the execution pocket" : "Price is outside the execution pocket",
      tone: getBiasTone(analysis.bias),
    }));

    cards.push(buildOverlayCard({
      eyebrow: "FVG",
      title: fvg ? `${formatPrice(fvg.low)} - ${formatPrice(fvg.high)}` : "No aligned FVG",
      detail: fvg
        ? `${fvg.type || fvg.direction || "Aligned"} imbalance available for refinement.`
        : "No clean fair value gap sits inside the current setup pocket.",
      status: fvg ? "Use only if it stays aligned with Fib and zone" : "Stand aside until a cleaner imbalance forms",
      tone: getBiasTone(fvg?.type || fvg?.direction || analysis.bias),
    }));

    cards.push(buildOverlayCard({
      eyebrow: "RSI confirmation",
      title: smc.rsiConfirmation || indicators.divergence || "Confirmation pending",
      detail: `RSI ${escapeHtml(indicators.rsi14 != null ? indicators.rsi14 : "--")} | MACD ${escapeHtml(indicators.macdHistogram != null ? indicators.macdHistogram : "--")}`,
      status: /divergence|cross/i.test(String(smc.rsiConfirmation || indicators.divergence || "")) ? "Momentum is confirming" : "Momentum confirmation is still weak",
      tone: getBiasTone(analysis.bias),
    }));

    cards.forEach((card) => mapPanel.appendChild(card));
    leftStack.appendChild(mapPanel);

    const rightStack = document.createElement("section");
    rightStack.className = "tv-overlay-stack tv-overlay-stack--right";

    const planPanel = document.createElement("div");
    planPanel.className = "tv-overlay-panel tv-overlay-panel--plan";
    const planTitle = document.createElement("div");
    planTitle.className = "tv-overlay-title";
    planTitle.textContent = "Primary plan";
    planPanel.appendChild(planTitle);
    planPanel.appendChild(buildOverlayCard({
      eyebrow: primarySetup ? `${primarySetup.direction} setup` : "No setup",
      title: primarySetup ? primarySetup.label : "Awaiting a cleaner setup",
      detail: primarySetup
        ? `Entry ${formatPrice(primarySetup.entry)} | Stop ${formatPrice(primarySetup.stopLoss)} | TP1 ${formatPrice(primarySetup.takeProfit1)}`
        : "The engine has not qualified a strong execution plan yet.",
      status: primarySetup ? primarySetup.summary : "Keep waiting for full confluence.",
      tone: getBiasTone(primarySetup?.direction || analysis.bias),
    }));

    const indicatorRow = document.createElement("div");
    indicatorRow.className = "tv-indicator-row";
    indicatorRow.appendChild(buildIndicatorPill("EMA 200", formatPrice(indicators.ema200)));
    indicatorRow.appendChild(buildIndicatorPill("ADX", indicators.adx != null ? indicators.adx : "--"));
    indicatorRow.appendChild(buildIndicatorPill("RSI 14", indicators.rsi14 != null ? indicators.rsi14 : "--"));
    indicatorRow.appendChild(buildIndicatorPill("Conf", `${analysis.scorecard?.confluence ?? "--"}%`));
    planPanel.appendChild(indicatorRow);

    rightStack.appendChild(planPanel);

    overlay.appendChild(leftStack);
    overlay.appendChild(rightStack);
    chartAnnotationLayer.appendChild(overlay);
  }

  function renderChartLegend(payload = renderedPayload) {
    chartLegend.innerHTML = "";
    if (!payload?.analysis) return;

    const legend = payload.analysis.visuals?.annotations?.legend || [];
    const row = document.createElement("div");
    row.className = "chart-legend-row";

    const head = document.createElement("span");
    head.className = "chart-legend-head";
    head.textContent = `${payload.displaySymbol || "--"} | ${payload.timeframe?.label || "--"}`;
    row.appendChild(head);

    legend.forEach((item) => {
      if (!item?.text) return;
      const chip = document.createElement("span");
      chip.className = "legend-chip";
      chip.style.setProperty("--legend-color", item.color || "#2f3a4d");
      chip.textContent = item.text;
      row.appendChild(chip);
    });

    chartLegend.appendChild(row);
  }

  function renderChartAnnotations(payload = renderedPayload) {
    chartAnnotationLayer.innerHTML = "";
    if (!payload?.analysis) return;

    const visuals = payload.analysis.visuals || {};
    const annotations = visuals.annotations || {};
    const bounds = chartState.plotBounds || syncPlotBounds();
    if (!bounds) return;

    const svg = createSvgNode("svg");
    svg.setAttribute("class", "annotation-svg");
    svg.setAttribute("viewBox", `0 0 ${chartContainer.clientWidth} ${chartContainer.clientHeight}`);
    svg.setAttribute("preserveAspectRatio", "none");

    (visuals.lineOverlays || []).forEach((overlay) => {
      renderSvgLine(svg, normalizeOverlayPoints(overlay.points), {
        className: overlay.label?.toLowerCase().includes("fib") ? "annotation-line fib-line" : "annotation-line",
        color: overlay.color || "#111827",
        lineStyle: overlay.lineStyle,
        width: overlay.lineWidth || 1.25,
      });
    });

    (visuals.priceLines || []).forEach((line) => {
      const y = toYCoordinate(line.value);
      if (!Number.isFinite(y)) return;

      const node = createSvgNode("line");
      node.setAttribute("class", "annotation-line price-line");
      node.setAttribute("x1", String(bounds.left));
      node.setAttribute("x2", String(bounds.left + bounds.width));
      node.setAttribute("y1", String(y));
      node.setAttribute("y2", String(y));
      node.setAttribute("stroke", line.color || "#6b7280");
      node.setAttribute("stroke-width", "1");
      node.setAttribute("stroke-dasharray", "5 5");
      svg.appendChild(node);
    });

    (annotations.regions || []).forEach((region) => {
      const startX = toXCoordinate(region.startTime);
      const endX = toXCoordinate(region.endTime);
      const topY = toYCoordinate(region.top);
      const bottomY = toYCoordinate(region.bottom);

      if (![startX, endX, topY, bottomY].every(Number.isFinite)) return;

      const zone = document.createElement("div");
      const left = Math.min(startX, endX);
      const top = Math.min(topY, bottomY);
      const width = Math.max(1, Math.abs(endX - startX));
      const height = Math.max(1, Math.abs(bottomY - topY));

      // Enhanced SMC zone styling
      let zoneClass = "annotation-zone";
      let bgColor = region.color || "rgba(148, 163, 184, 0.08)";
      let borderColor = region.borderColor || "rgba(148, 163, 184, 0.24)";

      // Apply specific SMC styling based on zone type
      if (region.label) {
        const labelLower = region.label.toLowerCase();
        if (labelLower.includes('demand') || labelLower.includes('buy')) {
          bgColor = "rgba(38, 166, 154, 0.15)";
          borderColor = "rgba(38, 166, 154, 0.4)";
          zoneClass += " smc-demand";
        } else if (labelLower.includes('supply') || labelLower.includes('sell')) {
          bgColor = "rgba(239, 83, 80, 0.15)";
          borderColor = "rgba(239, 83, 80, 0.4)";
          zoneClass += " smc-supply";
        } else if (labelLower.includes('order block') || labelLower.includes('ob')) {
          bgColor = "rgba(156, 39, 176, 0.12)";
          borderColor = "rgba(156, 39, 176, 0.35)";
          zoneClass += " smc-order-block";
        } else if (labelLower.includes('breaker')) {
          bgColor = "rgba(255, 152, 0, 0.12)";
          borderColor = "rgba(255, 152, 0, 0.35)";
          zoneClass += " smc-breaker";
        } else if (labelLower.includes('premium') || labelLower.includes('discount')) {
          bgColor = "rgba(63, 81, 181, 0.1)";
          borderColor = "rgba(63, 81, 181, 0.3)";
          zoneClass += " smc-premium-discount";
        } else if (labelLower.includes('liquidity') || labelLower.includes('liq')) {
          bgColor = "rgba(255, 193, 7, 0.12)";
          borderColor = "rgba(255, 193, 7, 0.35)";
          zoneClass += " smc-liquidity";
        }
      }

      zone.className = zoneClass;
      zone.style.left = `${left}px`;
      zone.style.top = `${top}px`;
      zone.style.width = `${width}px`;
      zone.style.height = `${height}px`;
      zone.style.background = bgColor;
      zone.style.borderColor = borderColor;
      zone.style.borderStyle = region.borderStyle || "solid";

      if (region.label) {
        const regionLabel = document.createElement("span");
        regionLabel.className = "annotation-zone-label";
        regionLabel.textContent = region.label;
        regionLabel.style.color = region.labelColor || "#111827";
        if (region.labelAlign === "center") {
          regionLabel.style.left = "50%";
          regionLabel.style.transform = "translate(-50%, 0)";
        } else {
          regionLabel.style.left = "8px";
        }
        zone.appendChild(regionLabel);
      }

      chartAnnotationLayer.appendChild(zone);
    });

    chartAnnotationLayer.appendChild(svg);

    (annotations.labels || []).forEach((label) => {
      let x = null;
      if (label.variant === "fib") {
        const fibOverlay = (visuals.lineOverlays || []).find((overlay) => overlay.label === `Fib ${label.text}`);
        const fibPoints = normalizeOverlayPoints(fibOverlay?.points);
        if (fibPoints.length >= 2) {
          const midpointTime = (fibPoints[0].time + fibPoints[fibPoints.length - 1].time) / 2;
          x = toXCoordinate(midpointTime);
        }
      }

      if (!Number.isFinite(x)) {
        x = label.anchor === "right-edge"
          ? bounds.left + bounds.width - 10
          : toXCoordinate(label.time);
      }
      const y = toYCoordinate(label.price);

      if (![x, y].every(Number.isFinite)) return;

      const isRightAligned = label.variant !== "fib" && (label.anchor === "right-edge" || label.align === "right");
      const node = buildLabelNode(
        label.text,
        label.color,
        label.variant === "fib" ? x - 12 : isRightAligned ? x - 44 : x + 6,
        y,
        label.variant ? `${label.variant}-label` : ""
      );

      if (isRightAligned) {
        node.style.textAlign = "right";
        node.style.minWidth = "38px";
      }

      chartAnnotationLayer.appendChild(node);
    });
  }

  function setList(target, items, fallback) {
    target.innerHTML = "";
    const values = items && items.length ? items : [fallback];
    values.forEach((text) => {
      const item = document.createElement("li");
      item.textContent = text;
      target.appendChild(item);
    });
  }

  function renderCommandHistory(history) {
    commandLog.innerHTML = "";
    const rows = history && history.length ? history : [{ command: "No terminal commands yet.", at: null }];
    rows.slice(0, 6).forEach((entry) => {
      const item = document.createElement("li");
      item.textContent = entry.at ? `${entry.command} - ${formatTimestamp(entry.at)}` : entry.command;
      commandLog.appendChild(item);
    });
  }

  function renderLayerTags(payload) {
    const smc = payload.analysis.indicators.smc || {};
    const primaryFvg = smc.fvgs && smc.fvgs.length ? smc.fvgs[0] : null;
    const tags = [
      smc.internalStructure || payload.analysis.bias || null,
      smc.fib ? `Fib ${formatPrice(smc.fib.level05)} - ${formatPrice(smc.fib.level0705)}` : null,
      smc.demandZones && smc.demandZones.length ? `Demand ${formatZone(smc.demandZones[0])}` : null,
      smc.supplyZones && smc.supplyZones.length ? `Supply ${formatZone(smc.supplyZones[0])}` : null,
      primaryFvg ? `FVG ${formatPrice(primaryFvg.low)} - ${formatPrice(primaryFvg.high)}` : null,
      smc.rsiConfirmation || null,
    ].filter(Boolean);

    layerTags.innerHTML = "";
    tags.forEach((label) => {
      const tag = document.createElement("span");
      tag.className = "layer-tag";
      tag.textContent = label;
      layerTags.appendChild(tag);
    });
  }

  function renderSetups(setups) {
    setupStack.innerHTML = "";
    if (!setups || !setups.length) {
      const card = document.createElement("article");
      card.className = "setup-card";
      card.innerHTML = "<span class='setup-label'>Awaiting market</span><strong>No setup yet</strong><p>Run terminal analysis to build Fib, supply and demand, FVG, and RSI-driven setups.</p>";
      setupStack.appendChild(card);
      return;
    }

    setups.slice(0, 2).forEach((setup) => {
      const card = document.createElement("article");
      card.className = `setup-card ${setup.direction.toLowerCase()}`;
      const notes = (setup.notes || []).map((note) => `<li>${escapeHtml(note)}</li>`).join("");
      card.innerHTML = `
        <span class="setup-label">${escapeHtml(setup.direction)} | ${escapeHtml(setup.grade)} | ${escapeHtml(setup.triggerType)}</span>
        <strong>${escapeHtml(setup.label)}</strong>
        <p>${escapeHtml(setup.summary)}</p>
        <div class="setup-meta">
          <div><span>Entry</span><strong>${escapeHtml(formatPrice(setup.entry))}</strong></div>
          <div><span>Stop</span><strong>${escapeHtml(formatPrice(setup.stopLoss))}</strong></div>
          <div><span>TP1</span><strong>${escapeHtml(formatPrice(setup.takeProfit1))}</strong></div>
          <div><span>TP2</span><strong>${escapeHtml(formatPrice(setup.takeProfit2))}</strong></div>
          <div><span>R:R</span><strong>${setup.riskReward != null ? escapeHtml(setup.riskReward) : "--"}</strong></div>
          <div><span>Confidence</span><strong>${escapeHtml(setup.confidence)}</strong></div>
        </div>
        <ul class="setup-note-list">${notes}</ul>
      `;
      setupStack.appendChild(card);
    });
  }

  function renderEmpty(snapshot) {
    renderedSnapshot = snapshot;
    renderedPayload = null;
    const loading = snapshot.status.mode === "loading";
    const selectedTimeframeLabel = config?.timeframeLabels?.[snapshot.selection.timeframe] || snapshot.selection.timeframe || "--";

    resetChartState();
    chartState.instance = null;
    chartState.lastMarketKey = "";
    chartState.viewport = null;
    clearChartSurface();
    renderChart({
      displaySymbol: snapshot.selection.symbol || config.defaultSymbol,
      providerSymbol: snapshot.selection.symbol || config.defaultSymbol,
      timeframe: {
        key: snapshot.selection.timeframe || config.defaultTimeframe,
      },
    }, snapshot.selection || {});

    statusCard.dataset.tone = snapshot.status.mode || "idle";
    statusLabel.textContent = snapshot.status.label || "Idle";
    statusDetail.textContent = snapshot.status.detail || "Waiting for terminal input.";
    sessionSymbol.textContent = snapshot.selection.symbol || "--";
    sessionTimeframe.textContent = selectedTimeframeLabel;
    headlinePrice.textContent = "--";
    headlineChange.textContent = "--";
    headlineSymbol.textContent = loading ? snapshot.selection.symbol || "Loading market" : "No active market";
    headlineMeta.textContent = loading ? `Switching to ${snapshot.selection.symbol || "--"} on ${selectedTimeframeLabel}.` : "Use the terminal to analyze a symbol and the strategy desk will populate here.";
    providerLabel.textContent = chartMode === CHART_MODE_TRADINGVIEW ? "TradingView live" : "ELS annotated";
    updatedStat.textContent = loading ? "Switching..." : "--";
    watchState.textContent = snapshot.watch.active ? "Watching" : "Paused";
    nextRefresh.textContent = formatTimingSummary(snapshot.watch);
    biasStat.textContent = "--";
    confidenceStat.textContent = "--";
    momentumStat.textContent = "--";
    patternStat.textContent = "--";
    breakoutValue.textContent = "--";
    rangeLocationValue.textContent = "--";
    confluenceValue.textContent = "--";
    confluenceFill.style.width = "0%";
    thesisValue.textContent = "Waiting for strategy output from the terminal.";
    aiProviderValue.textContent = "--";
    aiVerdictValue.textContent = "--";
    aiStatusValue.textContent = "--";
    aiConfidenceLabel.textContent = "--";
    structureEventValue.textContent = "--";
    locationValue.textContent = "--";
    fibZoneValue.textContent = "--";
    rsiRuleValue.textContent = "--";
    regimeValue.textContent = "--";
    volatilityValue.textContent = "--";
    trendScoreValue.textContent = "--";
    momentumScoreValue.textContent = "--";
    structureScoreValue.textContent = "--";
    timingScoreValue.textContent = "--";
    volatilityScoreValue.textContent = "--";
    adxValue.textContent = "--";
    ema20Value.textContent = "--";
    ema50Value.textContent = "--";
    ema200Value.textContent = "--";
    rsiValue.textContent = "--";
    macdValue.textContent = "--";
    supportValue.textContent = "--";
    resistanceValue.textContent = "--";
    supportZoneValue.textContent = "--";
    resistanceZoneValue.textContent = "--";
    fibEntryValue.textContent = "--";
    fibInvalidValue.textContent = "--";
    rangeMidpointValue.textContent = "--";
    renderLayerTags({ analysis: { indicators: { smc: {} } } });
    renderSetups([]);
    setList(riskList, [], "Waiting for AI risk review.");
    setList(nextActionsList, [], "Run terminal analysis to generate an AI action plan.");
    setList(invalidationList, [], "No invalidation rules yet.");
    renderCommandHistory(snapshot.history || []);
    const latestCommand = snapshot.history && snapshot.history[0];
    lastCommand.textContent = latestCommand ? latestCommand.command : "--";
    lastCommandTime.textContent = latestCommand ? formatTimestamp(latestCommand.at) : "--";
  }

  function renderMarket(snapshot) {
    const payload = snapshot.latest;
    if (!payload) {
      renderEmpty(snapshot);
      return;
    }

    renderedSnapshot = snapshot;
    renderedPayload = payload;

    try {
      renderChart(payload, snapshot.selection || {});
    } catch (error) {
      statusCard.dataset.tone = "error";
      statusLabel.textContent = "Chart error";
      statusDetail.textContent = error.message;
      return;
    }

    const latestCommand = snapshot.history && snapshot.history[0];
    const smc = payload.analysis.indicators.smc || {};
    const ai = payload.analysis.ai || {};
    const fib = smc.fib;
    const structureTag = smc.bos && smc.bos.length ? `${smc.bos[0].type} ${smc.bos[0].direction}` : smc.choch && smc.choch.length ? `${smc.choch[0].type} ${smc.choch[0].direction}` : payload.analysis.structure.sequence;
    const locationTag = smc.demandZones && smc.demandZones.length ? `Demand ${formatZone(smc.demandZones[0])}` : smc.supplyZones && smc.supplyZones.length ? `Supply ${formatZone(smc.supplyZones[0])}` : "No zone";

    statusCard.dataset.tone = snapshot.status.mode || "live";
    statusLabel.textContent = snapshot.status.label || "Live";
    statusDetail.textContent = snapshot.status.detail || "";
    sessionSymbol.textContent = payload.displaySymbol;
    sessionTimeframe.textContent = payload.timeframe.label;
    headlinePrice.textContent = `${formatPrice(payload.snapshot.price)} ${payload.snapshot.currency || ""}`.trim();
    headlineChange.textContent = formatChange(payload.snapshot.change, payload.snapshot.changePercent);
    headlineChange.style.color = Number(payload.snapshot.change) >= 0 ? "#089981" : "#f23645";
    lastCommand.textContent = latestCommand ? latestCommand.command : "--";
    lastCommandTime.textContent = latestCommand ? formatTimestamp(latestCommand.at) : "--";
    headlineSymbol.textContent = payload.displaySymbol;
    headlineMeta.textContent = `${payload.providerSymbol} | ${payload.timeframe.label}`;
    providerLabel.textContent = chartMode === CHART_MODE_TRADINGVIEW ? "TradingView live" : "ELS annotated";
    updatedStat.textContent = formatUpdatedStat(payload.updatedAt);
    watchState.textContent = snapshot.watch.active ? "Watching" : "Paused";
    nextRefresh.textContent = formatTimingSummary(snapshot.watch);
    biasStat.textContent = payload.analysis.bias;
    confidenceStat.textContent = `${payload.analysis.confidence}%`;
    momentumStat.textContent = payload.analysis.momentum;
    patternStat.textContent = payload.analysis.indicators.pattern;
    breakoutValue.textContent = payload.analysis.regime.breakoutPressure;
    rangeLocationValue.textContent = `${payload.analysis.indicators.rangeLocationPercent}%`;
    confluenceValue.textContent = `${payload.analysis.scorecard.confluence}%`;
    confluenceFill.style.width = `${payload.analysis.scorecard.confluence}%`;
    thesisValue.textContent = ai.thesis || ai.oneLineCall || payload.analysis.aiAnalysis || payload.analysis.insights?.thesis || "--";
    aiProviderValue.textContent = ai.provider ? `${ai.provider}${ai.model ? ` / ${ai.model}` : ""}` : "Qwen 2.5 AI";
    aiVerdictValue.textContent = `${ai.shouldTrade ? "Qualified" : "Stand aside"}${ai.directionalBias ? ` | ${ai.directionalBias}` : ""}`;
    aiStatusValue.textContent = ai.entryPlan?.status || (ai.shouldTrade ? "qualified" : "wait");
    aiConfidenceLabel.textContent = ai.confidenceLabel || (payload.analysis.confidence >= 70 ? "high" : "medium");
    structureEventValue.textContent = structureTag;
    locationValue.textContent = locationTag;
    fibZoneValue.textContent = fib ? `${formatPrice(fib.level05)} - ${formatPrice(fib.level0705)}` : "--";
    rsiRuleValue.textContent = smc.rsiConfirmation || payload.analysis.indicators.divergence || "--";
    regimeValue.textContent = payload.analysis.regime.marketState;
    volatilityValue.textContent = payload.analysis.regime.volatilityState;
    if (trendScoreValue) trendScoreValue.textContent = payload.analysis.scorecard.trend;
    if (momentumScoreValue) momentumScoreValue.textContent = payload.analysis.scorecard.momentum;
    if (structureScoreValue) structureScoreValue.textContent = payload.analysis.scorecard.structure;
    if (timingScoreValue) timingScoreValue.textContent = payload.analysis.scorecard.timing;
    if (volatilityScoreValue) volatilityScoreValue.textContent = payload.analysis.scorecard.volatility;
    if (adxValue) adxValue.textContent = payload.analysis.indicators.adx != null ? payload.analysis.indicators.adx : "--";
    
    // News Analysis Updates - Ensure elements exist
    const news = payload.analysis?.news || payload.news || {};
    if (newsSentimentValue) {
      newsSentimentValue.textContent = news.sentiment?.overall || "--";
      newsImpactValue.textContent = (typeof news.impact === 'object' ? news.impact.level : news.impact) || "--";
      newsArticlesValue.textContent = news.totalArticles || (news.articleSummaries ? news.articleSummaries.length : 0);
      newsEventsValue.textContent = news.keyEvents?.length || 0;
      
      // Display article summaries if available
      if (news.articleSummaries && news.articleSummaries.length > 0) {
        const summariesHtml = news.articleSummaries.map(article => `
          <div style="margin-bottom: 12px; padding: 10px; background: rgba(255,255,255,0.03); border-left: 3px solid ${article.sentiment === 'positive' ? '#089981' : article.sentiment === 'negative' ? '#f23645' : '#787b86'}; border-radius: 4px;">
            <div style="font-size: 11.5px; font-weight: 600; color: var(--ink-bright); margin-bottom: 4px; line-height: 1.4;">${article.summary || article.title}</div>
            <div style="font-size: 9.5px; color: var(--ink-dim); display: flex; gap: 8px; align-items: center;">
              <span style="font-weight:600;">${article.source || 'News'}</span>
              <span>${article.publishedAt ? new Date(article.publishedAt).toLocaleDateString() : 'Recent'}</span>
              <span style="color: ${article.sentiment === 'positive' ? '#089981' : article.sentiment === 'negative' ? '#f23645' : '#787b86'}; text-transform: capitalize; font-weight:600;">${article.sentiment}</span>
            </div>
          </div>
        `).join('');
        newsSummaryValue.innerHTML = summariesHtml;
      } else {
        newsSummaryValue.textContent = news.summary || "No news data available.";
      }
    }
    if (featureNews) featureNews.classList.add("active");
    
    // Historical Movements Updates - Ensure elements exist
    const movements = payload.analysis?.movements || payload.movements || {};
    if (movementChangeValue) {
      const priceMovement = movements.priceMovement || {};
      movementChangeValue.textContent = priceMovement.direction ? `${priceMovement.direction} ${priceMovement.changePercent?.toFixed(2) || 0}%` : "--";
      movementVolatilityValue.textContent = movements.volatility?.volatilityIndex || "--";
      movementMomentumValue.textContent = movements.momentum?.strength ? `${movements.momentum.direction} ${movements.momentum.strength}` : "--";
      movementTrendValue.textContent = movements.trend?.direction || "--";
      
      const patterns = movements.patterns || [];
      movementPatternsValue.textContent = patterns.length ? patterns.map(p => p.type).join(", ") : "--";
      
      const supportLevels = movements.supportResistance?.support || [];
      const resistanceLevels = movements.supportResistance?.resistance || [];
      movementSupportValue.textContent = supportLevels.length ? supportLevels[0].price?.toFixed(5) || "--" : "--";
      movementResistanceValue.textContent = resistanceLevels.length ? resistanceLevels[0].price?.toFixed(5) || "--" : "--";
      
      const volumeAnalysis = movements.volumeAnalysis || {};
      movementVolumeValue.textContent = volumeAnalysis.trend || "--";
    }
    
    ema20Value.textContent = formatPrice(payload.analysis.indicators.ema20);
    ema50Value.textContent = formatPrice(payload.analysis.indicators.ema50);
    ema200Value.textContent = formatPrice(payload.analysis.indicators.ema200);
    rsiValue.textContent = payload.analysis.indicators.rsi14;
    macdValue.textContent = payload.analysis.indicators.macdHistogram;
    supportValue.textContent = formatPrice(payload.analysis.indicators.nearestSupport);
    resistanceValue.textContent = formatPrice(payload.analysis.indicators.nearestResistance);
    supportZoneValue.textContent = smc.demandZones && smc.demandZones.length ? formatZone(smc.demandZones[0]) : formatZone(payload.analysis.indicators.supportZone);
    resistanceZoneValue.textContent = smc.supplyZones && smc.supplyZones.length ? formatZone(smc.supplyZones[0]) : formatZone(payload.analysis.indicators.resistanceZone);
    fibEntryValue.textContent = fib ? `${formatPrice(fib.level05)} - ${formatPrice(fib.level0705)}` : "--";
    fibInvalidValue.textContent = fib ? formatPrice(fib.level0786) : "--";
    rangeMidpointValue.textContent = formatPrice(payload.analysis.indicators.rangeMidpoint);
    renderLayerTags(payload);
    renderSetups(payload.analysis.setups || []);
    setList(riskList, sanitizeRiskFlags(ai.riskFlags || []), "No AI risk flags yet.");
    setList(nextActionsList, ai.nextActions || payload.analysis.checklist || [], "Waiting for AI action items.");
    setList(invalidationList, ai.invalidations || (ai.entryPlan?.stopLogic ? [ai.entryPlan.stopLogic] : []), "No invalidation rules yet.");
    
    // Update enhanced dashboard with all new features
    updateEnhancedDashboard(payload);
    
    // Directly update MTF display in case payload.analysis.mtf exists
    if (payload.analysis && payload.analysis.mtf) {
      updateMtfDisplay(payload.analysis.mtf);
    }
    
    renderCommandHistory(snapshot.history || []);
    
    // Draw sentiment timeline
    drawSentimentTimeline();
  }

  function handleSnapshot(payload) {
    if (!payload) return;

    // ── USER HAS EXPLICITLY CHOSEN A SYMBOL ───────────────────────────────────
    // On Vercel, serverless functions are stateless — every SSE/poll response
    // comes back with the server's default state (EURUSD/1h, possibly null data).
    // Once the user has loaded their own symbol/timeframe, we NEVER let the
    // server overwrite what's on screen. We only silently absorb timing & status.
    if (userSelection && renderedSnapshot?.latest) {
      // Just update the lightweight timing labels — no re-render
      if (nextRefresh) nextRefresh.textContent = formatTimingSummary(payload.watch);
      if (updatedStat) updatedStat.textContent = formatUpdatedStat(renderedSnapshot.latest?.updatedAt);

      // Update the status badge if the engine reports something meaningful
      if (payload.status?.label && statusCard) {
        const serverLabel = payload.status.label;
        // Don't overwrite an "Active" user state with a server "Idle"
        if (statusCard.dataset.tone !== "active") {
          if (statusLabel) statusLabel.textContent = serverLabel;
          if (statusDetail) statusDetail.textContent = payload.status.detail || "";
        }
      }

      // Keep renderedSnapshot metadata in sync (watch timings, version, etc.)
      // but preserve selection + latest so nothing on screen changes
      renderedSnapshot = {
        ...payload,
        selection: userSelection,
        latest: renderedSnapshot.latest,
      };
      return;
    }

    // ── FIRST LOAD (no user selection yet) — render normally ─────────────────
    renderedSnapshot = payload;
    const nextRenderKey = buildRenderKey(payload);
    if (nextRenderKey === lastRenderKey) {
      if (nextRefresh) nextRefresh.textContent = formatTimingSummary(payload.watch);
      if (updatedStat) updatedStat.textContent = formatUpdatedStat(payload.latest?.updatedAt);
      return;
    }
    lastRenderKey = nextRenderKey;
    renderMarket(payload);
  }

  async function fetchSession() {
    try {
      const response = await fetch(`/api/session?ts=${Date.now()}`, { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Unable to load session.");
      handleSnapshot(payload);
    } catch (error) {
      statusCard.dataset.tone = "error";
      statusLabel.textContent = "Error";
      statusDetail.textContent = error.message;
    }
  }

  function connectStream() {
    if (!window.EventSource) return;
    if (stream) stream.close();

    stream = new EventSource(`/api/stream?ts=${Date.now()}`);
    stream.onmessage = (event) => {
      try {
        streamRetryCount = 0;
        lastStreamEventAt = Date.now();
        handleSnapshot(JSON.parse(event.data));
      } catch (_error) {
        return;
      }
    };
    stream.onerror = () => {
      stream.close();
      streamRetryCount += 1;
      if (streamRetryCount > 3) return;
      window.setTimeout(connectStream, 3000);
    };
  }

  function downloadDataUrl(filename, dataUrl) {
    const link = document.createElement("a");
    link.download = filename;
    link.href = dataUrl;
    link.click();
  }

  async function exportSnapshot() {
    try {
      const symbol = toTradingViewSymbol(
        renderedSnapshot?.selection?.symbol || renderedPayload?.displaySymbol || renderedPayload?.providerSymbol || config.defaultSymbol,
        {
          displaySymbol: renderedPayload?.displaySymbol,
          providerSymbol: renderedPayload?.providerSymbol,
          selectionSymbol: renderedSnapshot?.selection?.symbol,
        }
      );
      window.open(`https://www.tradingview.com/chart/?symbol=${encodeURIComponent(symbol)}`, "_blank", "noopener");
    } catch (error) {
      statusCard.dataset.tone = "error";
      statusLabel.textContent = "Export error";
      statusDetail.textContent = error.message;
    }
  }

  if (exportButton) exportButton.addEventListener("click", exportSnapshot);
  if (chartModeLocalButton) {
    chartModeLocalButton.addEventListener("click", () => setChartMode(CHART_MODE_ANNOTATED));
  }
  if (chartModeTradingViewButton) {
    chartModeTradingViewButton.addEventListener("click", () => setChartMode(CHART_MODE_TRADINGVIEW));
  }

  window.setInterval(() => {
    if (renderedSnapshot?.watch) nextRefresh.textContent = formatTimingSummary(renderedSnapshot.watch);
    if (renderedPayload?.updatedAt) updatedStat.textContent = formatUpdatedStat(renderedPayload.updatedAt);

    // Only reconnect SSE / poll server on localhost — Vercel has no state to push
    if (isLocalDev && renderedSnapshot?.watch?.active && (!lastStreamEventAt || Date.now() - lastStreamEventAt > 7000)) {
      fetchSession();
      if (!stream || stream.readyState === window.EventSource.CLOSED) connectStream();
    }
  }, config.uiTickMs || 1000);

  window.addEventListener("resize", () => {
    queueAnnotationRender();
  });

  // Interactive Symbol Search & Timeframe handlers
  const symbolSearchInput = document.getElementById("symbol-search-input");
  const symbolSearchBtn = document.getElementById("symbol-search-btn");

  async function executeSymbolChange(rawSymbol) {
    const symbol = String(rawSymbol || "").trim().toUpperCase();
    if (!symbol) return;
    try {
      const currentTf = renderedSnapshot?.selection?.timeframe || "1h";
      if (statusCard) {
        statusCard.dataset.tone = "loading";
        if (statusLabel) statusLabel.textContent = "Loading...";
        if (statusDetail) statusDetail.textContent = `Analyzing ${symbol}...`;
      }

      const response = await fetch(`/api/market?symbol=${encodeURIComponent(symbol)}&timeframe=${encodeURIComponent(currentTf)}`);
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || `Failed to fetch ${symbol}`);
      }
      const marketData = await response.json();
      if (statusCard) {
        statusCard.dataset.tone = "active";
        if (statusLabel) statusLabel.textContent = "Active";
        if (statusDetail) statusDetail.textContent = `Viewing ${marketData.displaySymbol || symbol}`;
      }
      
      const resolvedSymbol = marketData.providerSymbol || symbol;
      // Persist so SSE stream doesn't reset us back to server default
      saveUserSelection(resolvedSymbol, currentTf);
      lastRenderKey = ""; // force a full re-render
      if (renderedSnapshot) {
        renderedSnapshot.selection = { symbol: resolvedSymbol, timeframe: currentTf };
        renderedSnapshot.latest = marketData;
        renderMarket(renderedSnapshot);
      }
    } catch (err) {
      if (statusCard) {
        statusCard.dataset.tone = "error";
        if (statusLabel) statusLabel.textContent = "Error";
        if (statusDetail) statusDetail.textContent = err.message;
      }
    }
  }

  if (symbolSearchBtn) {
    symbolSearchBtn.addEventListener("click", () => {
      if (symbolSearchInput) executeSymbolChange(symbolSearchInput.value);
    });
  }
  if (symbolSearchInput) {
    symbolSearchInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") executeSymbolChange(symbolSearchInput.value);
    });
  }

  // Timeframe buttons handler
  const timeframeButtonsContainer = document.getElementById("timeframe-buttons");
  if (timeframeButtonsContainer) {
    timeframeButtonsContainer.querySelectorAll(".tf-btn").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const tf = btn.dataset.tf;
        const currentSymbol = renderedSnapshot?.selection?.symbol || "EURUSD";
        timeframeButtonsContainer.querySelectorAll(".tf-btn").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        
        try {
          if (statusCard) {
            statusCard.dataset.tone = "loading";
            if (statusLabel) statusLabel.textContent = "Loading...";
            if (statusDetail) statusDetail.textContent = `Fetching ${currentSymbol} ${tf}...`;
          }
          
          const response = await fetch(`/api/market?symbol=${encodeURIComponent(currentSymbol)}&timeframe=${encodeURIComponent(tf)}`);
          if (!response.ok) throw new Error("Timeframe change failed");
          const marketData = await response.json();
          if (statusCard) {
            statusCard.dataset.tone = "active";
            if (statusLabel) statusLabel.textContent = "Active";
            if (statusDetail) statusDetail.textContent = `${marketData.displaySymbol} (${tf})`;
          }

          // Persist timeframe choice so SSE stream doesn't revert it
          saveUserSelection(currentSymbol, tf);
          lastRenderKey = ""; // force a full re-render
          if (renderedSnapshot) {
            renderedSnapshot.selection = { symbol: currentSymbol, timeframe: tf };
            renderedSnapshot.latest = marketData;
            renderMarket(renderedSnapshot);
          }
        } catch (err) {
          if (statusCard) {
            statusCard.dataset.tone = "error";
            if (statusLabel) statusLabel.textContent = "Error";
            if (statusDetail) statusDetail.textContent = err.message;
          }
        }
      });
    });
  }

  // Web Terminal Command Bar Handler
  const webTerminalInput = document.getElementById("web-terminal-input");
  const webTerminalBtn = document.getElementById("web-terminal-btn");

  async function executeWebTerminalCommand(cmd) {
    const rawCmd = String(cmd || "").trim();
    if (!rawCmd) return;
    try {
      if (statusCard) {
        statusCard.dataset.tone = "loading";
        if (statusLabel) statusLabel.textContent = "Running...";
        if (statusDetail) statusDetail.textContent = rawCmd;
      }

      const response = await fetch("/api/command", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command: rawCmd })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Command failed");
      }

      const updatedSnapshot = await response.json();
      if (webTerminalInput) webTerminalInput.value = "";

      // On production: directly render the command result and persist selection
      if (!isLocalDev && updatedSnapshot) {
        const sel = updatedSnapshot.selection || userSelection;
        if (sel) saveUserSelection(sel.symbol, sel.timeframe);
        renderedSnapshot = updatedSnapshot;
        lastRenderKey = "";
        renderMarket(renderedSnapshot);
        if (statusCard) {
          statusCard.dataset.tone = "active";
          if (statusLabel) statusLabel.textContent = "Active";
          if (statusDetail) statusDetail.textContent = updatedSnapshot.status?.detail || `Ran "${rawCmd}"`;
        }
      } else {
        // On localhost: let handleSnapshot manage it normally
        handleSnapshot(updatedSnapshot);
      }
    } catch (err) {
      if (statusCard) {
        statusCard.dataset.tone = "error";
        if (statusLabel) statusLabel.textContent = "Command Error";
        if (statusDetail) statusDetail.textContent = err.message;
      }
    }
  }

  if (webTerminalBtn) {
    webTerminalBtn.addEventListener("click", () => {
      if (webTerminalInput) executeWebTerminalCommand(webTerminalInput.value);
    });
  }
  if (webTerminalInput) {
    webTerminalInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") executeWebTerminalCommand(webTerminalInput.value);
    });
  }

  clearLegacyWidgetLocation();
  applyChartModeUi();

  if (isLocalDev) {
    // ── LOCAL DEV: full server-push pipeline ────────────────────────────────
    fetchSession();
    connectStream();
    window.setInterval(() => {
      const streamIsHealthy = stream && stream.readyState === window.EventSource.OPEN && Date.now() - lastStreamEventAt <= 7000;
      if (!streamIsHealthy) fetchSession();
    }, config.pollIntervalMs || 3000);
  } else {
    // ── PRODUCTION (Vercel): client-driven data fetching ────────────────────
    // Vercel serverless has NO persistent state — /api/session always returns
    // defaults (EURUSD/idle). We skip SSE and polling entirely and instead:
    //   1. On load: fetch the user's saved symbol from localStorage
    //   2. Auto-refresh: re-fetch the same symbol every 30s for live prices
    const saved = loadUserSelection();
    const initSymbol = saved?.symbol || config.defaultSymbol || "EURUSD";
    const initTf = saved?.timeframe || config.defaultTimeframe || "1h";

    // Initial data fetch
    (async () => {
      try {
        if (statusCard) {
          statusCard.dataset.tone = "loading";
          if (statusLabel) statusLabel.textContent = "Loading...";
          if (statusDetail) statusDetail.textContent = `Fetching ${initSymbol}...`;
        }
        const res = await fetch(`/api/market?symbol=${encodeURIComponent(initSymbol)}&timeframe=${encodeURIComponent(initTf)}`);
        if (!res.ok) throw new Error("Failed to load market data");
        const data = await res.json();
        const sym = data.providerSymbol || initSymbol;
        saveUserSelection(sym, initTf);
        renderedSnapshot = {
          selection: { symbol: sym, timeframe: initTf },
          latest: data,
          status: { mode: "active", label: "Active", detail: `Viewing ${data.displaySymbol || sym}`, updatedAt: Date.now() },
          watch: {},
          version: 1,
          history: [],
        };
        lastRenderKey = "";
        renderMarket(renderedSnapshot);
        if (statusCard) {
          statusCard.dataset.tone = "active";
          if (statusLabel) statusLabel.textContent = "Active";
          if (statusDetail) statusDetail.textContent = `Viewing ${data.displaySymbol || sym}`;
        }
      } catch (err) {
        if (statusCard) {
          statusCard.dataset.tone = "error";
          if (statusLabel) statusLabel.textContent = "Error";
          if (statusDetail) statusDetail.textContent = err.message;
        }
      }
    })();

    // Auto-refresh: re-fetch live data for the current symbol every 30s
    window.setInterval(async () => {
      const sel = userSelection;
      if (!sel) return;
      try {
        const res = await fetch(`/api/market?symbol=${encodeURIComponent(sel.symbol)}&timeframe=${encodeURIComponent(sel.timeframe)}`);
        if (!res.ok) return;
        const data = await res.json();
        if (renderedSnapshot) {
          renderedSnapshot.latest = data;
          renderedSnapshot.selection = sel;
          lastRenderKey = "";
          renderMarket(renderedSnapshot);
        }
      } catch (_) { /* silent retry next interval */ }
    }, 30000);
  }
})();

// ── PWA Service Worker Registration ──────────────────────────────────────────
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((reg) => console.log("✅ SW registered:", reg.scope))
      .catch((err) => console.warn("SW registration failed:", err));
  });
}
