const Database = require("better-sqlite3");
const path = require("path");
const fs = require("fs");

/**
 * データベースを初期化し、必要なテーブルを作成します
 */
function initializeDatabase() {
  // データベースディレクトリが存在しない場合は作成
  const dbDir = path.join(__dirname);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  // データベースファイルのパス
  const dbPath = path.join(dbDir, "nulltasker.db");

  // データベース接続を作成
  const db = new Database(dbPath, { verbose: console.log });

  // WALモードを有効化（パフォーマンス向上）
  db.pragma("journal_mode = WAL");

  // 外部キー制約を有効化
  db.pragma("foreign_keys = ON");

  console.log("データベースを初期化しています...");

  // ticketsテーブルの作成
  const createTicketsTable = `
    CREATE TABLE IF NOT EXISTS tickets (
      id TEXT PRIMARY KEY,
      project TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      assignee TEXT,
      category TEXT,
      priority TEXT DEFAULT 'medium',
      status TEXT DEFAULT 'todo',
      progress INTEGER DEFAULT 0,
      start_date TEXT,
      due_date TEXT,
      estimated_hours REAL,
      actual_hours REAL,
      tags TEXT,
      parent_task TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (parent_task) REFERENCES tickets(id) ON DELETE SET NULL
    )
  `;

  db.exec(createTicketsTable);
  console.log("✓ ticketsテーブルを作成しました");

  // projectsテーブルの作成
  const createProjectsTable = `
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      owner TEXT NOT NULL,
      members TEXT NOT NULL,
      admins TEXT NOT NULL,
      settings TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      last_updated TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `;

  db.exec(createProjectsTable);
  console.log("✓ projectsテーブルを作成しました");

  // インデックスの作成（パフォーマンス向上のため）
  const createIndexes = `
    CREATE INDEX IF NOT EXISTS idx_tickets_project ON tickets(project);
    CREATE INDEX IF NOT EXISTS idx_tickets_assignee ON tickets(assignee);
    CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
    CREATE INDEX IF NOT EXISTS idx_tickets_priority ON tickets(priority);
    CREATE INDEX IF NOT EXISTS idx_tickets_parent_task ON tickets(parent_task);
    CREATE INDEX IF NOT EXISTS idx_tickets_due_date ON tickets(due_date);
    CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON tickets(created_at);
    CREATE INDEX IF NOT EXISTS idx_projects_owner ON projects(owner);
    CREATE INDEX IF NOT EXISTS idx_projects_name ON projects(name);
  `;

  db.exec(createIndexes);
  console.log("✓ インデックスを作成しました");

  // トリガー: updated_at を自動更新
  const createUpdateTrigger = `
    CREATE TRIGGER IF NOT EXISTS update_tickets_timestamp 
    AFTER UPDATE ON tickets
    FOR EACH ROW
    BEGIN
      UPDATE tickets SET updated_at = datetime('now') WHERE id = NEW.id;
    END;
  `;

  db.exec(createUpdateTrigger);
  console.log("✓ トリガーを作成しました");

  // トリガー: projects の last_updated を自動更新
  const createProjectsUpdateTrigger = `
    CREATE TRIGGER IF NOT EXISTS update_projects_timestamp 
    AFTER UPDATE ON projects
    FOR EACH ROW
    BEGIN
      UPDATE projects SET last_updated = datetime('now') WHERE id = NEW.id;
    END;
  `;

  db.exec(createProjectsUpdateTrigger);
  console.log("✓ プロジェクトトリガーを作成しました");

  // デフォルトプロジェクトの挿入（存在しない場合のみ）
  const checkProject = db.prepare(
    "SELECT COUNT(*) as count FROM projects WHERE id = ?",
  );
  const { count } = checkProject.get("default");

  if (count === 0) {
    const defaultSettings = {
      categories: [
        "企画",
        "開発",
        "デザイン",
        "テスト",
        "ドキュメント",
        "会議",
        "その他",
      ],
      priorities: [
        { value: "high", label: "高優先度", color: "#c62828" },
        { value: "medium", label: "中優先度", color: "#ef6c00" },
        { value: "low", label: "低優先度", color: "#2e7d32" },
      ],
      statuses: [
        { value: "todo", label: "未着手", color: "#666" },
        { value: "in_progress", label: "進行中", color: "#1976d2" },
        { value: "review", label: "レビュー中", color: "#f57c00" },
        { value: "done", label: "完了", color: "#388e3c" },
      ],
      notifications: true,
      autoAssign: false,
    };

    const insertProject = db.prepare(`
      INSERT INTO projects (id, name, description, owner, members, admins, settings)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    insertProject.run(
      "default",
      "デフォルトプロジェクト",
      "初期プロジェクト",
      "admin",
      JSON.stringify(["admin"]),
      JSON.stringify(["admin"]),
      JSON.stringify(defaultSettings),
    );

    console.log("✓ デフォルトプロジェクトを作成しました");
  }

  console.log("データベースの初期化が完了しました！");

  return db;
}

// モジュールとして実行された場合
if (require.main === module) {
  try {
    const db = initializeDatabase();
    db.close();
    console.log("データベース接続を閉じました");
  } catch (error) {
    console.error("データベース初期化中にエラーが発生しました:", error);
    process.exit(1);
  }
}

module.exports = { initializeDatabase };
