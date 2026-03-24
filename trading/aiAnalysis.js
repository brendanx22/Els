require("dotenv").config();
const axios = require("axios");
const { NewsAnalyzer, MovementAnalyzer } = require("./newsAnalysis");

const RESPONSE_CACHE = new Map();
const CACHE_TTL_MS = Number.parseInt(process.env.AI_ANALYSIS_CACHE_MS || "45000", 10);

// Initialize analyzers
const newsAnalyzer = new NewsAnalyzer();
const movementAnalyzer = new MovementAnalyzer();
const GEMINI_MODEL_CANDIDATES = [
  process.env.GEMINI_ANALYSIS_MODEL || "gemini-2.5-flash",
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
  "gemini-flash-latest",
  "gemini-2.0-flash",
  "gemini-1.5-flash",
];
let cachedGeminiModel = null;

const GEMINI_REPORT_SCHEMA = {
  type: "object",
  properties: {
    market_state: { type: "string" },
    directional_bias: { type: "string" },
    confidence_label: { type: "string" },
    should_trade: { type: "boolean" },
    one_line_call: { type: "string" },
    thesis: { type: "string" },
    entry_plan: {
      type: "object",
      properties: {
        confirmation: { type: "string" },
        entry_zone: { type: "string" },
        status: { type: "string" },
        stop_logic: { type: "string" },
        target_logic: { type: "string" },
      },
      required: ["confirmation", "entry_zone", "status", "stop_logic", "target_logic"],
    },
    confluence: {
      type: "object",
      properties: {
        fibonacci: { type: "string" },
        fvg: { type: "string" },
        location: { type: "string" },
        rsi: { type: "string" },
        structure: { type: "string" },
      },
      required: ["fibonacci", "fvg", "location", "rsi", "structure"],
    },
    risk_flags: {
      type: "array",
      items: { type: "string" },
    },
    invalidations: {
      type: "array",
      items: { type: "string" },
    },
    next_actions: {
      type: "array",
      items: { type: "string" },
    },
    provider_warnings: {
      type: "array",
      items: { type: "string" },
    },
  },
  required: [
    "market_state",
    "directional_bias",
    "confidence_label",
    "should_trade",
    "one_line_call",
    "thesis",
    "entry_plan",
    "confluence",
    "risk_flags",
    "invalidations",
    "next_actions",
  ],
};

function fallbackAiReport(analysis) {
  const primary = (analysis.setups || [])[0];
  const smc = analysis.indicators?.smc || {};
  const directionalBias =
    analysis.bias === "Bullish structure"
      ? "bullish"
      : analysis.bias === "Bearish structure"
        ? "bearish"
        : "neutral";
  const shouldTrade = Boolean(primary && analysis.confidence >= 55);

  return {
    confidenceLabel:
      analysis.confidence >= 75 ? "high" : analysis.confidence >= 55 ? "medium" : "low",
    confluence: {
      fibonacci: smc.fib
        ? "Execution zone is mapped from the structural impulse."
        : "No valid Fib impulse is active.",
      fvg: smc.fvgs?.length
        ? "Aligned FVG is present inside the execution area."
        : "No aligned FVG sits inside the execution pocket.",
      location:
        smc.demandZones?.length || smc.supplyZones?.length
          ? "Refined candle-body supply or demand is active."
          : "No refined candle-body zone is active.",
      rsi: smc.rsiConfirmation || "RSI confirmation is still pending.",
      structure: smc.internalStructure || analysis.bias,
    },
    directionalBias,
    entryPlan: {
      confirmation: smc.rsiConfirmation || "Wait for RSI confirmation.",
      entryZone: smc.fib
        ? `${smc.fib.level05} to ${smc.fib.level0705}`
        : "No valid Fib entry zone.",
      status: shouldTrade ? "qualified" : primary ? "wait" : "avoid",
      stopLogic: primary ? primary.invalidation : "No valid setup.",
      targetLogic: primary ? `${primary.takeProfit1} then ${primary.takeProfit2}` : "No valid setup.",
    },
    invalidations: [
      smc.fib ? `Fib 0.786 invalidation: ${smc.fib.level0786}` : null,
      primary ? primary.invalidation : null,
    ].filter(Boolean),
    marketState: analysis.regime?.marketState || "range",
    nextActions: analysis.checklist || [],
    oneLineCall: analysis.insights?.thesis || "Wait for cleaner structure and confluence.",
    provider: "deterministic",
    riskFlags: [
      !smc.fvgs?.length ? "Missing FVG compression lowers setup quality." : null,
      analysis.confidence < 55
        ? "Confidence is low, so patience matters."
        : analysis.confidence < 70
          ? "Wait for a cleaner rejection before committing to the setup."
          : "Respect the Fib invalidation before adding size.",
    ].filter(Boolean),
    shouldTrade,
    thesis: analysis.aiAnalysis || analysis.insights?.thesis || "No AI thesis available.",
    model: "local-rules",
    providerWarnings: [],
  };
}

async function buildAiPayload(analysis, marketInfo, candles) {
  const recent = candles.slice(-30);

  // Fetch additional analysis data
  const [newsData, movementData] = await Promise.all([
    newsAnalyzer.fetchMarketNews(marketInfo.symbol, marketInfo.timeframe),
    movementAnalyzer.analyzeHistoricalMovements(candles, marketInfo.symbol, marketInfo.timeframe)
  ]);

  return {
    market: {
      price: candles[candles.length - 1]?.close,
      symbol: marketInfo.symbol || "Unknown",
      timeframe: marketInfo.timeframe || "Unknown",
      timestamp: candles[candles.length - 1]?.time || null,
    },
    recentCandles: recent.map((item) => ({
      c: item.close,
      h: item.high,
      l: item.low,
      o: item.open,
      t: item.time,
      v: item.volume || null,
    })),
    news: newsData,
    movements: movementData,
    strategy: {
      bias: analysis.bias,
      breakoutPressure: analysis.regime?.breakoutPressure,
      checklist: analysis.checklist,
      confidence: analysis.confidence,
      indicators: {
        adx: analysis.indicators?.adx,
        atr14: analysis.indicators?.atr14,
        macdHistogram: analysis.indicators?.macdHistogram,
        pattern: analysis.indicators?.pattern,
        rsi14: analysis.indicators?.rsi14,
      },
      momentum: analysis.momentum,
      narrative: analysis.narrative,
      regime: analysis.regime,
      scorecard: analysis.scorecard,
      setups: analysis.setups,
      smc: analysis.indicators?.smc,
      structure: analysis.structure,
      thesis: analysis.insights?.thesis,
    },
  };
}

function baseSystemPrompt() {
  return [
    "You are an elite trading analyst focused on execution quality and disciplined no-trade decisions.",
    "Return JSON only and do not wrap it in markdown.",
    "Analyze the comprehensive market data including technical indicators, news sentiment, and historical movements.",
    "Reason strictly in this order and never skip the order:",
    "1. News Analysis: Evaluate sentiment, key events, and market impact from news data.",
    "2. Historical Movements: Analyze price action, volatility, momentum, patterns, and trends.",
    "3. Structure using BOS / CHOCH for direction.",
    "4. Supply & Demand for location.",
    "5. Fibonacci from impulse that caused the break for execution zone.",
    "6. Confluence with FVG, RSI, and internal structure.",
    "7. Risk management with invalidation levels and position sizing.",
    "8. Execution plan with entry, stop, and targets.",
    "9. Trade thesis combining all factors: technical, news, and movement analysis.",
    "Prioritize safety over opportunity. Be extremely selective.",
    "Consider news impact and historical patterns in your final decision.",
    "Provide specific invalidation levels and clear entry criteria.",
    "Never invent price levels, zones, confirmations, or scenarios that are not present in the input.",
    "Keep the one_line_call decisive and concise.",
    "Use entry_plan.status values like qualified, wait, avoid, or monitor.",
    "Output valid JSON with these keys:",
    "market_state, directional_bias, confidence_label, should_trade, one_line_call, thesis, entry_plan, confluence, risk_flags, invalidations, next_actions.",
  ].join(" ");
}

function extractJsonCandidate(text) {
  if (!text || typeof text !== "string") {
    return "";
  }

  const trimmed = text.trim().replace(/^```json/i, "").replace(/^```/i, "").replace(/```$/, "").trim();
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");

  if (start !== -1 && end !== -1 && end > start) {
    return trimmed.slice(start, end + 1);
  }

  return trimmed;
}

function safeJsonParse(text) {
  const candidate = extractJsonCandidate(text);

  try {
    return JSON.parse(candidate);
  } catch (_error) {
    return null;
  }
}

function normalizeAiReport(raw, provider, model, fallback) {
  const report = raw && typeof raw === "object" ? raw : {};

  return {
    confidenceLabel: report.confidence_label || fallback.confidenceLabel,
    confluence: {
      fibonacci: report.confluence?.fibonacci || fallback.confluence.fibonacci,
      fvg: report.confluence?.fvg || fallback.confluence.fvg,
      location: report.confluence?.location || fallback.confluence.location,
      rsi: report.confluence?.rsi || fallback.confluence.rsi,
      structure: report.confluence?.structure || fallback.confluence.structure,
    },
    directionalBias: report.directional_bias || fallback.directionalBias,
    entryPlan: {
      confirmation: report.entry_plan?.confirmation || fallback.entryPlan.confirmation,
      entryZone: report.entry_plan?.entry_zone || fallback.entryPlan.entryZone,
      status: report.entry_plan?.status || fallback.entryPlan.status,
      stopLogic: report.entry_plan?.stop_logic || fallback.entryPlan.stopLogic,
      targetLogic: report.entry_plan?.target_logic || fallback.entryPlan.targetLogic,
    },
    invalidations:
      Array.isArray(report.invalidations) && report.invalidations.length
        ? report.invalidations
        : fallback.invalidations,
    marketState: report.market_state || fallback.marketState,
    nextActions:
      Array.isArray(report.next_actions) && report.next_actions.length
        ? report.next_actions
        : fallback.nextActions,
    oneLineCall: report.one_line_call || fallback.oneLineCall,
    provider,
    providerWarnings:
      Array.isArray(report.provider_warnings) && report.provider_warnings.length
        ? report.provider_warnings
        : fallback.providerWarnings || [],
    raw,
    riskFlags:
      Array.isArray(report.risk_flags) && report.risk_flags.length
        ? report.risk_flags
        : fallback.riskFlags,
    shouldTrade:
      typeof report.should_trade === "boolean" ? report.should_trade : fallback.shouldTrade,
    thesis: report.thesis || fallback.thesis,
    model,
  };
}

function buildCacheKey(provider, model, payload) {
  return JSON.stringify({
    market: payload.market,
    model,
    provider,
    setup: payload.strategy?.setups?.[0]?.label || null,
    structure: payload.strategy?.smc?.internalStructure || payload.strategy?.bias,
  });
}

function getCached(key) {
  const entry = RESPONSE_CACHE.get(key);

  if (!entry) {
    return null;
  }

  if (Date.now() - entry.at > CACHE_TTL_MS) {
    RESPONSE_CACHE.delete(key);
    return null;
  }

  return entry.value;
}

function setCached(key, value) {
  RESPONSE_CACHE.set(key, {
    at: Date.now(),
    value,
  });
}

function uniqueModels(models) {
  return [...new Set(models.filter(Boolean).map((model) => String(model).replace(/^models\//, "").trim()))];
}

function getProviderOrder() {
  const preferred = String(process.env.AI_PROVIDER_PREFERENCE || "gemini").trim().toLowerCase();
  return preferred === "openai" ? ["openai", "gemini"] : ["gemini", "openai"];
}

function isRetryableGeminiModelError(error) {
  const status = error.response?.status;
  const message = error.response?.data?.error?.message || error.message || "";
  const normalized = String(message).toLowerCase();

  return status === 404 ||
    status === 429 ||
    normalized.includes("resource_exhausted") ||
    normalized.includes("quota exceeded") ||
    normalized.includes("rate limit") ||
    normalized.includes("not found") ||
    normalized.includes("not supported for generatecontent") ||
    normalized.includes("unexpected model") ||
    normalized.includes("unknown model");
}

function getOpenAiOutputText(response) {
  if (response.data?.output_text) {
    return response.data.output_text;
  }

  const chunks = response.data?.output || [];
  return chunks
    .flatMap((item) => item.content || [])
    .map((item) => item.text || "")
    .join("\n");
}

async function generateOpenAiReport(payload, fallback) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey || apiKey === "your_api_key_here") {
    return null;
  }

  const model = process.env.OPENAI_ANALYSIS_MODEL || "gpt-5.4";
  const cacheKey = buildCacheKey("openai", model, payload);
  const cached = getCached(cacheKey);

  if (cached) {
    return cached;
  }

  const input = JSON.stringify(payload);
  const response = await axios.post(
    "https://api.openai.com/v1/responses",
    {
      model,
      input: [
        {
          role: "system",
          content: [
            {
              type: "input_text",
              text: baseSystemPrompt(),
            },
          ],
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: `Analyze this market packet and respond in JSON only.\n${input}`,
            },
          ],
        },
      ],
      max_output_tokens: 1200,
      reasoning: {
        effort: process.env.OPENAI_REASONING_EFFORT || "medium",
      },
      text: {
        verbosity: process.env.OPENAI_TEXT_VERBOSITY || "medium",
        format: {
          type: "json_object",
        },
      },
    },
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      timeout: 25000,
    }
  );

  const parsed = safeJsonParse(getOpenAiOutputText(response));
  const normalized = normalizeAiReport(parsed, "openai", model, fallback);
  setCached(cacheKey, normalized);
  return normalized;
}

async function generateGeminiReport(payload, fallback) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey === "your_api_key_here") {
    return null;
  }

  const prompt = `Analyze this market packet and respond with JSON that matches the schema.\n${JSON.stringify(payload)}`;
  const candidates = uniqueModels([
    cachedGeminiModel,
    ...GEMINI_MODEL_CANDIDATES,
  ]);
  let lastError = null;

  for (const model of candidates) {
    const cacheKey = buildCacheKey("gemini", model, payload);
    const cached = getCached(cacheKey);

    if (cached) {
      cachedGeminiModel = model;
      return cached;
    }

    try {
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        {
          generationConfig: {
            maxOutputTokens: Number.parseInt(process.env.GEMINI_MAX_OUTPUT_TOKENS || "1200", 10),
            responseJsonSchema: GEMINI_REPORT_SCHEMA,
            responseMimeType: "application/json",
            temperature: Number.parseFloat(process.env.GEMINI_TEMPERATURE || "0.2"),
          },
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          systemInstruction: {
            parts: [
              {
                text: baseSystemPrompt(),
              },
            ],
          },
        },
        {
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": apiKey,
          },
          timeout: 25000,
        }
      );

      const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
      const parsed = safeJsonParse(text);
      const normalized = normalizeAiReport(parsed, "gemini", model, fallback);
      setCached(cacheKey, normalized);
      cachedGeminiModel = model;
      return normalized;
    } catch (error) {
      lastError = error;

      if (isRetryableGeminiModelError(error)) {
        continue;
      }

      throw error;
    }
  }

  throw lastError || new Error("No Gemini model was available for generateContent.");
}

async function generateTradingAiReport(analysis, marketInfo, candles) {
  const fallback = fallbackAiReport(analysis);
  const payload = buildAiPayload(analysis, marketInfo, candles);
  const providerOrder = getProviderOrder();

  for (const provider of providerOrder) {
    try {
      const report = provider === "gemini"
        ? await generateGeminiReport(payload, fallback)
        : await generateOpenAiReport(payload, fallback);

      if (report) {
        return report;
      }
    } catch (error) {
      const label = provider === "gemini" ? "Gemini" : "OpenAI";
      fallback.providerWarnings = [...(fallback.providerWarnings || []), `${label} unavailable: ${error.message}`];
    }
  }

  return fallback;
}

module.exports = {
  fallbackAiReport,
  generateTradingAiReport,
};
