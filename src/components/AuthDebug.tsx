import React, { useEffect, useState } from "react";

/**
 * 認証デバッグコンポーネント
 * ブラウザコンソールとUIで認証状態を確認
 */
export const AuthDebug: React.FC = () => {
  const [authInfo, setAuthInfo] = useState({
    hasToken: false,
    hasUser: false,
    hasRefreshToken: false,
    token: "",
    user: null as any,
  });

  const checkAuth = () => {
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");
    const refreshToken = localStorage.getItem("refreshToken");

    const info = {
      hasToken: !!token,
      hasUser: !!user,
      hasRefreshToken: !!refreshToken,
      token: token?.substring(0, 20) + "..." || "なし",
      user: user ? JSON.parse(user) : null,
    };

    setAuthInfo(info);

    console.log("[AuthDebug] 認証情報:", {
      トークン: token ? "あり" : "なし",
      ユーザー: user ? JSON.parse(user) : "なし",
      リフレッシュトークン: refreshToken ? "あり" : "なし",
    });

    return info;
  };

  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        top: 10,
        right: 10,
        background: "#1f2937",
        color: "#fff",
        padding: "16px",
        borderRadius: "8px",
        fontSize: "12px",
        fontFamily: "monospace",
        maxWidth: "300px",
        zIndex: 9999,
        boxShadow: "0 4px 6px rgba(0,0,0,0.3)",
      }}
    >
      <div
        style={{ fontWeight: "bold", marginBottom: "8px", fontSize: "14px" }}
      >
        🔐 認証デバッグ
      </div>
      <div style={{ marginBottom: "4px" }}>
        トークン: {authInfo.hasToken ? "✅ あり" : "❌ なし"}
      </div>
      <div style={{ marginBottom: "4px" }}>
        ユーザー: {authInfo.hasUser ? "✅ あり" : "❌ なし"}
      </div>
      <div style={{ marginBottom: "8px" }}>
        リフレッシュ: {authInfo.hasRefreshToken ? "✅ あり" : "❌ なし"}
      </div>
      {authInfo.user && (
        <div
          style={{
            background: "#374151",
            padding: "8px",
            borderRadius: "4px",
            marginBottom: "8px",
          }}
        >
          <div>ID: {authInfo.user.id}</div>
          <div>表示名: {authInfo.user.displayName}</div>
          <div>ロール: {authInfo.user.role}</div>
        </div>
      )}
      <button
        onClick={checkAuth}
        style={{
          background: "#3b82f6",
          color: "#fff",
          border: "none",
          padding: "6px 12px",
          borderRadius: "4px",
          cursor: "pointer",
          width: "100%",
          fontSize: "12px",
        }}
      >
        更新
      </button>
    </div>
  );
};

export default AuthDebug;
