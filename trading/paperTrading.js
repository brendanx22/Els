/**
 * Paper Trading Engine & Position Sizer
 * Manages virtual account balance, open positions, risk calculations, and PnL.
 */
class PaperTradingEngine {
  constructor(initialBalance = 100000) {
    this.initialBalance = initialBalance;
    this.balance = initialBalance;
    this.positions = [];
    this.closedTrades = [];
  }

  /**
   * Calculate precise Position / Lot size based on account balance and stop loss distance
   */
  calculatePositionSize(accountBalance, riskPercent, entryPrice, stopLossPrice, assetType = "forex") {
    const riskAmount = (accountBalance * (riskPercent / 100));
    const priceDiff = Math.abs(entryPrice - stopLossPrice);

    if (priceDiff <= 0) return { lotSize: 0, units: 0, riskAmount };

    let units = 0;
    let lotSize = 0;

    if (assetType === "crypto") {
      units = riskAmount / priceDiff;
      lotSize = Number(units.toFixed(4));
    } else if (assetType === "commodity" || assetType === "gold") {
      // Gold standard 100 oz per lot ($1 move = $100 per lot)
      const pipValuePerLot = 100;
      lotSize = Number((riskAmount / (priceDiff * pipValuePerLot)).toFixed(2));
      units = lotSize * 100;
    } else {
      // Standard Forex: 100,000 units ($10 per pip on EURUSD)
      const stopDistancePips = priceDiff * 10000;
      const pipValuePerLot = 10;
      lotSize = Number((riskAmount / (stopDistancePips * pipValuePerLot)).toFixed(2));
      units = lotSize * 100000;
    }

    return {
      lotSize: Math.max(0.01, lotSize),
      units: Math.round(units),
      riskAmount: Number(riskAmount.toFixed(2)),
      stopDistance: Number(priceDiff.toFixed(5))
    };
  }

  /**
   * Open a new virtual position
   */
  openPosition(order) {
    const position = {
      id: `pos-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      symbol: order.symbol,
      side: order.side.toUpperCase(), // BUY or SELL
      entryPrice: Number(order.entryPrice),
      currentPrice: Number(order.entryPrice),
      stopLoss: Number(order.stopLoss),
      takeProfit: Number(order.takeProfit),
      takeProfit2: order.takeProfit2 ? Number(order.takeProfit2) : null,
      lotSize: Number(order.lotSize || 1.0),
      riskAmount: Number(order.riskAmount || 0),
      unrealizedPnL: 0,
      pnlPercent: 0,
      openedAt: Date.now(),
      status: "OPEN"
    };

    this.positions.push(position);
    return position;
  }

  /**
   * Update all open positions with current live market prices
   */
  updatePositionsWithPrice(symbol, currentPrice) {
    this.positions.forEach(pos => {
      if (pos.symbol === symbol && pos.status === "OPEN") {
        pos.currentPrice = currentPrice;
        const diff = pos.side === "BUY" ? currentPrice - pos.entryPrice : pos.entryPrice - currentPrice;
        
        // Forex approx $10 per pip on 1 lot, Crypto units * diff
        let pnl = 0;
        if (symbol.includes("BTC") || symbol.includes("ETH") || symbol.includes("SOL")) {
          pnl = diff * pos.lotSize;
        } else if (symbol.includes("XAU") || symbol.includes("GOLD")) {
          pnl = diff * pos.lotSize * 100;
        } else {
          pnl = (diff * 10000) * (pos.lotSize * 10);
        }

        pos.unrealizedPnL = Number(pnl.toFixed(2));
        pos.pnlPercent = Number(((diff / pos.entryPrice) * 100).toFixed(2));

        // Check SL / TP auto-trigger
        if (pos.side === "BUY") {
          if (pos.stopLoss && currentPrice <= pos.stopLoss) this.closePosition(pos.id, "STOP_LOSS");
          else if (pos.takeProfit && currentPrice >= pos.takeProfit) this.closePosition(pos.id, "TAKE_PROFIT");
        } else {
          if (pos.stopLoss && currentPrice >= pos.stopLoss) this.closePosition(pos.id, "STOP_LOSS");
          else if (pos.takeProfit && currentPrice <= pos.takeProfit) this.closePosition(pos.id, "TAKE_PROFIT");
        }
      }
    });
  }

  /**
   * Close an open position
   */
  closePosition(positionId, reason = "MANUAL") {
    const idx = this.positions.findIndex(p => p.id === positionId);
    if (idx === -1) return null;

    const pos = this.positions[idx];
    pos.status = "CLOSED";
    pos.closeReason = reason;
    pos.closedAt = Date.now();
    pos.realizedPnL = pos.unrealizedPnL;

    this.balance += pos.realizedPnL;
    this.closedTrades.unshift(pos);
    this.positions.splice(idx, 1);

    return pos;
  }

  getAccountSummary() {
    const totalUnrealized = this.positions.reduce((sum, p) => sum + (p.unrealizedPnL || 0), 0);
    const equity = this.balance + totalUnrealized;
    const wins = this.closedTrades.filter(t => (t.realizedPnL || 0) > 0).length;
    const totalClosed = this.closedTrades.length;
    const winRate = totalClosed > 0 ? Math.round((wins / totalClosed) * 100) : 0;

    return {
      balance: Number(this.balance.toFixed(2)),
      equity: Number(equity.toFixed(2)),
      unrealizedPnL: Number(totalUnrealized.toFixed(2)),
      openPositionsCount: this.positions.length,
      closedTradesCount: totalClosed,
      winRate: `${winRate}%`
    };
  }
}

module.exports = { PaperTradingEngine };
