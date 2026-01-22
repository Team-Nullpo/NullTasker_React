const Database = require('better-sqlite3');
const path = require('path');
const { initializeDatabase } = require('./init');

// データベースインスタンス
let db = null;

/**
 * データベース接続を取得
 */
function getDatabase() {
  if (!db) {
    const dbPath = path.join(__dirname, 'nulltasker.db');
    db = new Database(dbPath, { verbose: console.log });
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  }
  return db;
}

/**
 * データベースを初期化（必要な場合のみ）
 */
function ensureDatabase() {
  const dbPath = path.join(__dirname, 'nulltasker.db');
  const fs = require('fs');
  
  if (!fs.existsSync(dbPath)) {
    console.log('データベースファイルが存在しません。新規作成します...');
    db = initializeDatabase();
  } else {
    db = getDatabase();
  }
  
  return db;
}

/**
 * チケットの操作
 */
const TicketOperations = {
  /**
   * すべてのチケットを取得
   */
  getAll() {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM tickets ORDER BY created_at DESC');
    const tickets = stmt.all();
    
    // tagsをJSON配列に変換
    return tickets.map(ticket => ({
      ...ticket,
      tags: ticket.tags ? JSON.parse(ticket.tags) : [],
      progress: parseInt(ticket.progress) || 0,
      estimated_hours: parseFloat(ticket.estimated_hours) || 0,
      actual_hours: parseFloat(ticket.actual_hours) || 0
    }));
  },

  /**
   * IDでチケットを取得
   */
  getById(id) {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM tickets WHERE id = ?');
    const ticket = stmt.get(id);
    
    if (!ticket) return null;
    
    return {
      ...ticket,
      tags: ticket.tags ? JSON.parse(ticket.tags) : [],
      progress: parseInt(ticket.progress) || 0,
      estimated_hours: parseFloat(ticket.estimated_hours) || 0,
      actual_hours: parseFloat(ticket.actual_hours) || 0
    };
  },

  /**
   * プロジェクトIDでチケットを取得
   */
  getByProject(projectId) {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM tickets WHERE project = ? ORDER BY created_at DESC');
    const tickets = stmt.all(projectId);
    
    return tickets.map(ticket => ({
      ...ticket,
      tags: ticket.tags ? JSON.parse(ticket.tags) : [],
      progress: parseInt(ticket.progress) || 0,
      estimated_hours: parseFloat(ticket.estimated_hours) || 0,
      actual_hours: parseFloat(ticket.actual_hours) || 0
    }));
  },

  /**
   * アサインされたユーザーIDでチケットを取得
   */
  getByAssignee(assignee) {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM tickets WHERE assignee = ? ORDER BY created_at DESC');
    const tickets = stmt.all(assignee);
    
    return tickets.map(ticket => ({
      ...ticket,
      tags: ticket.tags ? JSON.parse(ticket.tags) : [],
      progress: parseInt(ticket.progress) || 0,
      estimated_hours: parseFloat(ticket.estimated_hours) || 0,
      actual_hours: parseFloat(ticket.actual_hours) || 0
    }));
  },

  /**
   * チケットを作成
   */
  create(ticketData) {
    const db = getDatabase();
    
    const {
      id,
      project,
      title,
      description = '',
      assignee = '',
      category = '',
      priority = 'medium',
      status = 'todo',
      progress = 0,
      start_date = null,
      due_date = null,
      estimated_hours = 0,
      actual_hours = 0,
      tags = [],
      parent_task = null
    } = ticketData;

    const stmt = db.prepare(`
      INSERT INTO tickets (
        id, project, title, description, assignee, category,
        priority, status, progress, start_date, due_date,
        estimated_hours, actual_hours, tags, parent_task
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      id,
      project,
      title,
      description,
      assignee,
      category,
      priority,
      status,
      progress,
      start_date,
      due_date,
      estimated_hours,
      actual_hours,
      JSON.stringify(tags),
      parent_task
    );

    return this.getById(id);
  },

  /**
   * チケットを更新
   */
  update(id, ticketData) {
    const db = getDatabase();
    
    const {
      project,
      title,
      description,
      assignee,
      category,
      priority,
      status,
      progress,
      start_date,
      due_date,
      estimated_hours,
      actual_hours,
      tags,
      parent_task
    } = ticketData;

    const stmt = db.prepare(`
      UPDATE tickets SET
        project = COALESCE(?, project),
        title = COALESCE(?, title),
        description = COALESCE(?, description),
        assignee = COALESCE(?, assignee),
        category = COALESCE(?, category),
        priority = COALESCE(?, priority),
        status = COALESCE(?, status),
        progress = COALESCE(?, progress),
        start_date = COALESCE(?, start_date),
        due_date = COALESCE(?, due_date),
        estimated_hours = COALESCE(?, estimated_hours),
        actual_hours = COALESCE(?, actual_hours),
        tags = COALESCE(?, tags),
        parent_task = COALESCE(?, parent_task),
        updated_at = datetime('now')
      WHERE id = ?
    `);

    const result = stmt.run(
      project,
      title,
      description,
      assignee,
      category,
      priority,
      status,
      progress,
      start_date,
      due_date,
      estimated_hours,
      actual_hours,
      tags ? JSON.stringify(tags) : null,
      parent_task,
      id
    );

    if (result.changes === 0) {
      return null;
    }

    return this.getById(id);
  },

  /**
   * チケットを削除
   */
  delete(id) {
    const db = getDatabase();
    
    // 親タスクとして参照されている場合、子タスクのparent_taskをNULLに設定
    const updateChildren = db.prepare('UPDATE tickets SET parent_task = NULL WHERE parent_task = ?');
    updateChildren.run(id);
    
    const stmt = db.prepare('DELETE FROM tickets WHERE id = ?');
    const result = stmt.run(id);

    return result.changes > 0;
  },

  /**
   * 子タスクを取得
   */
  getChildren(parentId) {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM tickets WHERE parent_task = ? ORDER BY created_at ASC');
    const tickets = stmt.all(parentId);
    
    return tickets.map(ticket => ({
      ...ticket,
      tags: ticket.tags ? JSON.parse(ticket.tags) : [],
      progress: parseInt(ticket.progress) || 0,
      estimated_hours: parseFloat(ticket.estimated_hours) || 0,
      actual_hours: parseFloat(ticket.actual_hours) || 0
    }));
  },

  /**
   * ステータスで検索
   */
  getByStatus(status) {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM tickets WHERE status = ? ORDER BY created_at DESC');
    const tickets = stmt.all(status);
    
    return tickets.map(ticket => ({
      ...ticket,
      tags: ticket.tags ? JSON.parse(ticket.tags) : [],
      progress: parseInt(ticket.progress) || 0,
      estimated_hours: parseFloat(ticket.estimated_hours) || 0,
      actual_hours: parseFloat(ticket.actual_hours) || 0
    }));
  },

  /**
   * 優先度で検索
   */
  getByPriority(priority) {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM tickets WHERE priority = ? ORDER BY created_at DESC');
    const tickets = stmt.all(priority);
    
    return tickets.map(ticket => ({
      ...ticket,
      tags: ticket.tags ? JSON.parse(ticket.tags) : [],
      progress: parseInt(ticket.progress) || 0,
      estimated_hours: parseFloat(ticket.estimated_hours) || 0,
      actual_hours: parseFloat(ticket.actual_hours) || 0
    }));
  }
};

/**
 * データベースを閉じる
 */
function closeDatabase() {
  if (db) {
    db.close();
    db = null;
    console.log('データベース接続を閉じました');
  }
}

module.exports = {
  getDatabase,
  ensureDatabase,
  TicketOperations,
  closeDatabase
};
