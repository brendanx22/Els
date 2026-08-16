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

    function fmt(val) {
      if (val == null || isNaN(val)) return "--";
      const num = Number(val);
      if (num >= 1000) return num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      if (num >= 1) return num.toFixed(4);
      return num.toFixed(6);
    }

    const embed = {
      title: `⚡ ELS Trade Signal: ${messageData.symbol || "MARKET"} (${messageData.timeframe || "1h"})`,
      description: messageData.setupType ? `**Setup:** ${messageData.setupType}` : (messageData.text || messageData.detail || "New market setup identified."),
      color: color,
      fields: [
        { name: "Direction", value: (messageData.direction || messageData.bias || "NEUTRAL").toUpperCase(), inline: true },
        { name: "Confluence", value: `${messageData.confluenceScore || messageData.confidence || "--"}%`, inline: true },
        { name: "Current Price", value: fmt(messageData.price || messageData.entry), inline: true }
      ],
      footer: { text: "ELS Institutional Trading Terminal • Automated Webhook" },
      timestamp: new Date().toISOString()
    };

    if (messageData.entry) {
      embed.fields.push(
        { name: "Entry Price", value: fmt(messageData.entry), inline: true },
        { name: "Stop Loss (SL)", value: fmt(messageData.stopLoss), inline: true },
        { name: "Take Profit 1 (TP1)", value: fmt(messageData.takeProfit1 || messageData.target1), inline: true }
      );
      if (messageData.takeProfit2) {
        embed.fields.push({ name: "Take Profit 2 (TP2)", value: fmt(messageData.takeProfit2), inline: true });
      }
      if (messageData.riskReward) {
        embed.fields.push({ name: "R:R Ratio", value: messageData.riskReward, inline: true });
      }
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

    const isBull = (messageData.direction || "").toUpperCase().includes("BULL") || (messageData.direction || "").toUpperCase().includes("BUY");
    const emoji = isBull ? "🟢" : "🔴";
    const dirText = isBull ? "BUY / LONG" : "SELL / SHORT";

    function fmt(val) {
      if (val == null || isNaN(val)) return "--";
      const num = Number(val);
      if (num >= 1000) return num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      if (num >= 1) return num.toFixed(4);
      return num.toFixed(6);
    }

    let planSection = "";
    if (messageData.entry) {
      planSection = `
📍 *TRADE EXECUTION PLAN:*
• *Action:* \`${dirText}\`
• *Entry:* \`${fmt(messageData.entry)}\`
• *Stop Loss (SL):* \`${fmt(messageData.stopLoss)}\`
• *Take Profit 1 (TP1):* \`${fmt(messageData.takeProfit1 || messageData.target1)}\`
${messageData.takeProfit2 ? `• *Take Profit 2 (TP2):* \`${fmt(messageData.takeProfit2)}\`\n` : ""}• *Risk : Reward:* \`${messageData.riskReward || "1 : 2.0"}\`
`;
    }

    const text = `
${emoji} *ELS QUANT TRADE SIGNAL* ${emoji}
━━━━━━━━━━━━━━━━━━
*Asset:* \`${messageData.symbol || "MARKET"}\` (${messageData.timeframe || "1h"})
*Direction:* *${dirText}*
*Confluence:* \`${messageData.confluenceScore || messageData.confidence || "--"}%\`
${messageData.setupType ? `*Setup:* _${messageData.setupType}_\n` : ""}${planSection}
🧠 *SMC & Technical Context:*
• ${messageData.detail || messageData.text || "High-confluence structure break"}
━━━━━━━━━━━━━━━━━━
⏰ _${new Date().toUTCString()} • ELS Terminal_
    `.trim();

    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    await axios.post(url, {
      chat_id: chatId,
      text: text,
      parse_mode: "Markdown"
    }, { timeout: 7000 });

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
