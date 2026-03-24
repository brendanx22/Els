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
    const snapshot = store.getSnapshot();

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
