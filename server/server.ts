// 環境変数の読み込み（最初に実行）
import "dotenv/config";

import express, {
  type Request,
  type Response,
  type NextFunction,
} from "express";
import https from "https";
import http from "http";
import fs from "fs/promises";
import fsSync from "fs";
import path from "path";
import cors from "cors";
import bcrypt from "bcrypt";
import jwt, { JwtPayload } from "jsonwebtoken";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import {
  body,
  validationResult,
  type ValidationChain,
} from "express-validator";
import crypto from "crypto";

import {
  VALIDATION,
  JWT_EXPIRY,
  RATE_LIMIT as RATE_LIMIT_CONFIG,
  DEFAULT_SETTINGS,
  TASK_PROGRESS,
  TASK_STATUS,
  getValidProgressValues,
  getValidStatusValues,
  getPrioritiesArray,
  getStatusesArray,
} from "./server-constants";

import {
  ensureDatabase,
  TicketOperations,
  ProjectOperations,
  closeDatabase,
} from "./db/database";

import type { UserWithPassword, UsersData } from "./types";

import type {
  User,
  UserPayload,
  Token,
  TokenPayload,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  Ticket,
  TicketPayload,
  Project,
  ProjectPayload,
  RequestWithType,
  ResponseWithError,
} from "@nulltasker/shared-types";

const app = express();
const PORT = parseInt(process.env.PORT || "3000", 10);
const HTTPS_PORT = parseInt(process.env.HTTPS_PORT || "3443", 10);
const NODE_ENV = process.env.NODE_ENV || "development";
const DEBUG_MODE = NODE_ENV === "development";
const USE_HTTPS = process.env.USE_HTTPS !== "false";

// デバッグログ用のヘルパー関数
const debugLog = (...args: unknown[]): void => {
  if (DEBUG_MODE) {
    console.log(...args);
  }
};

const generateId = (prefix = "item"): string => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `${prefix}_${timestamp}_${random}`;
};

// 開発環境用の安全なシークレット生成
function generateSecureSecret(): string {
  if (process.env.NODE_ENV === "production") {
    console.error(
      "エラー: 本番環境では必ずJWT_SECRET環境変数を設定してください",
    );
    process.exit(1);
  }
  console.warn("⚠️  ランダムなJWT_SECRETを生成しました（開発環境のみ）");
  return crypto.randomBytes(64).toString("hex");
}

// JWT秘密鍵（本番環境では必ず環境変数を使用）
const JWT_SECRET = process.env.JWT_SECRET || generateSecureSecret();

// 開発環境で環境変数が設定されていない場合の警告
if (!process.env.JWT_SECRET) {
  console.warn("⚠️  警告: JWT_SECRETが設定されていません！");
  console.warn("   サーバー再起動時にトークンが無効になります。");
  console.warn("   .envファイルにJWT_SECRETを設定してください。");
} else {
  console.log("✓ JWT_SECRETが環境変数から読み込まれました");
}

// データベースの初期化
ensureDatabase();
console.log("✓ データベースを初期化しました");

// ミドルウェア
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        scriptSrcAttr: ["'unsafe-inline'"],
        imgSrc: ["'self'", "data:"],
        fontSrc: ["'self'", "https://cdnjs.cloudflare.com"],
      },
    },
  }),
);

// CORS設定を厳格化
app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production"
        ? ["https://yourdomain.com"]
        : [
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "https://localhost:5173",
            "https://127.0.0.1:5173",
            "https://localhost:3443",
            "https://127.0.0.1:3443",
            "http://localhost:3000",
            "http://127.0.0.1:3000",
          ],
    credentials: true,
  }),
);

app.use(express.json({ limit: "10mb" }));

// レート制限設定
const authLimiter = rateLimit({
  windowMs: RATE_LIMIT_CONFIG.WINDOW_MS,
  max: RATE_LIMIT_CONFIG.LOGIN_MAX_REQUESTS,
  message: {
    success: false,
    message: "ログイン試行回数が上限に達しました。15分後に再試行してください。",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const generalLimiter = rateLimit({
  windowMs: RATE_LIMIT_CONFIG.WINDOW_MS,
  max: RATE_LIMIT_CONFIG.MAX_REQUESTS,
  message: {
    success: false,
    message:
      "リクエスト制限に達しました。しばらく時間をおいて再試行してください。",
  },
});

app.use("/api/login", authLimiter);
app.use("/api/register", authLimiter);
app.use("/api", generalLimiter);

// バリデーションルール
const loginValidation: ValidationChain[] = [
  body("loginId")
    .isLength({
      min: VALIDATION.LOGIN_ID.MIN_LENGTH,
      max: VALIDATION.LOGIN_ID.MAX_LENGTH,
    })
    .matches(VALIDATION.LOGIN_ID.PATTERN)
    .withMessage(VALIDATION.LOGIN_ID.ERROR_MESSAGE),
];

const registerValidation: ValidationChain[] = [
  body("loginId")
    .isLength({
      min: VALIDATION.LOGIN_ID.MIN_LENGTH,
      max: VALIDATION.LOGIN_ID.MAX_LENGTH,
    })
    .matches(VALIDATION.LOGIN_ID.PATTERN)
    .withMessage(VALIDATION.LOGIN_ID.ERROR_MESSAGE),
  body("password")
    .isLength({
      min: VALIDATION.PASSWORD.MIN_LENGTH,
      max: VALIDATION.PASSWORD.MAX_LENGTH,
    })
    .matches(VALIDATION.PASSWORD.PATTERN)
    .withMessage(VALIDATION.PASSWORD.ERROR_MESSAGE),
  body("displayName")
    .optional()
    .isLength({
      min: VALIDATION.DISPLAY_NAME.MIN_LENGTH,
      max: VALIDATION.DISPLAY_NAME.MAX_LENGTH,
    })
    .withMessage(VALIDATION.DISPLAY_NAME.ERROR_MESSAGE),
  body("email")
    .optional()
    .matches(VALIDATION.EMAIL.PATTERN)
    .withMessage(VALIDATION.EMAIL.ERROR_MESSAGE),
];

// 認証ミドルウェア
const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    res
      .status(401)
      .json({ success: false, message: "アクセストークンが必要です" });
    return;
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      res.status(403).json({ success: false, message: "無効なトークンです" });
      return;
    }
    req.user = decoded as TokenPayload;
    next();
  });
};

// システム管理者権限チェックミドルウェア
const requireSystemAdmin = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  if (!req.user || req.user.role !== "system_admin") {
    res
      .status(403)
      .json({ success: false, message: "システム管理者権限が必要です" });
    return;
  }
  next();
};

// React ビルドファイルの配信
app.use(express.static(path.join(__dirname, "..", "dist")));

// ファイルパス
const TICKETS_FILE = path.join(__dirname, "config", "tickets.json");
const SETTINGS_FILE = path.join(__dirname, "config", "settings.json");
const USERS_FILE = path.join(__dirname, "config", "users.json");
const PROJECTS_FILE = path.join(__dirname, "config", "projects.json");

// ============ 認証API ============

// ユーザー登録
app.post(
  "/api/register",
  registerValidation,
  async (
    req: RequestWithType<RegisterRequest>,
    res: ResponseWithError<User>,
  ): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          errorCode: "VALIDATION_ERROR",
          message: errors.array()[0].msg,
          errors: errors.array(),
        });
        return;
      }

      const { displayName, email, password } = req.body;

      const userData = await fs.readFile(USERS_FILE, "utf8");
      const users: UsersData = JSON.parse(userData);

      const projectData = await fs.readFile(PROJECTS_FILE, "utf8");
      const projects = JSON.parse(projectData);

      const existingUser = users.users.find(
        (u) => u.email === email || u.displayName === displayName,
      );
      if (existingUser) {
        res.status(409).json({
          success: false,
          errorCode: "CONFLICT_ERROR",
          message: "既に登録済みのメールアドレスまたは表示名です",
        });
        return;
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const newUser: UserWithPassword = {
        id: generateId("user"),
        displayName,
        email,
        password: hashedPassword,
        role: "user",
        projects: ["default"],
        createdAt: new Date().toISOString(),
        lastLogin: null,
      };

      users.users.push(newUser);

      const defaultProject = projects.projects.find(
        (p: Project) => p.id === "default",
      );
      if (defaultProject) {
        if (!defaultProject.members.includes(newUser.id)) {
          defaultProject.members.push(newUser.id);
          defaultProject.lastUpdated = new Date().toISOString();
        }
      }

      users.lastUpdated = new Date().toISOString();
      projects.lastUpdated = new Date().toISOString();

      await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2), "utf8");
      await fs.writeFile(
        PROJECTS_FILE,
        JSON.stringify(projects, null, 2),
        "utf8",
      );

      const userWithoutPassword: User = newUser satisfies User;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      console.error("ユーザー登録エラー:", error);
      res.status(500).json({
        success: false,
        errorCode: "SERVER_ERROR",
        message: "サーバーエラーが発生しました",
      });
    }
  },
);

// ログイン
app.post(
  "/api/login",
  loginValidation,
  async (
    req: RequestWithType<LoginRequest>,
    res: ResponseWithError<LoginResponse>,
  ): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          errorCode: "VALIDATION_ERROR",
          message: errors.array()[0].msg,
          errors: errors.array(),
        });
        return;
      }

      const { email, password, rememberMe } = req.body;

      if (!email || !password) {
        res.status(400).json({
          success: false,
          errorCode: "VALIDATION_ERROR",
          message: "メールアドレスとパスワードを入力してください",
        });
        return;
      }

      const userData = await fs.readFile(USERS_FILE, "utf8");
      const users: UsersData = JSON.parse(userData);

      const user = users.users.find((u) => u.email === email);
      if (!user) {
        res.status(401).json({
          success: false,
          errorCode: "INVALID_CREDENTIALS",
          message: "メールアドレスまたはパスワードが正しくありません",
        });
        return;
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        res.status(401).json({
          success: false,
          errorCode: "INVALID_CREDENTIALS",
          message: "メールアドレスまたはパスワードが正しくありません",
        });
        return;
      }

      const tokenPayload: Omit<TokenPayload, "iat" | "exp"> = {
        id: user.id,
        displayName: user.displayName,
        email: user.email,
        role: user.role || "user",
        projects: user.projects || ["default"],
      };

      const accessToken = jwt.sign(tokenPayload, JWT_SECRET, {
        expiresIn: JWT_EXPIRY.ACCESS_TOKEN,
      });

      const refreshToken = jwt.sign(
        { id: user.id, type: "refresh" },
        JWT_SECRET,
        { expiresIn: rememberMe ? "30d" : JWT_EXPIRY.REFRESH_TOKEN },
      );

      user.lastLogin = new Date().toISOString();
      users.lastUpdated = new Date().toISOString();
      await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2), "utf8");

      const userWithoutPassword: User = user satisfies User;

      res.json({
        token: accessToken,
        refreshToken,
        user: userWithoutPassword,
      });
    } catch (error) {
      console.error(
        "ログインエラー:",
        NODE_ENV === "development" ? error : (error as Error).message,
      );
      res.status(500).json({
        success: false,
        errorCode: "SERVER_ERROR",
        message: "サーバーエラーが発生しました",
      });
    }
  },
);

// トークン検証エンドポイント
app.post(
  "/api/verify-token",
  (req: RequestWithType<void>, res: ResponseWithError<TokenPayload>): void => {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader && authHeader.split(" ")[1];

      if (!token) {
        res.status(401).json({
          success: false,
          errorCode: "VALIDATION_ERROR",
          message: "トークンが提供されていません",
        });
        return;
      }

      jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
          res.status(403).json({
            success: false,
            errorCode: "INVALID_CREDENTIALS",
            message: "トークンが無効です",
          });
          return;
        }

        res.json(decoded as TokenPayload);
      });
    } catch (error) {
      console.error("トークン検証エラー:", error);
      res.status(500).json({
        success: false,
        errorCode: "SERVER_ERROR",
        message: "サーバーエラーが発生しました",
      });
    }
  },
);

// リフレッシュトークン
app.post(
  "/api/refresh",
  async (
    req: RequestWithType<Token>,
    res: ResponseWithError<Token>,
  ): Promise<void> => {
    try {
      const { token } = req.body;

      if (!token) {
        res.status(401).json({
          success: false,
          errorCode: "VALIDATION_ERROR",
          message: "リフレッシュトークンが必要です",
        });
        return;
      }

      const decoded = jwt.verify(token, JWT_SECRET);

      const isTokenPayload = (obj: unknown): obj is JwtPayload => {
        return typeof obj === "object" && obj !== null && "id" in obj;
      };
      const decodedPayload = isTokenPayload(decoded)
        ? (decoded as TokenPayload)
        : null;
      if (!decodedPayload || decodedPayload.type !== "refresh") {
        res.status(403).json({
          success: false,
          errorCode: "INVALID_CREDENTIALS",
          message: "無効なリフレッシュトークンです",
        });
        return;
      }

      const userData = await fs.readFile(USERS_FILE, "utf8");
      const users: UsersData = JSON.parse(userData);
      const user = users.users.find((u) => u.id === decodedPayload.id);

      if (!user) {
        res.status(404).json({
          success: false,
          message: "ユーザーが見つかりません",
        });
        return;
      }

      const newAccessToken = jwt.sign(
        {
          id: user.id,
          displayName: user.displayName,
          email: user.email,
          role: user.role || "user",
          projects: user.projects || ["default"],
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRY.ACCESS_TOKEN },
      );

      res.json({
        token: newAccessToken,
      });
    } catch {
      res.status(403).json({
        success: false,
        errorCode: "INVALID_CREDENTIALS",
        message: "無効なリフレッシュトークンです",
      });
    }
  },
);

// トークン検証
app.post(
  "/api/validate-token",
  authenticateToken,
  (req: Request, res: Response): void => {
    res.json({ success: true, user: req.user });
  },
);

// ログアウト
app.post(
  "/api/logout",
  authenticateToken,
  (_req: Request, res: Response): void => {
    res.json({ success: true, message: "ログアウトしました" });
  },
);

// ============ ユーザーAPI ============

// ユーザー情報取得
app.get(
  "/api/user",
  authenticateToken,
  async (req: Request, res: ResponseWithError<User>): Promise<void> => {
    try {
      const userData = await fs.readFile(USERS_FILE, "utf8");
      const data: UsersData = JSON.parse(userData);

      const user = data.users.find((u) => u.id === req.user?.id);
      if (!user) {
        res.status(404).json({
          success: false,
          errorCode: "USER_NOT_FOUND",
          message: "ユーザーが見つかりません",
        });
        return;
      }

      const userWithoutPassword: User = user satisfies User;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("ユーザー情報取得エラー:", error);
      res.status(500).json({
        success: false,
        errorCode: "SERVER_ERROR",
        message: "ユーザー情報の取得に失敗しました",
      });
    }
  },
);

// プロフィール更新
app.put(
  "/api/user/profile",
  authenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { displayName, email } = req.body as {
        displayName: string;
        email: string;
      };

      if (!displayName || !email) {
        res
          .status(400)
          .json({
            success: false,
            message: "表示名とメールアドレスは必須です",
          });
        return;
      }

      const userData = await fs.readFile(USERS_FILE, "utf8");
      const data: UsersData = JSON.parse(userData);

      const userIndex = data.users.findIndex((u) => u.id === req.user?.id);
      if (userIndex === -1) {
        res
          .status(404)
          .json({ success: false, message: "ユーザーが見つかりません" });
        return;
      }

      const emailExists = data.users.some(
        (u, index) => u.email === email && index !== userIndex,
      );

      if (emailExists) {
        res
          .status(409)
          .json({
            success: false,
            message: "このメールアドレスは既に使用されています",
          });
        return;
      }

      const updatedUser: UserWithPassword = {
        ...data.users[userIndex],
        displayName,
        email,
      };

      data.users[userIndex] = updatedUser;

      await fs.writeFile(USERS_FILE, JSON.stringify(data, null, 2));

      const { password: _, ...userWithoutPassword } = updatedUser;
      res.status(200).json(userWithoutPassword);
    } catch (error) {
      console.error("プロフィール更新エラー:", error);
      res
        .status(500)
        .json({ success: false, message: "プロフィールの更新に失敗しました" });
    }
  },
);

// パスワード変更
app.put(
  "/api/user/password",
  authenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { currentPassword, newPassword } = req.body as {
        currentPassword: string;
        newPassword: string;
      };

      if (!currentPassword || !newPassword) {
        res
          .status(400)
          .json({
            success: false,
            message: "現在のパスワードと新しいパスワードは必須です",
          });
        return;
      }

      const userData = await fs.readFile(USERS_FILE, "utf8");
      const data: UsersData = JSON.parse(userData);

      const user = data.users.find((u) => u.id === req.user?.id);
      if (!user) {
        res
          .status(404)
          .json({ success: false, message: "ユーザーが見つかりません" });
        return;
      }

      const isCurrentPasswordValid = await bcrypt.compare(
        currentPassword,
        user.password,
      );
      if (!isCurrentPasswordValid) {
        res
          .status(400)
          .json({
            success: false,
            message: "現在のパスワードが正しくありません",
          });
        return;
      }

      const hashedNewPassword = await bcrypt.hash(newPassword, 10);

      const userIndex = data.users.findIndex((u) => u.id === req.user?.id);
      data.users[userIndex].password = hashedNewPassword;
      data.lastUpdated = new Date().toISOString();

      await fs.writeFile(USERS_FILE, JSON.stringify(data, null, 2));
      res.status(204).end();
    } catch (error) {
      console.error("パスワード変更エラー:", error);
      res
        .status(500)
        .json({ success: false, message: "パスワードの変更に失敗しました" });
    }
  },
);

// 個人設定保存
app.put(
  "/api/user/settings",
  authenticateToken,
  (_req: Request, res: Response): void => {
    res.json({ success: true, message: "個人設定を保存しました" });
  },
);

// プロジェクトメンバー用ユーザー一覧取得
app.get(
  "/api/users",
  authenticateToken,
  async (req: Request, res: ResponseWithError<User[]>): Promise<void> => {
    try {
      const userData = await fs.readFile(USERS_FILE, "utf8");
      const data: UsersData = JSON.parse(userData);

      const currentUser = data.users.find((u) => u.id === req.user?.id);
      if (!currentUser) {
        res.status(404).json({
          success: false,
          errorCode: "USER_NOT_FOUND",
          message: "ユーザーが見つかりません",
        });
        return;
      }

      const projectUsers = data.users.filter((user) =>
        user.projects.some((project) => currentUser.projects.includes(project)),
      );
      const usersWithoutPasswords: User[] = projectUsers.map((user) => {
        const userWithoutPassword = user satisfies User;
        return userWithoutPassword;
      });

      res.status(200).json(usersWithoutPasswords);
    } catch (error) {
      console.error("ユーザー一覧取得エラー:", error);
      res.status(500).json({
        success: false,
        errorCode: "SERVER_ERROR",
        message: "ユーザー一覧の取得に失敗しました",
      });
    }
  },
);

// ============ 管理者API ============

// 全ユーザーデータ取得
app.get(
  "/api/admin/users",
  authenticateToken,
  requireSystemAdmin,
  async (_req: Request, res: ResponseWithError<User[]>): Promise<void> => {
    try {
      const userData = await fs.readFile(USERS_FILE, "utf8");
      const users: UsersData = JSON.parse(userData);

      const usersWithoutPasswords: User[] = users.users.map((user) => {
        const userWithoutPassword = user satisfies User;
        return userWithoutPassword;
      });

      res.status(200).json(usersWithoutPasswords);
    } catch (error) {
      console.error("管理者データ取得エラー:", error);
      res.status(500).json({
        success: false,
        errorCode: "SERVER_ERROR",
        message: "ユーザーデータの取得に失敗しました",
      });
    }
  },
);

// ユーザー作成
app.post(
  "/api/admin/users",
  authenticateToken,
  requireSystemAdmin,
  async (
    req: RequestWithType<UserPayload>,
    res: ResponseWithError<User>,
  ): Promise<void> => {
    try {
      const { displayName, email, role, password } = req.body;

      if (!displayName || !email || !role || !password) {
        res.status(400).json({
          success: false,
          errorCode: "VALIDATION_ERROR",
          message: "必須項目が不足しています",
        });
        return;
      }

      const userData = await fs.readFile(USERS_FILE, "utf8");
      const data: UsersData = JSON.parse(userData);

      const existingUser = data.users.find(
        (u) => u.email === email || u.displayName === displayName,
      );

      if (existingUser) {
        res.status(409).json({
          success: false,
          errorCode: "CONFLICT_ERROR",
          message: "ユーザー名またはメールアドレスが既に使用されています",
        });
        return;
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const newUser: UserWithPassword = {
        id: generateId("user"),
        displayName,
        email,
        password: hashedPassword,
        role,
        projects: ["default"],
        createdAt: new Date().toISOString(),
        lastLogin: null,
      };

      data.users.push(newUser);
      data.lastUpdated = new Date().toISOString();

      await fs.writeFile(USERS_FILE, JSON.stringify(data, null, 2));

      const userWithoutPassword: User = newUser satisfies User;
      res
        .status(201)
        .location(`/api/admin/users/${newUser.id}`)
        .json(userWithoutPassword);
    } catch (error) {
      console.error("ユーザー作成エラー:", error);
      res.status(500).json({
        success: false,
        errorCode: "SERVER_ERROR",
        message: "ユーザーの作成に失敗しました",
      });
    }
  },
);

// ユーザー更新
app.put(
  "/api/admin/users/:userId",
  authenticateToken,
  requireSystemAdmin,
  async (
    req: RequestWithType<UserPayload>,
    res: ResponseWithError<User>,
  ): Promise<void> => {
    try {
      const { userId } = req.params;
      const { displayName, email, role, password } = req.body;

      if (!displayName || !email || !role) {
        res.status(400).json({
          success: false,
          errorCode: "VALIDATION_ERROR",
          message: "必須項目が不足しています",
        });
        return;
      }

      const userData = await fs.readFile(USERS_FILE, "utf8");
      const data: UsersData = JSON.parse(userData);

      const userIndex = data.users.findIndex((u) => u.id === userId);
      if (userIndex === -1) {
        res.status(404).json({
          success: false,
          errorCode: "USER_NOT_FOUND",
          message: "ユーザーが見つかりません",
        });
        return;
      }

      const emailExists = data.users.some(
        (u, index) => u.email === email && index !== userIndex,
      );

      if (emailExists) {
        res.status(409).json({
          success: false,
          errorCode: "CONFLICT_ERROR",
          message: "このメールアドレスは既に使用されています",
        });
        return;
      }

      const updatedUser: UserWithPassword = {
        ...data.users[userIndex],
        displayName,
        email,
        role,
      };

      if (password) {
        updatedUser.password = await bcrypt.hash(password, 10);
      }

      data.users[userIndex] = updatedUser;
      data.lastUpdated = new Date().toISOString();

      await fs.writeFile(USERS_FILE, JSON.stringify(data, null, 2));

      const userWithoutPassword: User = updatedUser satisfies User;
      res.status(200).json(userWithoutPassword);
    } catch (error) {
      console.error("ユーザー更新エラー:", error);
      res.status(500).json({
        success: false,
        errorCode: "SERVER_ERROR",
        message: "ユーザーの更新に失敗しました",
      });
    }
  },
);

// ユーザー削除
app.delete(
  "/api/admin/users/:userId",
  authenticateToken,
  requireSystemAdmin,
  async (req: Request, res: ResponseWithError<void>): Promise<void> => {
    try {
      const { userId } = req.params;

      if (userId === req.user?.id) {
        res.status(400).json({
          success: false,
          errorCode: "VALIDATION_ERROR",
          message: "自分自身を削除することはできません",
        });
        return;
      }

      const userData = await fs.readFile(USERS_FILE, "utf8");
      const data: UsersData = JSON.parse(userData);

      const userIndex = data.users.findIndex((u) => u.id === userId);
      if (userIndex === -1) {
        res.status(404).json({
          success: false,
          errorCode: "USER_NOT_FOUND",
          message: "ユーザーが見つかりません",
        });
        return;
      }

      data.users.splice(userIndex, 1);
      data.lastUpdated = new Date().toISOString();

      await fs.writeFile(USERS_FILE, JSON.stringify(data, null, 2));

      res.status(204).end();
    } catch (error) {
      console.error("ユーザー削除エラー:", error);
      res.status(500).json({
        success: false,
        errorCode: "SERVER_ERROR",
        message: "ユーザーの削除に失敗しました",
      });
    }
  },
);

// 全プロジェクトデータ取得
app.get(
  "/api/admin/projects",
  authenticateToken,
  requireSystemAdmin,
  (_req: Request, res: ResponseWithError<Project[]>): void => {
    try {
      const projects: Project[] = ProjectOperations.getAll();
      res.status(200).json(projects);
    } catch (error) {
      console.error("プロジェクトデータの取得に失敗: ", error);
      res.status(500).json({
        success: false,
        errorCode: "SERVER_ERROR",
        message: "プロジェクトデータの取得に失敗しました",
      });
    }
  },
);

// プロジェクト作成
app.post(
  "/api/admin/projects",
  authenticateToken,
  requireSystemAdmin,
  async (
    req: RequestWithType<ProjectPayload>,
    res: ResponseWithError<Project>,
  ): Promise<void> => {
    try {
      const { name, description, owner } = req.body;

      if (!name || !owner) {
        res.status(400).json({
          success: false,
          errorCode: "VALIDATION_ERROR",
          message: "必須項目が不足しています",
        });
        return;
      }

      const userData = await fs.readFile(USERS_FILE, "utf8");
      const users: UsersData = JSON.parse(userData);

      const ownerUser = users.users.find((u) => u.id === owner);
      if (!ownerUser) {
        res.status(400).json({
          success: false,
          errorCode: "VALIDATION_ERROR",
          message: "指定されたオーナーが存在しません",
        });
        return;
      }

      const newProject: Project = {
        id: generateId("project"),
        name,
        description: description || "",
        owner,
        members: [owner],
        admins: [owner],
        settings: {
          categories: [...DEFAULT_SETTINGS.categories],
          priorities: getPrioritiesArray(),
          statuses: getStatusesArray(),
          notifications: true,
          autoAssign: false,
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const savedProject = ProjectOperations.add(newProject);

      const ownerIndex = users.users.findIndex((u) => u.id === owner);
      if (ownerIndex !== -1) {
        if (!users.users[ownerIndex].projects) {
          users.users[ownerIndex].projects = [];
        }
        if (!users.users[ownerIndex].projects.includes(savedProject.id)) {
          users.users[ownerIndex].projects.push(savedProject.id);
        }
      }

      users.lastUpdated = new Date().toISOString();

      await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));

      res
        .status(201)
        .location(`/api/projects/${savedProject.id}`)
        .json(savedProject);
    } catch (error) {
      console.error("プロジェクト作成エラー:", error);
      res.status(500).json({
        success: false,
        errorCode: "SERVER_ERROR",
        message: "プロジェクトの作成に失敗しました",
      });
    }
  },
);

// プロジェクト更新
app.put(
  "/api/admin/projects/:projectId",
  authenticateToken,
  requireSystemAdmin,
  async (
    req: RequestWithType<ProjectPayload>,
    res: ResponseWithError<Project>,
  ): Promise<void> => {
    try {
      const { projectId } = req.params;
      const { name, description, owner } = req.body;

      if (!name || !owner) {
        res.status(400).json({
          success: false,
          errorCode: "VALIDATION_ERROR",
          message: "必須項目が不足しています",
        });
        return;
      }

      const userData = await fs.readFile(USERS_FILE, "utf8");
      const users: UsersData = JSON.parse(userData);
      const projects = ProjectOperations.getAll();

      const projectIndex = projects?.findIndex((p) => p.id === projectId);
      if (projectIndex === -1 || !projects) {
        res.status(404).json({
          success: false,
          message: "プロジェクトが見つかりません",
        });
        return;
      }

      const ownerUser = users.users.find((u) => u.id === owner);
      if (!ownerUser) {
        res.status(400).json({
          success: false,
          errorCode: "VALIDATION_ERROR",
          message: "指定されたオーナーが存在しません",
        });
        return;
      }

      const updatedProject = ProjectOperations.update(projectId, {
        name,
        description: description || "",
        owner,
      });

      if (!updatedProject) {
        res.status(404).json({
          success: false,
          message: "プロジェクトの更新に失敗しました",
        });
        return;
      }

      res.status(200).json(updatedProject);
    } catch (error) {
      console.error("プロジェクト更新エラー:", error);
      res.status(500).json({
        success: false,
        errorCode: "SERVER_ERROR",
        message: "プロジェクトの更新に失敗しました",
      });
    }
  },
);

// プロジェクト削除
app.delete(
  "/api/admin/projects/:projectId",
  authenticateToken,
  requireSystemAdmin,
  async (req: Request, res: ResponseWithError<void>): Promise<void> => {
    try {
      const { projectId } = req.params;

      if (projectId === "default") {
        res.status(400).json({
          success: false,
          errorCode: "VALIDATION_ERROR",
          message: "デフォルトプロジェクトは削除できません",
        });
        return;
      }

      const userData = await fs.readFile(USERS_FILE, "utf8");
      const users: UsersData = JSON.parse(userData);
      const projects = ProjectOperations.getAll();

      const projectIndex = projects?.findIndex((p) => p.id === projectId);
      if (projectIndex === -1 || !projects) {
        res.status(404).json({
          success: false,
          message: "プロジェクトが見つかりません",
        });
        return;
      }

      ProjectOperations.delete(projectId);

      users.users.forEach((user) => {
        if (user.projects) {
          user.projects = user.projects.filter((p) => p !== projectId);
        }
      });

      users.lastUpdated = new Date().toISOString();

      await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));

      res.status(204).end();
    } catch (error) {
      console.error("プロジェクト削除エラー:", error);
      res.status(500).json({
        success: false,
        errorCode: "SERVER_ERROR",
        message: "プロジェクトの削除に失敗しました",
      });
    }
  },
);

// システム設定保存
app.put(
  "/api/admin/system-settings",
  authenticateToken,
  requireSystemAdmin,
  (_req: Request, res: Response): void => {
    res.json({ success: true, message: "システム設定を保存しました" });
  },
);

// バックアップ作成
app.post(
  "/api/admin/backup",
  authenticateToken,
  requireSystemAdmin,
  async (_req: Request, res: Response): Promise<void> => {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const backupDir = path.join(__dirname, "config", "backups");

      await fs.mkdir(backupDir, { recursive: true });

      const userData = await fs.readFile(USERS_FILE, "utf8");
      const tasksData = await fs.readFile(TICKETS_FILE, "utf8");
      const settingsData = await fs.readFile(SETTINGS_FILE, "utf8");
      const projectsData = await fs.readFile(PROJECTS_FILE, "utf8");

      const backupData = {
        users: JSON.parse(userData),
        tasks: JSON.parse(tasksData),
        settings: JSON.parse(settingsData),
        projects: JSON.parse(projectsData),
        backupDate: new Date().toISOString(),
      };

      const backupFileName = `backup-${timestamp}.json`;
      const backupPath = path.join(backupDir, backupFileName);

      await fs.writeFile(backupPath, JSON.stringify(backupData, null, 2));

      res.json({
        success: true,
        message: "バックアップを作成しました",
        filename: backupFileName,
      });
    } catch (error) {
      console.error("バックアップ作成エラー:", error);
      res
        .status(500)
        .json({ success: false, message: "バックアップの作成に失敗しました" });
    }
  },
);

// データバックアップダウンロード
app.get(
  "/api/admin/backup/download/data",
  authenticateToken,
  requireSystemAdmin,
  async (_req: Request, res: Response): Promise<void> => {
    try {
      const userData = await fs.readFile(USERS_FILE, "utf8");
      const tasksData = await fs.readFile(TICKETS_FILE, "utf8");
      const projectsData = await fs.readFile(PROJECTS_FILE, "utf8");

      const backupData = {
        users: JSON.parse(userData),
        tasks: JSON.parse(tasksData),
        projects: JSON.parse(projectsData),
        exportDate: new Date().toISOString(),
      };

      res.setHeader("Content-Type", "application/json");
      res.setHeader(
        "Content-Disposition",
        'attachment; filename="nulltasker-data-backup.json"',
      );
      res.send(JSON.stringify(backupData, null, 2));
    } catch (error) {
      console.error("データバックアップダウンロードエラー:", error);
      res
        .status(500)
        .json({
          success: false,
          message: "データバックアップの取得に失敗しました",
        });
    }
  },
);

// 設定バックアップダウンロード
app.get(
  "/api/admin/backup/download/settings",
  authenticateToken,
  requireSystemAdmin,
  async (_req: Request, res: Response): Promise<void> => {
    try {
      const settingsData = await fs.readFile(SETTINGS_FILE, "utf8");

      const backupData = {
        settings: JSON.parse(settingsData),
        exportDate: new Date().toISOString(),
      };

      res.setHeader("Content-Type", "application/json");
      res.setHeader(
        "Content-Disposition",
        'attachment; filename="nulltasker-settings-backup.json"',
      );
      res.send(JSON.stringify(backupData, null, 2));
    } catch (error) {
      console.error("設定バックアップダウンロードエラー:", error);
      res
        .status(500)
        .json({
          success: false,
          message: "設定バックアップの取得に失敗しました",
        });
    }
  },
);

// データ復元
app.post(
  "/api/admin/restore",
  authenticateToken,
  requireSystemAdmin,
  (_req: Request, res: Response): void => {
    res.json({ success: true, message: "データ復元機能は今後実装予定です" });
  },
);

// ============ 設定API ============

app.get(
  "/api/settings",
  authenticateToken,
  async (_req: Request, res: Response): Promise<void> => {
    try {
      const data = await fs.readFile(SETTINGS_FILE, "utf8");
      const settings = JSON.parse(data);
      res.json(settings);
    } catch (error) {
      console.error("設定読み込みエラー:", error);
      res
        .status(500)
        .json({ success: false, message: "設定の読み込みに失敗しました" });
    }
  },
);

// ============ タスクAPI ============

app.get(
  "/api/tasks",
  authenticateToken,
  (req: Request, res: ResponseWithError<Ticket[]>): void => {
    try {
      debugLog("タスク取得リクエスト受信:", req.user?.id);

      const tickets = TicketOperations.getAll();

      debugLog("タスク取得成功:", tickets.length, "件");

      res.json(tickets);
    } catch (error) {
      console.error("タスク読み込みエラー:", (error as Error).message);
      res.status(500).json({
        success: false,
        errorCode: "SERVER_ERROR",
        message: "タスクの読み込みに失敗しました",
      });
    }
  },
);

app.post(
  "/api/tasks",
  authenticateToken,
  (
    req: RequestWithType<TicketPayload>,
    res: ResponseWithError<Ticket>,
  ): void => {
    try {
      const payload = req.body;

      const allTickets = TicketOperations.getAll();
      const existingTask = allTickets.find(
        (task) =>
          task.title === payload.title && task.project === payload.project,
      );

      if (existingTask) {
        res.status(409).json({
          success: false,
          errorCode: "VALIDATION_ERROR",
          message: "同名のタスクが存在します",
        });
        return;
      }

      const newTask: Ticket = {
        id: generateId("task"),
        project: payload.project || "",
        title: payload.title || "Untitled",
        description: payload.description || "",
        assignee: payload.assignee || "",
        category: payload.category || "",
        priority: payload.priority || "medium",
        status: payload.status || "todo",
        progress: parseInt(String(payload.progress)) || 0,
        start_date: payload.start_date || null,
        due_date: payload.due_date || null,
        estimated_hours: parseFloat(String(payload.estimated_hours)) || 0,
        actual_hours: parseFloat(String(payload.actual_hours)) || 0,
        tags: Array.isArray(payload.tags) ? payload.tags : [],
        parent_task: payload.parent_task || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const savedTask = TicketOperations.create(newTask);

      debugLog("タスクが正常に保存されました:", savedTask.id);

      res.status(201).location(`/api/tasks/${savedTask.id}`).json(savedTask);
    } catch (error) {
      console.error("タスク保存エラー:", (error as Error).message);
      res.status(500).json({
        success: false,
        errorCode: "SERVER_ERROR",
        message: "タスクの保存に失敗しました",
      });
    }
  },
);

app.put(
  "/api/tasks/:ticketId",
  authenticateToken,
  (
    req: RequestWithType<TicketPayload>,
    res: ResponseWithError<Ticket>,
  ): void => {
    try {
      const { ticketId } = req.params;
      const payload = req.body;

      const existingTicket = TicketOperations.getById(ticketId);
      if (!existingTicket) {
        res.status(404).json({
          success: false,
          message: "チケットが見つかりません",
        });
        return;
      }

      const updateData: Ticket = {
        ...existingTicket,
        ...payload,
        updated_at: new Date().toISOString(),
      };

      const updatedTask = TicketOperations.update(ticketId, updateData);

      if (!updatedTask) {
        res.status(404).json({
          success: false,
          message: "チケットの更新に失敗しました",
        });
        return;
      }

      res.status(200).json(updatedTask);
    } catch (error) {
      console.error("チケット更新エラー:", error);
      res.status(500).json({
        success: false,
        errorCode: "SERVER_ERROR",
        message: "チケットの更新に失敗しました",
      });
    }
  },
);

app.delete(
  "/api/tasks/:ticketId",
  authenticateToken,
  (req: Request, res: ResponseWithError<void>): void => {
    try {
      const { ticketId } = req.params;

      const deleted = TicketOperations.delete(ticketId);

      if (!deleted) {
        res
          .status(404)
          .json({ success: false, message: "チケットが見つかりません" });
        return;
      }

      res.status(204).end();
    } catch (error) {
      console.error("チケット削除エラー:", error);
      res.status(500).json({
        success: false,
        errorCode: "SERVER_ERROR",
        message: "チケットの削除に失敗しました",
      });
    }
  },
);

// バックアップファイルの作成
app.post(
  "/api/backup",
  authenticateToken,
  async (_req: Request, res: Response): Promise<void> => {
    try {
      const tickets = TicketOperations.getAll();

      const backupData = {
        tasks: tickets,
        lastUpdated: new Date().toISOString(),
      };

      const backupFile = path.join(
        __dirname,
        "config",
        "backups",
        `backup_tickets_${Date.now()}.json`,
      );

      const backupDir = path.dirname(backupFile);
      await fs.mkdir(backupDir, { recursive: true });

      await fs.writeFile(
        backupFile,
        JSON.stringify(backupData, null, 2),
        "utf8",
      );

      res.json({ success: true, backupFile: path.basename(backupFile) });
    } catch (error) {
      console.error("バックアップ作成エラー:", error);
      res.status(500).json({
        success: false,
        errorCode: "SERVER_ERROR",
        message: "バックアップの作成に失敗しました",
      });
    }
  },
);

// ============ プロジェクトAPI ============

app.get(
  "/api/projects",
  authenticateToken,
  (req: Request, res: ResponseWithError<Project[]>): void => {
    try {
      const projects = ProjectOperations.getAll();
      const filtered = projects.filter((p) =>
        p.members.includes(req.user?.id || ""),
      );
      res.status(200).json(filtered);
    } catch (error) {
      console.error("プロジェクトデータの取得に失敗: ", error);
      res.status(500).json({
        success: false,
        errorCode: "SERVER_ERROR",
        message: "プロジェクトデータの取得に失敗しました",
      });
    }
  },
);

app.get(
  "/api/projects/:projectId",
  authenticateToken,
  (req: Request, res: ResponseWithError<Project>): void => {
    try {
      const { projectId } = req.params;
      const project = ProjectOperations.getById(projectId);

      if (!project || !project.members.includes(req.user?.id || "")) {
        res
          .status(404)
          .json({ success: false, message: "プロジェクトが見つかりません" });
        return;
      }

      res.status(200).json(project);
    } catch (error) {
      console.error("プロジェクトデータの取得に失敗: ", error);
      res.status(500).json({
        success: false,
        errorCode: "SERVER_ERROR",
        message: "プロジェクトデータ取得に失敗しました",
      });
    }
  },
);

// SPA fallback
app.get("*", (_req: Request, res: Response): void => {
  res.sendFile(path.join(__dirname, "..", "dist", "index.html"));
});

// ============ サーバー起動 ============

if (USE_HTTPS) {
  const sslKeyPath = path.join(__dirname, "..", "ssl", "server.key");
  const sslCertPath = path.join(__dirname, "..", "ssl", "server.cert");

  if (!fsSync.existsSync(sslKeyPath) || !fsSync.existsSync(sslCertPath)) {
    console.error("エラー: SSL証明書が見つかりません。");
    console.error("以下のコマンドでSSL証明書を生成してください:");
    console.error("  npm run generate-cert");
    process.exit(1);
  }

  const httpsOptions = {
    key: fsSync.readFileSync(sslKeyPath),
    cert: fsSync.readFileSync(sslCertPath),
  };

  https.createServer(httpsOptions, app).listen(HTTPS_PORT, () => {
    console.log(`HTTPSサーバーが起動しました: https://localhost:${HTTPS_PORT}`);
    console.log(`tickets.jsonファイル: ${TICKETS_FILE}`);
    console.log(`settings.jsonファイル: ${SETTINGS_FILE}`);
    console.log(
      `静的ファイルディレクトリ: ${path.join(__dirname, "..", "dist")}`,
    );
    console.log("\n警告: 自己署名証明書を使用しています。");
    console.log(
      "ブラウザで証明書の警告が表示される場合は、例外として承認してください。",
    );
  });

  if (process.env.REDIRECT_HTTP !== "false") {
    http
      .createServer((req, res) => {
        const host =
          req.headers.host?.replace(`:${PORT}`, `:${HTTPS_PORT}`) ||
          `localhost:${HTTPS_PORT}`;
        res.writeHead(301, {
          Location: `https://${host}${req.url}`,
        });
        res.end();
      })
      .listen(PORT, () => {
        console.log(
          `HTTPリダイレクトサーバーが起動しました: http://localhost:${PORT} -> https://localhost:${HTTPS_PORT}`,
        );
      });
  }
} else {
  app.listen(PORT, () => {
    console.log(`HTTPサーバーが起動しました: http://localhost:${PORT}`);
    console.log(
      `データベースファイル: ${path.join(__dirname, "db", "nulltasker.db")}`,
    );
    console.log(`settings.jsonファイル: ${SETTINGS_FILE}`);
    console.log(
      `静的ファイルディレクトリ: ${path.join(__dirname, "..", "dist")}`,
    );
  });
}

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("\nサーバーをシャットダウンしています...");
  closeDatabase();
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\nサーバーをシャットダウンしています...");
  closeDatabase();
  process.exit(0);
});
