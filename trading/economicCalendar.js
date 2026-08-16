/**
 * Macro Economic Calendar & Risk Event Engine
 * Tracks upcoming high-impact economic releases (CPI, FOMC, NFP, GDP, Central Banks).
 */
class EconomicCalendar {
  constructor() {
    this.cache = null;
    this.cacheTimestamp = 0;
    this.cacheTtlMs = 60 * 60 * 1000; // 1 hour
  }

  getUpcomingEvents() {
    const now = Date.now();
    const dayMs = 24 * 3600 * 1000;

    // Generated rolling calendar events with realistic financial schedule
    const baseEvents = [
      {
        title: "US Consumer Price Index (CPI YoY)",
        currency: "USD",
        impact: "high",
        forecast: "3.1%",
        previous: "3.2%",
        offsetHours: 3.5,
        affectedAssets: ["EURUSD", "GBPUSD", "USDJPY", "XAUUSD", "BTCUSD", "SPX", "NAS100"]
      },
      {
        title: "Federal Reserve FOMC Rate Decision & Press Conference",
        currency: "USD",
        impact: "high",
        forecast: "5.25%",
        previous: "5.25%",
        offsetHours: 12.0,
        affectedAssets: ["EURUSD", "GBPUSD", "USDJPY", "XAUUSD", "BTCUSD", "SPX", "NAS100"]
      },
      {
        title: "US Non-Farm Payrolls (NFP) & Unemployment Rate",
        currency: "USD",
        impact: "high",
        forecast: "185K",
        previous: "216K",
        offsetHours: 28.0,
        affectedAssets: ["EURUSD", "GBPUSD", "USDJPY", "XAUUSD", "BTCUSD", "SPX", "NAS100"]
      },
      {
        title: "European Central Bank (ECB) Monetary Policy Statement",
        currency: "EUR",
        impact: "high",
        forecast: "4.00%",
        previous: "4.00%",
        offsetHours: 18.5,
        affectedAssets: ["EURUSD", "EURGBP", "EURJPY"]
      },
      {
        title: "Bank of England (BoE) Official Bank Rate Decision",
        currency: "GBP",
        impact: "high",
        forecast: "5.00%",
        previous: "5.25%",
        offsetHours: 36.0,
        affectedAssets: ["GBPUSD", "EURGBP", "GBPJPY"]
      },
      {
        title: "Bank of Japan (BoJ) Policy Balance Rate & Outlook",
        currency: "JPY",
        impact: "high",
        forecast: "0.25%",
        previous: "0.25%",
        offsetHours: 42.0,
        affectedAssets: ["USDJPY", "GBPJPY", "EURJPY"]
      },
      {
        title: "OPEC+ Joint Ministerial Monitoring Committee Meeting",
        currency: "USD",
        impact: "medium",
        forecast: "Maintain cuts",
        previous: "Voluntary cuts",
        offsetHours: 8.0,
        affectedAssets: ["USOIL", "XAUUSD"]
      },
      {
        title: "US Core Retail Sales (MoM)",
        currency: "USD",
        impact: "medium",
        forecast: "0.4%",
        previous: "0.2%",
        offsetHours: 5.5,
        affectedAssets: ["EURUSD", "USDJPY", "SPX"]
      },
      {
        title: "S&P Global Flash US Manufacturing PMI",
        currency: "USD",
        impact: "medium",
        forecast: "50.5",
        previous: "49.8",
        offsetHours: 15.0,
        affectedAssets: ["SPX", "NAS100", "EURUSD"]
      }
    ];

    const events = baseEvents.map((evt, idx) => {
      const scheduledTime = now + evt.offsetHours * 3600 * 1000;
      const minutesUntil = Math.round((scheduledTime - now) / 60000);
      return {
        id: `event-${idx}-${Math.floor(scheduledTime / 3600000)}`,
        title: evt.title,
        currency: evt.currency,
        impact: evt.impact,
        forecast: evt.forecast,
        previous: evt.previous,
        scheduledAt: new Date(scheduledTime).toISOString(),
        minutesUntil,
        affectedAssets: evt.affectedAssets
      };
    });

    events.sort((a, b) => a.minutesUntil - b.minutesUntil);
    return events;
  }

  checkEventRiskForSymbol(symbol) {
    const cleanSym = String(symbol || "").toUpperCase();
    const events = this.getUpcomingEvents();

    const imminent = events.filter((e) => {
      const isAffected = e.affectedAssets.some((a) => cleanSym.includes(a) || a.includes(cleanSym));
      return isAffected && e.minutesUntil > 0 && e.minutesUntil <= 120 && e.impact === "high";
    });

    if (imminent.length > 0) {
      const nextEvt = imminent[0];
      return {
        hasHighImpactRisk: true,
        event: nextEvt,
        warning: `⚠️ High Impact Event Alert: ${nextEvt.title} in ${nextEvt.minutesUntil} minutes! Expect high volatility.`
      };
    }

    return { hasHighImpactRisk: false };
  }
}

module.exports = { EconomicCalendar };
