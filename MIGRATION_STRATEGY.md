# 🔄 React移行完了ガイド

## ✅ 移行完了

プロジェクトは**React標準構造への移行が完了**しました：

```
✅ 新しいコード: src/             (TypeScript + React)
📦 アーカイブ:   archive/          (旧コード保管)
✅ バックエンド:   server/          (整理済み)
```

## 📁 新しいディレクトリ構造

```
NullTasker_React/
├── src/                          # React アプリケーション
│   ├── components/              # Reactコンポーネント
│   ├── contexts/                # Contextプロバイダー
│   ├── pages/                   # ページコンポーネント
│   ├── services/                # API通信サービス
│   ├── styles/                  # スタイルシート
│   ├── types/                   # TypeScript型定義
│   ├── App.tsx                  # メインAppコンポーネント
│   └── main.tsx                 # エントリーポイント
├── public/                      # 静的ファイル
├── server/                      # バックエンド
│   ├── config/                 # JSONデータ
│   ├── server.js               # Express サーバー
│   └── server-constants.js     # 定数定義
├── archive/                     # 旧ファイル保管
│   ├── old-src/                # 旧フロントエンド
│   └── old-config/             # 旧設定ファイル
├── docs/                        # ドキュメント
├── scripts/                     # ユーティリティスクリプト
├── ssl/                         # SSL証明書
├── index.html                   # HTML エントリーポイント
├── vite.config.ts               # Vite設定
├── tsconfig.json                # TypeScript設定
└── package.json                 # 依存関係
```

## 🚀 開発の始め方

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 開発サーバーの起動

```bash
npm run dev
```

これにより以下が起動します：

- **Vite開発サーバー**: http://localhost:5173 (React HMR付き)
- **Express APIサーバー**: https://localhost:3443 (または http://localhost:3000)

### 3. ビルド

```bash
npm run build
```

ビルドされたファイルは `dist/` ディレクトリに出力されます。

### 4. 本番環境での起動

```bash
npm start
```

## 📋 旧ファイルの扱い方

旧ファイルは `archive/` ディレクトリに保管されています：

- **`archive/old-src/`** - 旧フロントエンド（Vanilla JavaScript）
- **`archive/old-config/`** - 旧設定ファイル

これらは参考資料として保管されており、必要に応じて確認できます。
新しい機能実装時に旧コードのロジックを参照する場合に使用してください。

## 🗂️ ファイル対応表

詳細は **[OLD_FILES_MAPPING.md](./OLD_FILES_MAPPING.md)** を参照

## 🎯 開発フェーズ

### Phase 1: 基盤（✅ 完了）

- [x] プロジェクト構造のReact化
- [x] TypeScript 設定
- [x] 認証システム
- [x] ルーティング
- [x] ディレクトリ構造の標準化

### Phase 2: コアページ（🚧 進行中）

- [ ] ダッシュボード
- [ ] タスク管理
- [ ] 共通レイアウト（サイドバー、ヘッダー）

### Phase 3: 詳細機能（📅 未着手）

- [ ] ガントチャート
- [ ] カレンダー
- [ ] 設定管理
- [ ] ユーザープロフィール

### Phase 4: 管理機能（📅 未着手）

- [ ] 管理者ダッシュボード
- [ ] ユーザー管理
- [ ] プロジェクト管理

## ⚠️ 重要なルール

### ✅ DO（推奨）

- 新しいコードは `src/` に書く
- 旧ファイルは `archive/` から参照のみ
- 機能ごとに段階的に実装する
- コミット前に動作確認を行う
- TypeScriptの型を適切に定義する

### ❌ DON'T（非推奨）

- `archive/` ディレクトリのファイルを編集しない
- 型定義なしでコードを書かない
- ビルドエラーを無視しない

## 🎓 学習リソース

実装の参考に：

- **認証の実装**: [src/contexts/AuthContext.tsx](src/contexts/AuthContext.tsx)
- **ページコンポーネント**: [src/pages/LoginPage.tsx](src/pages/LoginPage.tsx)
- **API通信**: [src/services/authService.ts](src/services/authService.ts)
- **レイアウト**: [src/components/Layout/Layout.tsx](src/components/Layout/Layout.tsx)

## 📞 サポート

質問や問題がある場合：

1. [IMPLEMENTATION_STATUS.md](./IMPLEMENTATION_STATUS.md) で実装状況を確認
2. [OLD_FILES_MAPPING.md](./OLD_FILES_MAPPING.md) で対応関係を確認
3. Issue を作成して相談

---

**Team Nullpo** - 段階的移行を成功させましょう！🚀
