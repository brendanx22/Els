const Tools = require("./tools");
const developmentCommands = require("../cli/commands/dev");
const productivityCommands = require("../cli/commands/productivity");
const systemCommands = require("../cli/commands/system");
const tradingCommands = require("../cli/commands/trading");

class Brain {
  constructor(memory, options = {}) {
    this.memory = memory;
    this.cwd = options.cwd || process.cwd();
    this.tools = options.tools || new Tools();
    this.handlers = {
      ...systemCommands,
      ...productivityCommands,
      ...developmentCommands,
      ...tradingCommands,
    };
  }

  async processInput(rawInput) {
    const assistantState = (await this.memory.get("assistant_state")) || "active";
    const parsed = this.tools.matchCommand(rawInput);
    const wakeWordUsed = this.tools.hasWakeWord(rawInput);

    if (assistantState === "standby" && !wakeWordUsed) {
      if (!parsed || parsed.name !== "activate") {
        return 'Standing by. Say "Jarvis" or use "activate" to bring me online.';
      }
    }

    if (parsed) {
      const handler = this.handlers[parsed.name];

      if (!handler) {
        return `I recognized "${parsed.name}", but that handler is not wired yet.`;
      }

      return handler({
        rawInput,
        input: parsed.cleanInput,
        args: parsed.args,
        cwd: this.cwd,
        memory: this.memory,
        tools: this.tools,
      });
    }

    return this.generateResponse(rawInput);
  }

  async generateResponse(rawInput) {
    const cleanInput = this.tools.stripWakeWord(rawInput);
    const lowerInput = cleanInput.toLowerCase();

    if (!cleanInput) {
      if (this.tools.hasWakeWord(rawInput)) {
        return "Yes?";
      }

      return 'I am listening. Try "help" to see what I can do.';
    }

    if (/^(hello|hi|hey)\b/.test(lowerInput)) {
      return 'Good to hear from you. I am online and ready. Say "Jarvis" before a command if you want wake-word style control.';
    }

    if (/(what can you do|help|commands|capabilities)/.test(lowerInput)) {
      return this.tools.getHelpText();
    }

    if (/(jarvis|assistant|system)/.test(lowerInput)) {
      return 'I am your local JARVIS-style assistant. Ask for "status", "help", "standby", or give me a concrete task.';
    }

    if (/(task|todo|remind|note)/.test(lowerInput)) {
      return 'For productivity, use "remind <task>", "list-todos", "complete-task <id>", "note <text>", or "list-notes".';
    }

    if (/(gold|chart|trade|trading|xauusd|forex|stock)/.test(lowerInput)) {
      return 'For trading, use "check-gold" or "analyze-chart <symbol>" such as "analyze-chart EURUSD".';
    }

    if (/(express|migration|deploy|server|app)/.test(lowerInput)) {
      return 'For development, use "create-express-app <name>", "run-migration", or "deploy-local <script>".';
    }

    const relatedConversations = await this.memory.searchConversations(cleanInput, 3);

    if (relatedConversations.length > 0) {
      const references = relatedConversations
        .map((conversation) => `"${conversation.user_input}"`)
        .join(", ");

      return `I do not have a direct command for "${cleanInput}" yet. I found related history in memory: ${references}. Say "help" if you want the current command palette.`;
    }

    const suggestions = this.tools
      .suggestCommands(cleanInput)
      .slice(0, 3)
      .map((command) => command.usage)
      .join(", ");

    if (suggestions) {
      return `I do not have a direct command for "${cleanInput}" yet. Closest commands: ${suggestions}.`;
    }

    return 'I do not have a direct command for that yet. Try "help" to see the current local toolset.';
  }
}

module.exports = Brain;
