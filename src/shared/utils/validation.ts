/**
 * メールアドレスの検証
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * パスワードの検証
 */
export const isValidPassword = (password: string): boolean => {
  return password.length >= 8;
};

/**
 * ログインIDの検証
 */
export const isValidLoginId = (loginId: string): boolean => {
  const loginIdRegex = /^[a-zA-Z0-9_]{3,20}$/;
  return loginIdRegex.test(loginId);
};
