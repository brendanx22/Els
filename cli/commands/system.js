function formatMegabytes(bytes) {
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

async function showHelp({ tools }) {
  return tools.getHelpText();
}

async function activateAssistant({ memory }) {
  await memory.set("assistant_state", "active");
  await memory.set("assistant_name", "JARVIS");

  return "Systems online. JARVIS is active and ready.";
}

async function showStatus({ cwd, memory }) {
  const assistantState = (await memory.get("assistant_state")) || "active";
  const assistantName = (await memory.get("assistant_name")) || "JARVIS";
  const stats = await memory.getStats();
  const heapUsed = process.memoryUsage().heapUsed;

  return [
    `${assistantName} status`,
    `Workspace: ${cwd}`,
    `State: ${assistantState}`,
    `Tasks: ${stats.pendingTasks} pending, ${stats.completedTasks} completed`,
    `Notes: ${stats.notesCount}`,
    `Conversations: ${stats.conversationCount}`,
    `Projects: ${stats.projectCount}`,
    `Heap used: ${formatMegabytes(heapUsed)}`,
    `Uptime: ${Math.round(process.uptime())} seconds`,
    "Mode: local-first",
  ].join("\n");
}

async function standbyAssistant({ memory }) {
  await memory.set("assistant_state", "standby");
  await memory.set("assistant_name", "JARVIS");

  return 'Standing by. Say "Jarvis" or use "activate" to bring me online again.';
}

async function identifyAssistant({ memory }) {
  const assistantName = (await memory.get("assistant_name")) || "JARVIS";

  return `${assistantName}, a local-first command assistant inspired by Jarvis. I can manage tasks, run development actions, inspect markets, and serve as your workspace control layer.`;
}

module.exports = {
  activate: activateAssistant,
  help: showHelp,
  status: showStatus,
  standby: standbyAssistant,
  "who-are-you": identifyAssistant,
};
