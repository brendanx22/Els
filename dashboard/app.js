require("dotenv").config();
const express = require("express");
const path = require("path");
const { analyzeCandles } = require("../trading/analysis");
const sessionStore = require("../trading/sessionStore");
const {
  fetchMarketData,
  searchSymbols,
  TIMEFRAME_MAP,
} = require("../trading/marketData");

const DEFAULT_SYMBOL = process.env.DEFAULT_MARKET_SYMBOL || "EURUSD";
const DEFAULT_TIMEFRAME = process.env.DEFAULT_MARKET_TIMEFRAME || "1h";
const LIVE_TICK_MS = Math.max(100, Number.parseInt(process.env.LIVE_TICK_MS || "1000", 10));
const UI_TICK_MS = Math.max(100, Number.parseInt(process.env.UI_TICK_MS || String(LIVE_TICK_MS), 10));

function createApp(options = {}) {
  const app = express();
  const store = options.sessionStore || sessionStore;

  app.set("view engine", "ejs");
  app.set("views", path.join(__dirname, "views"));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use((req, res, next) => {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    next();
  });
  app.use("/vendor/apexcharts", express.static(path.join(__dirname, "..", "node_modules", "apexcharts", "dist"), {
    etag: false,
    lastModified: false,
  }));
  app.use("/vendor/plotly", express.static(path.join(__dirname, "..", "node_modules", "plotly.js-dist-min"), {
    etag: false,
    lastModified: false,
  }));
  app.use("/vendor/klinecharts", express.static(path.join(__dirname, "..", "node_modules", "klinecharts", "dist", "umd"), {
    etag: false,
    lastModified: false,
  }));
  app.use("/vendor/html2canvas", express.static(path.join(__dirname, "..", "node_modules", "html2canvas", "dist"), {
    etag: false,
    lastModified: false,
  }));
  app.use(express.static(path.join(__dirname, "public"), {
    etag: false,
    lastModified: false,
  }));

  app.get("/favicon.ico", (_req, res) => res.status(204).end());

  app.get("/", (_req, res) => {
    res.render("dashboard", {
      appConfig: {
        commandExamples: [
          "analyze EURUSD 1h",
          "watch BTCUSD 5m",
          "refresh",
          "stop",
        ],
        defaultSymbol: DEFAULT_SYMBOL,
        defaultTimeframe: TIMEFRAME_MAP[DEFAULT_TIMEFRAME] ? DEFAULT_TIMEFRAME : "1h",
        timeframeLabels: Object.fromEntries(
          Object.entries(TIMEFRAME_MAP).map(([key, value]) => [key, value.label])
        ),
        defaultChartMode: String(process.env.DEFAULT_CHART_MODE || "tradingview").trim().toLowerCase() === "annotated"
          ? "annotated"
          : "tradingview",
        pollIntervalMs: Math.max(500, UI_TICK_MS * 5),
        uiTickMs: UI_TICK_MS,
      },
      error: "",
    });
  });

  app.get("/api/health", (_req, res) => {
    res.json({
      ok: true,
      service: "trading-terminal",
    });
  });

  app.get("/api/stream", (req, res) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders?.();

    const writeSnapshot = (snapshot) => {
      res.write(`data: ${JSON.stringify(snapshot)}\n\n`);
    };

    const heartbeat = setInterval(() => {
      res.write(": keep-alive\n\n");
    }, 15000);

    const listener = (snapshot) => {
      writeSnapshot(snapshot);
    };

    store.on("snapshot", listener);
    writeSnapshot(store.getSnapshot());

    req.on("close", () => {
      clearInterval(heartbeat);
      store.off("snapshot", listener);
      res.end();
    });
  });

  app.get("/api/search", async (req, res) => {
    try {
      const results = await searchSymbols(req.query.q);
      res.json({
        results,
      });
    } catch (error) {
      res.status(500).json({
        error: error.message,
      });
    }
  });

  app.get("/api/session", async (_req, res) => {
    let snapshot = store.getSnapshot();

    if (!snapshot.latest || !snapshot.latest.candles) {
      try {
        const symbol = snapshot.selection?.symbol || DEFAULT_SYMBOL;
        const timeframe = snapshot.selection?.timeframe || DEFAULT_TIMEFRAME;
        const market = await fetchMarketData(symbol, timeframe);
        const analysis = await analyzeCandles(market.candles, { symbol, timeframe });
        const latestData = { ...market, analysis };

        if (store.latest !== undefined) {
          store.latest = latestData;
          store.status = {
            detail: `Viewing ${market.displaySymbol || symbol} (${timeframe})`,
            label: "Active",
            mode: "active",
            updatedAt: Date.now(),
          };
          if (typeof store.saveState === "function") {
            store.saveState();
          }
        }
        snapshot = store.getSnapshot();
      } catch (err) {
        console.warn("Auto-load initial market error:", err.message);
      }
    }

    if (
      snapshot.latest?.candles &&
      (
        !snapshot.latest.analysis?.scorecard ||
        !snapshot.latest.analysis?.indicators?.smc?.rsiConfirmation ||
        !snapshot.latest.analysis?.ai?.oneLineCall
      )
    ) {
      const analysis = await analyzeCandles(snapshot.latest.candles, {
        symbol: snapshot.selection.symbol,
        timeframe: snapshot.selection.timeframe,
      });

      snapshot.latest.analysis = analysis;

      if (store.latest) {
        store.latest.analysis = analysis;

        if (typeof store.saveState === "function") {
          store.saveState();
        }
      }
    }

    res.json(snapshot);
  });

  app.post("/api/command", async (req, res) => {
    try {
      const rawCommand = String(req.body.command || "").trim();
      if (!rawCommand) {
        return res.status(400).json({ error: "Command string is required." });
      }

      const parts = rawCommand.split(/\s+/);
      const action = parts[0].toLowerCase();
      const symbolArg = parts[1] || DEFAULT_SYMBOL;
      const tfArg = parts[2] || DEFAULT_TIMEFRAME;

      let symbol = symbolArg;
      let timeframe = tfArg;

      if (action === "analyze" || action === "watch" || action === "view") {
        symbol = symbolArg;
        timeframe = tfArg;
      }

      const market = await fetchMarketData(symbol, timeframe);
      const analysis = await analyzeCandles(market.candles, { symbol, timeframe });
      const latestData = { ...market, analysis };

      if (store.latest !== undefined) {
        store.latest = latestData;
        store.selection = { symbol: market.providerSymbol || symbol, timeframe };
        store.status = {
          detail: `Ran "${rawCommand}"`,
          label: "Active",
          mode: "active",
          updatedAt: Date.now(),
        };
        store.commandHistory = [
          { command: rawCommand, timestamp: Date.now(), mode: "manual" },
          ...(store.commandHistory || []).slice(0, 49),
        ];
        if (typeof store.saveState === "function") {
          store.saveState();
        }
      }

      res.json(store.getSnapshot());
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/market", async (req, res) => {
    try {
      const symbol = req.query.symbol || DEFAULT_SYMBOL;
      const timeframe = req.query.timeframe || DEFAULT_TIMEFRAME;
      const market = await fetchMarketData(symbol, timeframe);
      const analysis = await analyzeCandles(market.candles, { symbol, timeframe });

      res.json({
        ...market,
        analysis,
      });
    } catch (error) {
      res.status(400).json({
        error: error.message,
      });
    }
  });

  // Enhanced API endpoints for new features
  app.get("/api/enhanced/:symbol", async (req, res) => {
    try {
      const { symbol } = req.params;
      const timeframe = req.query.timeframe || DEFAULT_TIMEFRAME;
      
      const { EnhancedDashboardViz } = require("../trading/enhancedDashboardViz");
      const visualizer = new EnhancedDashboardViz();
      
      // Get snapshot data
      const snapshot = store.getSnapshot();
      const analysis = snapshot.latest?.analysis;
      
      if (!analysis) {
        return res.status(404).json({ error: "No analysis data available" });
      }
      
      // Generate complete visualization package
      const enhancedData = visualizer.generateDashboardPackage(symbol, timeframe, {
        technical: analysis,
        news: analysis.news,
        newsHistory: [],
        movement: analysis.movements,
        patterns: analysis.advancedPatterns,
        predictive: analysis.predictive,
        mtf: analysis.mtf,
        signal: null,
        market: { price: snapshot.latest?.snapshot?.price }
      });
      
      res.json(enhancedData);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Trading signals endpoint
  app.get("/api/signals", async (req, res) => {
    try {
      const { AutomatedTradingSignals } = require("../trading/automatedSignals");
      const signalGenerator = new AutomatedTradingSignals();
      
      const symbol = req.query.symbol;
      const signals = signalGenerator.getActiveSignals(symbol);
      
      res.json({
        signals,
        count: signals.length,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Alerts endpoint
  app.get("/api/alerts", async (req, res) => {
    try {
      const { SmartAlertSystem } = require("../trading/smartAlerts");
      const alertSystem = new SmartAlertSystem();
      
      const symbol = req.query.symbol;
      const count = parseInt(req.query.count) || 10;
      
      const alerts = alertSystem.getRecentAlerts(count, symbol);
      
      res.json({
        alerts,
        count: alerts.length,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // WebSocket stats endpoint
  app.get("/api/websocket-stats", (req, res) => {
    try {
      const { RealtimeWebSocketServer } = require("../trading/websocketServer");
      // This would need the actual ws server instance
      res.json({
        status: "WebSocket server available on port 3003",
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // System status endpoint
  app.get("/api/system-status", async (req, res) => {
    try {
      const snapshot = store.getSnapshot();
      
      res.json({
        status: "operational",
        market: snapshot.selection,
        watch: snapshot.watch,
        timestamp: new Date().toISOString(),
        features: {
          news: true,
          patterns: true,
          predictions: true,
          mtf: true,
          alerts: true,
          screener: true,
          calendar: true,
          paperTrading: true,
          websocket: true
        }
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // ── Multi-Pair Market Screener ──
  const { MarketScreener } = require("../trading/screener");
  const screener = new MarketScreener();
  app.get("/api/screener", async (req, res) => {
    try {
      const tf = req.query.timeframe || "1h";
      const results = await screener.scanMarkets(tf);
      res.json({ markets: results, count: results.length, updatedAt: Date.now() });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // ── Macro Economic Calendar ──
  const { EconomicCalendar } = require("../trading/economicCalendar");
  const calendar = new EconomicCalendar();
  app.get("/api/calendar", (req, res) => {
    try {
      const symbol = req.query.symbol;
      const events = calendar.getUpcomingEvents();
      const risk = symbol ? calendar.checkEventRiskForSymbol(symbol) : { hasHighImpactRisk: false };
      res.json({ events, risk, count: events.length, updatedAt: Date.now() });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // ── Real-Time Webhook & Alert Dispatcher ──
  const fs = require("fs");
  const { AlertsEngine } = require("../trading/alertsEngine");
  const alertsEngine = new AlertsEngine();

  const ALERT_CONFIG_PATH = path.join(__dirname, "..", "data", "alert_config.json");

  function loadPersistedAlertConfig() {
    try {
      if (fs.existsSync(ALERT_CONFIG_PATH)) {
        const raw = fs.readFileSync(ALERT_CONFIG_PATH, "utf-8");
        return JSON.parse(raw);
      }
    } catch (_) {}
    return {};
  }

  function savePersistedAlertConfig(cfg) {
    try {
      const dir = path.dirname(ALERT_CONFIG_PATH);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(ALERT_CONFIG_PATH, JSON.stringify(cfg, null, 2), "utf-8");
    } catch (_) {}
  }

  const persistedConfig = loadPersistedAlertConfig();

  // Alert subscription store (combining Env Vars, Persistent File Store & Runtime API sync)
  let serverTelegramConfig = {
    botToken: process.env.TELEGRAM_BOT_TOKEN || persistedConfig.botToken || "",
    chatId: process.env.TELEGRAM_CHAT_ID || persistedConfig.chatId || "",
    discordWebhook: process.env.DISCORD_WEBHOOK_URL || persistedConfig.discordWebhook || "",
    minConfluence: Number(process.env.MIN_CONFLUENCE || persistedConfig.minConfluence || 60),
    timeframes: persistedConfig.timeframes || ["15m", "1h", "4h"]
  };

  app.post("/api/alerts/config", (req, res) => {
    const { botToken, chatId, discordWebhook, minConfluence, timeframes } = req.body;
    if (botToken !== undefined) serverTelegramConfig.botToken = botToken;
    if (chatId !== undefined) serverTelegramConfig.chatId = chatId;
    if (discordWebhook !== undefined) serverTelegramConfig.discordWebhook = discordWebhook;
    if (minConfluence !== undefined) serverTelegramConfig.minConfluence = Number(minConfluence);
    if (timeframes !== undefined) serverTelegramConfig.timeframes = Array.isArray(timeframes) ? timeframes : String(timeframes).split(",");
    
    savePersistedAlertConfig(serverTelegramConfig);

    res.json({
      success: true,
      config: {
        minConfluence: serverTelegramConfig.minConfluence,
        timeframes: serverTelegramConfig.timeframes,
        configured: !!(serverTelegramConfig.botToken && serverTelegramConfig.chatId)
      }
    });
  });

  app.get("/api/alerts/config", (req, res) => {
    res.json({
      configured: !!(serverTelegramConfig.botToken && serverTelegramConfig.chatId),
      hasDiscord: !!serverTelegramConfig.discordWebhook,
      minConfluence: serverTelegramConfig.minConfluence,
      timeframes: serverTelegramConfig.timeframes
    });
  });

  app.post("/api/alerts/test", async (req, res) => {
    try {
      const { type, webhookUrl, botToken, chatId, payload } = req.body;
      const targetToken = botToken || serverTelegramConfig.botToken;
      const targetChatId = chatId || serverTelegramConfig.chatId;
      const targetWebhook = webhookUrl || serverTelegramConfig.discordWebhook;

      const testData = payload || {
        symbol: "BTCUSD",
        timeframe: "1h",
        direction: "BULLISH",
        confluenceScore: 88,
        price: "67,450.00",
        entry: "67,200.00",
        stopLoss: "66,500.00",
        target1: "69,000.00",
        text: "Bullish Order Block Mitigation + Confluence 88%"
      };

      let result;
      if (type === "discord") {
        result = await alertsEngine.sendDiscordWebhook(targetWebhook, testData);
      } else if (type === "telegram") {
        result = await alertsEngine.sendTelegramAlert(targetToken, targetChatId, testData);
      } else {
        return res.status(400).json({ error: "Invalid alert type (expected 'discord' or 'telegram')" });
      }

      res.json({ success: true, result });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  // Cooldown store for automated scanner alerts (prevent spamming every 2 min)
  const recentAlertsCooldown = new Map();

  // ── Autonomous Telegram & Discord Multi-Timeframe Scanner Cron ──
  // Scans multiple timeframes (15m, 1h, 4h) automatically via Vercel Cron, GitHub Actions, or External Ping 24/7
  app.all("/api/cron/scan", async (req, res) => {
    try {
      const token = req.query.botToken || req.headers["x-telegram-token"] || serverTelegramConfig.botToken || process.env.TELEGRAM_BOT_TOKEN;
      const chat = req.query.chatId || req.headers["x-telegram-chat"] || serverTelegramConfig.chatId || process.env.TELEGRAM_CHAT_ID;
      const webhook = req.query.webhookUrl || req.headers["x-discord-webhook"] || serverTelegramConfig.discordWebhook || process.env.DISCORD_WEBHOOK_URL;
      const minConf = Number(req.query.minConfluence || serverTelegramConfig.minConfluence || 60);

      // Determine which timeframes to scan (default to multi-timeframe: 15m, 1h, 4h)
      const rawTfParam = req.query.timeframes || req.query.tf || "";
      const targetTimeframes = rawTfParam
        ? rawTfParam.split(",").map(t => t.trim()).filter(Boolean)
        : (Array.isArray(serverTelegramConfig.timeframes) && serverTelegramConfig.timeframes.length ? serverTelegramConfig.timeframes : ["15m", "1h", "4h"]);

      if (!token && !webhook) {
        return res.json({
          status: "waiting_for_config",
          message: "No Telegram or Discord configured yet. You can supply them in the URL query (?botToken=...&chatId=...), set TELEGRAM_BOT_TOKEN/TELEGRAM_CHAT_ID in Vercel env, or enter them in the terminal More tab."
        });
      }

      const sentAlerts = [];
      const triggeredSetups = [];
      let totalMarketsScanned = 0;
      const now = Date.now();

      // Scan all requested timeframes concurrently
      const scanResults = await Promise.allSettled(
        targetTimeframes.map(async (tf) => {
          const markets = await screener.scanMarkets(tf);
          return { tf, markets: Array.isArray(markets) ? markets : [] };
        })
      );

      for (const resItem of scanResults) {
        if (resItem.status !== "fulfilled") continue;
        const { tf, markets } = resItem.value;
        totalMarketsScanned += markets.length;

        const highQualitySetups = markets.filter(m => m.confluenceScore >= minConf);
        for (const setup of highQualitySetups) {
          triggeredSetups.push({ ...setup, timeframe: tf });
          const cooldownKey = `${setup.symbol}-${tf}-${setup.bias}`;
          const lastSent = recentAlertsCooldown.get(cooldownKey) || 0;

          // Don't repeat the exact same setup on the same timeframe within 30 minutes unless forced
          if (!req.query.force && (now - lastSent < 30 * 60 * 1000)) {
            continue;
          }

          const alertPayload = {
            symbol: setup.displaySymbol || setup.symbol,
            timeframe: tf,
            direction: setup.bias,
            confluenceScore: setup.confluenceScore,
            price: setup.price,
            entry: setup.entry,
            stopLoss: setup.stopLoss,
            takeProfit1: setup.takeProfit1,
            takeProfit2: setup.takeProfit2,
            riskReward: setup.riskReward,
            setupType: setup.setupType,
            detail: `[${tf.toUpperCase()}] SMC: ${setup.smcStatus} | 24h Change: ${setup.changePercent}% | RSI: ${setup.rsi}`
          };

          if (token && chat) {
            try {
              await alertsEngine.sendTelegramAlert(token, chat, alertPayload);
              sentAlerts.push({ symbol: setup.symbol, timeframe: tf, destination: "Telegram", confluence: setup.confluenceScore });
              recentAlertsCooldown.set(cooldownKey, now);
            } catch (_) {}
          }
          if (webhook) {
            try {
              await alertsEngine.sendDiscordWebhook(webhook, alertPayload);
              sentAlerts.push({ symbol: setup.symbol, timeframe: tf, destination: "Discord", confluence: setup.confluenceScore });
              recentAlertsCooldown.set(cooldownKey, now);
            } catch (_) {}
          }
        }
      }

      res.json({
        status: "complete",
        timeframesScanned: targetTimeframes,
        totalMarketsScanned,
        minConfluence: minConf,
        triggeredSetupsCount: triggeredSetups.length,
        dispatchedCount: sentAlerts.length,
        dispatched: sentAlerts,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // ── Position Size & Lot Calculator ──
  const { PaperTradingEngine } = require("../trading/paperTrading");
  const paperEngine = new PaperTradingEngine();
  app.post("/api/paper-trading/calc", (req, res) => {
    try {
      const { balance, riskPercent, entry, stopLoss, assetType } = req.body;
      const sizing = paperEngine.calculatePositionSize(
        Number(balance || 100000),
        Number(riskPercent || 1.0),
        Number(entry),
        Number(stopLoss),
        assetType || "forex"
      );
      res.json(sizing);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  return app;
}

async function startDashboard() {
  const port = Number.parseInt(process.env.PORT || "3001", 10);
  const app = createApp();

  app.listen(port, () => {
    console.log(`Trading mirror running at http://localhost:${port}`);
  });
}

if (require.main === module) {
  startDashboard().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}

module.exports = createApp;
