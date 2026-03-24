require("dotenv").config();
const readline = require("readline");
const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const createApp = require("../dashboard/app");
const { searchSymbols, TIMEFRAME_MAP } = require("../trading/marketData");
const sessionStore = require("../trading/sessionStore");
const STT = require("../voice/stt");

const PORT = Number.parseInt(process.env.PORT || "3001", 10);
const DASHBOARD_URL = `http://localhost:${PORT}`;
const CONTROLLER_LOCK_FILE = path.join(__dirname, "../.terminal-controller.lock");
const TIMEFRAME_INPUT_MAP = {
  "1m": "1m",
  "1min": "1m",
  "1minute": "1m",
  "5m": "5m",
  "5min": "5m",
  "5minute": "5m",
  "15m": "15m",
  "15min": "15m",
  "15minute": "15m",
  "30m": "30m",
  "30min": "30m",
  "30minute": "30m",
  "1h": "1h",
  "1hr": "1h",
  "1hour": "1h",
  "4h": "4h",
  "4hr": "4h",
  "4hour": "4h",
  "1d": "1d",
  "1day": "1d",
  "1wk": "1wk",
  "1w": "1wk",
  "1week": "1wk",
};

let sttInstance = null;
let voiceMode = false;

async function initializeVoice() {
  try {
    sttInstance = new STT();
    const result = await sttInstance.initialize();
    
    if (result.ok) {
      console.log("✅ Voice recognition initialized");
      console.log("🎤 Say 'voice mode' to enable voice commands");
      return true;
    } else {
      console.log("⚠️  Voice recognition unavailable:", result.reason);
      console.log("💡 Install 'vosk' and 'mic' packages to enable voice commands");
      console.log("📦 Run: npm install vosk mic");
      return false;
    }
  } catch (error) {
    console.log("⚠️  Voice recognition failed:", error.message);
    console.log("� Install 'vosk' and 'mic' packages to enable voice commands");
    console.log("📦 Run: npm install vosk mic");
    return false;
  }
}

async function startVoiceListening() {
  if (!sttInstance || voiceMode) return;
  
  // Ensure live feed is paused for voice work
  const snapshot = sessionStore.getSnapshot();
  if (snapshot.watch.active) {
    console.log("⏸️  Pausing live feed for voice mode...");
    sessionStore.stopWatch({
      command: "voice-prepare",
      source: "terminal",
    });
  }
  
  voiceMode = true;
  console.log("🎤 Voice mode enabled - Listening for commands...");
  console.log("💡 Say 'stop voice' to disable or 'resume' to restart live feed");
  
  try {
    await sttInstance.startListening(async (text) => {
      if (!text || !text.trim()) return;
      
      console.log(`🎤 Heard: "${text}"`);
      
      const normalizedText = text.toLowerCase().trim();
      
      if (normalizedText.includes("stop voice")) {
        voiceMode = false;
        console.log("🔇 Voice mode disabled");
        return;
      }
      
      if (normalizedText.includes("resume")) {
        voiceMode = false;
        await sessionStore.startWatch(snapshot.selection.symbol, snapshot.selection.timeframe, {
          command: "voice-resume",
          source: "terminal",
        });
        console.log("▶️  Live feed resumed from voice command");
        return;
      }
      
      try {
        await handleCommand(text);
      } catch (error) {
        console.error(`Voice command error: ${error.message}`);
      }
    });
  } catch (error) {
    console.error("Voice listening error:", error.message);
    voiceMode = false;
  }
}

function formatPrice(value) {
  if (value == null || Number.isNaN(Number(value))) {
    return "--";
  }

  const numeric = Number(value);

  if (Math.abs(numeric) >= 1000) {
    return numeric.toFixed(2);
  }

  if (Math.abs(numeric) >= 10) {
    return numeric.toFixed(3);
  }

  return numeric.toFixed(5);
}

function formatSignedChange(value) {
  if (value == null || Number.isNaN(Number(value))) {
    return "--";
  }

  const numeric = Number(value);
  return `${numeric >= 0 ? "+" : ""}${formatPrice(numeric)}`;
}

function formatTimestamp(value) {
  if (!value) {
    return "--";
  }

  return new Date(value).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function formatCountdownShort(target) {
  if (!target) {
    return "--";
  }

  const remainingMs = Math.max(0, target - Date.now());
  const remainingSeconds = remainingMs / 1000;

  if (remainingSeconds < 10) {
    return `${remainingSeconds.toFixed(1)}s`;
  }

  if (remainingSeconds < 60) {
    return `${Math.ceil(remainingSeconds)}s`;
  }

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = Math.ceil(remainingSeconds) % 60;
  return `${minutes}m${String(seconds).padStart(2, "0")}s`;
}

function formatWatchTimers(watch) {
  if (!watch?.active) {
    return "--";
  }

  const parts = [
    `tick ${formatCountdownShort(watch.nextQuoteAt)}`,
    `scan ${formatCountdownShort(watch.nextRefreshAt)}`,
  ];

  if (watch.nextAiAt) {
    parts.push(`ai ${formatCountdownShort(watch.nextAiAt)}`);
  }

  return parts.join(" | ");
}

function normalizeTimeframeInput(value, fallback) {
  if (!value) {
    return fallback;
  }

  const normalized = TIMEFRAME_INPUT_MAP[String(value).trim().toLowerCase()];
  return TIMEFRAME_MAP[normalized] ? normalized : fallback;
}

function printDivider() {
  console.log("------------------------------------------------------------");
}

function processExists(pid) {
  if (!pid || Number.isNaN(Number(pid))) {
    return false;
  }

  try {
    process.kill(Number(pid), 0);
    return true;
  } catch (_error) {
    return false;
  }
}

function readControllerLock() {
  try {
    if (!fs.existsSync(CONTROLLER_LOCK_FILE)) {
      return null;
    }

    return JSON.parse(fs.readFileSync(CONTROLLER_LOCK_FILE, "utf8"));
  } catch (_error) {
    return null;
  }
}

function findOtherTerminalControllers() {
  if (process.platform !== "win32") {
    return [];
  }

  const script = [
    "Get-CimInstance Win32_Process",
    `| Where-Object { $_.Name -eq 'node.exe' -and $_.ProcessId -ne ${process.pid} -and $_.CommandLine -match 'terminal.*index\\.js' }`,
    "| Select-Object -ExpandProperty ProcessId",
  ].join(" ");

  const result = spawnSync("powershell", ["-NoProfile", "-Command", script], {
    encoding: "utf8",
  });

  if (result.status !== 0) {
    return [];
  }

  return String(result.stdout || "")
    .split(/\r?\n/)
    .map((value) => Number.parseInt(value.trim(), 10))
    .filter((value) => Number.isInteger(value) && value > 0);
}

function acquireControllerLock() {
  const payload = {
    createdAt: Date.now(),
    pid: process.pid,
    port: PORT,
  };
  const runningControllers = findOtherTerminalControllers();

  if (runningControllers.length) {
    const message = `Another trading terminal is already running on PID ${runningControllers.join(", ")}. Close the older controller first so the live symbol stops getting stuck.`;
    const lockError = new Error(message);
    lockError.code = "TERMINAL_LOCKED";
    throw lockError;
  }

  try {
    fs.writeFileSync(CONTROLLER_LOCK_FILE, JSON.stringify(payload, null, 2), {
      flag: "wx",
    });
    return payload;
  } catch (error) {
    if (error.code !== "EEXIST") {
      throw error;
    }
  }

  const existing = readControllerLock();

  if (existing && processExists(existing.pid)) {
    const message = `Another trading terminal is already running on PID ${existing.pid}. Close that controller first so the session does not get stuck on the wrong symbol.`;
    const lockError = new Error(message);
    lockError.code = "TERMINAL_LOCKED";
    throw lockError;
  }

  try {
    fs.unlinkSync(CONTROLLER_LOCK_FILE);
  } catch (_error) {
    return acquireControllerLock();
  }

  return acquireControllerLock();
}

function releaseControllerLock() {
  const existing = readControllerLock();

  if (!existing || Number(existing.pid) !== process.pid) {
    return;
  }

  try {
    fs.unlinkSync(CONTROLLER_LOCK_FILE);
  } catch (_error) {
    return;
  }
}

function printHelp() {
  printDivider();
  console.log("Commands");
  console.log("analyze <symbol> [timeframe]   Analyze and switch live market feed");
  console.log("watch <symbol> [timeframe]     Start or switch live market feed");
  console.log("pause                          Pause live feed (enables voice work)");
  console.log("resume                         Resume paused live feed");
  console.log("refresh                        Re-run current market");
  console.log("stop                           Pause live refresh");
  console.log("search <query>                 Search Yahoo Finance symbols");
  console.log("status                         Show latest tracked market");
  console.log("voice                          Enable voice command mode");
  console.log("voice-dev                      Enter voice development mode");
  console.log("help                           Show this help");
  console.log("quit, exit                     Close the terminal");
  printDivider();
}

function printSnapshot() {
  const snapshot = sessionStore.getSnapshot();
  const latest = snapshot.latest;
  const selectedTimeframeLabel = TIMEFRAME_MAP[snapshot.selection.timeframe]?.label || snapshot.selection.timeframe;

  printDivider();
  console.log(`Status: ${snapshot.status.label} - ${snapshot.status.detail}`);
  console.log(
    `Watch: ${snapshot.watch.active ? "ON" : "OFF"} | ${snapshot.selection.symbol} | ${snapshot.selection.timeframe}`
  );
  if (snapshot.watch.active) {
    console.log(`Loop: ${formatWatchTimers(snapshot.watch)}`);
  }
  console.log(`Web: ${DASHBOARD_URL}`);

  if (!latest) {
    console.log(`Market: ${snapshot.selection.symbol} | ${selectedTimeframeLabel} | --`);
    printDivider();
    return;
  }

  console.log(
    `Market: ${latest.displaySymbol} | ${latest.timeframe.label} | ${formatPrice(latest.snapshot.price)} ${latest.snapshot.currency || ""}`.trim()
  );
  console.log(
    `Bias: ${latest.analysis.bias} (${latest.analysis.confidence}%) | Momentum: ${latest.analysis.momentum}`
  );
  console.log(
    `Support: ${formatPrice(latest.analysis.indicators.nearestSupport)} | Resistance: ${formatPrice(latest.analysis.indicators.nearestResistance)}`
  );
  console.log(`AI: ${latest.analysis.aiAnalysis || latest.analysis.insights?.thesis || "--"}`);

  if (latest.analysis.ai) {
    console.log(
      `AI plan: ${latest.analysis.ai.shouldTrade ? "Qualified" : "Stand aside"} | ${latest.analysis.ai.entryPlan?.status || "review"} | ${latest.analysis.ai.entryPlan?.entryZone || "--"}`
    );
  }

  const primarySetup = (latest.analysis.setups || [])[0];

  if (primarySetup) {
    console.log(
      `Primary setup: ${primarySetup.direction} ${primarySetup.label} | Entry ${formatPrice(primarySetup.entry)} | Stop ${formatPrice(primarySetup.stopLoss)} | TP1 ${formatPrice(primarySetup.takeProfit1)}`
    );
  }

  if (latest.analysis.ai?.nextActions?.length) {
    console.log(`Next action: ${latest.analysis.ai.nextActions[0]}`);
  }

  printDivider();
}

function printLiveUpdate(snapshot, state, rl) {
  const latest = snapshot.latest;
  const loading = snapshot.status.mode === "loading";
  const activeSymbol = loading ? snapshot.selection?.symbol : latest?.displaySymbol || snapshot.selection?.symbol;
  const activeTimeframe = loading
    ? TIMEFRAME_MAP[snapshot.selection?.timeframe]?.label || snapshot.selection?.timeframe || "--"
    : latest?.timeframe?.label || TIMEFRAME_MAP[snapshot.selection?.timeframe]?.label || "--";

  const fingerprint = JSON.stringify({
    active: snapshot.watch.active,
    detail: snapshot.status.detail,
    loading,
    mode: snapshot.status.mode,
    price: loading ? null : latest?.snapshot?.price,
    symbol: activeSymbol,
    timeframe: activeTimeframe,
    updatedAt: latest?.updatedAt || snapshot.status.updatedAt,
    version: snapshot.version,
  });

  if (fingerprint === state.lastFingerprint) {
    return;
  }

  state.lastFingerprint = fingerprint;
  const priceChanged =
    state.lastPrice != null &&
    latest?.snapshot?.price != null &&
    Number(latest?.snapshot?.price) !== Number(state.lastPrice);
  const pulseLabel = snapshot.watch.active && latest?.updatedAt !== state.lastUpdatedAt
    ? "tick"
    : "status";
  const moveLabel = !loading && latest?.snapshot?.change != null
    ? `${formatSignedChange(latest.snapshot.change)} / ${Number(latest.snapshot.changePercent || 0).toFixed(2)}%`
    : "--";
  const liveLine = `[${pulseLabel} ${formatTimestamp(latest?.updatedAt || snapshot.status.updatedAt)}] ${activeSymbol} ${activeTimeframe} | ${loading ? "--" : formatPrice(latest?.snapshot?.price)} ${loading ? "" : latest?.snapshot?.currency || ""}`.trim();
  const detailLine = `${snapshot.status.label} | ${moveLabel} | ${loading ? "Switching market..." : latest?.analysis?.bias || "--"}${priceChanged ? " | price moved" : ""}`;

  if (process.stdout.isTTY) {
    readline.clearLine(process.stdout, 0);
    readline.cursorTo(process.stdout, 0);
  }

  process.stdout.write(`${liveLine}\n${detailLine}\n`);

  state.lastUpdatedAt = latest?.updatedAt || state.lastUpdatedAt;
  state.lastPrice = latest?.snapshot?.price ?? state.lastPrice;

  if (rl && typeof rl.prompt === "function") {
    rl.prompt(true);
  }
}

function attachRealtimeFeed(rl) {
  const state = {
    lastFingerprint: "",
    lastPrice: null,
    lastUpdatedAt: null,
  };

  const listener = (snapshot) => {
    if (!snapshot || !snapshot.latest) {
      return;
    }

    try {
      printLiveUpdate(snapshot, state, rl);
    } catch (error) {
      console.error(`Live terminal update failed: ${error.message}`);
    }
  };

  sessionStore.on("snapshot", listener);
  return () => {
    sessionStore.off("snapshot", listener);
  };
}

function attachPromptTicker(rl) {
  const renderPrompt = () => {
    const snapshot = sessionStore.getSnapshot();
    const basePrompt = snapshot.watch?.active
      ? `trade [${formatWatchTimers(snapshot.watch)}]> `
      : "trade> ";

    rl.setPrompt(basePrompt);
    rl.prompt(true);
  };

  renderPrompt();
  const handle = setInterval(renderPrompt, Math.max(100, Number.parseInt(process.env.UI_TICK_MS || process.env.LIVE_TICK_MS || "1000", 10)));
  return () => {
    clearInterval(handle);
  };
}

async function runAnalyze(tokens) {
  const symbol = tokens[1] || sessionStore.getSnapshot().selection.symbol;
  const timeframe = normalizeTimeframeInput(tokens[2], sessionStore.getSnapshot().selection.timeframe);

  await sessionStore.startWatch(symbol, timeframe, {
    command: `analyze ${symbol} ${timeframe}`,
    source: "terminal",
  });

  printSnapshot();
}

async function runWatch(tokens) {
  const symbol = tokens[1] || sessionStore.getSnapshot().selection.symbol;
  const timeframe = normalizeTimeframeInput(tokens[2], sessionStore.getSnapshot().selection.timeframe);

  await sessionStore.startWatch(symbol, timeframe, {
    command: `watch ${symbol} ${timeframe}`,
    source: "terminal",
  });

  printSnapshot();
}

async function runSearch(tokens) {
  const query = tokens.slice(1).join(" ").trim();

  if (!query) {
    console.log("Provide a symbol or name to search.");
    return;
  }

  const results = await searchSymbols(query);

  printDivider();
  console.log(`Search: ${query}`);

  if (results.length === 0) {
    console.log("No results found.");
    printDivider();
    return;
  }

  results.slice(0, 6).forEach((item, index) => {
    console.log(`${index + 1}. ${item.symbol} | ${item.name} | ${item.exchange || "Unknown"}`);
  });
  printDivider();
}

async function handleCommand(line) {
  const trimmed = line.trim();

  if (!trimmed) {
    return;
  }

  const tokens = trimmed.split(/\s+/);
  const command = tokens[0].toLowerCase();

  if (command === "help") {
    printHelp();
    return;
  }

  if (command === "status") {
    printSnapshot();
    return;
  }

  if (command === "refresh") {
    await sessionStore.refreshCurrent({
      command: "refresh",
      source: "terminal",
    });
    printSnapshot();
    return;
  }

  if (command === "stop") {
    sessionStore.stopWatch({
      command: "stop",
      source: "terminal",
    });
    printSnapshot();
    return;
  }

  if (command === "pause") {
    sessionStore.stopWatch({
      command: "pause",
      source: "terminal",
    });
    console.log("⏸️  Live feed paused - Voice mode available");
    console.log("💡 Use 'resume' to restart live feed or 'voice' for voice commands");
    return;
  }

  if (command === "resume") {
    const snapshot = sessionStore.getSnapshot();
    await sessionStore.startWatch(snapshot.selection.symbol, snapshot.selection.timeframe, {
      command: "resume",
      source: "terminal",
    });
    console.log("▶️  Live feed resumed");
    printSnapshot();
    return;
  }

  if (command === "search") {
    await runSearch(tokens);
    return;
  }

  if (command === "analyze") {
    await runAnalyze(tokens);
    return;
  }

  if (command === "watch") {
    await runWatch(tokens);
    return;
  }

  if (command === "voice" || (trimmed.toLowerCase().includes("voice") && trimmed.toLowerCase().includes("mode"))) {
    await startVoiceListening();
    return;
  }

  if (command === "voice-dev") {
    console.log("🎙️  Entering Voice Development Mode...");
    console.log("💡 This pauses live feed for focused voice work");
    
    // Stop live feed
    sessionStore.stopWatch({
      command: "voice-dev",
      source: "terminal",
    });
    
    // Start voice development environment
    const { spawn } = require("child_process");
    const voiceDev = spawn("node", ["voice-dev.js"], {
      stdio: "inherit",
      cwd: __dirname,
    });
    
    voiceDev.on("exit", (code) => {
      console.log(`👋 Voice development mode exited (code: ${code})`);
      console.log("💡 Use 'resume' to restart live feed");
    });
    
    return;
  }

  if (command === "quit" || command === "exit") {
    throw new Error("__EXIT__");
  }

  console.log(`Unknown command: ${command}`);
  console.log("Use `help` to see available commands.");
}

async function startServer() {
  const app = createApp({
    sessionStore,
  });

  return new Promise((resolve, reject) => {
    const server = app.listen(PORT, () => {
      resolve(server);
    });

    server.on("error", reject);
  });
}

async function main() {
  acquireControllerLock();
  const server = await startServer();
  
  // Initialize voice recognition
  await initializeVoice();
  
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: Boolean(process.stdin.isTTY && process.stdout.isTTY),
  });
  const detachRealtimeFeed = attachRealtimeFeed(rl);
  let detachPromptTicker = () => {};

  console.log("Trading terminal is running.");
  console.log(`Web mirror: ${DASHBOARD_URL}`);
  console.log("Starting live watch on the default market...");

  try {
    await sessionStore.startWatch(undefined, undefined, {
      source: "terminal",
    });
    printSnapshot();
  } catch (error) {
    console.error(`Startup analysis failed: ${error.message}`);
  }

  printHelp();
  detachPromptTicker = attachPromptTicker(rl);

  rl.on("line", async (line) => {
    try {
      await handleCommand(line);
    } catch (error) {
      if (error.message === "__EXIT__") {
        rl.close();
        return;
      }

      console.error(error.message);
    }

    rl.prompt();
  });

  rl.on("close", () => {
    detachRealtimeFeed();
    detachPromptTicker();
    sessionStore.stopWatch({
      source: "terminal",
    });
    server.close(() => {
      releaseControllerLock();
      process.exit(0);
    });
  });
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    releaseControllerLock();
    process.exitCode = 1;
  });
}

module.exports = {
  main,
};
