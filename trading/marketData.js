const SEARCH_URL = "https://query1.finance.yahoo.com/v1/finance/search";
const CHART_URL = "https://query1.finance.yahoo.com/v8/finance/chart/";
const REQUEST_HEADERS = {
  "User-Agent": "Mozilla/5.0",
};
const LIVE_QUOTE_RANGE = "1d";
const LIVE_QUOTE_INTERVAL = "1m";

const ALIAS_MAP = {
  AUS200: "^AXJO",
  BTCUSD: "BTC-USD",
  BRENT: "BZ=F",
  ETHUSD: "ETH-USD",
  EURUSD: "EURUSD=X",
  GBPJPY: "GBPJPY=X",
  GOLD: "GC=F",
  NAS100: "NQ=F",
  NASDAQ100: "NQ=F",
  SILVER: "SI=F",
  SOLUSD: "SOL-USD",
  SP500: "ES=F",
  SPX500: "ES=F",
  US100: "NQ=F",
  US30: "YM=F",
  US500: "ES=F",
  USOIL: "CL=F",
  WTI: "CL=F",
  XAGUSD: "SI=F",
  XAUUSD: "GC=F",
  XRPUSD: "XRP-USD",
};

const FIAT_CODES = new Set([
  "AUD",
  "CAD",
  "CHF",
  "CNY",
  "EUR",
  "GBP",
  "HKD",
  "JPY",
  "MXN",
  "NOK",
  "NZD",
  "SEK",
  "SGD",
  "TRY",
  "USD",
  "ZAR",
]);

const CRYPTO_CODES = new Set([
  "ADA",
  "ARB",
  "AVAX",
  "BCH",
  "BNB",
  "BTC",
  "DOGE",
  "DOT",
  "ETH",
  "LINK",
  "LTC",
  "MATIC",
  "NEAR",
  "OP",
  "PEPE",
  "SHIB",
  "SOL",
  "SUI",
  "TRX",
  "UNI",
  "XRP",
]);

const CRYPTO_QUOTES = ["USDT", "USD", "EUR", "GBP", "BTC", "ETH"];

const TIMEFRAME_MAP = {
  "1m": {
    interval: "1m",
    label: "1 Minute",
    range: "1d",
  },
  "5m": {
    interval: "5m",
    label: "5 Minutes",
    range: "5d",
  },
  "15m": {
    interval: "15m",
    label: "15 Minutes",
    range: "5d",
  },
  "30m": {
    aggregate: 2,
    interval: "15m",
    label: "30 Minutes",
    range: "5d",
  },
  "1h": {
    interval: "60m",
    label: "1 Hour",
    range: "1mo",
  },
  "2h": {
    aggregate: 2,
    interval: "60m",
    label: "2 Hours",
    range: "1mo",
  },
  "4h": {
    aggregate: 4,
    interval: "60m",
    label: "4 Hours",
    range: "3mo",
  },
  "6h": {
    aggregate: 6,
    interval: "60m",
    label: "6 Hours",
    range: "3mo",
  },
  "8h": {
    aggregate: 8,
    interval: "60m",
    label: "8 Hours",
    range: "3mo",
  },
  "12h": {
    aggregate: 12,
    interval: "60m",
    label: "12 Hours",
    range: "3mo",
  },
  "1d": {
    interval: "1d",
    label: "1 Day",
    range: "1y",
  },
  "3d": {
    aggregate: 3,
    interval: "1d",
    label: "3 Days",
    range: "1y",
  },
  "1w": {
    interval: "1wk",
    label: "1 Week",
    range: "5y",
  },
  "1wk": {
    interval: "1wk",
    label: "1 Week",
    range: "5y",
  },
  "1M": {
    interval: "1mo",
    label: "1 Month",
    range: "10y",
  },
};

async function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function fetchWithRetry(url, options = {}, retries = 2) {
  let lastError;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await fetch(url, options);
    } catch (error) {
      lastError = error;

      if (attempt === retries) {
        throw lastError;
      }

      await sleep(250 * (attempt + 1));
    }
  }

  throw lastError;
}

function uniqBy(items, keyBuilder) {
  const seen = new Set();

  return items.filter((item) => {
    const key = keyBuilder(item);

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function cleanInput(value) {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "")
    .replace(/\//g, "");
}

function toDisplaySymbol(rawInput, resolvedSymbol) {
  const input = cleanInput(rawInput);

  if (input) {
    return input;
  }

  return resolvedSymbol;
}

function buildIncompleteSymbolError(cleaned) {
  const preferredQuote = FIAT_CODES.has(cleaned) ? "USD" : "USD";
  return new Error(`"${cleaned}" looks incomplete. Use a full symbol like ${cleaned}${preferredQuote} or ${cleaned}JPY.`);
}

function resolveSymbol(input) {
  const cleaned = cleanInput(input);

  if (!cleaned) {
    throw new Error("A symbol or pair is required.");
  }

  if (ALIAS_MAP[cleaned]) {
    return {
      displaySymbol: cleaned,
      providerSymbol: ALIAS_MAP[cleaned],
    };
  }

  if (cleaned.includes("=") || cleaned.includes("^") || cleaned.includes("-") || cleaned.includes(".")) {
    return {
      displaySymbol: cleaned,
      providerSymbol: cleaned,
    };
  }

  if (cleaned.length === 6) {
    const base = cleaned.slice(0, 3);
    const quote = cleaned.slice(3);

    if (FIAT_CODES.has(base) && FIAT_CODES.has(quote)) {
      return {
        displaySymbol: `${base}/${quote}`,
        providerSymbol: `${base}${quote}=X`,
      };
    }

    if (CRYPTO_CODES.has(base) && CRYPTO_QUOTES.includes(quote)) {
      return {
        displaySymbol: `${base}/${quote}`,
        providerSymbol: `${base}-${quote}`,
      };
    }
  }

  for (const quote of CRYPTO_QUOTES) {
    if (cleaned.endsWith(quote)) {
      const base = cleaned.slice(0, cleaned.length - quote.length);

      if (CRYPTO_CODES.has(base)) {
        const normalizedQuote = quote === "USDT" ? "USD" : quote;

        return {
          displaySymbol: `${base}/${quote}`,
          providerSymbol: `${base}-${normalizedQuote}`,
        };
      }
    }
  }

  if (cleaned.length === 3 && (FIAT_CODES.has(cleaned) || CRYPTO_CODES.has(cleaned))) {
    throw buildIncompleteSymbolError(cleaned);
  }

  if (/^[A-Z]{1,5}$/.test(cleaned)) {
    return {
      displaySymbol: cleaned,
      providerSymbol: cleaned,
    };
  }

  return {
    displaySymbol: cleaned,
    providerSymbol: cleaned,
  };
}

function normalizeSearchItem(item) {
  return {
    exchange: item.exchange || item.exchDisp || "",
    name: item.shortname || item.longname || item.symbol,
    symbol: item.symbol,
    type: item.quoteType || "",
  };
}

async function searchSymbols(query) {
  const rawQuery = String(query || "").trim();

  if (!rawQuery) {
    return [];
  }

  const resolved = resolveSymbol(rawQuery);
  const url = new URL(SEARCH_URL);
  url.searchParams.set("q", rawQuery);
  url.searchParams.set("quotesCount", "8");
  url.searchParams.set("newsCount", "0");

  const response = await fetchWithRetry(url, {
    headers: REQUEST_HEADERS,
  });

  if (!response.ok) {
    throw new Error(`Search request failed with ${response.status}.`);
  }

  const payload = await response.json();
  const results = (payload.quotes || []).map(normalizeSearchItem);
  const candidate = {
    exchange: "Resolved",
    name: `Resolved from input "${rawQuery}"`,
    symbol: resolved.providerSymbol,
    type: "resolved",
  };

  return uniqBy([candidate, ...results], (item) => item.symbol).slice(0, 8);
}

function getTimeframeConfig(timeframe) {
  return TIMEFRAME_MAP[timeframe] || TIMEFRAME_MAP["1h"];
}

function aggregateCandles(candles, groupSize) {
  if (!Array.isArray(candles)) {
    console.warn("[aggregateCandles] candles is not an array:", typeof candles, candles);
    return [];
  }
  if (!groupSize || groupSize <= 1) {
    return candles;
  }

  const grouped = [];

  for (let index = 0; index < candles.length; index += groupSize) {
    const batch = candles.slice(index, index + groupSize);

    if (batch.length === 0) {
      continue;
    }

    grouped.push({
      close: batch[batch.length - 1].close,
      high: Math.max(...batch.map((item) => item.high)),
      low: Math.min(...batch.map((item) => item.low)),
      open: batch[0].open,
      time: batch[0].time,
      volume: batch.reduce((total, item) => total + (item.volume || 0), 0),
    });
  }

  return grouped;
}

function parseYahooChart(result) {
  const quote = result.indicators?.quote?.[0];
  const timestamps = result.timestamp || [];

  if (!quote || timestamps.length === 0) {
    return [];
  }

  const candles = [];

  for (let index = 0; index < timestamps.length; index += 1) {
    const open = quote.open?.[index];
    const high = quote.high?.[index];
    const low = quote.low?.[index];
    const close = quote.close?.[index];

    if ([open, high, low, close].some((value) => value == null || Number.isNaN(value))) {
      continue;
    }

    candles.push({
      close: Number(close),
      high: Number(high),
      low: Number(low),
      open: Number(open),
      time: Number(timestamps[index]),
      volume: Number(quote.volume?.[index] || 0),
    });
  }

  return candles;
}

function buildSnapshot(meta, candles) {
  const latest = candles[candles.length - 1];
  const previous = candles[candles.length - 2] || latest;
  const price = Number(meta.regularMarketPrice || latest?.close || 0);
  const previousClose = Number(meta.chartPreviousClose || previous?.close || price);
  const change = price - previousClose;
  const changePercent = previousClose ? (change / previousClose) * 100 : 0;

  return {
    change,
    changePercent,
    currency: meta.currency || "",
    exchangeName: meta.exchangeName || meta.fullExchangeName || "",
    marketState: meta.marketState || "",
    marketTime: Number(meta.regularMarketTime || latest?.time || 0),
    previousClose,
    price,
    shortName: meta.shortName || meta.symbol || "",
  };
}

async function fetchMarketData(input, timeframe = "1h") {
  const resolved = resolveSymbol(input);
  const config = getTimeframeConfig(timeframe);
  const url = new URL(`${CHART_URL}${encodeURIComponent(resolved.providerSymbol)}`);

  url.searchParams.set("interval", config.interval);
  url.searchParams.set("range", config.range);
  url.searchParams.set("includePrePost", "true");

  const response = await fetchWithRetry(url, {
    headers: REQUEST_HEADERS,
  });

  if (!response.ok) {
    throw new Error(`Chart request failed with ${response.status}.`);
  }

  const payload = await response.json();
  const result = payload.chart?.result?.[0];
  const error = payload.chart?.error;

  if (error) {
    throw new Error(error.description || "Unknown chart error.");
  }

  if (!result) {
    throw new Error(`No chart data returned for ${resolved.providerSymbol}.`);
  }

  const rawCandles = parseYahooChart(result);
  const candles = aggregateCandles(rawCandles, config.aggregate || 1);

  if (candles.length < 20) {
    throw new Error(`Not enough data returned for ${resolved.providerSymbol} on ${timeframe}.`);
  }

  return {
    candles,
    displaySymbol: toDisplaySymbol(input, resolved.providerSymbol),
    provider: "Yahoo Finance",
    providerSymbol: resolved.providerSymbol,
    snapshot: buildSnapshot(result.meta || {}, candles),
    updatedAt: Date.now(),
    timeframe: {
      key: timeframe,
      label: config.label,
    },
  };
}

async function fetchLiveSnapshot(input) {
  const resolved = resolveSymbol(input);
  const url = new URL(`${CHART_URL}${encodeURIComponent(resolved.providerSymbol)}`);

  url.searchParams.set("interval", LIVE_QUOTE_INTERVAL);
  url.searchParams.set("range", LIVE_QUOTE_RANGE);
  url.searchParams.set("includePrePost", "true");

  const response = await fetchWithRetry(url, {
    headers: REQUEST_HEADERS,
  });

  if (!response.ok) {
    throw new Error(`Live quote request failed with ${response.status}.`);
  }

  const payload = await response.json();
  const result = payload.chart?.result?.[0];
  const error = payload.chart?.error;

  if (error) {
    throw new Error(error.description || "Unknown live quote error.");
  }

  if (!result) {
    throw new Error(`No live quote data returned for ${resolved.providerSymbol}.`);
  }

  const candles = parseYahooChart(result);
  const tick = candles[candles.length - 1];

  if (!tick) {
    throw new Error(`No live tick returned for ${resolved.providerSymbol}.`);
  }

  return {
    displaySymbol: toDisplaySymbol(input, resolved.providerSymbol),
    provider: "Yahoo Finance",
    providerSymbol: resolved.providerSymbol,
    snapshot: buildSnapshot(result.meta || {}, candles),
    tick,
    updatedAt: Date.now(),
  };
}

module.exports = {
  fetchMarketData,
  fetchLiveSnapshot,
  getTimeframeConfig,
  resolveSymbol,
  searchSymbols,
  TIMEFRAME_MAP,
};
