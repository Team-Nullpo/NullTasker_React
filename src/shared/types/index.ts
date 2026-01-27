import {
  TaskStatus,
  ApiErrorResponse,
  UserRole,
  User,
} from "@nulltasker/shared-types";
export interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (
    loginId: string,
    password: string,
    rememberMe?: boolean,
  ) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export type ApiResBody<T> = T | ApiErrorResponse;
export interface TicketFormData {
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

export interface UserFormData {
  loginId: string;
  displayName: string;
  email: string;
  role: UserRole;
  password?: string;
}

export interface ProjectFormData {
  id: string;
  name: string;
  description: string;
  owner: string;
}

// ユーティリティ型
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};
