#!/usr/bin/env node

require("dotenv").config();
const readline = require("readline");
const fs = require("fs");

// Import terminal components
const sessionStore = require("./trading/sessionStore");
const { searchSymbols, TIMEFRAME_MAP } = require("./trading/marketData");
const STT = require("./voice/stt");
const MockSTT = require("./voice/stt-mock");

// Voice development environment
class VoiceDevEnvironment {
  constructor() {
    this.sttInstance = null;
    this.voiceMode = false;
    this.rl = null;
  }

  async initialize() {
    console.log("🎙️  Voice Development Environment");
    console.log("=" .repeat(50));
    
    // Initialize voice (native or mock)
    try {
      this.sttInstance = new STT();
      const result = await this.sttInstance.initialize();
      
      if (result.ok) {
        console.log("✅ Native voice recognition initialized");
      } else {
        throw new Error(result.reason);
      }
    } catch (error) {
      console.log("⚠️  Native voice failed:", error.message);
      console.log("🔄 Using mock voice for development...");
      
      this.sttInstance = new MockSTT();
      const mockResult = await this.sttInstance.initialize();
      if (mockResult.ok) {
        console.log("✅ Mock voice initialized");
      } else {
        console.log("❌ Voice initialization failed");
        return false;
      }
    }

    // Setup readline interface
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: true,
    });

    return true;
  }

  async start() {
    console.log("\n🎯 Voice Development Mode");
    console.log("Live feed is paused - Focus on voice integration");
    console.log("\nCommands:");
    console.log("  voice     - Start voice listening");
    console.log("  test      - Test voice commands");
    console.log("  status    - Show current market");
    console.log("  resume    - Resume live feed and exit");
    console.log("  quit      - Exit voice dev mode");
    console.log("\n💡 Use 'pause' in main terminal to enter this mode");
    
    this.showPrompt();
    
    this.rl.on("line", async (line) => {
      await this.handleCommand(line.trim());
      this.showPrompt();
    });
  }

  async handleCommand(command) {
    if (!command) return;

    const parts = command.toLowerCase().split(/\s+/);
    const cmd = parts[0];

    switch (cmd) {
      case "voice":
        await this.startVoiceListening();
        break;
        
      case "test":
        await this.testVoiceCommands();
        break;
        
      case "status":
        this.showStatus();
        break;
        
      case "resume":
        await this.resumeLiveFeed();
        break;
        
      case "quit":
        console.log("👋 Exiting voice development mode");
        this.rl.close();
        process.exit(0);
        break;
        
      default:
        console.log(`❓ Unknown command: ${cmd}`);
        console.log("💡 Available: voice, test, status, resume, quit");
    }
  }

  async startVoiceListening() {
    if (this.voiceMode) {
      console.log("⚠️  Voice mode already active");
      return;
    }

    this.voiceMode = true;
    console.log("🎤 Voice listening started...");
    console.log("💡 Say commands or 'stop voice' to end");

    try {
      await this.sttInstance.startListening(async (text) => {
        if (!text || !text.trim()) return;
        
        console.log(`🎤 Heard: "${text}"`);
        
        const normalized = text.toLowerCase().trim();
        if (normalized.includes("stop voice")) {
          this.voiceMode = false;
          console.log("🔇 Voice listening stopped");
          this.showPrompt();
          return;
        }

        // Process voice command
        await this.processVoiceCommand(text);
      });
    } catch (error) {
      console.error("Voice error:", error.message);
      this.voiceMode = false;
    }
  }

  async processVoiceCommand(text) {
    const tokens = text.trim().split(/\s+/);
    const command = tokens[0]?.toLowerCase();

    try {
      switch (command) {
        case "analyze":
          await this.analyzeMarket(tokens[1], tokens[2]);
          break;
        case "watch":
          await this.watchMarket(tokens[1], tokens[2]);
          break;
        case "status":
          this.showStatus();
          break;
        default:
          console.log(`❓ Unknown voice command: ${text}`);
      }
    } catch (error) {
      console.error(`Command error: ${error.message}`);
    }
  }

  async analyzeMarket(symbol, timeframe) {
    console.log(`📊 Analyzing ${symbol || 'default'} ${timeframe || 'timeframe'}...`);
    // Simulate analysis
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log("✅ Analysis complete");
    this.showStatus();
  }

  async watchMarket(symbol, timeframe) {
    console.log(`👀 Setting watch for ${symbol || 'default'} ${timeframe || 'timeframe'}...`);
    // Simulate watch setup
    await new Promise(resolve => setTimeout(resolve, 1500));
    console.log("✅ Watch ready (use 'resume' to activate)");
  }

  async testVoiceCommands() {
    console.log("🧪 Testing voice commands...");
    const testCommands = [
      "analyze EURUSD 1h",
      "watch BTCUSD 5m",
      "status",
      "help"
    ];

    for (const cmd of testCommands) {
      console.log(`🎤 Simulating: "${cmd}"`);
      await this.processVoiceCommand(cmd);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log("✅ Voice command test complete");
  }

  showStatus() {
    const snapshot = sessionStore.getSnapshot();
    console.log("\n📊 Current Status:");
    console.log(`Symbol: ${snapshot.selection.symbol}`);
    console.log(`Timeframe: ${snapshot.selection.timeframe}`);
    console.log(`Live: ${snapshot.watch.active ? 'Active' : 'Paused'}`);
    console.log(`Status: ${snapshot.status.label}`);
  }

  async resumeLiveFeed() {
    console.log("▶️  Resuming live feed...");
    const snapshot = sessionStore.getSnapshot();
    
    try {
      await sessionStore.startWatch(snapshot.selection.symbol, snapshot.selection.timeframe, {
        command: "resume",
        source: "voice-dev",
      });
      console.log("✅ Live feed resumed - Exiting voice dev mode");
      this.rl.close();
      process.exit(0);
    } catch (error) {
      console.error("Resume failed:", error.message);
    }
  }

  showPrompt() {
    if (!this.voiceMode) {
      this.rl.prompt("voice-dev> ");
    } else {
      process.stdout.write("🎤 Listening... ");
    }
  }
}

// Start voice development environment
async function main() {
  const voiceDev = new VoiceDevEnvironment();
  
  if (await voiceDev.initialize()) {
    await voiceDev.start();
  } else {
    console.error("❌ Failed to initialize voice development environment");
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = VoiceDevEnvironment;
