import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useNavigate } from "react-router-dom";
import type { User } from "@nulltasker/shared-types";
import type { AuthContextType } from "@/shared/types";
import * as authService from "../services/authService";
import { isErrorResponse } from "@/shared/utils";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // 初期化時にトークンとユーザー情報を復元
  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedToken = localStorage.getItem("token");
        const storedUser = localStorage.getItem("user");

        if (storedToken && storedUser) {
          // トークンの検証
          const isValid = await authService.validateToken(storedToken);
          if (isValid) {
            setToken(storedToken);
            setUser(JSON.parse(storedUser));
          } else {
            // トークンが無効な場合はクリア
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            localStorage.removeItem("refreshToken");
          }
        }
      } catch (error) {
        console.error("認証の初期化エラー:", error);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("refreshToken");
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string, rememberMe = false) => {
    try {
      const response = await authService.login({
        email,
        password,
        rememberMe,
      });

      if (isErrorResponse(response)) {
        throw new Error(response.message || "ログインに失敗しました");
      }
      setToken(response.token);
      setUser(response.user);

      // ローカルストレージに保存
      localStorage.setItem("token", response.token);
      localStorage.setItem("user", JSON.stringify(response.user));

      if (rememberMe && response.refreshToken) {
        localStorage.setItem("refreshToken", response.refreshToken);
      }

      navigate("/");
    } catch (error) {
      console.error("ログインエラー:", error);
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("refreshToken");
    navigate("/login");
  };

  const value: AuthContextType = {
    user,
    token,
    login,
    logout,
    isAuthenticated: !!user && !!token,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
