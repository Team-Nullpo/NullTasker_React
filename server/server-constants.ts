// サーバーサイド定数定義
// フロントエンドのconstants.jsと同期を保つ必要がある

import type { TaskPriority, TaskStatus } from "@nulltasker/shared-types";

// タスク進捗率の設定
export const TASK_PROGRESS_CONFIG = {
  MIN: 0, // 最小値
  MAX: 100, // 最大値
  STEP: 10, // 刻み幅（10%刻み）
} as const;

// タスク進捗率の定義（よく使う値に名前を付ける）
export const TASK_PROGRESS = {
  NOT_STARTED: TASK_PROGRESS_CONFIG.MIN,
  COMPLETED: TASK_PROGRESS_CONFIG.MAX,
} as const;

export interface ProgressOption {
  value: number;
  label: string;
}

/**
 * 進捗率の選択肢を動的に生成
 * TASK_PROGRESS_CONFIG.STEP の値に応じて自動的に選択肢が変わる
 */
export function generateProgressOptions(): ProgressOption[] {
  const options: ProgressOption[] = [];
  for (
    let i = TASK_PROGRESS_CONFIG.MIN;
    i <= TASK_PROGRESS_CONFIG.MAX;
    i += TASK_PROGRESS_CONFIG.STEP
  ) {
    options.push({
      value: i,
      label: `${i}%`,
    });
  }
  return options;
}

// タスク進捗率の選択肢（フォーム用）
export const TASK_PROGRESS_OPTIONS = generateProgressOptions();

// タスク優先度の定義
export const TASK_PRIORITY = {
  HIGH: "high",
  MEDIUM: "medium",
  LOW: "low",
} as const satisfies Record<string, TaskPriority>;

export interface PriorityConfig {
  label: string;
  color: string;
}

// タスク優先度の設定
export const TASK_PRIORITY_CONFIG: Record<TaskPriority, PriorityConfig> = {
  high: { label: "高優先度", color: "#c62828" },
  medium: { label: "中優先度", color: "#ef6c00" },
  low: { label: "低優先度", color: "#2e7d32" },
};

// タスクステータスの定義
export const TASK_STATUS = {
  TODO: "todo",
  IN_PROGRESS: "in_progress",
  REVIEW: "review",
  DONE: "done",
} as const satisfies Record<string, TaskStatus>;

export interface StatusConfig {
  label: string;
  color: string;
}

// タスクステータスの設定
export const TASK_STATUS_CONFIG: Record<TaskStatus, StatusConfig> = {
  todo: { label: "未着手", color: "#666" },
  in_progress: { label: "進行中", color: "#1976d2" },
  review: { label: "レビュー中", color: "#f57c00" },
  done: { label: "完了", color: "#388e3c" },
};

// ユーザーロールの定義
export const USER_ROLE = {
  SYSTEM_ADMIN: "system_admin",
  PROJECT_ADMIN: "project_admin",
  MEMBER: "member",
  USER: "user",
} as const;

// バリデーションルール
export const VALIDATION = {
  LOGIN_ID: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 20,
    PATTERN: /^[a-zA-Z0-9_-]+$/,
    ERROR_MESSAGE:
      "ログインIDは3〜20文字の英数字、アンダースコア、ハイフンで入力してください",
  },
  PASSWORD: {
    MIN_LENGTH: 8,
    MAX_LENGTH: 128,
    PATTERN: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d@$!%*?&_-]+$/,
    ERROR_MESSAGE:
      "パスワードは8文字以上で、大文字・小文字・数字を含む必要があります",
  },
  EMAIL: {
    PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    ERROR_MESSAGE: "有効なメールアドレスを入力してください",
  },
  DISPLAY_NAME: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 50,
    ERROR_MESSAGE: "表示名は1〜50文字で入力してください",
  },
} as const;

// JWTトークンの有効期限
export const JWT_EXPIRY = {
  ACCESS_TOKEN: "1h",
  REFRESH_TOKEN: "7d",
} as const;

// レート制限設定
export const RATE_LIMIT = {
  WINDOW_MS: 15 * 60 * 1000, // 15分
  MAX_REQUESTS: 100,
  LOGIN_MAX_REQUESTS: 5,
} as const;

// デフォルト設定
export const DEFAULT_SETTINGS = {
  categories: [
    "企画",
    "開発",
    "デザイン",
    "テスト",
    "ドキュメント",
    "会議",
    "その他",
  ],
  projectName: "NullTasker Project",
  projectDescription: "チームでのタスク管理を効率化するプロジェクトです。",
  notifications: {
    email: true,
    desktop: false,
    taskReminder: true,
  },
  display: {
    theme: "light" as const,
    language: "ja",
    tasksPerPage: 20,
  },
} as const;

// ヘルパー関数
export function getValidProgressValues(): number[] {
  return Object.values(TASK_PROGRESS);
}

export function getValidPriorityValues(): TaskPriority[] {
  return Object.values(TASK_PRIORITY) as TaskPriority[];
}

export function getValidStatusValues(): TaskStatus[] {
  return Object.values(TASK_STATUS) as TaskStatus[];
}

export function getValidRoleValues(): string[] {
  return Object.values(USER_ROLE);
}

export interface PriorityArrayItem {
  value: TaskPriority;
  label: string;
  color: string;
}

export function getPrioritiesArray(): PriorityArrayItem[] {
  return (
    Object.entries(TASK_PRIORITY_CONFIG) as [TaskPriority, PriorityConfig][]
  ).map(([value, config]) => ({
    value,
    label: config.label,
    color: config.color,
  }));
}

export interface StatusArrayItem {
  value: TaskStatus;
  label: string;
  color: string;
}

export function getStatusesArray(): StatusArrayItem[] {
  return (
    Object.entries(TASK_STATUS_CONFIG) as [TaskStatus, StatusConfig][]
  ).map(([value, config]) => ({
    value,
    label: config.label,
    color: config.color,
  }));
}
