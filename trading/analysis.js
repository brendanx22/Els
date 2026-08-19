const {
  ATR,
  BollingerBands,
  EMA,
  MACD,
  RSI,
  ADX,
  abandonedbaby: AbandonedBaby,
  bearishengulfingpattern: BearishEngulfing,
  bullishengulfingpattern: BullishEngulfing,
  darkcloudcover: DarkCloudCover,
  doji: Doji,
  eveningstar: EveningStar,
  hammerpattern: Hammer,
  hangingman: HangingMan,
  morningstar: MorningStar,
  piercingline: PiercingLine,
  shootingstar: ShootingStar,
} = require("technicalindicators");
const axios = require("axios");
const { fallbackAiReport, generateTradingAiReport } = require("./aiAnalysis");
const { NewsAnalyzer, MovementAnalyzer } = require("./newsAnalysis");
const { MultiSourceNewsAggregator } = require("./multiSourceNews");
const { AdvancedPatternRecognition } = require("./advancedPatterns");
const { PredictiveAnalytics } = require("./predictiveAnalytics");
const { EnhancedAIAnalysis } = require("./enhancedAI");

// Initialize analyzers
const newsAnalyzer = new NewsAnalyzer();
const movementAnalyzer = new MovementAnalyzer();
const newsAggregator = new MultiSourceNewsAggregator();
const patternRecognizer = new AdvancedPatternRecognition();
const predictor = new PredictiveAnalytics();
let mtfAnalyzer;
const aiAnalyzer = new EnhancedAIAnalysis();

async function getAIAnalysis(marketData, technicals) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "your_api_key_here") {
    return "AI analysis unavailable (missing API key).";
  }

  try {
    const prompt = `Analyze this market data using Smart Money Concepts (SMC) and provide a professional trading insight.
    Market: ${marketData.symbol} (${marketData.timeframe})
    Price: ${technicals.latestClose}
    
    SMC Structure:
    - Bias: ${technicals.bias}
    - Sequence: ${technicals.structure.sequence}
    - Internal Structure: ${technicals.smc.internalStructure}
    - BOS/CHOCH: ${technicals.smc.bos.length ? technicals.smc.bos[0].type : (technicals.smc.choch.length ? technicals.smc.choch[0].type : 'None')}
    
    SMC Zones:
    - Premium/Discount: ${technicals.smc.premiumDiscount}
    - Nearest Supply: ${technicals.smc.supplyZones.length ? technicals.smc.supplyZones[0].high : 'None'}
    - Nearest Demand: ${technicals.smc.demandZones.length ? technicals.smc.demandZones[0].low : 'None'}
    - FVG Presence: ${technicals.smc.fvgs.length > 0 ? 'Active FVGs detected' : 'No major FVGs'}
    
    Confirmation:
    - RSI: ${technicals.rsi} (${technicals.divergence || 'No divergence'})
    - Momentum: ${technicals.momentum}
    
    Provide a concise (2-3 sentences) high-probability thesis following this rule: 
    "If bullish, look for buys at demand in discount. If bearish, look for sells at supply in premium."`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-latest:generateContent?key=${apiKey}`;
    const response = await axios.post(url, {
      contents: [{
        parts: [{ text: prompt }]
      }]
    }, {
      headers: {
        "Content-Type": "application/json"
      }
    });

    if (response.data && response.data.candidates && response.data.candidates[0].content.parts[0].text) {
      return response.data.candidates[0].content.parts[0].text.trim();
    }
    
    return "AI analysis failed: Unexpected response format.";
  } catch (error) {
    return `AI analysis failed: ${error.response?.data?.error?.message || error.message}`;
  }
}

function detectDivergence(candles, rsiSeries) {
  if (candles.length < 20 || rsiSeries.length < 20) return null;

  const windowSize = 15;
  const recentCandles = candles.slice(-windowSize);
  const recentRsi = rsiSeries.slice(-windowSize);

  const priceHighs = detectSwingPoints(recentCandles, 2).highs;
  const rsiHighs = detectSwingPoints(recentRsi.map((v, i) => ({ time: i, high: v })), 2).highs;

  if (priceHighs.length >= 2 && rsiHighs.length >= 2) {
    const p1 = priceHighs[priceHighs.length - 2];
    const p2 = priceHighs[priceHighs.length - 1];
    const r1 = recentRsi[rsiHighs[rsiHighs.length - 2].time];
    const r2 = recentRsi[rsiHighs[rsiHighs.length - 1].time];

    if (p2.value > p1.value && r2 < r1) {
      return "Bearish Divergence";
    }
  }

  const priceLows = detectSwingPoints(recentCandles, 2).lows;
  const rsiLows = detectSwingPoints(recentRsi.map((v, i) => ({ time: i, low: v })), 2).lows;

  if (priceLows.length >= 2 && rsiLows.length >= 2) {
    const p1 = priceLows[priceLows.length - 2];
    const p2 = priceLows[priceLows.length - 1];
    const r1 = recentRsi[rsiLows[rsiLows.length - 2].time];
    const r2 = recentRsi[rsiLows[rsiLows.length - 1].time];

    if (p2.value < p1.value && r2 > r1) {
      return "Bullish Divergence";
    }
  }

  return null;
}

function detectAdvancedPatterns(candles) {
  const input = {
    open: candles.map(c => c.open),
    high: candles.map(c => c.high),
    low: candles.map(c => c.low),
    close: candles.map(c => c.close),
  };

  if (BullishEngulfing(input)) return "Bullish Engulfing";
  if (BearishEngulfing(input)) return "Bearish Engulfing";
  if (MorningStar(input)) return "Morning Star";
  if (EveningStar(input)) return "Evening Star";
  if (Hammer(input)) return "Hammer";
  if (ShootingStar(input)) return "Shooting Star";
  if (AbandonedBaby(input)) return "Abandoned Baby";
  if (DarkCloudCover(input)) return "Dark Cloud Cover";
  if (PiercingLine(input)) return "Piercing Line";
  if (HangingMan(input)) return "Hanging Man";
  if (Doji(input)) return "Doji";

  return detectPattern(candles);
}

/**
 * SMC - Smart Money Concepts Analysis
 */

function detectSMC(candles, swings) {
  const latest = candles[candles.length - 1];
  const highs = swings.highs;
  const lows = swings.lows;

  if (highs.length < 3 || lows.length < 3) {
    return {
      bos: [],
      choch: [],
      fvgs: [],
      supplyZones: [],
      demandZones: [],
      fib: null,
      internalStructure: "Neutral"
    };
  }

  const bos = [];
  const choch = [];
  const fvgs = [];
  const supplyZones = [];
  const demandZones = [];

  // 1. Detect BOS and CHOCH
  let currentBias = "Neutral";
  const lastHigh = highs[highs.length - 1];
  const lastLow = lows[lows.length - 1];
  const prevHigh = highs[highs.length - 2];
  const prevLow = lows[lows.length - 2];

  // Break of Structure (BOS) - Continuation
  if (lastHigh.value > prevHigh.value && latest.close > lastHigh.value) {
    bos.push({ type: "BOS", direction: "Bullish", time: latest.time, value: lastHigh.value });
    currentBias = "Bullish";
  } else if (lastLow.value < prevLow.value && latest.close < lastLow.value) {
    bos.push({ type: "BOS", direction: "Bearish", time: latest.time, value: lastLow.value });
    currentBias = "Bearish";
  }

  // Change of Character (CHOCH) - Reversal
  if (currentBias === "Bullish" && latest.close < lastLow.value) {
    choch.push({ type: "CHOCH", direction: "Bearish", time: latest.time, value: lastLow.value });
    currentBias = "Bearish";
  } else if (currentBias === "Bearish" && latest.close > lastHigh.value) {
    choch.push({ type: "CHOCH", direction: "Bullish", time: latest.time, value: lastHigh.value });
    currentBias = "Bullish";
  }

  // 2. Detect Fair Value Gaps (FVG)
  for (let i = 2; i < candles.length; i++) {
    const c1 = candles[i - 2];
    const c2 = candles[i - 1];
    const c3 = candles[i];

    // Bullish FVG
    if (c3.low > c1.high) {
      fvgs.push({ type: "Bullish", top: c3.low, bottom: c1.high, time: c2.time });
    }
    // Bearish FVG
    else if (c3.high < c1.low) {
      fvgs.push({ type: "Bearish", top: c1.low, bottom: c3.high, time: c2.time });
    }
  }

  // 3. Supply & Demand Zones (Refined to candle body)
  // Demand: Last bearish candle before impulsive bullish move
  for (let i = 1; i < candles.length - 1; i++) {
    const prev = candles[i - 1];
    const curr = candles[i];
    const next = candles[i + 1];

    if (curr.close < curr.open && next.close > next.open && next.close > curr.high) {
      demandZones.push({
        high: Math.max(curr.open, curr.close),
        low: Math.min(curr.open, curr.close),
        time: curr.time
      });
    }
    // Supply: Last bullish candle before impulsive bearish move
    else if (curr.close > curr.open && next.close < next.open && next.close < curr.low) {
      supplyZones.push({
        high: Math.max(curr.open, curr.close),
        low: Math.min(curr.open, curr.close),
        time: curr.time
      });
    }
  }

  // 4. Fibonacci Retracement from last structural impulse
  let fib = null;
  if (currentBias === "Bullish") {
    const low = lastLow.value;
    const high = latest.high;
    const diff = high - low;
    fib = {
      level0: high,
      level05: high - diff * 0.5,
      level0618: high - diff * 0.618,
      level0705: high - diff * 0.705,
      level0786: high - diff * 0.786,
      level1: low,
      zone: "Discount"
    };
  } else if (currentBias === "Bearish") {
    const high = lastHigh.value;
    const low = latest.low;
    const diff = high - low;
    fib = {
      level0: low,
      level05: low + diff * 0.5,
      level0618: low + diff * 0.618,
      level0705: low + diff * 0.705,
      level0786: low + diff * 0.786,
      level1: high,
      zone: "Premium"
    };
  }

  return {
    bos,
    choch,
    fvgs: fvgs.slice(-5),
    supplyZones: supplyZones.slice(-5),
    demandZones: demandZones.slice(-5),
    fib,
    internalStructure: currentBias,
    premiumDiscount: fib ? fib.zone : "Neutral"
  };
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function lastValue(values) {
  return values.length ? values[values.length - 1] : null;
}

function roundPrice(value) {
  if (!Number.isFinite(value)) {
    return null;
  }

  if (Math.abs(value) >= 1000) {
    return Number(value.toFixed(2));
  }

  if (Math.abs(value) >= 10) {
    return Number(value.toFixed(3));
  }

  return Number(value.toFixed(5));
}

function average(values) {
  if (!values.length) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function toLinePoints(candles, values) {
  const offset = candles.length - values.length;

  return values.map((value, index) => ({
    time: candles[offset + index].time,
    value: roundPrice(value),
  }));
}

function getVisibleRange(candles) {
  const startIndex = Math.max(0, candles.length - 180);

  return {
    end: candles[candles.length - 1].time,
    start: candles[startIndex].time,
  };
}

function buildHorizontalOverlay(candles, label, value, color, lineStyle = "dashed") {
  const range = getVisibleRange(candles);

  return {
    color,
    label,
    lineStyle,
    points: [
      { time: range.start, value: roundPrice(value) },
      { time: range.end, value: roundPrice(value) },
    ],
  };
}

function buildSegmentOverlay(label, points, color, lineStyle = "solid", lineWidth = 1) {
  return {
    color,
    label,
    lineStyle,
    lineWidth,
    points: points.map((point) => ({
      time: point.time,
      value: roundPrice(point.value),
    })),
  };
}

function buildTimedHorizontalOverlay(label, value, startTime, endTime, color, lineStyle = "dashed", lineWidth = 1) {
  return {
    color,
    label,
    lineStyle,
    lineWidth,
    points: [
      { time: startTime, value: roundPrice(value) },
      { time: endTime, value: roundPrice(value) },
    ],
  };
}

function estimateTimeSpacing(candles) {
  if (candles.length < 2) {
    return 3600;
  }

  const deltas = [];

  for (let index = Math.max(1, candles.length - 12); index < candles.length; index += 1) {
    const delta = candles[index].time - candles[index - 1].time;

    if (delta > 0) {
      deltas.push(delta);
    }
  }

  return deltas.length ? Math.round(average(deltas)) : 3600;
}

function buildChartAnnotations({ atr, candles, fib, originZone, selectedFvg, structureEvent }) {
  const spacing = estimateTimeSpacing(candles);
  const latestTime = candles[candles.length - 1]?.time || 0;
  const rightTime = latestTime + spacing * 12;
  const fibStartIndex = structureEvent
    ? Math.max(0, structureEvent.impulseStartIndex - 1)
    : Math.max(0, candles.length - 28);
  const fibStartTime = fib?.anchorStartTime || candles[fibStartIndex]?.time || candles[0]?.time || latestTime;
  const labels = [];
  const regions = [];
  const structureLines = [];

  if (fib) {
    const level0 = fib.direction === "bullish" ? fib.anchorHigh : fib.anchorLow;
    const level1 = fib.direction === "bullish" ? fib.anchorLow : fib.anchorHigh;
    const fibLabelTime = rightTime - spacing * 1.5;

    regions.push(
      {
        borderColor: "rgba(8, 153, 129, 0.16)",
        color: "rgba(8, 153, 129, 0.10)",
        endTime: rightTime,
        startTime: fibStartTime,
        top: Math.max(level0, fib.levels["0.5"]),
        bottom: Math.min(level0, fib.levels["0.5"]),
      },
      {
        borderColor: "rgba(255, 191, 70, 0.28)",
        color: "rgba(255, 191, 70, 0.16)",
        endTime: rightTime,
        startTime: fibStartTime,
        top: Math.max(fib.levels["0.5"], fib.levels["0.705"]),
        bottom: Math.min(fib.levels["0.5"], fib.levels["0.705"]),
      },
      {
        borderColor: "rgba(255, 191, 70, 0.18)",
        color: "rgba(255, 191, 70, 0.08)",
        endTime: rightTime,
        label: "Fib pocket",
        labelAlign: "left",
        labelColor: "#b7791f",
        startTime: fibStartTime,
        top: Math.max(fib.levels["0.705"], fib.levels["0.786"]),
        bottom: Math.min(fib.levels["0.705"], fib.levels["0.786"]),
      },
      {
        borderColor: "rgba(41, 98, 255, 0.16)",
        color: "rgba(41, 98, 255, 0.10)",
        endTime: rightTime,
        top: Math.max(fib.levels["0.786"], level1),
        bottom: Math.min(fib.levels["0.786"], level1),
      }
    );

    labels.push(
      { align: "right", anchor: "right-edge", color: "#6b7280", price: level0, text: "0", time: fibLabelTime, variant: "fib" },
      { align: "right", anchor: "right-edge", color: "#089981", price: fib.levels["0.5"], text: "0.5", time: fibLabelTime, variant: "fib" },
      { align: "right", anchor: "right-edge", color: "#c58a14", price: fib.levels["0.618"], text: "0.618", time: fibLabelTime, variant: "fib" },
      { align: "right", anchor: "right-edge", color: "#c58a14", price: fib.levels["0.705"], text: "0.705", time: fibLabelTime, variant: "fib" },
      { align: "right", anchor: "right-edge", color: "#b45309", price: fib.levels["0.786"], text: "0.786", time: fibLabelTime, variant: "fib" },
      { align: "right", anchor: "right-edge", color: "#6b7280", price: level1, text: "1", time: fibLabelTime, variant: "fib" }
    );
  }

  if (originZone) {
    regions.push({
      borderColor: originZone.type === "Demand" ? "rgba(41, 98, 255, 0.32)" : "rgba(242, 54, 69, 0.32)",
      color: originZone.type === "Demand" ? "rgba(41, 98, 255, 0.14)" : "rgba(242, 54, 69, 0.12)",
      endTime: rightTime,
      label: originZone.type === "Demand" ? "Demand zone" : "Supply zone",
      labelAlign: "left",
      labelColor: originZone.type === "Demand" ? "#2962ff" : "#f23645",
      startTime: originZone.time,
      top: originZone.high,
      bottom: originZone.low,
    });
  }

  if (selectedFvg) {
    const fvgEndTime = Math.min(rightTime, (selectedFvg.endTime || selectedFvg.startTime) + spacing * 6);

    regions.push({
      borderColor: "rgba(17, 24, 39, 0.28)",
      borderStyle: "dashed",
      color: "rgba(17, 24, 39, 0.06)",
      endTime: fvgEndTime,
      label: "FVG",
      labelAlign: "center",
      labelColor: "#111827",
      startTime: selectedFvg.startTime,
      top: selectedFvg.high,
      bottom: selectedFvg.low,
    });
  }

  if (structureEvent) {
    const structureStartTime = candles[Math.max(0, structureEvent.breakIndex - 6)]?.time || fibStartTime;
    const structureEndTime = candles[Math.min(candles.length - 1, structureEvent.breakIndex + 1)]?.time || latestTime;

    structureLines.push(
      buildTimedHorizontalOverlay(
        structureEvent.type,
        structureEvent.breakLevel,
        structureStartTime,
        structureEndTime,
        structureEvent.type === "CHOCH" ? "#53b46f" : "#2962ff",
        "solid",
        2
      )
    );

    labels.push({
      align: "left",
      color: structureEvent.type === "CHOCH" ? "#53b46f" : "#2962ff",
      price: roundPrice(
        structureEvent.direction === "bullish"
          ? structureEvent.breakLevel + atr * 0.18
          : structureEvent.breakLevel - atr * 0.18
      ),
      text: structureEvent.type === "CHOCH" ? "CHoCH" : "BOS",
      time: structureStartTime,
      variant: "structure",
    });
  }

  return {
    fibStartTime,
    labels,
    legend: [
      { color: "#ff4d5a", text: "EMA (200, open)" },
      fib ? { color: "#111827", text: "Fib 0 / 0.5 / 0.618 / 0.705 / 0.786 / 1" } : null,
    ].filter(Boolean),
    regions,
    rightTime,
    structureLines,
  };
}

function buildTrendOverlay(swings, side, color) {
  const points = side === "high" ? swings.highs : swings.lows;

  if (points.length < 2) {
    return null;
  }

  const a = points[points.length - 2];
  const b = points[points.length - 1];

  return {
    color,
    label: side === "high" ? "Swing-high trendline" : "Swing-low trendline",
    lineStyle: "solid",
    points: [
      { time: a.time, value: roundPrice(a.value) },
      { time: b.time, value: roundPrice(b.value) },
    ],
  };
}

function detectSwingPoints(candles, windowSize = 3, indexOffset = 0) {
  const highs = [];
  const lows = [];

  for (let index = windowSize; index < candles.length - windowSize; index += 1) {
    const bar = candles[index];
    const left = candles.slice(index - windowSize, index);
    const right = candles.slice(index + 1, index + windowSize + 1);

    if ([...left, ...right].every((item) => item.high < bar.high)) {
      highs.push({ index: indexOffset + index, time: bar.time, value: bar.high });
    }

    if ([...left, ...right].every((item) => item.low > bar.low)) {
      lows.push({ index: indexOffset + index, time: bar.time, value: bar.low });
    }
  }

  return { highs, lows };
}

function detectPattern(candles) {
  const latest = candles[candles.length - 1];
  const previous = candles[candles.length - 2];

  if (!latest || !previous) {
    return "No pattern";
  }

  const latestBodyHigh = Math.max(latest.open, latest.close);
  const latestBodyLow = Math.min(latest.open, latest.close);
  const previousBodyHigh = Math.max(previous.open, previous.close);
  const previousBodyLow = Math.min(previous.open, previous.close);

  if (
    latest.close > latest.open &&
    previous.close < previous.open &&
    latestBodyHigh >= previousBodyHigh &&
    latestBodyLow <= previousBodyLow
  ) {
    return "Bullish engulfing";
  }

  if (
    latest.close < latest.open &&
    previous.close > previous.open &&
    latestBodyHigh >= previousBodyHigh &&
    latestBodyLow <= previousBodyLow
  ) {
    return "Bearish engulfing";
  }

  if (latest.high <= previous.high && latest.low >= previous.low) {
    return "Inside bar";
  }

  const fullRange = latest.high - latest.low;

  if (fullRange <= 0) {
    return "Continuation";
  }

  const lowerWick = Math.min(latest.open, latest.close) - latest.low;
  const upperWick = latest.high - Math.max(latest.open, latest.close);

  if (lowerWick / fullRange > 0.55 && latest.close > latest.open) {
    return "Bullish rejection";
  }

  if (upperWick / fullRange > 0.55 && latest.close < latest.open) {
    return "Bearish rejection";
  }

  return "Continuation";
}

function countMoves(values, direction) {
  let count = 0;

  for (let index = 1; index < values.length; index += 1) {
    if (direction === "up" && values[index] > values[index - 1]) {
      count += 1;
    }

    if (direction === "down" && values[index] < values[index - 1]) {
      count += 1;
    }
  }

  return count;
}

function evaluateStructure(swings) {
  const highs = swings.highs.slice(-4).map((item) => item.value);
  const lows = swings.lows.slice(-4).map((item) => item.value);
  const higherHighs = countMoves(highs, "up");
  const lowerHighs = countMoves(highs, "down");
  const higherLows = countMoves(lows, "up");
  const lowerLows = countMoves(lows, "down");

  let biasHint = "Neutral structure";
  let sequence = "Mixed rotation";

  if (higherHighs >= 2 && higherLows >= 2) {
    biasHint = "Bullish structure";
    sequence = "Higher highs / higher lows";
  } else if (lowerHighs >= 2 && lowerLows >= 2) {
    biasHint = "Bearish structure";
    sequence = "Lower highs / lower lows";
  } else if (higherLows >= 2 && lowerHighs >= 2) {
    sequence = "Compression / triangle";
  }

  return {
    biasHint,
    lastSwingHigh: highs.length ? roundPrice(highs[highs.length - 1]) : null,
    lastSwingLow: lows.length ? roundPrice(lows[lows.length - 1]) : null,
    quality: clamp(Math.round(((higherHighs + higherLows + lowerHighs + lowerLows) / 6) * 100), 18, 96),
    rangeLocationPercent: 50,
    sequence,
  };
}

function evaluateRange(candles, latestClose) {
  const recent = candles.slice(-48);
  const highs = recent.map((item) => item.high);
  const lows = recent.map((item) => item.low);
  const high = Math.max(...highs);
  const low = Math.min(...lows);
  const width = Math.max(high - low, 0.0000001);
  const midpoint = low + width / 2;
  const locationPercent = clamp(Math.round(((latestClose - low) / width) * 100), 0, 100);

  return {
    high: roundPrice(high),
    locationPercent,
    low: roundPrice(low),
    midpoint: roundPrice(midpoint),
    width,
  };
}

function evaluateVolatility(bollingerSeries, atr, latestClose) {
  const latestBand = lastValue(bollingerSeries) || { lower: latestClose, middle: latestClose, upper: latestClose };
  const widths = bollingerSeries.map((item) => ((item.upper - item.lower) / item.middle) * 100);
  const bandwidthPercent = latestBand.middle
    ? ((latestBand.upper - latestBand.lower) / latestBand.middle) * 100
    : 0;
  const widthRatio = average(widths.slice(-20)) ? bandwidthPercent / average(widths.slice(-20)) : 1;
  const atrPercent = latestClose ? (atr / latestClose) * 100 : 0;

  return {
    atrPercent: Number(atrPercent.toFixed(2)),
    bandwidthPercent: Number(bandwidthPercent.toFixed(2)),
    state: widthRatio < 0.78 ? "Compression" : widthRatio > 1.25 ? "Expansion" : "Balanced volatility",
    widthRatio: Number(widthRatio.toFixed(2)),
  };
}

function sortSwings(swings) {
  return [...swings.highs.map((item) => ({ ...item, kind: "high" })), ...swings.lows.map((item) => ({ ...item, kind: "low" }))].sort(
    (left, right) => left.index - right.index
  );
}

function findStructureEvent(candles, swings, structureBias) {
  const ordered = sortSwings(swings);
  let swingCursor = 0;
  let lastHigh = null;
  let lastLow = null;
  let trend = structureBias === "Bullish structure" ? "bullish" : structureBias === "Bearish structure" ? "bearish" : "neutral";
  let latestEvent = null;

  for (let index = 0; index < candles.length; index += 1) {
    while (swingCursor < ordered.length && ordered[swingCursor].index <= index) {
      if (ordered[swingCursor].kind === "high") {
        lastHigh = ordered[swingCursor];
      } else {
        lastLow = ordered[swingCursor];
      }

      swingCursor += 1;
    }

    if (lastHigh && candles[index].close > lastHigh.value) {
      latestEvent = {
        breakIndex: index,
        breakLevel: lastHigh.value,
        direction: "bullish",
        impulseEndIndex: index,
        impulseStartIndex: lastLow ? lastLow.index : Math.max(0, index - 12),
        type: trend === "bearish" ? "CHOCH" : "BOS",
      };
      trend = "bullish";
      lastHigh = null;
    }

    if (lastLow && candles[index].close < lastLow.value) {
      latestEvent = {
        breakIndex: index,
        breakLevel: lastLow.value,
        direction: "bearish",
        impulseEndIndex: index,
        impulseStartIndex: lastHigh ? lastHigh.index : Math.max(0, index - 12),
        type: trend === "bullish" ? "CHOCH" : "BOS",
      };
      trend = "bearish";
      lastLow = null;
    }
  }

  return latestEvent;
}

function isLowerTimeframe(timeframe) {
  return timeframe === "1m" || timeframe === "5m" || timeframe === "15m";
}

// Tighter ATR padding on lower timeframes keeps stops close to the invalidation
// level instead of the wider buffer that makes sense on swing timeframes.
function getStopAtrMultiplier(timeframe) {
  const multipliers = {
    "1m": 0.06,
    "5m": 0.08,
    "15m": 0.1,
    "1h": 0.12,
    "4h": 0.15,
    "1d": 0.18,
    "1wk": 0.2,
  };

  return multipliers[timeframe] ?? 0.1;
}

function getStructureAgeLimit(timeframe) {
  const limits = {
    "1m": 96,
    "5m": 84,
    "15m": 72,
    "1h": 60,
    "4h": 48,
    "1d": 36,
    "1wk": 24,
  };

  return limits[timeframe] || 60;
}

function getActiveStructureEvent(structureEvent, candles, timeframe) {
  if (!structureEvent || !Array.isArray(candles) || candles.length === 0) {
    return null;
  }

  const lastIndex = candles.length - 1;
  const breakAgeBars = lastIndex - structureEvent.breakIndex;
  const impulseBars = structureEvent.impulseEndIndex - structureEvent.impulseStartIndex + 1;
  const maxAgeBars = getStructureAgeLimit(timeframe);
  const maxImpulseBars = Math.max(maxAgeBars + 12, 24);

  if (breakAgeBars < 0 || impulseBars <= 0) {
    return null;
  }

  if (breakAgeBars > maxAgeBars || impulseBars > maxImpulseBars) {
    return null;
  }

  return structureEvent;
}

function buildFib(structureEvent, candles) {
  if (!structureEvent) {
    return null;
  }

  let impulseLow = Number.POSITIVE_INFINITY;
  let impulseHigh = Number.NEGATIVE_INFINITY;
  let lowIndex = structureEvent.impulseStartIndex;
  let highIndex = structureEvent.impulseStartIndex;

  for (let index = structureEvent.impulseStartIndex; index <= structureEvent.impulseEndIndex; index += 1) {
    const candle = candles[index];

    if (candle.low <= impulseLow) {
      impulseLow = candle.low;
      lowIndex = index;
    }

    if (candle.high >= impulseHigh) {
      impulseHigh = candle.high;
      highIndex = index;
    }
  }

  const impulseRange = Math.max(impulseHigh - impulseLow, 0.0000001);

  if (structureEvent.direction === "bullish") {
    const l50 = impulseHigh - impulseRange * 0.5;
    const l618 = impulseHigh - impulseRange * 0.618;
    const l705 = impulseHigh - impulseRange * 0.705;
    const l786 = impulseHigh - impulseRange * 0.786;

    return {
      anchorHigh: roundPrice(impulseHigh),
      anchorLow: roundPrice(impulseLow),
      anchorStartPrice: roundPrice(impulseLow),
      anchorStartTime: candles[structureEvent.impulseStartIndex]?.time || candles[lowIndex]?.time,
      anchorEndPrice: roundPrice(impulseHigh),
      anchorEndTime: candles[structureEvent.impulseEndIndex]?.time || candles[highIndex]?.time,
      direction: "bullish",
      entryZone: {
        high: roundPrice(Math.max(l50, l705)),
        low: roundPrice(Math.min(l50, l705)),
      },
      extension1272: roundPrice(impulseHigh + impulseRange * 0.272),
      invalidation: roundPrice(l786),
      levels: {
        "0.5": roundPrice(l50),
        "0.618": roundPrice(l618),
        "0.705": roundPrice(l705),
        "0.786": roundPrice(l786),
      },
    };
  }

  const l50 = impulseLow + impulseRange * 0.5;
  const l618 = impulseLow + impulseRange * 0.618;
  const l705 = impulseLow + impulseRange * 0.705;
  const l786 = impulseLow + impulseRange * 0.786;

  return {
    anchorHigh: roundPrice(impulseHigh),
    anchorLow: roundPrice(impulseLow),
    anchorStartPrice: roundPrice(impulseHigh),
    anchorStartTime: candles[structureEvent.impulseStartIndex]?.time || candles[highIndex]?.time,
    anchorEndPrice: roundPrice(impulseLow),
    anchorEndTime: candles[structureEvent.impulseEndIndex]?.time || candles[lowIndex]?.time,
    direction: "bearish",
    entryZone: {
      high: roundPrice(Math.max(l50, l705)),
      low: roundPrice(Math.min(l50, l705)),
    },
    extension1272: roundPrice(impulseLow - impulseRange * 0.272),
    invalidation: roundPrice(l786),
    levels: {
      "0.5": roundPrice(l50),
      "0.618": roundPrice(l618),
      "0.705": roundPrice(l705),
      "0.786": roundPrice(l786),
    },
  };
}

function findOriginZone(candles, structureEvent) {
  if (!structureEvent) {
    return null;
  }

  const start = structureEvent.impulseStartIndex;
  const end = structureEvent.impulseEndIndex;
  const isBullish = structureEvent.direction === "bullish";
  let zoneCandle = null;

  for (let index = end; index >= start; index -= 1) {
    const candle = candles[index];
    const bearish = candle.close < candle.open;
    const bullish = candle.close > candle.open;

    if ((isBullish && bearish) || (!isBullish && bullish)) {
      zoneCandle = {
        ...candle,
        index,
      };
      break;
    }
  }

  if (!zoneCandle) {
    zoneCandle = {
      ...candles[start],
      index: start,
    };
  }

  return {
    candleIndex: zoneCandle.index,
    high: roundPrice(Math.max(zoneCandle.open, zoneCandle.close)),
    low: roundPrice(Math.min(zoneCandle.open, zoneCandle.close)),
    time: zoneCandle.time,
    type: isBullish ? "Demand" : "Supply",
  };
}

function zoneOverlap(a, b) {
  if (!a || !b) {
    return false;
  }

  return Math.max(a.low, b.low) <= Math.min(a.high, b.high);
}

function detectFvgs(candles, direction) {
  const fvgs = [];

  for (let index = 1; index < candles.length - 1; index += 1) {
    const left = candles[index - 1];
    const right = candles[index + 1];

    if (direction === "bullish" && left.high < right.low) {
      fvgs.push({
        direction,
        endTime: right.time,
        high: roundPrice(right.low),
        index,
        low: roundPrice(left.high),
        startTime: left.time,
      });
    }

    if (direction === "bearish" && left.low > right.high) {
      fvgs.push({
        direction,
        endTime: right.time,
        high: roundPrice(left.low),
        index,
        low: roundPrice(right.high),
        startTime: left.time,
      });
    }
  }

  return fvgs;
}

function selectFvg(fvgs, fib, originZone, structureEvent) {
  if (!fib || !structureEvent) {
    return null;
  }

  const fibZone = fib.entryZone;
  const candidates = fvgs.filter(
    (item) =>
      item.index >= Math.max(0, structureEvent.impulseStartIndex - 1) &&
      item.index <= structureEvent.breakIndex &&
      zoneOverlap(item, fibZone) &&
      zoneOverlap(item, originZone)
  );

  return candidates.length ? candidates[candidates.length - 1] : null;
}

function getRsiAtIndex(rsiSeries, candlesLength, index) {
  const offset = candlesLength - rsiSeries.length;
  const seriesIndex = index - offset;

  if (seriesIndex < 0 || seriesIndex >= rsiSeries.length) {
    return null;
  }

  return rsiSeries[seriesIndex];
}

function getRsiConfirmation(rsiSeries, candlesLength, swings, direction) {
  const lastValues = rsiSeries.slice(-5);
  const latestRsi = lastValue(rsiSeries) || 50;
  const crossed50Bullish = lastValues.length >= 2 && lastValues[lastValues.length - 2] < 50 && latestRsi > 50;
  const crossed50Bearish = lastValues.length >= 2 && lastValues[lastValues.length - 2] > 50 && latestRsi < 50;
  let divergence = false;

  if (direction === "bullish" && swings.lows.length >= 2) {
    const previous = swings.lows[swings.lows.length - 2];
    const latest = swings.lows[swings.lows.length - 1];
    const previousRsi = getRsiAtIndex(rsiSeries, candlesLength, previous.index);
    const latestRsiSwing = getRsiAtIndex(rsiSeries, candlesLength, latest.index);
    divergence = latest.value < previous.value && latestRsiSwing != null && previousRsi != null && latestRsiSwing > previousRsi;
  }

  if (direction === "bearish" && swings.highs.length >= 2) {
    const previous = swings.highs[swings.highs.length - 2];
    const latest = swings.highs[swings.highs.length - 1];
    const previousRsi = getRsiAtIndex(rsiSeries, candlesLength, previous.index);
    const latestRsiSwing = getRsiAtIndex(rsiSeries, candlesLength, latest.index);
    divergence = latest.value > previous.value && latestRsiSwing != null && previousRsi != null && latestRsiSwing < previousRsi;
  }

  const crossed50 = direction === "bullish" ? crossed50Bullish : crossed50Bearish;

  return {
    crossed50,
    divergence,
    label: divergence
      ? `${direction === "bullish" ? "Bullish" : "Bearish"} RSI divergence`
      : crossed50
        ? `RSI crossed ${direction === "bullish" ? "above" : "below"} 50`
        : "RSI confirmation pending",
    score: divergence || crossed50 ? 100 : 35,
  };
}

function buildSetup({ candles, confidence, confirmations, direction, entry, grade, invalidation, isSniperEntry, label, notes, stopLoss, summary, takeProfit1, takeProfit2, timing, triggerType }) {
  const roundedEntry = roundPrice(entry);
  const roundedStopLoss = roundPrice(stopLoss);
  const roundedTp1 = roundPrice(takeProfit1);
  const roundedTp2 = roundPrice(takeProfit2);
  const risk = direction === "Long" ? roundedEntry - roundedStopLoss : roundedStopLoss - roundedEntry;
  const reward = direction === "Long" ? roundedTp1 - roundedEntry : roundedEntry - roundedTp1;

  return {
    confidence,
    confirmations: confirmations || null,
    direction,
    entry: roundedEntry,
    grade,
    invalidation,
    isSniperEntry: Boolean(isSniperEntry),
    label,
    notes,
    riskReward: risk > 0 && reward > 0 ? Number((reward / risk).toFixed(2)) : null,
    stopLoss: roundedStopLoss,
    summary,
    takeProfit1: roundedTp1,
    takeProfit2: roundedTp2,
    timing,
    triggerType,
    visuals: {
      markers: [
        {
          color: direction === "Long" ? "#60d6bf" : "#ff866d",
          position: direction === "Long" ? "belowBar" : "aboveBar",
          shape: direction === "Long" ? "arrowUp" : "arrowDown",
          text: `${label} ${direction === "Long" ? "buy" : "sell"}`,
          time: candles[candles.length - 1].time,
        },
      ],
      priceLines: [
        { color: direction === "Long" ? "#60d6bf" : "#ff866d", label: `${label} Entry`, value: roundedEntry },
        { color: "#f1c17b", label: `${label} Stop`, value: roundedStopLoss },
        { color: "#9df39b", label: `${label} TP1`, value: roundedTp1 },
        { color: "#cbffc3", label: `${label} TP2`, value: roundedTp2 },
      ],
    },
  };
}

function buildSetups(context) {
  const { atr, bias, candles, fib, nearestResistance, nearestSupport, originZone, range, rsiConfirmation, selectedFvg, structureEvent, timeframe } = context;

  if (!fib || !originZone || !structureEvent) {
    return [];
  }

  const lowerTf = isLowerTimeframe(timeframe);
  const stopAtrMultiplier = getStopAtrMultiplier(timeframe);

  const isBullish = bias === "Bullish structure";
  const direction = isBullish ? "Long" : "Short";
  const entryLow = Math.max(fib.entryZone.low, originZone.low, selectedFvg ? selectedFvg.low : -Infinity);
  const entryHigh = Math.min(fib.entryZone.high, originZone.high, selectedFvg ? selectedFvg.high : Infinity);
  const hasTightConfluence = Number.isFinite(entryLow) && Number.isFinite(entryHigh) && entryLow <= entryHigh;
  const entry = hasTightConfluence ? (entryLow + entryHigh) / 2 : (fib.entryZone.low + fib.entryZone.high) / 2;
  const invalidationBase = fib.invalidation;
  const stopLoss = isBullish
    ? Math.min(invalidationBase, originZone.low - atr * stopAtrMultiplier)
    : Math.max(invalidationBase, originZone.high + atr * stopAtrMultiplier);
  const impulseRange = Math.max(fib.anchorHigh - fib.anchorLow, 0.0000001);
  const tp1 = isBullish ? Math.max(structureEvent.breakLevel, range.midpoint, nearestResistance) : Math.min(structureEvent.breakLevel, range.midpoint, nearestSupport);
  const tp2 = isBullish ? fib.anchorHigh + impulseRange * 0.272 : fib.anchorLow - impulseRange * 0.272;

  // "Sniper" confirmations: the pieces that matter most for a precise, low-drawdown entry.
  const hasRsiConfirmation = rsiConfirmation.score >= 100;
  const isBos = structureEvent.type === "BOS";
  const stackedConfirmations = [isBos, Boolean(selectedFvg), hasRsiConfirmation, hasTightConfluence].filter(Boolean).length;

  let confidenceScore = clamp(
    45 +
      (isBos ? 10 : 6) +
      (originZone ? 10 : 0) +
      (fib ? 10 : 0) +
      (selectedFvg ? 12 : 0) +
      (hasRsiConfirmation ? 10 : 0) +
      (hasTightConfluence ? 6 : 0),
    40,
    96
  );

  // On lower timeframes, noise is higher and stops are tighter, so a setup only
  // earns High/A-grade "sniper" status when every confirmation stacks. Anything
  // less gets capped down rather than silently treated the same as an HTF setup.
  const requiredStack = lowerTf ? 4 : 3;
  if (lowerTf && stackedConfirmations < requiredStack) {
    confidenceScore = clamp(confidenceScore - 14, 30, 96);
  }

  const confidence = confidenceScore >= (lowerTf ? 84 : 78) ? "High" : confidenceScore >= 62 ? "Medium" : "Low";
  const grade = confidenceScore >= (lowerTf ? 88 : 82) ? "A" : confidenceScore >= 68 ? "B" : "C";
  const isSniperEntry = lowerTf && grade === "A" && stackedConfirmations === requiredStack;
  const setupLabel = isSniperEntry ? "Sniper confluence entry" : selectedFvg ? "Confluence retracement" : "Fib retracement";
  const confirmations = {
    required: requiredStack,
    stacked: stackedConfirmations,
    breakdown: [
      { label: "Break of structure", met: isBos },
      { label: "Fair value gap", met: Boolean(selectedFvg) },
      { label: "RSI confirmation", met: hasRsiConfirmation },
      { label: "Tight zone overlap", met: hasTightConfluence },
    ],
  };
  const summary = `${structureEvent.type} ${isBullish ? "bullish" : "bearish"} structure leads the idea. We want price back in the Fib 0.5-0.705 zone, inside ${originZone.type.toLowerCase()}, with RSI confirming the rejection.${isSniperEntry ? " All confirmations are stacked — this is a high-precision entry, not just a directional one." : ""}`;
  const notes = [
    `${structureEvent.type} sets the directional bias, so this stays ${isBullish ? "buy-only" : "sell-only"}.`,
    `${originZone.type} is refined from the last ${isBullish ? "bearish" : "bullish"} candle body before the break.`,
    selectedFvg
      ? `FVG sits inside the Fib execution zone, which sharpens the entry area.`
      : `No clean FVG inside the Fib zone, so this setup is less compressed.`,
    rsiConfirmation.label,
    lowerTf
      ? `LTF stop uses a tighter ${stopAtrMultiplier}x ATR buffer for precision — expect more stop-outs on noise if you skip confirmation.`
      : null,
    lowerTf && !isSniperEntry
      ? `Not all sniper confirmations stacked (${stackedConfirmations}/${requiredStack}) — treat this as lower-conviction until they do.`
      : null,
  ].filter(Boolean);

  return [
    buildSetup({
      candles,
      confidence,
      confirmations,
      direction,
      entry,
      grade,
      invalidation: `${isBullish ? "Below" : "Above"} Fib 0.786 (${roundPrice(fib.invalidation)}) invalidates the setup`,
      isSniperEntry,
      label: setupLabel,
      notes,
      stopLoss,
      summary,
      takeProfit1: tp1,
      takeProfit2: tp2,
      timing: hasTightConfluence ? "Best inside the overlapping Fib / zone / FVG pocket" : "Best inside the Fib zone after a clear rejection",
      triggerType: `${structureEvent.type} retracement`,
    }),
    buildSetup({
      candles,
      confidence: selectedFvg ? "Medium" : "Low",
      direction,
      entry: isBullish ? fib.levels["0.618"] : fib.levels["0.618"],
      grade: selectedFvg ? "B" : "C",
      invalidation: `${isBullish ? "Below" : "Above"} ${roundPrice(fib.invalidation)} invalidates continuation`,
      label: selectedFvg ? "FVG midpoint entry" : "Deep Fib confirmation",
      notes: [
        selectedFvg ? "Use the midpoint of the aligned FVG only if price rejects the zone cleanly." : "Without a clean FVG, wait for stronger price action confirmation.",
        `RSI rule: divergence or a 50-line cross should support the direction.`,
      ],
      stopLoss,
      summary: selectedFvg
        ? `Secondary entry plan using the aligned FVG as the final refinement inside the Fibonacci pocket.`
        : `Secondary plan only if price taps deeper into the Fib pocket and still respects the structure invalidation.`,
      takeProfit1: tp1,
      takeProfit2: tp2,
      timing: selectedFvg ? "Best at FVG midpoint after rejection" : "Best after rejection from deep retracement",
      triggerType: selectedFvg ? "FVG refinement" : "Deep retracement",
    }),
  ];
}

function buildNarrative({ bias, breakoutPressure, latestClose, nearestResistance, nearestSupport, pattern, regime, rsi, macdHistogram, setups, stretchState, structure, smc }) {
  return [
    `Bias: ${bias} (${smc.premiumDiscount}). ${structure.sequence} is the active swing template.`,
    `SMC: Internal structure is ${smc.internalStructure}. ${smc.bos.length ? "BOS detected." : ""} ${smc.choch.length ? "CHOCH detected." : ""}`,
    `Price is ${roundPrice(latestClose)} with RSI at ${rsi.toFixed(2)}. ${smc.fib ? `Execution pocket is ${roundPrice(smc.fib.level05)} to ${roundPrice(smc.fib.level0705)}.` : ""}`,
    `Supply / demand is refined to candle bodies only. ${smc.fvgs.length ? "An aligned FVG is available for refinement." : "No aligned FVG sits inside the Fib pocket yet."}`,
    `RSI confirmation: ${smc.rsiConfirmation || "Pending"}.`,
    `Regime: ${regime.marketState}, ${regime.volatilityState.toLowerCase()}, and ${breakoutPressure.state.toLowerCase()}.`,
    `Latest pattern: ${pattern}. Stretch state: ${stretchState}.`,
    `Key zones: ${smc.demandZones.length ? 'Demand zone identified' : 'Support at ' + roundPrice(nearestSupport)}, ${smc.supplyZones.length ? 'Supply zone identified' : 'Resistance at ' + roundPrice(nearestResistance)}.`,
    setups[0] ? `Primary plan: ${setups[0].summary}` : "No primary plan yet.",
    "Treat this as structured market context, not financial advice.",
  ];
}

async function analyzeCandles(candles, marketInfo = {}) {
  const closes = candles.map((item) => item.close);
  const highs = candles.map((item) => item.high);
  const lows = candles.map((item) => item.low);
  const latestClose = lastValue(closes);
  const ema20Series = EMA.calculate({ period: 20, values: closes });
  const ema50Series = EMA.calculate({ period: 50, values: closes });
  const ema200Series = EMA.calculate({ period: 200, values: closes });
  const rsiSeries = RSI.calculate({ period: 14, values: closes });
  const atrSeries = ATR.calculate({ close: closes, high: highs, low: lows, period: 14 });
  const macdSeries = MACD.calculate({
    SimpleMAOscillator: false,
    SimpleMASignal: false,
    fastPeriod: 12,
    signalPeriod: 9,
    slowPeriod: 26,
    values: closes,
  });
  const adxSeries = ADX.calculate({
    period: 14,
    high: highs,
    low: lows,
    close: closes
  });
  const bollingerSeries = BollingerBands.calculate({ period: 20, stdDev: 2, values: closes });
  const ema20 = lastValue(ema20Series) || latestClose;
  const ema50 = lastValue(ema50Series) || ema20;
  const ema200 = lastValue(ema200Series) || ema50;
  const rsi = lastValue(rsiSeries) || 50;
  const adx = lastValue(adxSeries) || { adx: 0, pdi: 0, mdi: 0 };
  const atr = lastValue(atrSeries) || latestClose * 0.002;
  const macd = lastValue(macdSeries) || { histogram: 0, MACD: 0, signal: 0 };
  const bollinger = lastValue(bollingerSeries) || { lower: latestClose, middle: latestClose, upper: latestClose };
  const swingWindowStart = Math.max(0, candles.length - 180);
  const swings = detectSwingPoints(candles.slice(swingWindowStart), 3, swingWindowStart);
  const structure = evaluateStructure(swings);
  const range = evaluateRange(candles, latestClose);
  structure.rangeLocationPercent = range.locationPercent;
  const supports = swings.lows.map((item) => item.value).filter((value) => value < latestClose);
  const resistances = swings.highs.map((item) => item.value).filter((value) => value > latestClose);
  const nearestSupport = supports.length ? Math.max(...supports) : Math.min(...lows.slice(-40));
  const nearestResistance = resistances.length ? Math.min(...resistances) : Math.max(...highs.slice(-40));
  const pattern = detectAdvancedPatterns(candles.slice(-10));
  const divergence = detectDivergence(candles, rsiSeries);
  const volatility = evaluateVolatility(bollingerSeries, atr, latestClose);
  const rawStructureEvent = findStructureEvent(candles, swings, structure.biasHint);
  const structureEvent = getActiveStructureEvent(rawStructureEvent, candles, marketInfo.timeframe);
  const directionKey = structureEvent
    ? structureEvent.direction
    : structure.biasHint === "Bullish structure"
      ? "bullish"
      : structure.biasHint === "Bearish structure"
        ? "bearish"
        : "neutral";
  const fib = buildFib(structureEvent, candles);
  const originZone = findOriginZone(candles, structureEvent);
  const rawFvgs = directionKey === "neutral" ? [] : detectFvgs(candles, directionKey);
  const selectedFvg = structureEvent ? selectFvg(rawFvgs, fib, originZone, structureEvent) : null;
  const rsiConfirmation = directionKey === "neutral"
    ? { crossed50: false, divergence: false, label: "RSI confirmation pending", score: 35 }
    : getRsiConfirmation(rsiSeries, candles.length, swings, directionKey);
  const smc = {
    bos: structureEvent && structureEvent.type === "BOS"
      ? [{
          direction: directionKey === "bullish" ? "Bullish" : "Bearish",
          time: candles[structureEvent.breakIndex].time,
          type: "BOS",
          value: roundPrice(structureEvent.breakLevel),
        }]
      : [],
    choch: structureEvent && structureEvent.type === "CHOCH"
      ? [{
          direction: directionKey === "bullish" ? "Bullish" : "Bearish",
          time: candles[structureEvent.breakIndex].time,
          type: "CHOCH",
          value: roundPrice(structureEvent.breakLevel),
        }]
      : [],
    demandZones: originZone && originZone.type === "Demand" ? [originZone] : [],
    fib: fib ? {
      level0: directionKey === "bullish" ? fib.anchorHigh : fib.anchorLow,
      level05: fib.levels["0.5"],
      level0618: fib.levels["0.618"],
      level0705: fib.levels["0.705"],
      level0786: fib.levels["0.786"],
      level1: directionKey === "bullish" ? fib.anchorLow : fib.anchorHigh,
      zone: directionKey === "bullish" ? "Discount" : "Premium",
    } : null,
    fvgs: (selectedFvg ? [selectedFvg] : rawFvgs.slice(-3)).map((item) => ({
      ...item,
      bottom: item.low,
      top: item.high,
      type: item.direction === "bullish" ? "Bullish" : "Bearish",
    })),
    internalStructure: structureEvent ? `${structureEvent.type} ${directionKey}` : structure.biasHint,
    premiumDiscount: fib
      ? directionKey === "bullish"
        ? latestClose <= fib.levels["0.5"] ? "Discount" : "Premium"
        : latestClose >= fib.levels["0.5"] ? "Premium" : "Discount"
      : "Neutral",
    rsiConfirmation: rsiConfirmation.label,
    selectedFvg: selectedFvg || null,
    supplyZones: originZone && originZone.type === "Supply" ? [originZone] : [],
  };
  const slopeRaw = ema20Series.length > 5 ? ema20Series[ema20Series.length - 1] - ema20Series[ema20Series.length - 6] : 0;
  let trendScore = 50;
  trendScore += latestClose > ema20 ? 10 : -10;
  trendScore += ema20 > ema50 ? 12 : -12;
  trendScore += ema50 > ema200 ? 7 : -7;
  trendScore += structure.biasHint === "Bullish structure" ? 12 : structure.biasHint === "Bearish structure" ? -12 : 0;
  trendScore += rsi > 54 && rsi < 74 ? 6 : rsi < 46 && rsi > 26 ? -6 : 0;
  trendScore += macd.histogram > 0 ? 8 : macd.histogram < 0 ? -8 : 0;
  trendScore += pattern === "Bullish rejection" || pattern === "Bullish engulfing" ? 5 : pattern === "Bearish rejection" || pattern === "Bearish engulfing" ? -5 : 0;
  trendScore += clamp((slopeRaw / Math.max(atr, 0.0000001)) * 10, -10, 10);
  trendScore = clamp(Math.round(trendScore), 0, 100);
  let momentumScore = 50 + clamp((rsi - 50) * 1.5, -18, 18) + clamp(macd.histogram * 650, -18, 18);
  momentumScore += range.locationPercent >= 70 && rsi > 55 ? 8 : range.locationPercent <= 30 && rsi < 45 ? -8 : 0;
  momentumScore = clamp(Math.round(momentumScore), 0, 100);
  let breakoutScore = 50;
  breakoutScore += volatility.state === "Compression" ? 8 : 0;
  breakoutScore += range.locationPercent >= 72 ? 12 : range.locationPercent <= 28 ? -12 : 0;
  breakoutScore += clamp((momentumScore - 50) * 0.45, -14, 14);
  breakoutScore += clamp((trendScore - 50) * 0.35, -12, 12);
  breakoutScore = clamp(Math.round(breakoutScore), 0, 100);
  const structureScore = clamp(Math.round(structure.quality * 0.55 + (structure.biasHint !== "Neutral structure" ? 25 : 0)), 0, 100);
  const timingScore = clamp(Math.round(50 + (pattern === "Inside bar" ? 6 : 0) + (pattern.includes("rejection") || pattern.includes("engulfing") ? 10 : 0) + (volatility.state === "Compression" ? 8 : 0)), 0, 100);
  const volatilityScore = clamp(Math.round(50 + (volatility.state === "Expansion" ? 10 : 0) + (volatility.state === "Compression" ? 6 : 0) - Math.abs(volatility.widthRatio - 1) * 12), 0, 100);
  const confluence = clamp(Math.round(trendScore * 0.3 + momentumScore * 0.2 + structureScore * 0.2 + timingScore * 0.15 + clamp(100 - Math.abs(breakoutScore - 50) * 1.4, 0, 100) * 0.15), 12, 98);
  const bias = directionKey === "bullish"
    ? "Bullish structure"
    : directionKey === "bearish"
      ? "Bearish structure"
      : trendScore >= 62 && structure.biasHint !== "Bearish structure"
        ? "Bullish structure"
        : trendScore <= 38 && structure.biasHint !== "Bullish structure"
          ? "Bearish structure"
          : structure.biasHint;
  const stretchState = latestClose > bollinger.upper ? "Overextended upside" : latestClose < bollinger.lower ? "Overextended downside" : "Inside expected volatility";
  const breakoutPressure = {
    score: breakoutScore,
    state: breakoutScore >= 60 ? "Bullish breakout pressure" : breakoutScore <= 40 ? "Bearish breakout pressure" : "Two-sided / neutral",
  };
  const regime = {
    breakoutPressure: breakoutPressure.state,
    marketState: volatility.state === "Compression" ? "Compression / breakout watch" : bias === "Neutral structure" ? "Range / rotation" : "Trend continuation",
    trendState: trendScore >= 62 ? "Bullish trend" : trendScore <= 38 ? "Bearish trend" : "Balanced / sideways",
    volatilityState: volatility.state,
  };
  const supportZoneSize = atr * 0.45;
  const resistanceZoneSize = supportZoneSize;
  const supportZone = { high: roundPrice(nearestSupport + supportZoneSize), low: roundPrice(nearestSupport - supportZoneSize) };
  const resistanceZone = { high: roundPrice(nearestResistance + resistanceZoneSize), low: roundPrice(nearestResistance - resistanceZoneSize) };
  const setups = buildSetups({
    atr,
    bias,
    candles,
    fib,
    nearestResistance,
    nearestSupport,
    originZone,
    range,
    rsiConfirmation,
    selectedFvg,
    structureEvent,
    timeframe: marketInfo.timeframe,
  });
  const chartAnnotations = buildChartAnnotations({
    atr,
    candles,
    fib,
    originZone,
    selectedFvg,
    structureEvent,
  });
  const markers = [];
  const lineOverlays = [
    ...(fib ? [
      buildSegmentOverlay(
        "Fib impulse",
        [
          { time: fib.anchorStartTime, value: fib.anchorStartPrice },
          { time: fib.anchorEndTime, value: fib.anchorEndPrice },
        ],
        "rgba(127, 139, 163, 0.65)",
        "dashed",
        1
      ),
    ] : []),
    ...(smc.fib ? [
      buildTimedHorizontalOverlay("Fib 0", smc.fib.level0, chartAnnotations.fibStartTime, chartAnnotations.rightTime, "rgba(107, 114, 128, 0.6)", "dashed", 1),
      buildTimedHorizontalOverlay("Fib 0.5", smc.fib.level05, chartAnnotations.fibStartTime, chartAnnotations.rightTime, "rgba(62, 165, 92, 0.68)", "solid", 1),
      buildTimedHorizontalOverlay("Fib 0.618", smc.fib.level0618, chartAnnotations.fibStartTime, chartAnnotations.rightTime, "rgba(197, 138, 20, 0.82)", "solid", 1),
      buildTimedHorizontalOverlay("Fib 0.705", smc.fib.level0705, chartAnnotations.fibStartTime, chartAnnotations.rightTime, "rgba(197, 138, 20, 0.82)", "solid", 1),
      buildTimedHorizontalOverlay("Fib 0.786", smc.fib.level0786, chartAnnotations.fibStartTime, chartAnnotations.rightTime, "rgba(180, 83, 9, 0.72)", "solid", 1),
      buildTimedHorizontalOverlay("Fib 1", smc.fib.level1, chartAnnotations.fibStartTime, chartAnnotations.rightTime, "rgba(107, 114, 128, 0.6)", "dashed", 1),
    ] : []),
    ...chartAnnotations.structureLines,
  ].filter(Boolean);
  const priceLines = [];
  const thesis = bias === "Bullish structure"
    ? "Bullish structure remains intact. Favor continuation or accepted breakout behavior while support holds."
    : bias === "Bearish structure"
      ? "Bearish structure remains intact. Favor continuation or accepted breakdown behavior while resistance holds."
      : "The market is less directional here, so confirmation matters more than activity.";

  const checklist = [
    `1. Structure: ${smc.bos.length ? "BOS" : smc.choch.length ? "CHOCH" : "No fresh structural break"} driving ${bias}.`,
    `2. Location: ${originZone ? `${originZone.type} body ${originZone.low} to ${originZone.high}` : "No refined supply or demand body yet"}.`,
    `3. Fibonacci: ${smc.fib ? `0.5 to 0.705 execution zone with 0.786 invalidation at ${smc.fib.level0786}` : "No impulse Fib drawn yet"}.`,
    `4. FVG: ${smc.fvgs.length ? "Aligned FVG available inside the setup area." : "No aligned FVG in the execution pocket."}`,
    `5. RSI: ${smc.rsiConfirmation}.`,
  ];
  const narrative = buildNarrative({
    bias,
    breakoutPressure,
    latestClose,
    nearestResistance,
    nearestSupport,
    pattern,
    regime,
    rsi,
    macdHistogram: macd.histogram,
    setups,
    stretchState,
    structure,
    smc,
  });
  const baseAnalysis = {
    bias,
    aiAnalysis: thesis,
    checklist,
    confidence: confluence,
    indicators: {
      adx: Number(adx.adx.toFixed(2)),
      atr14: roundPrice(atr),
      atrPercent: volatility.atrPercent,
      bollingerBandwidthPercent: volatility.bandwidthPercent,
      bollingerLower: roundPrice(bollinger.lower),
      bollingerMiddle: roundPrice(bollinger.middle),
      bollingerUpper: roundPrice(bollinger.upper),
      divergence: rsiConfirmation.divergence ? rsiConfirmation.label : divergence,
      ema20: roundPrice(ema20),
      ema50: roundPrice(ema50),
      ema200: roundPrice(ema200),
      macdHistogram: Number(macd.histogram.toFixed(5)),
      macdSignal: Number(macd.signal.toFixed(5)),
      macdValue: Number(macd.MACD.toFixed(5)),
      nearestResistance: roundPrice(nearestResistance),
      nearestSupport: roundPrice(nearestSupport),
      pattern,
      rangeHigh: range.high,
      rangeLocationPercent: range.locationPercent,
      rangeLow: range.low,
      rangeMidpoint: range.midpoint,
      resistanceZone,
      rsi14: Number(rsi.toFixed(2)),
      supportZone,
      smc,
    },
    insights: {
      breakoutPressure: breakoutPressure.state,
      liquidityEvent: smc.fvgs.length ? `${smc.fvgs[0].type} FVG aligned` : "No aligned FVG",
      stretchState,
      thesis,
    },
    momentum: momentumScore >= 62 ? "Bullish momentum" : momentumScore <= 38 ? "Bearish momentum" : "Balanced momentum",
    narrative,
    regime,
    scorecard: {
      confluence,
      momentum: momentumScore,
      structure: structureScore,
      timing: timingScore,
      trend: trendScore,
      volatility: volatilityScore,
    },
    setups,
    structure,
    visuals: {
      annotations: {
        legend: chartAnnotations.legend,
        labels: chartAnnotations.labels,
        regions: chartAnnotations.regions,
      },
      ema20: toLinePoints(candles, ema20Series),
      ema50: toLinePoints(candles, ema50Series),
      ema200: toLinePoints(candles, ema200Series),
      lineOverlays,
      markers,
      priceLines,
    },
  };

  let ai;

  if (marketInfo.skipRemoteAi) {
    const previousAi = marketInfo.previousAi && typeof marketInfo.previousAi === "object"
      ? marketInfo.previousAi
      : null;
    const fallbackAi = fallbackAiReport(baseAnalysis);

    ai = previousAi
      ? {
          ...previousAi,
          confidenceLabel: previousAi.confidenceLabel || fallbackAi.confidenceLabel,
          confluence: {
            ...fallbackAi.confluence,
            ...(previousAi.confluence || {}),
          },
          directionalBias: previousAi.directionalBias || fallbackAi.directionalBias,
          entryPlan: {
            ...fallbackAi.entryPlan,
            ...(previousAi.entryPlan || {}),
          },
          invalidations: Array.isArray(previousAi.invalidations) && previousAi.invalidations.length
            ? previousAi.invalidations
            : fallbackAi.invalidations,
          marketState: previousAi.marketState || fallbackAi.marketState,
          nextActions: Array.isArray(previousAi.nextActions) && previousAi.nextActions.length
            ? previousAi.nextActions
            : fallbackAi.nextActions,
          oneLineCall: previousAi.oneLineCall || fallbackAi.oneLineCall,
          provider: previousAi.provider || fallbackAi.provider,
          raw: previousAi.raw || fallbackAi.raw,
          riskFlags: Array.isArray(previousAi.riskFlags) && previousAi.riskFlags.length
            ? previousAi.riskFlags
            : fallbackAi.riskFlags,
          shouldTrade: typeof previousAi.shouldTrade === "boolean"
            ? previousAi.shouldTrade
            : fallbackAi.shouldTrade,
          thesis: previousAi.thesis || fallbackAi.thesis,
          model: previousAi.model || fallbackAi.model,
        }
      : fallbackAi;
  } else {
    ai = await generateTradingAiReport(baseAnalysis, marketInfo, candles);
  }

  // Fetch news and movement analysis
  let newsData = null;
  let movementData = null;
  let advancedPatterns = null;
  let predictiveData = null;
  let mtfData = null;
  
  try {
    newsData = await newsAnalyzer.fetchMarketNews(marketInfo.symbol, marketInfo.timeframe);
  } catch (error) {
    console.warn(`News analysis failed for ${marketInfo.symbol}:`, error.message);
  }
  
  try {
    movementData = movementAnalyzer.analyzeHistoricalMovements(candles, marketInfo.symbol, marketInfo.timeframe);
  } catch (error) {
    console.warn(`Movement analysis failed for ${marketInfo.symbol}:`, error.message);
  }

  // Advanced analysis
  try {
    advancedPatterns = patternRecognizer.detectPatterns(candles, marketInfo.symbol, marketInfo.timeframe);
  } catch (error) {
    console.warn(`Pattern recognition failed for ${marketInfo.symbol}:`, error.message);
  }

  try {
    predictiveData = await predictor.generateForecast(candles, marketInfo.symbol, marketInfo.timeframe, newsData, movementData);
  } catch (error) {
    console.warn(`Predictive analytics failed for ${marketInfo.symbol}:`, error.message);
  }

  try {
    if (!mtfAnalyzer) {
      const { MultiTimeframeAnalysis } = require("./multiTimeframeAnalysis");
      mtfAnalyzer = new MultiTimeframeAnalysis();
    }
    mtfData = await mtfAnalyzer.analyzeAllTimeframes(marketInfo.symbol, marketInfo.timeframe);
  } catch (error) {
    console.warn(`Multi-timeframe analysis failed for ${marketInfo.symbol}:`, error.message);
  }

  return {
    ...baseAnalysis,
    ai,
    aiAnalysis: ai.oneLineCall || baseAnalysis.aiAnalysis,
    news: newsData,
    movements: movementData,
    advancedPatterns,
    predictive: predictiveData,
    mtf: mtfData
  };
}

module.exports = { analyzeCandles };
