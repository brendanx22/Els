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
          websocket: true
        }
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
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
