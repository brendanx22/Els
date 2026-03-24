function formatTask(task) {
  const completedSuffix =
    task.status === "completed" && task.completed_at
      ? ` completed ${task.completed_at}`
      : "";

  return `#${task.id} [${task.status}] ${task.description}${completedSuffix}`;
}

async function addReminder({ args, memory }) {
  const task = (args.task || "").trim();

  if (!task) {
    return 'Please provide a task. Example: "remind buy coffee".';
  }

  const taskId = await memory.addTask(task);
  return `Saved task #${taskId}: ${task}`;
}

async function listTodos({ memory }) {
  const tasks = await memory.getTasks();

  if (tasks.length === 0) {
    return 'No tasks yet. Use "remind <task>" to add one.';
  }

  const pendingTasks = tasks.filter((task) => task.status === "pending");
  const completedTasks = tasks.filter((task) => task.status === "completed");
  const lines = ["Tasks"];

  if (pendingTasks.length > 0) {
    lines.push("Pending:");
    lines.push(...pendingTasks.map(formatTask));
  }

  if (completedTasks.length > 0) {
    lines.push("Completed:");
    lines.push(...completedTasks.slice(0, 10).map(formatTask));
  }

  return lines.join("\n");
}

async function completeTask({ args, memory }) {
  const taskId = Number(args.taskId);

  if (!Number.isInteger(taskId) || taskId <= 0) {
    return 'Please provide a numeric task id. Example: "complete-task 2".';
  }

  const updatedCount = await memory.completeTask(taskId);

  if (updatedCount === 0) {
    return `Task #${taskId} was not found or is already completed.`;
  }

  return `Completed task #${taskId}.`;
}

async function saveNote({ args, memory }) {
  const content = (args.content || "").trim();

  if (!content) {
    return 'Please provide note text. Example: "note capture Tuesday trading plan".';
  }

  const noteId = await memory.addNote(content);
  return `Saved note #${noteId}.`;
}

async function listNotes({ memory }) {
  const notes = await memory.getNotes(10);

  if (notes.length === 0) {
    return 'No notes yet. Use "note <text>" to save one.';
  }

  return [
    "Recent notes",
    ...notes.map((note) => `#${note.id} ${note.content}`),
  ].join("\n");
}

module.exports = {
  "complete-task": completeTask,
  "list-notes": listNotes,
  "list-todos": listTodos,
  note: saveNote,
  remind: addReminder,
};
