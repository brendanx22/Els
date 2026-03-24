const path = require("path");
const sqlite3 = require("sqlite3").verbose();

const DEFAULT_DB_PATH = path.resolve(__dirname, "..", "els_memory.db");

class Memory {
  constructor(dbPath = DEFAULT_DB_PATH) {
    this.dbPath = path.resolve(dbPath);
    this.db = new sqlite3.Database(this.dbPath);
    this.ready = this.init();
  }

  init() {
    const statements = [
      `CREATE TABLE IF NOT EXISTS conversations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        user_input TEXT NOT NULL,
        ai_response TEXT NOT NULL,
        context TEXT
      )`,
      `CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        description TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        completed_at DATETIME
      )`,
      `CREATE TABLE IF NOT EXISTS projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        status TEXT DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS kv_store (
        key TEXT PRIMARY KEY,
        value TEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS notes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        content TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS schema_migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
    ];

    return new Promise((resolve, reject) => {
      this.db.serialize(() => {
        let index = 0;

        const runNext = () => {
          if (index >= statements.length) {
            resolve();
            return;
          }

          this.db.run(statements[index], (error) => {
            if (error) {
              reject(error);
              return;
            }

            index += 1;
            runNext();
          });
        };

        runNext();
      });
    });
  }

  async run(sql, params = []) {
    await this.ready;

    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function onRun(error) {
        if (error) {
          reject(error);
          return;
        }

        resolve({
          changes: this.changes,
          lastID: this.lastID,
        });
      });
    });
  }

  async getRow(sql, params = []) {
    await this.ready;

    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (error, row) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(row || null);
      });
    });
  }

  async allRows(sql, params = []) {
    await this.ready;

    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (error, rows) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(rows || []);
      });
    });
  }

  async storeConversation(userInput, aiResponse, context = "") {
    const result = await this.run(
      "INSERT INTO conversations (user_input, ai_response, context) VALUES (?, ?, ?)",
      [userInput, aiResponse, context]
    );

    return result.lastID;
  }

  async getRecentConversations(limit = 10) {
    return this.allRows(
      "SELECT * FROM conversations ORDER BY timestamp DESC LIMIT ?",
      [limit]
    );
  }

  async searchConversations(query, limit = 5) {
    if (!query || !query.trim()) {
      return [];
    }

    const pattern = `%${query.toLowerCase()}%`;
    return this.allRows(
      `SELECT * FROM conversations
       WHERE lower(user_input) LIKE ? OR lower(ai_response) LIKE ?
       ORDER BY timestamp DESC
       LIMIT ?`,
      [pattern, pattern, limit]
    );
  }

  async addTask(description) {
    const result = await this.run(
      "INSERT INTO tasks (description) VALUES (?)",
      [description]
    );

    return result.lastID;
  }

  async getTasks(filter = null) {
    let status = null;
    let limit = null;

    if (typeof filter === "string") {
      status = filter;
    } else if (filter && typeof filter === "object") {
      status = filter.status || null;
      limit = filter.limit || null;
    }

    const clauses = [];
    const params = [];

    if (status) {
      clauses.push("status = ?");
      params.push(status);
    }

    let sql = "SELECT * FROM tasks";

    if (clauses.length > 0) {
      sql += ` WHERE ${clauses.join(" AND ")}`;
    }

    sql += ' ORDER BY CASE WHEN status = "pending" THEN 0 ELSE 1 END, created_at DESC';

    if (limit) {
      sql += " LIMIT ?";
      params.push(limit);
    }

    return this.allRows(sql, params);
  }

  async completeTask(id) {
    const result = await this.run(
      `UPDATE tasks
       SET status = 'completed', completed_at = CURRENT_TIMESTAMP
       WHERE id = ? AND status != 'completed'`,
      [id]
    );

    return result.changes;
  }

  async addNote(content) {
    const result = await this.run(
      "INSERT INTO notes (content) VALUES (?)",
      [content]
    );

    return result.lastID;
  }

  async getNotes(limit = 10) {
    return this.allRows(
      "SELECT * FROM notes ORDER BY created_at DESC LIMIT ?",
      [limit]
    );
  }

  async addProject(name, description = "") {
    const result = await this.run(
      "INSERT INTO projects (name, description) VALUES (?, ?)",
      [name, description]
    );

    return result.lastID;
  }

  async getProjects(status = null) {
    if (!status) {
      return this.allRows(
        "SELECT * FROM projects ORDER BY created_at DESC",
        []
      );
    }

    return this.allRows(
      "SELECT * FROM projects WHERE status = ? ORDER BY created_at DESC",
      [status]
    );
  }

  async set(key, value) {
    const serializedValue =
      typeof value === "string" ? value : JSON.stringify(value);

    await this.run(
      `INSERT INTO kv_store (key, value, updated_at)
       VALUES (?, ?, CURRENT_TIMESTAMP)
       ON CONFLICT(key) DO UPDATE SET
         value = excluded.value,
         updated_at = CURRENT_TIMESTAMP`,
      [key, serializedValue]
    );
  }

  async get(key, parseJson = true) {
    const row = await this.getRow(
      "SELECT value FROM kv_store WHERE key = ?",
      [key]
    );

    if (!row) {
      return null;
    }

    if (!parseJson) {
      return row.value;
    }

    try {
      return JSON.parse(row.value);
    } catch (_error) {
      return row.value;
    }
  }

  async getStats() {
    const [taskCounts, noteCount, conversationCount, projectCount] =
      await Promise.all([
        this.allRows(
          "SELECT status, COUNT(*) AS count FROM tasks GROUP BY status",
          []
        ),
        this.getRow("SELECT COUNT(*) AS count FROM notes", []),
        this.getRow("SELECT COUNT(*) AS count FROM conversations", []),
        this.getRow("SELECT COUNT(*) AS count FROM projects", []),
      ]);

    const pendingTasks =
      taskCounts.find((row) => row.status === "pending")?.count || 0;
    const completedTasks =
      taskCounts.find((row) => row.status === "completed")?.count || 0;

    return {
      totalTasks: pendingTasks + completedTasks,
      pendingTasks,
      completedTasks,
      notesCount: noteCount?.count || 0,
      conversationCount: conversationCount?.count || 0,
      projectCount: projectCount?.count || 0,
    };
  }

  async getDashboardData() {
    const [tasks, conversations, notes, stats] = await Promise.all([
      this.getTasks(),
      this.getRecentConversations(12),
      this.getNotes(8),
      this.getStats(),
    ]);

    return {
      completedTasks: tasks.filter((task) => task.status === "completed"),
      conversations,
      notes,
      pendingTasks: tasks.filter((task) => task.status === "pending"),
      stats,
    };
  }

  async close() {
    await this.ready;

    return new Promise((resolve, reject) => {
      this.db.close((error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve();
      });
    });
  }
}

module.exports = Memory;
