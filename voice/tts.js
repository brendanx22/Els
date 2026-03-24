function optionalRequire(packageName) {
  try {
    return require(packageName);
  } catch (_error) {
    return null;
  }
}

class TTS {
  constructor() {
    this.say = optionalRequire("say");
    this.initialized = false;
    this.rate = 1;
    this.voice = null;
  }

  async initialize() {
    if (!this.say) {
      return {
        ok: false,
        reason: 'Voice output is optional. Install "say" to enable TTS.',
      };
    }

    this.initialized = true;
    return {
      ok: true,
    };
  }

  async speak(text, options = {}) {
    if (!this.initialized) {
      const result = await this.initialize();

      if (!result.ok) {
        return false;
      }
    }

    const voice = options.voice || this.voice;
    const speed = options.rate || this.rate;

    return new Promise((resolve, reject) => {
      this.say.speak(text, voice, speed, (error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(true);
      });
    });
  }

  stop() {
    if (!this.say || typeof this.say.stop !== "function") {
      return;
    }

    this.say.stop();
  }

  getVoices() {
    if (!this.say || typeof this.say.getInstalledVoices !== "function") {
      return Promise.resolve([]);
    }

    return new Promise((resolve, reject) => {
      this.say.getInstalledVoices((error, voices) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(voices || []);
      });
    });
  }

  setVoice(voiceName) {
    this.voice = voiceName;
    return this.voice;
  }

  setRate(rate) {
    const normalizedRate = Number(rate);

    if (!Number.isFinite(normalizedRate) || normalizedRate <= 0) {
      throw new Error("Rate must be a positive number.");
    }

    this.rate = normalizedRate;
    return this.rate;
  }

  exportToFile(text, filePath) {
    if (!this.say || typeof this.say.export !== "function") {
      return Promise.reject(
        new Error("Audio export is not available in this environment.")
      );
    }

    return new Promise((resolve, reject) => {
      this.say.export(text, this.voice, this.rate, filePath, (error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(filePath);
      });
    });
  }

  getStatus() {
    return {
      initialized: this.initialized,
      optionalDependencyInstalled: Boolean(this.say),
      rate: this.rate,
      voice: this.voice,
    };
  }
}

module.exports = TTS;
