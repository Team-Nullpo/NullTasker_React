const fs = require("fs").promises;
const path = require("path");
const { ensureDatabase, TicketOperations } = require("./db/database");

/**
 * JSONファイルからSQLiteデータベースへデータを移行
 */
async function migrateTickets() {
  console.log("=== チケットデータの移行を開始します ===\n");

  try {
    // データベースを初期化
    const db = ensureDatabase();
    console.log("✓ データベース接続を確立しました\n");

    // 既存のJSONファイルを読み込み
    const ticketsPath = path.join(__dirname, "config", "tickets.json");

    let ticketsData;
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
      if (error.code === "ENOENT") {
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
        const normalizedTicket = {
          id: ticket.id,
          project: ticket.project || "",
          title: ticket.title || "Untitled",
          description: ticket.description || "",
          assignee: ticket.assignee || "",
          category: ticket.category || "",
          priority: ticket.priority || "medium",
          status: ticket.status || "todo",
          progress: parseInt(ticket.progress) || 0,
          start_date: ticket.start_date || ticket.startDate || null,
          due_date: ticket.due_date || ticket.dueDate || null,
          estimated_hours:
            parseFloat(ticket.estimated_hours) ||
            parseFloat(ticket.estimatedHours) ||
            0,
          actual_hours:
            parseFloat(ticket.actual_hours) ||
            parseFloat(ticket.actualHours) ||
            0,
          tags: Array.isArray(ticket.tags) ? ticket.tags : [],
          parent_task: ticket.parent_task || ticket.parentTask || null,
        };

        // データベースに挿入
        TicketOperations.create(normalizedTicket);
        successCount++;
        console.log(`✓ チケット ${ticket.id} を移行しました`);
      } catch (error) {
        errorCount++;
        console.error(
          `✗ チケット ${ticket.id} の移行に失敗しました:`,
          error.message,
        );
      }
    }

    console.log("\n=== 移行完了 ===");
    console.log(`成功: ${successCount}件`);
    console.log(`失敗: ${errorCount}件`);
    console.log(`合計: ${ticketsData.length}件\n`);

    // 移行後のチケット数を確認
    const finalTickets = TicketOperations.getAll();
    console.log(`データベース内の総チケット数: ${finalTickets.length}件`);

    // バックアップの作成を推奨
    console.log(
      "\n💡 ヒント: 元のJSONファイルはバックアップとして保持することをお勧めします。",
    );

    return {
      success: successCount,
      error: errorCount,
      total: ticketsData.length,
    };
  } catch (error) {
    console.error("\n✗ 移行中にエラーが発生しました:", error);
    throw error;
  }
}

/**
 * データベースからJSONファイルへエクスポート（バックアップ用）
 */
async function exportTicketsToJSON() {
  console.log("=== チケットデータのエクスポートを開始します ===\n");

  try {
    const db = ensureDatabase();
    const tickets = TicketOperations.getAll();

    console.log(`✓ ${tickets.length}件のチケットを取得しました\n`);

    // エクスポート用にデータを整形
    const exportData = tickets.map((ticket) => ({
      id: ticket.id,
      project: ticket.project,
      title: ticket.title,
      description: ticket.description,
      assignee: ticket.assignee,
      category: ticket.category,
      priority: ticket.priority,
      status: ticket.status,
      progress: ticket.progress,
      start_date: ticket.start_date,
      due_date: ticket.due_date,
      estimated_hours: ticket.estimated_hours,
      actual_hours: ticket.actual_hours,
      tags: ticket.tags,
      parent_task: ticket.parent_task,
      created_at: ticket.created_at,
      updated_at: ticket.updated_at,
    }));

    // JSONファイルとして保存
    const exportPath = path.join(__dirname, "config", "tickets-export.json");
    await fs.writeFile(exportPath, JSON.stringify(exportData, null, 2), "utf8");

    console.log(`✓ チケットデータを ${exportPath} にエクスポートしました\n`);

    return exportData;
  } catch (error) {
    console.error("\n✗ エクスポート中にエラーが発生しました:", error);
    throw error;
  }
}

// スクリプトとして直接実行された場合
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0] || "migrate";

  (async () => {
    try {
      if (command === "migrate") {
        await migrateTickets();
      } else if (command === "export") {
        await exportTicketsToJSON();
      } else {
        console.log("使用方法:");
        console.log("  node migrate.js migrate  - JSONからSQLiteへ移行");
        console.log(
          "  node migrate.js export   - SQLiteからJSONへエクスポート",
        );
      }
    } catch (error) {
      console.error("エラーが発生しました:", error);
      process.exit(1);
    }
  })();
}

module.exports = {
  migrateTickets,
  exportTicketsToJSON,
};
