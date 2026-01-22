// API configuration constants
export const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";
export const API_TIMEOUT = 10000; // 10 seconds

// Storage keys
export const STORAGE_KEYS = {
  TOKEN: "token",
  USER: "user",
  REFRESH_TOKEN: "refreshToken",
} as const;

// App configuration
export const APP_CONFIG = {
  NAME: "NullTasker",
  VERSION: "1.0.0",
  DEFAULT_LOCALE: "ja",
} as const;
