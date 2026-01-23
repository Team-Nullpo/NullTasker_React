import axios, { AxiosInstance } from "axios";

// 開発環境ではViteのproxyを使用するため、相対パスを使用
const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";

// Axiosインスタンスの作成
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// リクエストインターセプター：トークンを自動的に付与
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log("[apiClient] リクエスト送信:", config.url, "トークンあり");
    } else {
      console.warn("[apiClient] リクエスト送信:", config.url, "トークンなし");
    }
    return config;
  },
  (error) => {
    console.error("[apiClient] リクエストエラー:", error);
    return Promise.reject(error);
  },
);

// レスポンスインターセプター：エラーハンドリング
apiClient.interceptors.response.use(
  (response) => {
    console.log(
      "[apiClient] レスポンス成功:",
      response.config.url,
      response.status,
    );
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;
    const url = originalRequest?.url;

    console.error("[apiClient] レスポンスエラー:", {
      url,
      status,
      message: error.message,
      response: error.response?.data,
    });

    // 403エラー（権限不足）の場合
    if (status === 403) {
      console.error("[apiClient] 403 Forbidden: アクセス権限がありません");
      const token = localStorage.getItem("token");
      if (!token) {
        console.error(
          "[apiClient] トークンが存在しません。ログインページへリダイレクトします。",
        );
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("refreshToken");
        window.location.href = "/login";
      }
      return Promise.reject(error);
    }

    // 401エラーでリフレッシュトークンがある場合、トークンをリフレッシュ
    if (status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      console.log("[apiClient] 401エラー: トークンリフレッシュを試行");

      try {
        const refreshToken = localStorage.getItem("refreshToken");
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/refresh`, {
            refreshToken,
          });

          if (response.data.success) {
            const newToken = response.data.token;
            localStorage.setItem("token", newToken);
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            console.log("[apiClient] トークンリフレッシュ成功");
            return apiClient(originalRequest);
          }
        } else {
          console.error("[apiClient] リフレッシュトークンが存在しません");
        }
      } catch (refreshError) {
        console.error("[apiClient] トークンリフレッシュ失敗:", refreshError);
        // リフレッシュ失敗時はログアウト
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("refreshToken");
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

export default apiClient;
