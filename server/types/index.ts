import type { User, Project, Ticket } from "@nulltasker/shared-types";
// ============ ユーザー関連 ============

/** サーバー内部で使用するユーザー情報（パスワードを含む） */
export interface UserWithPassword extends User {
  password: string;
}

/** ユーザーデータファイルの構造 */
export interface UsersData {
  users: UserWithPassword[];
  lastUpdated: string;
}

// ============ プロジェクト関連 ============

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

// ============ バックアップ関連 ============

export interface BackupData {
  users: UsersData;
  tasks: { tasks: Ticket[] };
  settings: AppSettings;
  projects: ProjectsData;
  backupDate: string;
}
