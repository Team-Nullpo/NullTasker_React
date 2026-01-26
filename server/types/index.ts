// サーバー専用型定義
// 共有型はフロントエンドからre-exportまたは直接定義

// ============ 共有型（フロントエンドと同じ定義） ============
// Note: 将来的にはモノレポ化して共有パッケージにすることを推奨

import { Request, Response } from "express";
import { Send } from "express-serve-static-core";

export type UserRole = "system_admin" | "project_admin" | "user";
export type TaskPriority = "low" | "medium" | "high";
export type TaskStatus = "todo" | "in_progress" | "review" | "done";

export type ErrorCode =
  | "USER_NOT_FOUND"
  | "INVALID_CREDENTIALS"
  | "TOKEN_EXPIRED"
  | "FORBIDDEN"
  | "VALIDATION_ERROR"
  | "SERVER_ERROR"
  | "PROJECT_NOT_FOUND"
  | "TICKET_NOT_FOUND"
  | "CONFLICT_ERROR";

// ============ ユーザー関連 ============

/** クライアントに返すユーザー情報（パスワードを含まない） */
export interface User {
  id: string;
  displayName: string;
  email: string;
  role: UserRole;
  projects: string[];
  createdAt: string;
  lastLogin: string | null;
}

export interface UserPayload {
  displayName: string;
  email: string;
  role: UserRole;
  projects: string[];
  password: string;
}

/** サーバー内部で使用するユーザー情報（パスワードを含む） */
export interface UserWithPassword extends User {
  password: string;
}

/** ユーザーデータファイルの構造 */
export interface UsersData {
  users: UserWithPassword[];
  lastUpdated: string;
}

// ============ 認証関連 ============

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface LoginResponse {
  token: string;
  refreshToken: string;
  user: User;
}

export interface RegisterRequest {
  displayName: string;
  email: string;
  password: string;
}

export interface Token {
  token: string;
}

export interface TokenPayload {
  id: string;
  displayName: string;
  email: string;
  role: UserRole;
  projects: string[];
  type?: "refresh";
  iat?: number;
  exp?: number;
}

// ============ チケット関連 ============

export interface Ticket {
  id: string;
  project: string;
  title: string;
  description: string;
  assignee: string;
  category: string;
  priority: TaskPriority;
  status: TaskStatus;
  progress: number;
  start_date: string | null;
  due_date: string | null;
  estimated_hours: number;
  actual_hours: number;
  tags: string[];
  parent_task: string | null;
  created_at: string;
  updated_at: string;
}

export interface TicketPayload {
  project: string;
  title: string;
  description?: string;
  assignee?: string;
  category?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  progress?: number;
  start_date?: string | null;
  due_date?: string | null;
  estimated_hours?: number;
  actual_hours?: number;
  tags?: string[];
  parent_task?: string | null;
}

export interface TicketsResponse {
  tickets: Ticket[];
  lastUpdated: string;
}

// ============ プロジェクト関連 ============

export interface ProjectSettings {
  categories: string[];
  priorities: Array<{ value: TaskPriority; label: string; color: string }>;
  statuses: Array<{ value: TaskStatus; label: string; color: string }>;
  notifications: boolean;
  autoAssign: boolean;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  owner: string;
  members: string[];
  admins: string[];
  settings: ProjectSettings;
  created_at: string;
  last_updated: string;
}

export interface ProjectCreateData {
  id?: string;
  name: string;
  description?: string;
  owner: string;
  members?: string[];
  admins?: string[];
  settings?: ProjectSettings;
}

export interface ProjectUpdateData {
  name?: string;
  description?: string;
  owner?: string;
  members?: string[];
  admins?: string[];
  settings?: ProjectSettings;
}

export interface ProjectsData {
  projects: Project[];
  lastUpdated: string;
}

// ============ 設定関連 ============

export interface AppSettings {
  categories: string[];
  projectName: string;
  projectDescription: string;
  notifications: {
    email: boolean;
    desktop: boolean;
    taskReminder: boolean;
  };
  display: {
    theme: "light" | "dark";
    language: string;
    tasksPerPage: number;
  };
}

// ============ API レスポンス ============

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
}

export interface ApiErrorResponse {
  errorCode?: ErrorCode;
  message: string;
  errors?: Array<{ msg: string; param?: string }>;
}

// ============ バックアップ関連 ============

export interface BackupData {
  users: UsersData;
  tasks: { tasks: Ticket[] };
  settings: AppSettings;
  projects: ProjectsData;
  backupDate: string;
}

// ============ Express 拡張 ============

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

export interface RequestWithType<ReqBody> extends Request {
  body: ReqBody;
}

export interface ResponseWithError<ResBody> extends Response {
  json: Send<ResBody | ApiErrorResponse, this>;
}
