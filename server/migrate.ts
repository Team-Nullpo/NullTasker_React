import fs from "fs/promises";
import path from "path";
import { ensureDatabase, TicketOperations } from "./db/database";
import type { TicketCreateData } from "./types";

interface LegacyTicket {
  id: string;
  project?: string;
  title?: string;
  description?: string;
  assignee?: string;
  category?: string;
  priority?: string;
  status?: string;
  progress?: number | string;
  start_date?: string;
  startDate?: string;
  due_date?: string;
  dueDate?: string;
  estimated_hours?: number | string;
  estimatedHours?: number | string;
  actual_hours?: number | string;
  actualHours?: number | string;
  tags?: string[];
  parent_task?: string;
  parentTask?: string;
}

/**
 * JSONファイルからSQLiteデータベースへデータを移行
 */
async function migrateTickets(): Promise<void> {
  console.log("=== チケットデータの移行を開始します ===\n");

  try {
    // データベースを初期化
    ensureDatabase();
    console.log("✓ データベース接続を確立しました\n");

    // 既存のJSONファイルを読み込み
    const ticketsPath = path.join(__dirname, "config", "tickets.json");

    let ticketsData: LegacyTicket[];
    try {
      const ticketsContent = await fs.readFile(ticketsPath, "utf8");
      const jsonData = JSON.parse(ticketsContent);

      // データ構造を確認（tasks配列として格納されている場合とそうでない場合を処理）
      if (Array.isArray(jsonData)) {
        ticketsData = jsonData;
      } else if (jsonData.tasks && Array.isArray(jsonData.tasks)) {
        ticketsData = jsonData.tasks;
      } else {
        ticketsData = [];
      }

      console.log(
        `✓ tickets.json を読み込みました (${ticketsData.length}件のチケット)\n`,
      );
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        console.log(
          "⚠ tickets.json が見つかりません。空のデータベースを作成します。\n",
        );
        ticketsData = [];
      } else {
        throw error;
      }
    }

    // 既存のチケット数を確認
    const existingTickets = TicketOperations.getAll();
    console.log(
      `現在のデータベース内のチケット数: ${existingTickets.length}件\n`,
    );

    if (existingTickets.length > 0) {
      console.log("⚠ データベースに既存のチケットが存在します。");
      console.log(
        "移行を続行すると、重複したチケットが作成される可能性があります。\n",
      );
    }

    // チケットデータを移行
    let successCount = 0;
    let errorCount = 0;

    for (const ticket of ticketsData) {
      try {
        // IDが存在するかチェック
        const existing = TicketOperations.getById(ticket.id);

        if (existing) {
          console.log(`⚠ スキップ: チケット ${ticket.id} は既に存在します`);
          continue;
        }

        // チケットデータを正規化
        const normalizedTicket: TicketCreateData = {
          id: ticket.id,
          project: ticket.project || "",
          title: ticket.title || "Untitled",
          description: ticket.description || "",
          assignee: ticket.assignee || "",
          category: ticket.category || "",
          priority: (ticket.priority as "low" | "medium" | "high") || "medium",
          status:
            (ticket.status as "todo" | "in_progress" | "review" | "done") ||
            "todo",
          progress: parseInt(String(ticket.progress)) || 0,
          start_date: ticket.start_date || ticket.startDate || null,
          due_date: ticket.due_date || ticket.dueDate || null,
          estimated_hours:
            parseFloat(String(ticket.estimated_hours)) ||
            parseFloat(String(ticket.estimatedHours)) ||
            0,
          actual_hours:
            parseFloat(String(ticket.actual_hours)) ||
            parseFloat(String(ticket.actualHours)) ||
            0,
          tags: Array.isArray(ticket.tags) ? ticket.tags : [],
          parent_task: ticket.parent_task || ticket.parentTask || null,
        };

        // データベースに挿入
        TicketOperations.create(normalizedTicket);
        console.log(`✓ 移行成功: ${ticket.id} - ${normalizedTicket.title}`);
        successCount++;
      } catch (error) {
        console.error(`✗ 移行失敗: ${ticket.id}`, error);
        errorCount++;
      }
    }

    console.log("\n=== 移行完了 ===");
    console.log(`成功: ${successCount}件`);
    console.log(`失敗: ${errorCount}件`);
  } catch (error) {
    console.error("移行中にエラーが発生しました:", error);
    process.exit(1);
  }
}

/**
 * SQLiteデータベースからJSONファイルへエクスポート
 */
async function exportTickets(): Promise<void> {
  console.log("=== チケットデータのエクスポートを開始します ===\n");

  try {
    ensureDatabase();

    const tickets = TicketOperations.getAll();
    console.log(`${tickets.length}件のチケットを取得しました\n`);

    const exportData = {
      tasks: tickets,
      lastUpdated: new Date().toISOString(),
    };

    const exportPath = path.join(
      __dirname,
      "config",
      `tickets_export_${Date.now()}.json`,
    );
    await fs.writeFile(exportPath, JSON.stringify(exportData, null, 2), "utf8");

    console.log(`✓ エクスポート完了: ${exportPath}`);
  } catch (error) {
    console.error("エクスポート中にエラーが発生しました:", error);
    process.exit(1);
  }
}

// コマンドライン引数を処理
const command = process.argv[2];

switch (command) {
  case "migrate":
    migrateTickets();
    break;
  case "export":
    exportTickets();
    break;
  default:
    console.log("使用方法:");
    console.log("  ts-node migrate.ts migrate  - JSONからSQLiteへ移行");
    console.log("  ts-node migrate.ts export   - SQLiteからJSONへエクスポート");
}
