import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import { initializeDatabase } from "./init";
import type {
  Ticket,
  Project,
  TaskPriority,
  TaskStatus,
  TicketPayload,
} from "@nulltasker/shared-types";

// データベースインスタンス
let db: Database.Database | null = null;

// DBから取得した生のチケットデータ
interface RawTicket {
  id: string;
  project: string;
  title: string;
  description: string | null;
  assignee: string | null;
  category: string | null;
  priority: string;
  status: string;
  progress: number;
  start_date: string | null;
  due_date: string | null;
  estimated_hours: number | null;
  actual_hours: number | null;
  tags: string | null;
  parent_task: string | null;
  created_at: string;
  updated_at: string;
}

// DBから取得した生のプロジェクトデータ
interface RawProject {
  id: string;
  name: string;
  description: string | null;
  owner: string;
  members: string;
  admins: string;
  settings: string;
  created_at: string;
  updated_at: string;
}

/**
 * 生のチケットデータを型安全なTicketに変換
 */
function parseTicket(ticket: RawTicket): Ticket {
  return {
    id: ticket.id,
    project: ticket.project,
    title: ticket.title,
    description: ticket.description || "",
    assignee: ticket.assignee || "",
    category: ticket.category || "",
    priority: (ticket.priority || "medium") as TaskPriority,
    status: (ticket.status || "todo") as TaskStatus,
    progress: parseInt(String(ticket.progress)) || 0,
    start_date: ticket.start_date,
    due_date: ticket.due_date,
    estimated_hours: parseFloat(String(ticket.estimated_hours)) || 0,
    actual_hours: parseFloat(String(ticket.actual_hours)) || 0,
    tags: ticket.tags ? JSON.parse(ticket.tags) : [],
    parent_task: ticket.parent_task,
    created_at: ticket.created_at,
    updated_at: ticket.updated_at,
  };
}

/**
 * 生のプロジェクトデータを型安全なProjectに変換
 */
function parseProject(project: RawProject): Project {
  return {
    id: project.id,
    name: project.name,
    description: project.description || "",
    owner: project.owner,
    members: project.members ? JSON.parse(project.members) : [],
    admins: project.admins ? JSON.parse(project.admins) : [],
    settings: project.settings ? JSON.parse(project.settings) : {},
    created_at: project.created_at,
    updated_at: project.updated_at,
  };
}

/**
 * データベース接続を取得
 */
export function getDatabase(): Database.Database {
  if (!db) {
    const dbPath = path.join(__dirname, "nulltasker.db");
    db = new Database(dbPath, { verbose: console.log });
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");
  }
  return db;
}

/**
 * データベースを初期化（必要な場合のみ）
 */
export function ensureDatabase(): Database.Database {
  const dbPath = path.join(__dirname, "nulltasker.db");

  if (!fs.existsSync(dbPath)) {
    console.log("データベースファイルが存在しません。新規作成します...");
    db = initializeDatabase();
  } else {
    db = getDatabase();
  }

  return db;
}

/**
 * チケットの操作
 */
export const TicketOperations = {
  /**
   * すべてのチケットを取得
   */
  getAll(): Ticket[] {
    const database = getDatabase();
    const stmt = database.prepare(
      "SELECT * FROM tickets ORDER BY created_at DESC",
    );
    const tickets = stmt.all() as RawTicket[];

    return tickets.map(parseTicket);
  },

  /**
   * IDでチケットを取得
   */
  getById(id: string): Ticket | null {
    const database = getDatabase();
    const stmt = database.prepare("SELECT * FROM tickets WHERE id = ?");
    const ticket = stmt.get(id) as RawTicket | undefined;

    if (!ticket) return null;

    return parseTicket(ticket);
  },

  /**
   * プロジェクトIDでチケットを取得
   */
  getByProject(projectId: string): Ticket[] {
    const database = getDatabase();
    const stmt = database.prepare(
      "SELECT * FROM tickets WHERE project = ? ORDER BY created_at DESC",
    );
    const tickets = stmt.all(projectId) as RawTicket[];

    return tickets.map(parseTicket);
  },

  /**
   * アサインされたユーザーIDでチケットを取得
   */
  getByAssignee(assignee: string): Ticket[] {
    const database = getDatabase();
    const stmt = database.prepare(
      "SELECT * FROM tickets WHERE assignee = ? ORDER BY created_at DESC",
    );
    const tickets = stmt.all(assignee) as RawTicket[];

    return tickets.map(parseTicket);
  },

  /**
   * チケットを作成
   */
  create(ticketData: Ticket): Ticket {
    const database = getDatabase();

    const {
      id,
      project,
      title,
      description = "",
      assignee = "",
      category = "",
      priority = "medium",
      status = "todo",
      progress = 0,
      start_date = null,
      due_date = null,
      estimated_hours = 0,
      actual_hours = 0,
      tags = [],
      parent_task = null,
    } = ticketData;

    const stmt = database.prepare(`
      INSERT INTO tickets (
        id, project, title, description, assignee, category,
        priority, status, progress, start_date, due_date,
        estimated_hours, actual_hours, tags, parent_task
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
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
      parent_task,
    );

    return this.getById(id!)!;
  },

  /**
   * チケットを更新
   */
  update(id: string, ticketData: Ticket): Ticket | null {
    const database = getDatabase();

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
      parent_task,
    } = ticketData;

    const stmt = database.prepare(`
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
      id,
    );

    if (result.changes === 0) {
      return null;
    }

    return this.getById(id);
  },

  /**
   * チケットを削除
   */
  delete(id: string): boolean {
    const database = getDatabase();

    // 親タスクとして参照されている場合、子タスクのparent_taskをNULLに設定
    const updateChildren = database.prepare(
      "UPDATE tickets SET parent_task = NULL WHERE parent_task = ?",
    );
    updateChildren.run(id);

    const stmt = database.prepare("DELETE FROM tickets WHERE id = ?");
    const result = stmt.run(id);

    return result.changes > 0;
  },

  /**
   * 子タスクを取得
   */
  getChildren(parentId: string): Ticket[] {
    const database = getDatabase();
    const stmt = database.prepare(
      "SELECT * FROM tickets WHERE parent_task = ? ORDER BY created_at ASC",
    );
    const tickets = stmt.all(parentId) as RawTicket[];

    return tickets.map(parseTicket);
  },

  /**
   * ステータスで検索
   */
  getByStatus(status: TaskStatus): Ticket[] {
    const database = getDatabase();
    const stmt = database.prepare(
      "SELECT * FROM tickets WHERE status = ? ORDER BY created_at DESC",
    );
    const tickets = stmt.all(status) as RawTicket[];

    return tickets.map(parseTicket);
  },

  /**
   * 優先度で検索
   */
  getByPriority(priority: TaskPriority): Ticket[] {
    const database = getDatabase();
    const stmt = database.prepare(
      "SELECT * FROM tickets WHERE priority = ? ORDER BY created_at DESC",
    );
    const tickets = stmt.all(priority) as RawTicket[];

    return tickets.map(parseTicket);
  },
};

/**
 * プロジェクトの操作
 */
export const ProjectOperations = {
  /**
   * すべてのプロジェクトを取得
   */
  getAll(): Project[] {
    const database = getDatabase();
    const stmt = database.prepare(
      "SELECT * FROM projects ORDER BY created_at DESC",
    );
    const projects = stmt.all() as RawProject[];

    return projects.map(parseProject);
  },

  /**
   * IDでプロジェクトを取得
   */
  getById(id: string): Project | null {
    const database = getDatabase();
    const stmt = database.prepare("SELECT * FROM projects WHERE id = ?");
    const project = stmt.get(id) as RawProject | undefined;

    if (!project) return null;

    return parseProject(project);
  },

  /**
   * オーナーでプロジェクトを取得
   */
  getByOwner(owner: string): Project[] {
    const database = getDatabase();
    const stmt = database.prepare(
      "SELECT * FROM projects WHERE owner = ? ORDER BY created_at DESC",
    );
    const projects = stmt.all(owner) as RawProject[];

    return projects.map(parseProject);
  },

  /**
   * プロジェクトを作成
   */
  create(projectData: Project): Project {
    const database = getDatabase();

    const {
      id,
      name,
      description = "",
      owner,
      members = [],
      admins = [],
      settings = {},
    } = projectData;

    const stmt = database.prepare(`
      INSERT INTO projects (
        id, name, description, owner, members, admins, settings
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      name,
      description,
      owner,
      JSON.stringify(members),
      JSON.stringify(admins),
      JSON.stringify(settings),
    );

    return this.getById(id!)!;
  },

  /**
   * プロジェクトを追加（createのエイリアス - 旧コードとの互換性のため）
   */
  add(projectData: Project): Project {
    return this.create(projectData);
  },

  /**
   * プロジェクトを更新
   */
  update(id: string, projectData: Project): Project | null {
    const database = getDatabase();

    const { name, description, owner, members, admins, settings } = projectData;

    const stmt = database.prepare(`
      UPDATE projects SET
        name = COALESCE(?, name),
        description = COALESCE(?, description),
        owner = COALESCE(?, owner),
        members = COALESCE(?, members),
        admins = COALESCE(?, admins),
        settings = COALESCE(?, settings),
        updated_at = datetime('now')
      WHERE id = ?
    `);

    const result = stmt.run(
      name,
      description,
      owner,
      members ? JSON.stringify(members) : null,
      admins ? JSON.stringify(admins) : null,
      settings ? JSON.stringify(settings) : null,
      id,
    );

    if (result.changes === 0) {
      return null;
    }

    return this.getById(id);
  },

  /**
   * プロジェクトを削除
   */
  delete(id: string): boolean {
    const database = getDatabase();

    // 関連するチケットも削除
    const deleteTickets = database.prepare(
      "DELETE FROM tickets WHERE project = ?",
    );
    deleteTickets.run(id);

    const stmt = database.prepare("DELETE FROM projects WHERE id = ?");
    const result = stmt.run(id);

    return result.changes > 0;
  },

  /**
   * メンバーを追加
   */
  addMember(projectId: string, userId: string): Project | null {
    const project = this.getById(projectId);
    if (!project) return null;

    const members = project.members || [];
    if (!members.includes(userId)) {
      members.push(userId);
      return this.update(projectId, { ...project, members: members });
    }

    return project;
  },

  /**
   * メンバーを削除
   */
  removeMember(projectId: string, userId: string): Project | null {
    const project = this.getById(projectId);
    if (!project) return null;

    const members = (project.members || []).filter((id) => id !== userId);
    return this.update(projectId, { ...project, members: members });
  },

  /**
   * 管理者を追加
   */
  addAdmin(projectId: string, userId: string): Project | null {
    const project = this.getById(projectId);
    if (!project) return null;

    const admins = project.admins || [];
    if (!admins.includes(userId)) {
      admins.push(userId);
      return this.update(projectId, { ...project, admins: admins });
    }

    return project;
  },

  /**
   * 管理者を削除
   */
  removeAdmin(projectId: string, userId: string): Project | null {
    const project = this.getById(projectId);
    if (!project) return null;

    const admins = (project.admins || []).filter((id) => id !== userId);
    return this.update(projectId, { ...project, admins: admins });
  },
};

/**
 * データベースを閉じる
 */
export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
    console.log("データベース接続を閉じました");
  }
}
