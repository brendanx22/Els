const { RealtimeWebSocketServer } = require("./trading/websocketServer");

async function startWs() {
  const wsServer = new RealtimeWebSocketServer(3003);
  await wsServer.start();
  console.log("WebSocket server started on port 3003");
}

startWs().catch(err => {
  console.error("Failed to start WebSocket server:", err);
  process.exit(1);
});
