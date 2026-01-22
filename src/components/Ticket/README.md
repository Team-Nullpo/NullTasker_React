# チケット管理コンポーネント

サーバーと接続してチケットを管理するReactコンポーネント群です。

## コンポーネント一覧

### 1. TicketCard

チケット情報を視覚的に表示するカードコンポーネント。

### 2. TicketList

チケット一覧の表示、検索、フィルタリングを行うコンポーネント。

### 3. TicketForm

チケットの作成・編集を行うフォームコンポーネント。

## 使用方法

### TicketListの使用

```tsx
import { TicketList } from "./components/Ticket";

function MyPage() {
  const handleTicketClick = (ticket) => {
    console.log("Clicked ticket:", ticket);
  };

  const handleCreateClick = () => {
    console.log("Create new ticket");
  };

  return (
    <TicketList
      projectId="project_123"
      onTicketClick={handleTicketClick}
      onCreateClick={handleCreateClick}
    />
  );
}
```

### TicketCardの使用

```tsx
import { TicketCard } from "./components/Ticket";

function MyComponent({ ticket }) {
  const handleEdit = () => {
    console.log("Edit ticket:", ticket.id);
  };

  const handleDelete = () => {
    console.log("Delete ticket:", ticket.id);
  };

  return (
    <TicketCard
      ticket={ticket}
      onClick={() => console.log("Clicked")}
      onEdit={handleEdit}
      onDelete={handleDelete}
      showActions={true}
    />
  );
}
```

### TicketFormの使用

```tsx
import { useState } from "react";
import { TicketForm } from "./components/Ticket";

function CreateTicketPage() {
  const [showForm, setShowForm] = useState(false);

  const handleSave = (ticket) => {
    console.log("Saved ticket:", ticket);
    setShowForm(false);
  };

  const handleCancel = () => {
    setShowForm(false);
  };

  return (
    <div>
      <button onClick={() => setShowForm(true)}>新規チケット作成</button>

      {showForm && (
        <TicketForm
          projectId="project_123"
          onSave={handleSave}
          onCancel={handleCancel}
        />
      )}
    </div>
  );
}
```

### チケット編集の例

```tsx
import { useState } from "react";
import { TicketForm } from "./components/Ticket";

function EditTicketPage({ ticket }) {
  const handleSave = (updatedTicket) => {
    console.log("Updated ticket:", updatedTicket);
  };

  return (
    <TicketForm
      ticket={ticket}
      onSave={handleSave}
      onCancel={() => window.history.back()}
    />
  );
}
```

## API サービスの使用

チケットサービスAPIを直接使用することもできます。

```tsx
import ticketService from "./services/ticketService";

// すべてのチケットを取得
const tickets = await ticketService.getAllTickets();

// チケットを作成
const newTicket = await ticketService.createTicket({
  project: "project_123",
  title: "新しいバグ修正",
  description: "ログイン画面のバグを修正",
  priority: "high",
  status: "todo",
});

// チケットを更新
const updated = await ticketService.updateTicket(ticketId, {
  status: "in_progress",
  progress: 50,
});

// チケットを削除
await ticketService.deleteTicket(ticketId);

// 進捗を更新
await ticketService.updateProgress(ticketId, 75);

// タグを追加
await ticketService.addTag(ticketId, "urgent");
```

## 完全な使用例

TaskPageコンポーネントでの統合例：

```tsx
import { useState } from "react";
import { TicketList, TicketForm } from "../components/Ticket";
import type { Ticket } from "../types";

function TaskPage() {
  const [showForm, setShowForm] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  const handleTicketClick = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setShowForm(true);
  };

  const handleCreateClick = () => {
    setSelectedTicket(null);
    setShowForm(true);
  };

  const handleSave = (ticket: Ticket) => {
    console.log("Saved:", ticket);
    setShowForm(false);
    setSelectedTicket(null);
    // リストを更新するために再レンダリング
  };

  const handleCancel = () => {
    setShowForm(false);
    setSelectedTicket(null);
  };

  return (
    <div style={{ padding: "20px" }}>
      {showForm ? (
        <TicketForm
          ticket={selectedTicket}
          projectId="project_123"
          onSave={handleSave}
          onCancel={handleCancel}
        />
      ) : (
        <TicketList
          projectId="project_123"
          onTicketClick={handleTicketClick}
          onCreateClick={handleCreateClick}
        />
      )}
    </div>
  );
}

export default TaskPage;
```

## 機能

### TicketCard

- ✅ 優先度と状態のバッジ表示
- ✅ カテゴリとタグの表示
- ✅ 担当者、期限、工数の表示
- ✅ 進捗バーの表示
- ✅ 期限切れの警告表示
- ✅ 編集・削除アクション

### TicketList

- ✅ チケット一覧の表示
- ✅ タイトル、説明、タグでの検索
- ✅ ステータス、優先度、担当者でのフィルタリング
- ✅ リアルタイム更新
- ✅ レスポンシブデザイン

### TicketForm

- ✅ 新規作成と編集の両対応
- ✅ バリデーション
- ✅ タグの追加・削除
- ✅ 進捗スライダー
- ✅ 日付ピッカー
- ✅ 工数入力

## スタイリング

各コンポーネントはCSS Modulesを使用しており、カスタマイズが容易です：

- `TicketCard.module.css`
- `TicketList.module.css`
- `TicketForm.module.css`

## 型定義

チケット関連の型は `src/types/index.ts` で定義されています：

```typescript
interface Ticket {
  id: string;
  project: string;
  title: string;
  description: string;
  assignee: string;
  category: string;
  priority: "low" | "medium" | "high";
  status: "todo" | "in_progress" | "review" | "done";
  progress: number;
  start_date: string | null;
  due_date: string | null;
  estimated_hours: number;
  actual_hours: number;
  tags: string[];
  parent_task: string | null;
  created_at: string;
  updated_at: string;
}
```

## 注意事項

- サーバーが起動していることを確認してください
- 認証トークンが必要です（AuthContext経由で取得）
- プロジェクトIDは必須です
