const axios = require("axios");

/**
 * Real-Time Alerts & Webhook Dispatcher
 * Dispatches trade signals, price alerts, and SMC updates to Telegram and Discord.
 */
class AlertsEngine {
  constructor() {
    this.alerts = [];
    this.maxAlerts = 50;
  }

  /**
   * Format and send an alert payload to a Discord Webhook
   */
  async sendDiscordWebhook(webhookUrl, messageData) {
    if (!webhookUrl || !webhookUrl.startsWith("http")) {
      throw new Error("Invalid Discord Webhook URL");
    }

    const isBullish = (messageData.direction || messageData.signal || "").toLowerCase().includes("bull");
    const color = isBullish ? 0x00ff88 : 0xf23645;

    const embed = {
      title: `⚡ ELS Terminal Alert: ${messageData.symbol || "MARKET"} (${messageData.timeframe || "1h"})`,
      description: messageData.text || messageData.detail || "New market event triggered.",
      color: color,
      fields: [
        { name: "Direction", value: (messageData.direction || messageData.bias || "NEUTRAL").toUpperCase(), inline: true },
        { name: "Confluence", value: `${messageData.confluenceScore || messageData.confidence || "--"}%`, inline: true },
        { name: "Current Price", value: String(messageData.price || "--"), inline: true }
      ],
      footer: { text: "ELS Institutional Trading Terminal • Automated Webhook" },
      timestamp: new Date().toISOString()
    };

    if (messageData.entry) {
      embed.fields.push(
        { name: "Entry", value: String(messageData.entry), inline: true },
        { name: "Stop Loss", value: String(messageData.stopLoss || "--"), inline: true },
        { name: "Target 1", value: String(messageData.target1 || messageData.tp1 || "--"), inline: true }
      );
    }

    await axios.post(webhookUrl, {
      username: "ELS Quant Terminal",
      avatar_url: "https://els-beta.vercel.app/els-logo.jpg",
      embeds: [embed]
    }, { timeout: 5000 });

    return { success: true, provider: "Discord" };
  }

  /**
   * Format and send an alert payload to Telegram Bot
   */
  async sendTelegramAlert(botToken, chatId, messageData) {
    if (!botToken || !chatId) {
      throw new Error("Missing Telegram Bot Token or Chat ID");
    }

    const emoji = (messageData.direction || "").toLowerCase().includes("bull") ? "🟢" : "🔴";
    const text = `
${emoji} *ELS TERMINAL ALERT*
*Asset:* \`${messageData.symbol || "MARKET"}\` (${messageData.timeframe || "1h"})
*Signal:* *${(messageData.direction || "ALERT").toUpperCase()}*
*Details:* ${messageData.text || messageData.detail || "Market trigger activated."}
${messageData.entry ? `*Entry:* \`${messageData.entry}\` | *SL:* \`${messageData.stopLoss}\` | *TP:* \`${messageData.target1}\`` : ""}
*Confidence:* ${messageData.confluenceScore || messageData.confidence || "--"}%
_Time:_ ${new Date().toLocaleTimeString()}
    `.trim();

    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    await axios.post(url, {
      chat_id: chatId,
      text: text,
      parse_mode: "Markdown"
    }, { timeout: 5000 });

    return { success: true, provider: "Telegram" };
  }

  /**
   * Standard broker execution format (for MT4/MT5 TradingView Webhooks, Bybit, Binance)
   */
  buildExecutionWebhookPayload(setup, accountInfo = {}) {
    return {
      action: setup.direction?.toLowerCase() === "bullish" ? "BUY" : "SELL",
      symbol: setup.symbol,
      orderType: "LIMIT",
      price: setup.entry,
      stopLoss: setup.stopLoss,
      takeProfit: setup.target1 || setup.target,
      takeProfit2: setup.target2,
      riskPercentage: accountInfo.riskPercent || 1.0,
      magicNumber: 777888,
      comment: "ELS_AI_QUANT_SETUP",
      timestamp: Date.now()
    };
  }
}

module.exports = { AlertsEngine };
