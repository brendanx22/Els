const readline = require("readline");
const Brain = require("../brain/brain");
const Memory = require("../brain/memory");

class ElsCLI {
  constructor() {
    this.memory = new Memory();
    this.brain = new Brain(this.memory, {
      cwd: process.cwd(),
    });
    this.isRunning = true;
  }

  async start() {
    await this.memory.ready;

    const directInput = process.argv.slice(2).join(" ").trim();

    if (directInput) {
      await this.handleInput(directInput);
      await this.stop();
      return;
    }

    console.log("JARVIS");
    console.log("Local-first command assistant for development, trading, and productivity.");
    console.log('Type "help" for commands or "exit" to quit.');
    console.log("");

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: "JARVIS> ",
    });

    rl.prompt();

    rl.on("line", async (line) => {
      rl.pause();

      try {
        await this.handleInput(line);
      } finally {
        if (this.isRunning) {
          rl.resume();
          rl.prompt();
        } else {
          rl.close();
        }
      }
    });

    rl.on("close", async () => {
      await this.stop();
    });

    process.on("SIGINT", async () => {
      this.isRunning = false;
      rl.close();
    });
  }

  async handleInput(input) {
    const normalizedInput = (input || "").trim();

    if (!normalizedInput) {
      console.log('Type "help" to see commands.');
      return;
    }

    if (/^(exit|quit)$/i.test(normalizedInput)) {
      this.isRunning = false;
      console.log("Goodbye.");
      return;
    }

    try {
      const response = await this.brain.processInput(normalizedInput);
      console.log(response);
      await this.memory.storeConversation(normalizedInput, response);
    } catch (error) {
      const message = `Error: ${error.message}`;
      console.log(message);
      await this.memory.storeConversation(normalizedInput, message);
    }
  }

  async stop() {
    if (!this.memory) {
      return;
    }

    const memory = this.memory;
    this.memory = null;

    await memory.close();
  }
}

const cli = new ElsCLI();

cli.start().catch(async (error) => {
  console.error(error);

  if (cli.memory) {
    await cli.stop();
  }

  process.exitCode = 1;
});
