const { fetchMarketData } = require("./marketData");
const { analyzeCandles } = require("./analysis");

/**
 * Multi-Asset Market Screener Engine
 * Scans key Forex, Crypto, Commodities, and Indices in parallel.
 */
class MarketScreener {
  constructor() {
    this.defaultSymbols = [
      // ── Crypto ──
      { symbol: "BTCUSD", name: "Bitcoin", category: "crypto" },
      { symbol: "ETHUSD", name: "Ethereum", category: "crypto" },
      { symbol: "SOLUSD", name: "Solana", category: "crypto" },
      { symbol: "XRPUSD", name: "XRP", category: "crypto" },
      { symbol: "DOGEUSD", name: "Dogecoin", category: "crypto" },
      { symbol: "ADAUSD", name: "Cardano", category: "crypto" },
      { symbol: "BNBUSD", name: "Binance Coin", category: "crypto" },
      { symbol: "AVAXUSD", name: "Avalanche", category: "crypto" },
      { symbol: "LINKUSD", name: "Chainlink", category: "crypto" },
      { symbol: "SUIUSD", name: "Sui Network", category: "crypto" },

      // ── Forex Majors & Crosses ──
      { symbol: "EURUSD", name: "EUR / USD", category: "forex" },
      { symbol: "GBPUSD", name: "GBP / USD", category: "forex" },
      { symbol: "USDJPY", name: "USD / JPY", category: "forex" },
      { symbol: "AUDUSD", name: "AUD / USD", category: "forex" },
      { symbol: "USDCAD", name: "USD / CAD", category: "forex" },
      { symbol: "USDCHF", name: "USD / CHF", category: "forex" },
      { symbol: "NZDUSD", name: "NZD / USD", category: "forex" },
      { symbol: "GBPJPY", name: "GBP / JPY", category: "forex" },
      { symbol: "EURJPY", name: "EUR / JPY", category: "forex" },
      { symbol: "EURGBP", name: "EUR / GBP", category: "forex" },

      // ── Commodities ──
      { symbol: "XAUUSD", name: "Gold (XAU/USD)", category: "commodity" },
      { symbol: "XAGUSD", name: "Silver (XAG/USD)", category: "commodity" },
      { symbol: "USOIL", name: "Crude Oil (WTI)", category: "commodity" },
      { symbol: "BRENT", name: "Brent Crude", category: "commodity" },

      // ── Global Indices ──
      { symbol: "SPX", name: "S&P 500", category: "indices" },
      { symbol: "NAS100", name: "Nasdaq 100", category: "indices" },
      { symbol: "US30", name: "Dow Jones 30", category: "indices" },
      { symbol: "AUS200", name: "Australia 200", category: "indices" }
    ];
    this.cache = new Map();
    this.cacheTtlMs = 12000; // 12 seconds
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

        // Perform fast technical and SMC check
        const recentCandles = candles.slice(-60);
        const analysis = await analyzeCandles(recentCandles, {
          symbol: item.symbol,
          timeframe,
          skipAi: true
        });

        const indicators = analysis.indicators || {};
        const smc = analysis.smc || {};
        const scorecard = analysis.scorecard || {};
        const setups = analysis.setups || [];
        const confluenceScore = Math.round(
          ((scorecard.trend || 50) + (scorecard.momentum || 50) + (scorecard.structure || 50) + (scorecard.timing || 50)) / 4
        );

        let bias = "NEUTRAL";
        if (indicators.ema20 > indicators.ema50 && indicators.rsi14 > 48) bias = "BULLISH";
        else if (indicators.ema20 < indicators.ema50 && indicators.rsi14 < 52) bias = "BEARISH";

        let smcStatus = "In Equilibrium";
        let setupType = bias === "BULLISH" ? "Trend Continuation Long" : "Trend Continuation Short";
        
        if (smc.demandZones && smc.demandZones.length && currentPrice <= smc.demandZones[0].high * 1.003) {
          smcStatus = "Tapping Demand OB";
          setupType = "Demand Order Block Bounce";
          bias = "BULLISH";
        } else if (smc.supplyZones && smc.supplyZones.length && currentPrice >= smc.supplyZones[0].low * 0.997) {
          smcStatus = "Tapping Supply OB";
          setupType = "Supply Order Block Rejection";
          bias = "BEARISH";
        } else if (smc.bos && smc.bos.length) {
          smcStatus = `${smc.bos[0].direction} BOS`;
          setupType = `${smc.bos[0].direction} Structure Breakout`;
        }

        // Calculate Actionable Entry, Stop Loss, and Take Profit Targets
        let entry = currentPrice;
        let stopLoss = 0;
        let takeProfit1 = 0;
        let takeProfit2 = 0;

        if (setups && setups.length && setups[0].entry && setups[0].stopLoss) {
          const s = setups[0];
          entry = Number(s.entry) || currentPrice;
          stopLoss = Number(s.stopLoss);
          takeProfit1 = Number(s.target1 || s.target || (bias === "BULLISH" ? entry * 1.015 : entry * 0.985));
          takeProfit2 = Number(s.target2 || (bias === "BULLISH" ? entry * 1.03 : entry * 0.97));
        } else {
          // Dynamic ATR / Zone-based Entry & Risk Plan
          const isCrypto = item.category === "crypto";
          const riskBuffer = isCrypto ? 0.025 : 0.007; // 2.5% for crypto, 0.7% for forex/indices
          if (bias === "BULLISH") {
            entry = currentPrice;
            stopLoss = smc.demandZones?.length ? (smc.demandZones[0].low * 0.998) : (currentPrice * (1 - riskBuffer));
            const riskDist = Math.abs(entry - stopLoss) || (entry * 0.01);
            takeProfit1 = entry + (riskDist * 1.8);
            takeProfit2 = entry + (riskDist * 3.0);
          } else {
            entry = currentPrice;
            stopLoss = smc.supplyZones?.length ? (smc.supplyZones[0].high * 1.002) : (currentPrice * (1 + riskBuffer));
            const riskDist = Math.abs(stopLoss - entry) || (entry * 0.01);
            takeProfit1 = entry - (riskDist * 1.8);
            takeProfit2 = entry - (riskDist * 3.0);
          }
        }

        const riskDist = Math.abs(entry - stopLoss);
        const rewardDist = Math.abs(takeProfit1 - entry);
        const rrRatio = riskDist > 0 ? (rewardDist / riskDist).toFixed(1) : "2.0";

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
          setupType,
          entry,
          stopLoss,
          takeProfit1,
          takeProfit2,
          riskReward: `1 : ${rrRatio}`,
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
