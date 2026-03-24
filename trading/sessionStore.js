const EventEmitter = require("events");
const { analyzeCandles } = require("./analysis");
const { generateTradingAiReport } = require("./aiAnalysis");
const { fetchLiveSnapshot, fetchMarketData, resolveSymbol, TIMEFRAME_MAP } = require("./marketData");
const fs = require("fs");
const path = require("path");

const STATE_FILE = path.join(__dirname, "../.session-state.json");
const STATE_FILE_TMP = path.join(__dirname, "../.session-state.tmp.json");

const DEFAULT_SYMBOL = process.env.DEFAULT_MARKET_SYMBOL || "EURUSD";
const DEFAULT_TIMEFRAME = TIMEFRAME_MAP[process.env.DEFAULT_MARKET_TIMEFRAME]
  ? process.env.DEFAULT_MARKET_TIMEFRAME
  : "1h";
const LIVE_TICK_MS = Math.max(100, Number.parseInt(process.env.LIVE_TICK_MS || "1000", 10));
const FILE_WATCH_INTERVAL_MS = Math.max(100, Math.min(1000, LIVE_TICK_MS));

function createInstanceId() {
  return `session-${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function getRefreshInterval(timeframe) {
  const cadence = {
    "1m": 5 * 1000,
    "5m": 15 * 1000,
    "15m": 30 * 1000,
    "1h": 60 * 1000,
    "4h": 3 * 60 * 1000,
    "1d": 15 * 60 * 1000,
    "1wk": 60 * 60 * 1000,
  };

  return cadence[timeframe] || 60 * 1000;
}

function getQuoteInterval(timeframe) {
  const cadence = {
    "1m": LIVE_TICK_MS,
    "5m": LIVE_TICK_MS,
    "15m": LIVE_TICK_MS,
    "1h": LIVE_TICK_MS,
    "4h": LIVE_TICK_MS,
    "1d": LIVE_TICK_MS,
    "1wk": LIVE_TICK_MS,
  };

  return cadence[timeframe] || LIVE_TICK_MS;
}

function hasRemoteAiProvider() {
  const openAiKey = String(process.env.OPENAI_API_KEY || "").trim();
  const geminiKey = String(process.env.GEMINI_API_KEY || "").trim();

  return (openAiKey && openAiKey !== "your_openai_api_key_here")
    || (geminiKey && geminiKey !== "your_api_key_here");
}

function getAiRefreshInterval(timeframe) {
  const configured = Number.parseInt(process.env.AI_BACKGROUND_REFRESH_MS || "", 10);

  if (Number.isFinite(configured) && configured >= 1000) {
    return configured;
  }

  const cadence = {
    "1m": 1500,
    "5m": 2000,
    "15m": 3000,
    "1h": 4500,
    "4h": 7000,
    "1d": 12000,
    "1wk": 20000,
  };

  return cadence[timeframe] || 5000;
}

function buildMarketKey(symbol, timeframe) {
  return `${symbol || "unknown"}:${timeframe || "unknown"}`;
}

function buildAiFingerprint(analysis, candles) {
  const smc = analysis?.indicators?.smc || {};
  const fib = smc.fib || {};
  const primarySetup = (analysis?.setups || [])[0] || {};
  const latest = Array.isArray(candles) && candles.length ? candles[candles.length - 1] : null;

  return JSON.stringify({
    bias: analysis?.bias || "",
    candleTime: latest?.time || null,
    close: latest?.close != null ? Number(Number(latest.close).toFixed(5)) : null,
    confidence: analysis?.confidence || null,
    directionalBias: primarySetup.direction || "",
    fib05: fib.level05 || null,
    fib0705: fib.level0705 || null,
    fvg: smc.selectedFvg?.time || smc.fvgs?.[0]?.time || null,
    rsi: analysis?.indicators?.rsi14 || null,
    setupLabel: primarySetup.label || "",
    structure: smc.internalStructure || analysis?.structure?.sequence || "",
    zone:
      smc.demandZones?.[0]?.time ||
      smc.supplyZones?.[0]?.time ||
      null,
  });
}

function getTimeframeSeconds(timeframe) {
  const seconds = {
    "1m": 60,
    "5m": 300,
    "15m": 900,
    "1h": 3600,
    "4h": 14400,
    "1d": 86400,
    "1wk": 604800,
  };

  return seconds[timeframe] || 3600;
}

function normalizeTickToTimeframe(candles, tick, timeframe) {
  if (!Array.isArray(candles) || !candles.length || !tick || tick.time == null) {
    return candles;
  }

  const timeframeSeconds = getTimeframeSeconds(timeframe);
  const bucketTime = Math.floor(Number(tick.time) / timeframeSeconds) * timeframeSeconds;
  const nextCandles = candles.map((item) => ({ ...item }));
  const latest = nextCandles[nextCandles.length - 1];

  if (!latest) {
    return nextCandles;
  }

  if (latest.time === bucketTime) {
    latest.close = Number(tick.close);
    latest.high = Math.max(Number(latest.high), Number(tick.high ?? tick.close));
    latest.low = Math.min(Number(latest.low), Number(tick.low ?? tick.close));
    latest.volume = Number(latest.volume || 0) + Number(tick.volume || 0);
    return nextCandles;
  }

  if (latest.time < bucketTime) {
    nextCandles.push({
      close: Number(tick.close),
      high: Number(tick.high ?? tick.close),
      low: Number(tick.low ?? tick.close),
      open: Number(latest.close),
      time: bucketTime,
      volume: Number(tick.volume || 0),
    });

    return nextCandles.slice(-600);
  }

  return nextCandles;
}

class TradingSessionStore extends EventEmitter {
  constructor() {
    super();
    this.instanceId = createInstanceId();
    this.version = 1;
    this.latest = null;
    this.commandHistory = [];
    this.selection = {
      symbol: DEFAULT_SYMBOL,
      timeframe: DEFAULT_TIMEFRAME,
    };
    this.status = {
      detail: "Waiting for terminal input.",
      label: "Idle",
      mode: "idle",
      updatedAt: Date.now(),
    };
    this.watch = {
      active: false,
      ownerId: null,
      ownerSource: null,
      nextRefreshAt: null,
      nextQuoteAt: null,
      quoteMs: getQuoteInterval(DEFAULT_TIMEFRAME),
      refreshMs: getRefreshInterval(DEFAULT_TIMEFRAME),
      symbol: DEFAULT_SYMBOL,
      timeframe: DEFAULT_TIMEFRAME,
    };
    this.refreshHandle = null;
    this.quoteHandle = null;
    this.fileWatchStarted = false;
    this.inFlight = Promise.resolve();
    this.lastLoad = 0;
    this.aiState = {
      inFlight: false,
      lastFingerprint: null,
      lastMarketKey: null,
      lastReport: null,
      requestId: 0,
    };
    this.loadState();
    this.startFileWatcher();
  }

  ownsWatch() {
    return !this.watch.ownerId || this.watch.ownerId === this.instanceId;
  }

  clearLocalTimers() {
    if (this.refreshHandle) {
      clearTimeout(this.refreshHandle);
      this.refreshHandle = null;
    }

    if (this.quoteHandle) {
      clearTimeout(this.quoteHandle);
      this.quoteHandle = null;
    }
  }

  clearRefreshTimer() {
    if (this.refreshHandle) {
      clearTimeout(this.refreshHandle);
      this.refreshHandle = null;
    }
  }

  clearQuoteTimer() {
    if (this.quoteHandle) {
      clearTimeout(this.quoteHandle);
      this.quoteHandle = null;
    }
  }

  startFileWatcher() {
    if (this.fileWatchStarted) {
      return;
    }

    this.fileWatchStarted = true;
    fs.watchFile(STATE_FILE, { interval: FILE_WATCH_INTERVAL_MS }, (current, previous) => {
      if (current.mtimeMs <= previous.mtimeMs) {
        return;
      }

      this.loadState();
      this.emit("snapshot", this.getSnapshot());
    });
  }

  loadState() {
    try {
      if (fs.existsSync(STATE_FILE)) {
        const stats = fs.statSync(STATE_FILE);
        const mtime = stats.mtimeMs;
        
        if (mtime > this.lastLoad) {
          const data = JSON.parse(fs.readFileSync(STATE_FILE, "utf-8"));
          this.latest = data.latest;
          this.commandHistory = data.commandHistory || [];
          this.selection = data.selection || this.selection;
          this.status = data.status || this.status;
          this.version = data.version || this.version;
          this.watch = {
            ...this.watch,
            ...(data.watch || {}),
          };

          if (this.watch.active && !this.ownsWatch()) {
            this.clearLocalTimers();
          }

          this.lastLoad = mtime;
        }
      }
    } catch (error) {
      if (error instanceof SyntaxError) {
        return;
      }
      console.error("Failed to load session state:", error.message);
    }
  }

  saveState() {
    try {
      const data = {
        latest: this.latest,
        commandHistory: this.commandHistory,
        selection: this.selection,
        status: this.status,
        version: this.version,
        watch: this.watch,
      };
      fs.writeFileSync(STATE_FILE_TMP, JSON.stringify(data, null, 2));
      if (fs.existsSync(STATE_FILE)) {
        fs.unlinkSync(STATE_FILE);
      }
      fs.renameSync(STATE_FILE_TMP, STATE_FILE);
      this.lastLoad = fs.statSync(STATE_FILE).mtimeMs;
    } catch (error) {
      console.error("Failed to save session state:", error.message);
    }
  }

  bumpVersion(options = {}) {
    this.version += 1;
    if (options.persist !== false) {
      this.saveState();
    }
    this.emit("snapshot", this.getSnapshot());
  }

  setStatus(mode, label, detail) {
    this.status = {
      detail,
      label,
      mode,
      updatedAt: Date.now(),
    };
    this.bumpVersion();
  }

  recordCommand(command, source = "terminal") {
    if (!command) {
      return;
    }

    this.commandHistory.unshift({
      at: Date.now(),
      command,
      source,
    });
    this.commandHistory = this.commandHistory.slice(0, 12);
    this.bumpVersion();
  }

  queue(work) {
    const task = this.inFlight.then(work, work);
    this.inFlight = task.catch(() => {});
    return task;
  }

  getSnapshot() {
    this.loadState();
    return {
      latest: this.latest,
      selection: {
        ...this.selection,
      },
      status: {
        ...this.status,
      },
      version: this.version,
      watch: {
        ...this.watch,
      },
      history: this.commandHistory.slice(0, 8),
    };
  }

  syncAiStateFromLatest() {
    const providerSymbol = this.latest?.providerSymbol;
    const timeframe = this.latest?.timeframe?.key || this.selection.timeframe;
    const latestAi = this.latest?.analysis?.ai || null;

    if (!providerSymbol || !latestAi) {
      this.aiState.lastMarketKey = null;
      this.aiState.lastReport = null;
      this.aiState.lastFingerprint = null;
      return;
    }

    this.aiState.lastMarketKey = buildMarketKey(providerSymbol, timeframe);
    this.aiState.lastReport = latestAi;
    this.aiState.lastFingerprint = buildAiFingerprint(this.latest.analysis, this.latest.candles);
  }

  maybeRefreshBackgroundAi({ analysis, candles, marketKey, symbol, timeframe }) {
    if (!hasRemoteAiProvider() || !this.watch.active || !this.ownsWatch()) {
      this.watch.aiInFlight = false;
      this.watch.aiMs = null;
      this.watch.nextAiAt = null;
      return;
    }

    const aiMs = getAiRefreshInterval(timeframe);
    const now = Date.now();
    const fingerprint = buildAiFingerprint(analysis, candles);
    const materiallyChanged = this.aiState.lastFingerprint !== fingerprint;
    const dueByTime = !this.watch.nextAiAt || now >= this.watch.nextAiAt;
    const canFastRefresh = materiallyChanged && (!this.watch.lastAiAt || now - this.watch.lastAiAt >= Math.min(aiMs, 1500));

    this.watch.aiMs = aiMs;

    if (this.aiState.inFlight) {
      this.watch.aiInFlight = true;
      if (!this.watch.nextAiAt) {
        this.watch.nextAiAt = now + aiMs;
      }
      return;
    }

    if (!dueByTime && !canFastRefresh) {
      if (!this.watch.nextAiAt) {
        this.watch.nextAiAt = now + aiMs;
      }
      this.watch.aiInFlight = false;
      return;
    }

    const requestId = ++this.aiState.requestId;
    const requestedSymbol = symbol;
    const requestedTimeframe = timeframe;
    const requestedMarketKey = marketKey;

    this.aiState.inFlight = true;
    this.watch.aiInFlight = true;
    this.watch.nextAiAt = now + aiMs;
    this.saveState();
    this.emit("snapshot", this.getSnapshot());

    generateTradingAiReport(analysis, { symbol: requestedSymbol, timeframe: requestedTimeframe }, candles)
      .then((report) => {
        if (this.aiState.requestId !== requestId) {
          return;
        }

        const currentMarketKey = buildMarketKey(this.latest?.providerSymbol, this.latest?.timeframe?.key);
        if (!this.latest || currentMarketKey !== requestedMarketKey) {
          return;
        }

        this.latest.analysis = {
          ...this.latest.analysis,
          ai: report,
          aiAnalysis: report.oneLineCall || this.latest.analysis.aiAnalysis,
        };

        this.aiState.lastFingerprint = fingerprint;
        this.aiState.lastMarketKey = requestedMarketKey;
        this.aiState.lastReport = report;
        this.watch.lastAiAt = Date.now();
      })
      .catch((_error) => {
        return;
      })
      .finally(() => {
        if (this.aiState.requestId !== requestId) {
          return;
        }

        this.aiState.inFlight = false;
        this.watch.aiInFlight = false;
        this.watch.nextAiAt = this.watch.active ? Date.now() + aiMs : null;
        this.bumpVersion();
      });
  }

  async analyzeMarket(symbol, timeframe, options = {}) {
    const nextSymbol = symbol || this.selection.symbol;
    const nextTimeframe = TIMEFRAME_MAP[timeframe] ? timeframe : this.selection.timeframe;
    const nextResolved = resolveSymbol(nextSymbol);
    const source = options.source || "terminal";
    const reason = options.reason || `Analyzing ${nextSymbol} on ${nextTimeframe}.`;
    const syncWatch = options.syncWatch === true;
    const activateWatch = options.activateWatch === true;
    const previousLatest = this.latest;
    const previousSelection = { ...this.selection };
    const previousWatch = { ...this.watch };
    const previousAiState = {
      ...this.aiState,
    };
    const nextWatch = syncWatch
      ? {
          ...this.watch,
          active: activateWatch || this.watch.active,
          aiInFlight: false,
          aiMs: hasRemoteAiProvider() ? getAiRefreshInterval(nextTimeframe) : null,
          lastAiAt: null,
          nextAiAt: null,
          ownerId: options.claimWatch ? this.instanceId : this.watch.ownerId,
          ownerSource: options.claimWatch ? source : this.watch.ownerSource,
          quoteMs: getQuoteInterval(nextTimeframe),
          refreshMs: getRefreshInterval(nextTimeframe),
          symbol: nextSymbol,
          timeframe: nextTimeframe,
        }
      : null;

    if (options.command) {
      this.recordCommand(options.command, source);
    }

    return this.queue(async () => {
      if (syncWatch && this.ownsWatch()) {
        this.clearLocalTimers();
      }

      this.setStatus("loading", "Loading", reason);

      try {
        const market = await fetchMarketData(nextSymbol, nextTimeframe);
        const analysis = await analyzeCandles(market.candles, {
          symbol: nextSymbol,
          timeframe: nextTimeframe
        });

        this.selection = {
          symbol: nextSymbol,
          timeframe: nextTimeframe,
        };

        if (nextWatch) {
          this.watch = {
            ...nextWatch,
            nextQuoteAt: null,
            nextRefreshAt: null,
          };
        }

        this.latest = {
          ...market,
          analysis,
          news: analysis.news || null,
          movements: analysis.movements || null,
        };
        this.aiState.inFlight = false;
        this.aiState.requestId += 1;
        this.syncAiStateFromLatest();

        if (this.watch.active) {
          this.watch.aiInFlight = false;
          this.watch.aiMs = hasRemoteAiProvider() ? getAiRefreshInterval(nextTimeframe) : null;
          this.watch.lastAiAt = analysis.ai ? Date.now() : null;
          this.watch.nextAiAt = this.watch.aiMs ? Date.now() + this.watch.aiMs : null;
        }

        const liveDetail = this.watch.active
          ? `Watching ${market.displaySymbol} on ${market.timeframe.label}.`
          : `Updated ${market.displaySymbol} on ${market.timeframe.label}.`;

        this.setStatus("live", "Live", liveDetail);
        if (this.watch.active && this.ownsWatch()) {
          this.scheduleNextRefresh();
          this.scheduleNextQuote();
        }

        return this.latest;
      } catch (error) {
        this.latest = previousLatest;
        this.selection = previousSelection;
        this.watch = previousWatch;
        this.aiState = previousAiState;
        this.setStatus("error", "Error", error.message);
        if (this.watch.active && this.ownsWatch()) {
          this.scheduleNextRefresh();
          this.scheduleNextQuote();
        }
        throw error;
      }
    });
  }

  async refreshCurrent(options = {}) {
    const symbol = this.watch.active ? this.watch.symbol : this.selection.symbol;
    const timeframe = this.watch.active ? this.watch.timeframe : this.selection.timeframe;

    return this.analyzeMarket(symbol, timeframe, {
      command: options.command || "refresh",
      reason: options.reason || `Refreshing ${symbol} on ${timeframe}.`,
      source: options.source || "terminal",
      syncWatch: this.watch.active,
    });
  }

  async startWatch(symbol, timeframe, options = {}) {
    const nextSymbol = symbol || this.selection.symbol;
    const nextTimeframe = TIMEFRAME_MAP[timeframe] ? timeframe : this.selection.timeframe;

    return this.analyzeMarket(nextSymbol, nextTimeframe, {
      activateWatch: true,
      claimWatch: true,
      command: options.command,
      reason: `Starting live watch for ${nextSymbol} on ${nextTimeframe}.`,
      source: options.source || "terminal",
      syncWatch: true,
    });
  }

  async ensureWatch(symbol, timeframe, options = {}) {
    if (this.watch.active) {
      if (this.ownsWatch()) {
        this.scheduleNextRefresh();
        this.scheduleNextQuote();
      }

      return this.latest;
    }

    return this.startWatch(symbol, timeframe, options);
  }

  stopWatch(options = {}) {
    this.clearLocalTimers();

    if (!this.ownsWatch()) {
      return;
    }

    this.watch.active = false;
    this.watch.ownerId = null;
    this.watch.ownerSource = null;
    this.watch.aiInFlight = false;
    this.watch.aiMs = null;
    this.watch.lastAiAt = null;
    this.watch.nextRefreshAt = null;
    this.watch.nextAiAt = null;
    this.watch.nextQuoteAt = null;

    if (options.command) {
      this.recordCommand(options.command, options.source || "terminal");
    }

    this.setStatus("idle", "Paused", "Auto-refresh is paused. Use the terminal to resume.");
  }

  scheduleNextRefresh() {
    this.clearRefreshTimer();

    if (!this.watch.active) {
      this.watch.nextRefreshAt = null;
      this.bumpVersion();
      return;
    }

    if (!this.ownsWatch()) {
      return;
    }

    const refreshMs = getRefreshInterval(this.watch.timeframe);
    this.watch.refreshMs = refreshMs;
    this.watch.nextRefreshAt = Date.now() + refreshMs;
    this.bumpVersion();

    this.refreshHandle = setTimeout(async () => {
      try {
        await this.analyzeMarket(this.watch.symbol, this.watch.timeframe, {
          reason: `Auto-refreshing ${this.watch.symbol} on ${this.watch.timeframe}.`,
          source: "watch",
        });
      } catch (_error) {
        return;
      }
    }, refreshMs);
  }

  scheduleNextQuote() {
    this.clearQuoteTimer();

    if (!this.watch.active || !this.latest) {
      this.watch.aiInFlight = false;
      this.watch.nextQuoteAt = null;
      this.saveState();
      this.emit("snapshot", this.getSnapshot());
      return;
    }

    if (!this.ownsWatch()) {
      return;
    }

    const quoteMs = getQuoteInterval(this.watch.timeframe);
    this.watch.quoteMs = quoteMs;
    this.watch.nextQuoteAt = Date.now() + quoteMs;
    this.saveState();
    this.emit("snapshot", this.getSnapshot());

    this.quoteHandle = setTimeout(async () => {
      try {
        await this.refreshLiveQuote();
      } catch (_error) {
        this.scheduleNextQuote();
      }
    }, quoteMs);
  }

  async refreshLiveQuote() {
    return this.queue(async () => {
      if (!this.latest || !this.ownsWatch()) {
        return null;
      }

      const activeSymbol = this.watch.symbol || this.selection.symbol;
      const activeTimeframe = TIMEFRAME_MAP[this.watch.timeframe] ? this.watch.timeframe : this.selection.timeframe;
      const marketKey = buildMarketKey(this.latest.providerSymbol, activeTimeframe);
      const previousAi = this.aiState.lastMarketKey === marketKey
        ? this.aiState.lastReport
        : this.latest.analysis?.ai || null;
      const live = await fetchLiveSnapshot(activeSymbol);
      const nextCandles = normalizeTickToTimeframe(this.latest.candles, live.tick, activeTimeframe);
      const nextAnalysis = await analyzeCandles(nextCandles, {
        symbol: activeSymbol,
        timeframe: activeTimeframe,
        skipRemoteAi: true,
        previousAi,
      });

      this.latest = {
        ...this.latest,
        analysis: nextAnalysis,
        candles: nextCandles,
        displaySymbol: live.displaySymbol || this.latest.displaySymbol,
        provider: live.provider || this.latest.provider,
        providerSymbol: live.providerSymbol || this.latest.providerSymbol,
        snapshot: {
          ...this.latest.snapshot,
          ...live.snapshot,
        },
        updatedAt: live.updatedAt,
      };
      this.aiState.lastMarketKey = buildMarketKey(this.latest.providerSymbol, activeTimeframe);
      this.aiState.lastReport = nextAnalysis.ai || previousAi || null;

      this.status = {
        ...this.status,
        detail: this.watch.active
          ? `Watching ${this.latest.displaySymbol} on ${this.latest.timeframe.label}.`
          : this.status.detail,
        updatedAt: Date.now(),
      };

      this.maybeRefreshBackgroundAi({
        analysis: nextAnalysis,
        candles: nextCandles,
        marketKey: this.aiState.lastMarketKey,
        symbol: activeSymbol,
        timeframe: activeTimeframe,
      });
      this.scheduleNextQuote();
      this.bumpVersion();
      return this.latest;
    });
  }
}

module.exports = new TradingSessionStore();
module.exports.TradingSessionStore = TradingSessionStore;
