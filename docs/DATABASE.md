# NullTasker SQLiteデータベース

## 概要

NullTaskerのチケット管理システムは、SQLiteデータベースを使用してデータを永続化します。

## データベース構造

### ticketsテーブル

| カラム名        | 型      | 説明                                  |
| --------------- | ------- | ------------------------------------- |
| id              | TEXT    | 主キー（一意のチケットID）            |
| project         | TEXT    | プロジェクトID                        |
| title           | TEXT    | チケットタイトル                      |
| description     | TEXT    | チケットの詳細説明                    |
| assignee        | TEXT    | 担当者のユーザーID                    |
| category        | TEXT    | カテゴリ                              |
| priority        | TEXT    | 優先度（low, medium, high）           |
| status          | TEXT    | ステータス（todo, in_progress, done） |
| progress        | INTEGER | 進捗率（0-100）                       |
| start_date      | TEXT    | 開始日（ISO 8601形式）                |
| due_date        | TEXT    | 期限日（ISO 8601形式）                |
| estimated_hours | REAL    | 見積工数（時間）                      |
| actual_hours    | REAL    | 実績工数（時間）                      |
| tags            | TEXT    | タグ（JSON配列形式）                  |
| parent_task     | TEXT    | 親タスクID（外部キー）                |
| created_at      | TEXT    | 作成日時（自動設定）                  |
| updated_at      | TEXT    | 更新日時（自動更新）                  |

## セットアップ

### 1. データベースの初期化

```bash
npm run db:init
```

このコマンドは以下を実行します：

- データベースファイル `server/db/nulltasker.db` を作成
- `tickets` テーブルを作成
- インデックスを作成（パフォーマンス向上）
- トリガーを設定（自動更新）

### 2. 既存データの移行

既存のJSONファイル（`server/config/tickets.json`）からSQLiteへデータを移行する場合：

```bash
npm run db:migrate
```

このコマンドは：

- `server/config/tickets.json` を読み込み
- データをSQLiteデータベースに移行
- 重複チェックを実行
- 移行結果を表示

### 3. データのエクスポート

SQLiteデータベースからJSONファイルへエクスポート（バックアップ用）：

```bash
npm run db:export
```

このコマンドは：

- データベースからすべてのチケットを取得
- `server/config/tickets-export.json` にエクスポート
- JSONフォーマットで保存

## 開発サーバーの起動

```bash
# 開発モード（フロントエンド + バックエンド）
npm run dev

# バックエンドのみ
npm run dev:server

# HTTPSなしで起動
npm run start:http
```

サーバー起動時に自動的にデータベース接続が確立されます。

## APIエンドポイント

### チケット取得

```
GET /api/tasks
```

全チケットを取得します。

### チケット作成

```
POST /api/tasks
Content-Type: application/json

{
  "project": "project_123",
  "title": "新しいタスク",
  "description": "タスクの説明",
  "assignee": "user_456",
  "priority": "high",
  "status": "todo",
  "progress": 0,
  "due_date": "2026-01-31",
  "estimated_hours": 8,
  "tags": ["bug", "urgent"]
}
```

### チケット更新

```
PUT /api/tasks/:ticketId
Content-Type: application/json

{
  "status": "in_progress",
  "progress": 50,
  "actual_hours": 4
}
```

### チケット削除

```
DELETE /api/tasks/:ticketId
```

### バックアップ作成

```
POST /api/backup
```

データベースの内容をJSONファイルとしてバックアップします。

## データベースファイル

- **データベースファイル**: `server/db/nulltasker.db`
- **WALファイル**: `server/db/nulltasker.db-wal`（Write-Ahead Log）
- **SHMファイル**: `server/db/nulltasker.db-shm`（Shared Memory）

WALモードが有効になっているため、複数の読み取りと1つの書き込みを同時に実行できます。

## パフォーマンス最適化

- **インデックス**: project, assignee, status, priority, parent_task, due_date, created_at にインデックスを設定
- **WALモード**: 同時実行性を向上
- **外部キー制約**: データ整合性を保証
- **自動トリガー**: updated_at を自動更新

## トラブルシューティング

### データベースファイルが見つからない

```bash
npm run db:init
```

を実行してデータベースを初期化してください。

### データ移行エラー

既存のJSONファイルのフォーマットが正しいか確認してください。移行スクリプトは以下のフィールド名の両方をサポートします：

- `start_date` / `startDate`
- `due_date` / `dueDate`
- `estimated_hours` / `estimatedHours`
- `actual_hours` / `actualHours`
- `parent_task` / `parentTask`

### データベースのリセット

データベースをリセットしたい場合：

```bash
rm server/db/nulltasker.db*
npm run db:init
```

既存データを再移行する場合：

```bash
npm run db:migrate
```

## セキュリティ

- データベースファイルは `.gitignore` に追加してバージョン管理から除外してください
- 本番環境ではデータベースファイルのアクセス権限を適切に設定してください
- 定期的にバックアップを作成してください（`npm run db:export`）

## ライセンス

MIT
