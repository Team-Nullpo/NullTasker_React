import { useState, FormEvent } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import "@/shared/styles/login.css";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await login(email, password, rememberMe);
    } catch (err: any) {
      setError(
        err.response?.data?.message || err.message || "ログインに失敗しました",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>NullTasker</h1>
          <p>タスク管理システム</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && <div className="error-message">{error}</div>}

          <div className="form-group">
            <label htmlFor="email">メールアドレス</label>
            <input
              type="text"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">パスワード</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          <div className="form-group-checkbox">
            <label>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                disabled={isLoading}
              />
              ログイン状態を保持する
            </label>
          </div>

          <button type="submit" className="btn-primary" disabled={isLoading}>
            {isLoading ? "ログイン中..." : "ログイン"}
          </button>
        </form>

        <div className="login-footer">
          <p>
            アカウントをお持ちでないですか？{" "}
            <Link to="/register">新規登録</Link>
          </p>
        </div>
        <div className="login-info">
          <p>デフォルト管理者アカウント:</p>
          <p>
            メールアドレス: <strong>admin@n.c</strong> / パスワード:{" "}
            <strong>admin123</strong>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
