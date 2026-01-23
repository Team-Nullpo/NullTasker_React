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
        color: "#e5e7eb",
        padding: "16px",
        borderRadius: "8px",
        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
        fontSize: "14px",
        minWidth: "300px",
        zIndex: 9999,
      }}
    >
      <div
        style={{
          fontWeight: "bold",
          marginBottom: "12px",
          borderBottom: "1px solid #4b5563",
          paddingBottom: "8px",
        }}
      >
        🔐 認証デバッグ
      </div>
      <div style={{ marginBottom: "8px" }}>
        <span style={{ fontWeight: "500" }}>トークン: </span>
        <span style={{ color: authInfo.hasToken ? "#10b981" : "#ef4444" }}>
          {authInfo.hasToken ? "✓ あり" : "✗ なし"}
        </span>
      </div>
      <div style={{ marginBottom: "8px" }}>
        <span style={{ fontWeight: "500" }}>ユーザー: </span>
        <span style={{ color: authInfo.hasUser ? "#10b981" : "#ef4444" }}>
          {authInfo.hasUser ? "✓ あり" : "✗ なし"}
        </span>
      </div>
      {authInfo.user && (
        <div style={{ marginBottom: "8px", fontSize: "12px" }}>
          <div>ID: {authInfo.user.loginId}</div>
          <div>表示名: {authInfo.user.displayName}</div>
          <div>権限: {authInfo.user.role}</div>
        </div>
      )}
      <div style={{ marginBottom: "8px" }}>
        <span style={{ fontWeight: "500" }}>リフレッシュトークン: </span>
        <span
          style={{
            color: authInfo.hasRefreshToken ? "#10b981" : "#ef4444",
          }}
        >
          {authInfo.hasRefreshToken ? "✓ あり" : "✗ なし"}
        </span>
      </div>
      <button
        onClick={checkAuth}
        style={{
          marginTop: "8px",
          padding: "6px 12px",
          background: "#3b82f6",
          color: "white",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
          width: "100%",
        }}
      >
        🔄 再確認
      </button>
    </div>
  );
};
