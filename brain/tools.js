function normalizeWhitespace(value) {
  return value.replace(/\s+/g, " ").trim();
}

class Tools {
  constructor() {
    this.commands = [
      {
        category: "system",
        description: "Show the supported command palette.",
        examples: ["help", "Els help"],
        keywords: ["help", "commands", "support", "what can you do"],
        name: "help",
        pattern: /^(?:help|commands|what can you do)$/i,
        usage: "help",
        getArgs: () => ({}),
      },
      {
        category: "system",
        description: "Show local runtime and memory stats.",
        examples: ["status"],
        keywords: ["status", "health", "stats"],
        name: "status",
        pattern: /^(?:status|system status|health)$/i,
        usage: "status",
        getArgs: () => ({}),
      },
      {
        category: "system",
        description: "Wake the assistant from standby.",
        examples: ["activate", "Jarvis activate"],
        keywords: ["activate", "wake", "online"],
        name: "activate",
        pattern: /^(?:activate|wake up|come online)$/i,
        usage: "activate",
        getArgs: () => ({}),
      },
      {
        category: "system",
        description: "Put the assistant into standby mode.",
        examples: ["standby", "go to standby"],
        keywords: ["standby", "sleep", "quiet"],
        name: "standby",
        pattern: /^(?:standby|go to standby|sleep mode|stand down)$/i,
        usage: "standby",
        getArgs: () => ({}),
      },
      {
        category: "system",
        description: "Hear the assistant identity and role.",
        examples: ["who are you", "identify yourself"],
        keywords: ["who are you", "identity", "jarvis"],
        name: "who-are-you",
        pattern: /^(?:who are you|identify yourself|what are you)$/i,
        usage: "who-are-you",
        getArgs: () => ({}),
      },
      {
        category: "productivity",
        description: "Store a task or reminder in SQLite.",
        examples: ["remind buy coffee", "remind me to review pull requests"],
        keywords: ["remind", "task", "todo", "remember"],
        name: "remind",
        pattern: /^(?:remind(?: me)?(?: to)?|add task|todo)\s+(.+)$/i,
        usage: "remind <task>",
        getArgs: (match) => ({
          task: match[1].trim(),
        }),
      },
      {
        category: "productivity",
        description: "List pending and completed tasks.",
        examples: ["list-todos", "show tasks"],
        keywords: ["tasks", "todos", "list"],
        name: "list-todos",
        pattern: /^(?:list-todos|list todos|show tasks|show todos|list tasks)$/i,
        usage: "list-todos",
        getArgs: () => ({}),
      },
      {
        category: "productivity",
        description: "Mark a task as completed.",
        examples: ["complete-task 4", "complete task 4"],
        keywords: ["complete", "done", "finish", "task"],
        name: "complete-task",
        pattern: /^(?:complete-task|complete task|finish task|mark task)\s+(\d+)(?:\s+(?:done|complete))?$/i,
        usage: "complete-task <id>",
        getArgs: (match) => ({
          taskId: Number.parseInt(match[1], 10),
        }),
      },
      {
        category: "productivity",
        description: "Save a short note to local memory.",
        examples: ["note check Node 20 upgrade", "remember this swap API key"],
        keywords: ["note", "notes", "remember", "memo"],
        name: "note",
        pattern: /^(?:note|remember this|save note)\s+(.+)$/i,
        usage: "note <text>",
        getArgs: (match) => ({
          content: match[1].trim(),
        }),
      },
      {
        category: "productivity",
        description: "Show recent notes stored in SQLite.",
        examples: ["list-notes", "notes"],
        keywords: ["note", "notes", "list"],
        name: "list-notes",
        pattern: /^(?:list-notes|list notes|show notes|notes)$/i,
        usage: "list-notes",
        getArgs: () => ({}),
      },
      {
        category: "development",
        description: "Scaffold a small Express app.",
        examples: ["create-express-app demo-api", "create express app portfolio"],
        keywords: ["express", "scaffold", "app", "server"],
        name: "create-express-app",
        pattern: /^(?:create-express-app|create express app|scaffold express app|new express app)\s+([A-Za-z][\w-]*)$/i,
        usage: "create-express-app <name>",
        getArgs: (match) => ({
          appName: match[1].trim(),
        }),
      },
      {
        category: "development",
        description: "Apply SQL files from ./migrations to a local SQLite DB.",
        examples: ["run-migration", "run migrations"],
        keywords: ["migration", "migrate", "database", "sql"],
        name: "run-migration",
        pattern: /^(?:run-migration|run migrations|run migration|migrate)$/i,
        usage: "run-migration",
        getArgs: () => ({}),
      },
      {
        category: "development",
        description: "Launch a non-interactive npm script in the background.",
        examples: ["deploy-local dashboard", "deploy local preview"],
        keywords: ["deploy", "launch", "dashboard", "server"],
        name: "deploy-local",
        pattern: /^(?:deploy-local|deploy local|launch local app|start local app)(?:\s+([A-Za-z][\w:-]*))?$/i,
        usage: "deploy-local <script>",
        getArgs: (match) => ({
          script: match[1] || "start",
        }),
      },
      {
        category: "trading",
        description: "Fetch the latest XAU/USD spot snapshot from Alpha Vantage.",
        examples: ["check-gold", "gold price"],
        keywords: ["gold", "xauusd", "price"],
        name: "check-gold",
        pattern: /^(?:check-gold|check gold|gold price|xauusd)$/i,
        usage: "check-gold",
        getArgs: () => ({}),
      },
      {
        category: "trading",
        description: "Pull daily candles and calculate RSI, SMA, MACD, and Fibonacci levels.",
        examples: ["analyze-chart EURUSD", "chart AAPL"],
        keywords: ["chart", "analyze", "symbol", "forex", "stock"],
        name: "analyze-chart",
        pattern: /^(?:analyze-chart|analyze chart|analyze|chart)\s+([A-Za-z0-9._-]+)$/i,
        usage: "analyze-chart <symbol>",
        getArgs: (match) => ({
          symbol: match[1].trim().toUpperCase(),
        }),
      },
    ];
  }

  stripWakeWord(input) {
    if (!input) {
      return "";
    }

    const cleaned = input.replace(
      /^(?:(?:hey|hi|ok|okay)\s+)?(?:els|jarvis)[\s,:-]*/i,
      ""
    );

    return normalizeWhitespace(cleaned);
  }

  hasWakeWord(input) {
    return /^(?:(?:hey|hi|ok|okay)\s+)?(?:els|jarvis)[\s,:-]*/i.test(
      input || ""
    );
  }

  matchCommand(input) {
    const cleanInput = normalizeWhitespace(this.stripWakeWord(input || ""));

    for (const command of this.commands) {
      const match = cleanInput.match(command.pattern);

      if (match) {
        return {
          args: command.getArgs(match, cleanInput),
          category: command.category,
          cleanInput,
          description: command.description,
          name: command.name,
          usage: command.usage,
        };
      }
    }

    return null;
  }

  suggestCommands(input) {
    const lowered = (input || "").toLowerCase();

    return this.commands
      .map((command) => {
        const score = command.keywords.reduce((total, keyword) => {
          if (lowered.includes(keyword)) {
            return total + keyword.length;
          }

          return total;
        }, 0);

        return {
          ...command,
          score,
        };
      })
      .filter((command) => command.score > 0)
      .sort((left, right) => right.score - left.score);
  }

  getAllTools() {
    return this.commands.map((command) => ({
      category: command.category,
      description: command.description,
      examples: command.examples,
      name: command.name,
      usage: command.usage,
    }));
  }

  getHelpText() {
    const categories = {
      development: "Development",
      productivity: "Productivity",
      system: "System",
      trading: "Trading",
    };

    const sections = Object.entries(categories).map(([categoryKey, label]) => {
      const commands = this.commands
        .filter((command) => command.category === categoryKey)
        .map(
          (command) =>
            `- ${command.usage}: ${command.description} Example: ${command.examples[0]}`
        );

      return `${label}\n${commands.join("\n")}`;
    });

    return [
      "JARVIS command palette",
      'You can prefix commands with "Jarvis", "Hey Jarvis", or "Els".',
      "",
      ...sections,
      "",
      'Examples: "Jarvis status", "remind buy milk", "standby", "deploy-local dashboard".',
    ].join("\n");
  }
}

module.exports = Tools;
