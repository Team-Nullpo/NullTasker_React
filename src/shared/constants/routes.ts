// API Routes
export const API_ROUTES = {
  LOGIN: "/login",
  REGISTER: "/register",
  LOGOUT: "/logout",
  VERIFY_TOKEN: "/verify-token",
  REFRESH: "/refresh",
  TASKS: "/tasks",
  PROJECTS: "/projects",
  USERS: "/users",
  BACKUP: "/backup",
} as const;

// App Routes
export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  REGISTER: "/register",
  TASKS: "/tasks",
  GANTT: "/gantt",
  CALENDAR: "/calendar",
  SETTINGS: "/settings",
  PROFILE: "/profile",
  ADMIN: "/admin",
} as const;
