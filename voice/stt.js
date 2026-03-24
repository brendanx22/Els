const fs = require("fs");
const path = require("path");

function optionalRequire(packageName) {
  try {
    return require(packageName);
  } catch (_error) {
    return null;
  }
}

function findModelDirectory(basePath) {
  const resolvedBasePath = path.resolve(basePath);

  if (!fs.existsSync(resolvedBasePath)) {
    return null;
  }

  const queue = [resolvedBasePath];

  while (queue.length > 0) {
    const currentPath = queue.shift();
    const entries = fs.readdirSync(currentPath, {
      withFileTypes: true,
    });
    const childDirectories = entries
      .filter((entry) => entry.isDirectory())
      .map((entry) => path.join(currentPath, entry.name));

    if (
      childDirectories.some((directory) => path.basename(directory) === "am") &&
      childDirectories.some((directory) => path.basename(directory) === "conf")
    ) {
      return currentPath;
    }

    queue.push(...childDirectories);
  }

  return null;
}

class STT {
  constructor(modelPath = path.resolve(__dirname, "..", "model")) {
    this.modelPath = modelPath;
    this.modelDirectory = null;
    this.model = null;
    this.micFactory = optionalRequire("mic");
    this.micInstance = null;
    this.recognizer = null;
    this.vosk = optionalRequire("vosk");
    this.initialized = false;
    this.isListening = false;
  }

  async initialize() {
    this.modelDirectory = findModelDirectory(this.modelPath);

    if (!this.modelDirectory) {
      return {
        ok: false,
        reason: `No Vosk model directory was found under ${this.modelPath}.`,
      };
    }

    if (!this.vosk || !this.micFactory) {
      return {
        ok: false,
        reason: 'Voice input is optional. Install "vosk" and "mic" to enable live STT.',
      };
    }

    if (typeof this.vosk.setLogLevel === "function") {
      this.vosk.setLogLevel(0);
    }

    this.model = new this.vosk.Model(this.modelDirectory);
    this.recognizer = new this.vosk.Recognizer({
      model: this.model,
      sampleRate: 16000,
    });
    this.initialized = true;

    return {
      modelDirectory: this.modelDirectory,
      ok: true,
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

    this.micInstance = this.micFactory({
      channels: "1",
      debug: false,
      rate: "16000",
    });

    const inputStream = this.micInstance.getAudioStream();

    inputStream.on("data", (chunk) => {
      if (!this.recognizer || typeof onText !== "function") {
        return;
      }

      if (this.recognizer.acceptWaveform(chunk)) {
        const result = JSON.parse(this.recognizer.result());

        if (result.text && result.text.trim()) {
          onText(result.text.trim());
        }
      }
    });

    inputStream.on("error", (error) => {
      console.error(`STT stream error: ${error.message}`);
      this.stopListening();
    });

    this.micInstance.start();
    this.isListening = true;
    return true;
  }

  stopListening() {
    if (!this.isListening) {
      return;
    }

    if (this.micInstance && typeof this.micInstance.stop === "function") {
      this.micInstance.stop();
    }

    this.micInstance = null;
    this.isListening = false;
  }

  getStatus() {
    return {
      initialized: this.initialized,
      isListening: this.isListening,
      modelDirectory: this.modelDirectory,
      optionalDependenciesInstalled: Boolean(this.vosk && this.micFactory),
    };
  }

  dispose() {
    this.stopListening();

    if (this.recognizer && typeof this.recognizer.free === "function") {
      this.recognizer.free();
    }

    if (this.model && typeof this.model.free === "function") {
      this.model.free();
    }

    this.recognizer = null;
    this.model = null;
    this.initialized = false;
  }
}

module.exports = STT;
