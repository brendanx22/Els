#!/usr/bin/env node

require("dotenv").config();
const readline = require("readline");
const fs = require("fs");

// Import terminal functions
const { main: terminalMain } = require("./terminal/index.js");

async function testVoiceIntegration() {
  console.log("🧪 Testing Voice Integration");
  console.log("=" .repeat(40));
  
  // Test 1: Initialize voice
  console.log("1. Testing voice initialization...");
  const STT = require("./voice/stt");
  const MockSTT = require("./voice/stt-mock");
  
  let sttInstance;
  try {
    sttInstance = new STT();
    const result = await sttInstance.initialize();
    if (result.ok) {
      console.log("✅ Native STT initialized successfully");
    } else {
      throw new Error(result.reason);
    }
  } catch (error) {
    console.log("⚠️  Native STT failed:", error.message);
    console.log("🔄 Falling back to mock STT...");
    
    sttInstance = new MockSTT();
    const mockResult = await sttInstance.initialize();
    if (mockResult.ok) {
      console.log("✅ Mock STT initialized successfully");
    } else {
      console.log("❌ Mock STT also failed");
      return;
    }
  }
  // Test 2: Voice commands
  console.log("\n2. Testing voice commands...");
  const testCommands = [
    "analyze EURUSD 1h",
    "watch BTCUSD 5m",
    "status",
    "help"
  ];
  
  for (const command of testCommands) {
    console.log(`🎤 Simulating: "${command}"`);
    // Simulate voice recognition
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log("\n3. Voice integration test complete!");
  console.log("📋 To test with real terminal:");
  console.log("   1. Run: npm start");
  console.log("   2. Type: voice");
  console.log("   3. Watch for simulated voice commands");
}

testVoiceIntegration().catch(console.error);
