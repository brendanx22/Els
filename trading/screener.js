const { fetchMarketData } = require("./marketData");
const { analyzeCandles } = require("./analysis");

/**
 * Multi-Asset Market Screener Engine
 * Scans key Forex, Crypto, Commodities, and Indices in parallel.
 */
class MarketScreener {
  constructor() {
    this.defaultSymbols = [
      { symbol: "BTCUSD", name: "Bitcoin", category: "crypto" },
      { symbol: "ETHUSD", name: "Ethereum", category: "crypto" },
      { symbol: "SOLUSD", name: "Solana", category: "crypto" },
      { symbol: "EURUSD", name: "EUR / USD", category: "forex" },
      { symbol: "GBPUSD", name: "GBP / USD", category: "forex" },
      { symbol: "USDJPY", name: "USD / JPY", category: "forex" },
      { symbol: "XAUUSD", name: "Gold / USD", category: "commodity" },
      { symbol: "USOIL", name: "Crude Oil", category: "commodity" },
      { symbol: "SPX", name: "S&P 500", category: "indices" },
      { symbol: "NAS100", name: "Nasdaq 100", category: "indices" }
    ];
    this.cache = new Map();
    this.cacheTtlMs = 15000; // 15 seconds
  }

  async scanMarkets(timeframe = "1h") {
    const cacheKey = `screener-${timeframe}`;
    const now = Date.now();

    if (this.cache.has(cacheKey)) {
      const entry = this.cache.get(cacheKey);
      if (now - entry.timestamp < this.cacheTtlMs) {
        return entry.data;
      }
    }

    const scanPromises = this.defaultSymbols.map(async (item) => {
      try {
        const market = await fetchMarketData(item.symbol, timeframe);
        const candles = market.candles || [];
        if (!candles.length) return null;

        const currentPrice = candles[candles.length - 1].close;
        const openPrice = candles[0].open;
        const changePercent = ((currentPrice - openPrice) / openPrice) * 100;

        // Perform fast technical check
        const recentCandles = candles.slice(-60);
        const analysis = await analyzeCandles(recentCandles, {
          symbol: item.symbol,
          timeframe,
          skipAi: true
        });

        const indicators = analysis.indicators || {};
        const smc = analysis.smc || {};
        const scorecard = analysis.scorecard || {};
        const confluenceScore = Math.round(
          ((scorecard.trend || 50) + (scorecard.momentum || 50) + (scorecard.structure || 50) + (scorecard.timing || 50)) / 4
        );

        let bias = "NEUTRAL";
        if (indicators.ema20 > indicators.ema50 && indicators.rsi14 > 50) bias = "BULLISH";
        else if (indicators.ema20 < indicators.ema50 && indicators.rsi14 < 50) bias = "BEARISH";

        let smcStatus = "In Equilibrium";
        if (smc.demandZones && smc.demandZones.length && currentPrice <= smc.demandZones[0].high * 1.002) {
          smcStatus = "Tapping Demand OB";
        } else if (smc.supplyZones && smc.supplyZones.length && currentPrice >= smc.supplyZones[0].low * 0.998) {
          smcStatus = "Tapping Supply OB";
        } else if (analysis.patterns && analysis.patterns.length) {
          smcStatus = analysis.patterns[0].type || "Pattern Forming";
        }

        return {
          symbol: item.symbol,
          displaySymbol: market.displaySymbol || item.symbol,
          name: item.name,
          category: item.category,
          price: currentPrice,
          changePercent: Number(changePercent.toFixed(2)),
          timeframe,
          bias,
          confluenceScore,
          smcStatus,
          rsi: Math.round(indicators.rsi14 || 50),
          volatility: analysis.volatility?.regime || "Normal",
          updatedAt: now
        };
      } catch (err) {
        return null;
      }
    });

    const results = (await Promise.all(scanPromises)).filter(Boolean);
    // Sort by highest confluence score
    results.sort((a, b) => b.confluenceScore - a.confluenceScore);

    this.cache.set(cacheKey, { data: results, timestamp: now });
    return results;
  }
}

module.exports = { MarketScreener };
