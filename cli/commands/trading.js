const axios = require("axios");
const { MACD, RSI, SMA } = require("technicalindicators");

const ALPHA_VANTAGE_URL = "https://www.alphavantage.co/query";
const STOOQ_QUOTE_URL = "https://stooq.com/q/l/";
const STOOQ_SERIES_URL = "https://stooq.com/q/d/l/";

function getApiKey() {
  return process.env.ALPHAVANTAGE_API_KEY || "demo";
}

function formatPrice(value) {
  if (!Number.isFinite(value)) {
    return "n/a";
  }

  if (value >= 100) {
    return value.toFixed(2);
  }

  if (value >= 1) {
    return value.toFixed(4);
  }

  return value.toFixed(6);
}

function describeRsi(value) {
  if (value >= 70) {
    return "overbought";
  }

  if (value <= 30) {
    return "oversold";
  }

  return "neutral";
}

function isForexSymbol(symbol) {
  return /^[A-Z]{6}$/.test(symbol);
}

function fibonacciLevels(high, low) {
  const range = high - low;

  return {
    "23.6%": high - range * 0.236,
    "38.2%": high - range * 0.382,
    "50.0%": high - range * 0.5,
    "61.8%": high - range * 0.618,
  };
}

function lastValue(values) {
  return values[values.length - 1];
}

function parseCsv(text) {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    return [];
  }

  const headers = lines[0].split(",");

  return lines.slice(1).map((line) => {
    const values = line.split(",");
    const row = {};

    headers.forEach((header, index) => {
      row[header] = values[index];
    });

    return row;
  });
}

function toStooqSymbol(symbol) {
  if (isForexSymbol(symbol)) {
    return symbol.toLowerCase();
  }

  if (symbol.includes(".")) {
    return symbol.toLowerCase();
  }

  if (/^[A-Z]{1,5}$/.test(symbol)) {
    return `${symbol.toLowerCase()}.us`;
  }

  return symbol.toLowerCase();
}

async function requestAlphaVantage(params) {
  const response = await axios.get(ALPHA_VANTAGE_URL, {
    params: {
      apikey: getApiKey(),
      ...params,
    },
    timeout: 15000,
  });

  const payload = response.data;

  if (payload.Note) {
    throw new Error(
      "Alpha Vantage rate limit reached. Try again shortly or set ALPHAVANTAGE_API_KEY."
    );
  }

  if (payload["Error Message"]) {
    throw new Error(payload["Error Message"]);
  }

  if (payload.Information) {
    throw new Error(payload.Information);
  }

  return payload;
}

async function fetchStooqGoldQuote() {
  const response = await axios.get(STOOQ_QUOTE_URL, {
    params: {
      i: "d",
      s: "xauusd",
    },
    responseType: "text",
    timeout: 15000,
  });
  const values = response.data
    .trim()
    .split(",")
    .map((value) => value.trim());

  if (values.length < 7 || !values[6]) {
    throw new Error("No Stooq quote returned for XAUUSD.");
  }

  return {
    price: Number(values[6]),
    refreshedAt: `${values[1]} ${values[2] || ""}`.trim(),
    source: "Stooq fallback",
  };
}

async function checkGold() {
  try {
    try {
      const payload = await requestAlphaVantage({
        function: "CURRENCY_EXCHANGE_RATE",
        from_currency: "XAU",
        to_currency: "USD",
      });
      const quote = payload["Realtime Currency Exchange Rate"];

      if (!quote) {
        throw new Error("Unexpected response shape from Alpha Vantage.");
      }

      return [
        "XAU/USD spot snapshot",
        `Price: $${formatPrice(Number(quote["5. Exchange Rate"]))}`,
        `Last refreshed: ${quote["6. Last Refreshed"]}`,
        "Source: Alpha Vantage free tier",
        "This is informational only, not trading advice.",
      ].join("\n");
    } catch (_alphaError) {
      const quote = await fetchStooqGoldQuote();

      return [
        "XAU/USD spot snapshot",
        `Price: $${formatPrice(quote.price)}`,
        `Last refreshed: ${quote.refreshedAt}`,
        `Source: ${quote.source}`,
        "This is informational only, not trading advice.",
      ].join("\n");
    }
  } catch (error) {
    return `Could not fetch gold price: ${error.message}`;
  }
}

function normalizeCandle(row) {
  return {
    close: Number(row.Close),
    date: row.Date,
    high: Number(row.High),
    low: Number(row.Low),
    open: Number(row.Open),
  };
}

async function fetchStooqDailyCandles(symbol) {
  const response = await axios.get(STOOQ_SERIES_URL, {
    params: {
      i: "d",
      s: toStooqSymbol(symbol),
    },
    responseType: "text",
    timeout: 15000,
  });

  const rows = parseCsv(response.data)
    .filter(
      (row) =>
        row.Date &&
        row.Open &&
        row.High &&
        row.Low &&
        row.Close &&
        row.Close !== "N/D"
    )
    .map(normalizeCandle)
    .sort((left, right) => left.date.localeCompare(right.date));

  if (rows.length === 0) {
    throw new Error(`No Stooq daily candles returned for ${symbol}.`);
  }

  return {
    candles: rows,
    source: "Stooq fallback",
  };
}

async function fetchDailyCandles(symbol) {
  try {
    if (isForexSymbol(symbol)) {
      const payload = await requestAlphaVantage({
        function: "FX_DAILY",
        from_symbol: symbol.slice(0, 3),
        outputsize: "compact",
        to_symbol: symbol.slice(3),
      });
      const series = payload["Time Series FX (Daily)"];

      if (!series) {
        throw new Error("No FX daily series returned.");
      }

      return {
        candles: Object.entries(series)
          .map(([date, values]) => ({
            close: Number(values["4. close"]),
            date,
            high: Number(values["2. high"]),
            low: Number(values["3. low"]),
            open: Number(values["1. open"]),
          }))
          .sort((left, right) => left.date.localeCompare(right.date)),
        source: "Alpha Vantage free tier",
      };
    }

    const payload = await requestAlphaVantage({
      function: "TIME_SERIES_DAILY",
      outputsize: "compact",
      symbol,
    });
    const series = payload["Time Series (Daily)"];

    if (!series) {
      throw new Error("No daily price series returned.");
    }

    return {
      candles: Object.entries(series)
        .map(([date, values]) => ({
          close: Number(values["4. close"]),
          date,
          high: Number(values["2. high"]),
          low: Number(values["3. low"]),
          open: Number(values["1. open"]),
        }))
        .sort((left, right) => left.date.localeCompare(right.date)),
      source: "Alpha Vantage free tier",
    };
  } catch (_alphaError) {
    return fetchStooqDailyCandles(symbol);
  }
}

function describeBias({ latestClose, macdHistogram, sma20 }) {
  if (latestClose > sma20 && macdHistogram > 0) {
    return "bullish bias";
  }

  if (latestClose < sma20 && macdHistogram < 0) {
    return "bearish bias";
  }

  return "mixed bias";
}

async function analyzeChart({ args }) {
  const symbol = args.symbol;

  try {
    const { candles, source } = await fetchDailyCandles(symbol);

    if (candles.length < 35) {
      return `Not enough daily candles returned for ${symbol}.`;
    }

    const closes = candles.map((candle) => candle.close);
    const recentWindow = candles.slice(-30);
    const latestCandle = candles[candles.length - 1];
    const rsi = lastValue(
      RSI.calculate({
        period: 14,
        values: closes,
      })
    );
    const sma20 = lastValue(
      SMA.calculate({
        period: 20,
        values: closes,
      })
    );
    const macd = lastValue(
      MACD.calculate({
        SimpleMAOscillator: false,
        SimpleMASignal: false,
        fastPeriod: 12,
        signalPeriod: 9,
        slowPeriod: 26,
        values: closes,
      })
    );

    if (!rsi || !sma20 || !macd) {
      throw new Error("Indicator calculation failed for the returned series.");
    }

    const recentHigh = Math.max(...recentWindow.map((candle) => candle.high));
    const recentLow = Math.min(...recentWindow.map((candle) => candle.low));
    const levels = fibonacciLevels(recentHigh, recentLow);
    const range = recentHigh - recentLow;
    const demandTop = recentLow + range * 0.15;
    const supplyBottom = recentHigh - range * 0.15;

    return [
      `Chart analysis for ${symbol}`,
      `Latest close: ${formatPrice(latestCandle.close)} on ${latestCandle.date}`,
      `RSI(14): ${rsi.toFixed(2)} (${describeRsi(rsi)})`,
      `SMA(20): ${formatPrice(sma20)}`,
      `MACD histogram: ${macd.histogram.toFixed(4)}`,
      `Bias: ${describeBias({
        latestClose: latestCandle.close,
        macdHistogram: macd.histogram,
        sma20,
      })}`,
      `30-day support: ${formatPrice(recentLow)}`,
      `30-day resistance: ${formatPrice(recentHigh)}`,
      `Demand zone: ${formatPrice(recentLow)} to ${formatPrice(demandTop)}`,
      `Supply zone: ${formatPrice(supplyBottom)} to ${formatPrice(recentHigh)}`,
      `Fib 38.2%: ${formatPrice(levels["38.2%"])}`,
      `Fib 50.0%: ${formatPrice(levels["50.0%"])}`,
      `Fib 61.8%: ${formatPrice(levels["61.8%"])}`,
      `Source: ${source}`,
      "This is informational only, not trading advice.",
    ].join("\n");
  } catch (error) {
    return `Could not analyze ${symbol}: ${error.message}`;
  }
}

module.exports = {
  "analyze-chart": analyzeChart,
  "check-gold": checkGold,
};
