const EventEmitter = require("events");

class MockSTT extends EventEmitter {
  constructor(modelPath) {
    super();
    this.modelPath = modelPath;
    this.modelDirectory = null;
    this.model = null;
    this.micInstance = null;
    this.recognizer = null;
    this.initialized = false;
    this.isListening = false;
    this.mockCommands = [
      "analyze EURUSD 1h",
      "watch BTCUSD 5m", 
      "refresh",
      "stop",
      "status",
      "search gold",
      "help"
    ];
  }

  async initialize() {
    // Simulate successful initialization
    this.modelDirectory = this.modelPath;
    this.initialized = true;
    
    return {
      ok: true,
      modelDirectory: this.modelDirectory,
      reason: "Mock voice recognition initialized (simulated mode)"
    };
  }

  async startListening(onText) {
    if (this.isListening) {
      return false;
    }

    if (!this.initialized) {
      const result = await this.initialize();
      if (!result.ok) {
        throw new Error(result.reason);
      }
    }

    this.isListening = true;
    
    // Simulate voice recognition with random commands
    const simulateVoiceInput = () => {
      if (!this.isListening) return;
      
      // Random delay between 3-8 seconds
      const delay = Math.random() * 5000 + 3000;
      
      setTimeout(() => {
        if (this.isListening) {
          // Pick a random command or generate a custom one
          const randomCommand = Math.random() > 0.5 
            ? this.mockCommands[Math.floor(Math.random() * this.mockCommands.length)]
            : "analyze EURUSD 1h";
          
          console.log(`🎤 [Mock] Heard: "${randomCommand}"`);
          onText(randomCommand);
          
          // Continue simulating
          simulateVoiceInput();
        }
      }, delay);
    };

    // Start simulation
    simulateVoiceInput();
    return true;
  }

  stopListening() {
    this.isListening = false;
    return true;
  }
}

module.exports = MockSTT;
