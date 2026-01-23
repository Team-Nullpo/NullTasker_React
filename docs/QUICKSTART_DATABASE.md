# SQLiteデータベース クイックスタートガイド

## セットアップ

### 1. パッケージのインストール

```bash
npm install
```

### 2. データベースの初期化

```bash
npm run db:init
```

## 基本的な使い方

### サーバーの起動

```bash
# 開発モード（フロントエンド + バックエンド）
npm run dev

# HTTPSなしで起動
npm run start:http
```

### データの移行（既存のJSONファイルがある場合）

```bash
npm run db:migrate
```

### データのエクスポート（バックアップ）

```bash
npm run db:export
```

## APIの使用例

### チケットの作成

```bash
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "project": "project_123",
    "title": "新しいバグ修正",
    "description": "ログイン画面のバグを修正",
    "assignee": "user_456",
    "category": "bug",
    "priority": "high",
    "status": "todo",
    "progress": 0,
    "start_date": "2026-01-22",
    "due_date": "2026-01-25",
    "estimated_hours": 4,
    "tags": ["bug", "urgent", "frontend"]
  }'
```

### チケットの一覧取得

```bash
curl http://localhost:3000/api/tasks \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### チケットの更新

```bash
curl -X PUT http://localhost:3000/api/tasks/task_123 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "status": "in_progress",
    "progress": 50,
    "actual_hours": 2
  }'
```

### チケットの削除

```bash
curl -X DELETE http://localhost:3000/api/tasks/task_123 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## データベース管理

### データベースファイルの場所

- メインDB: `server/db/nulltasker.db`
- WALファイル: `server/db/nulltasker.db-wal`
- SHMファイル: `server/db/nulltasker.db-shm`

### SQLiteコマンドラインでの確認

```bash
# SQLiteをインストール（まだの場合）
sudo apt install sqlite3  # Linux
brew install sqlite3      # macOS

# データベースを開く
sqlite3 server/db/nulltasker.db

# テーブル一覧を表示
.tables

# テーブル構造を表示
.schema tickets

# データを確認
SELECT * FROM tickets;

# 終了
.exit
```

## よくある質問

### Q: データベースをリセットするには？

```bash
rm server/db/nulltasker.db*
npm run db:init
```

### Q: JSONファイルとSQLiteを併用できますか？

A: いいえ。このシステムはSQLiteのみを使用します。既存のJSONデータは `npm run db:migrate` で一度だけ移行してください。

### Q: バックアップはどうすれば？

```bash
# JSONフォーマットでエクスポート
npm run db:export

# データベースファイルを直接コピー（推奨）
cp server/db/nulltasker.db server/db/nulltasker.db.backup
```

### Q: 本番環境での注意点は？

1. データベースファイルのアクセス権限を適切に設定
2. 定期的なバックアップを実行
3. 必要に応じてSQLiteの設定を最適化
4. ログを監視してエラーを検出

## トラブルシューティング

### データベースがロックされている

```bash
# WALファイルをクリーンアップ
sqlite3 server/db/nulltasker.db "PRAGMA wal_checkpoint(FULL);"
```

### マイグレーションエラー

JSONファイルのフォーマットを確認してください：

```json
{
  "tasks": [
    {
      "id": "task_123",
      "project": "project_456",
      "title": "タスク名",
      ...
    }
  ],
  "lastUpdated": "2026-01-22T00:00:00.000Z"
}
```

## 詳細ドキュメント

詳細については [DATABASE.md](./DATABASE.md) を参照してください。
