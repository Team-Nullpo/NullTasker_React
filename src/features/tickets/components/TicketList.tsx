import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faFilter,
  faSearch,
  faSync,
} from "@fortawesome/free-solid-svg-icons";
import TicketCard from "./TicketCard";
import ticketService from "../services/ticketService";
import type { Ticket } from "@/shared/types";
import styles from "./TicketList.module.css";

type TicketListProps = {
  projectId?: string;
  onTicketClick?: (ticket: Ticket) => void;
  onCreateClick?: () => void;
};

/**
 * チケット一覧管理コンポーネント
 * チケットの取得、表示、フィルタリングを管理
 */
export const TicketList: React.FC<TicketListProps> = ({
  projectId,
  onTicketClick,
  onCreateClick,
}) => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [assigneeFilter, setAssigneeFilter] = useState<string>("all");

  // チケットを取得
  const fetchTickets = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log("[TicketList] チケット取得開始");
      const response = await ticketService.getAllTickets();
      let ticketList = response.tasks;

      // プロジェクトIDでフィルタリング
      if (projectId) {
        ticketList = ticketList.filter(
          (ticket) => ticket.project === projectId,
        );
      }

      console.log("[TicketList] チケット取得成功:", ticketList.length);
      setTickets(ticketList);
      setFilteredTickets(ticketList);
    } catch (err: any) {
      console.error("[TicketList] チケット取得エラー:", err);
      const status = err.response?.status;
      let errorMessage = "チケットの取得に失敗しました";

      if (status === 401) {
        errorMessage = "認証エラー: ログインし直してください";
      } else if (status === 403) {
        errorMessage =
          "アクセス権限がありません。ログインしていることを確認してください。";
      } else if (status === 404) {
        errorMessage = "チケットが見つかりません";
      } else if (err.message) {
        errorMessage = `エラー: ${err.message}`;
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // 初回読み込み
  useEffect(() => {
    fetchTickets();
  }, [projectId]);

  // フィルタリングと検索
  useEffect(() => {
    let result = [...tickets];

    // 検索クエリでフィルタリング
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (ticket) =>
          ticket.title.toLowerCase().includes(query) ||
          ticket.description.toLowerCase().includes(query) ||
          ticket.tags.some((tag) => tag.toLowerCase().includes(query)),
      );
    }

    // ステータスでフィルタリング
    if (statusFilter !== "all") {
      result = result.filter((ticket) => ticket.status === statusFilter);
    }

    // 優先度でフィルタリング
    if (priorityFilter !== "all") {
      result = result.filter((ticket) => ticket.priority === priorityFilter);
    }

    // 担当者でフィルタリング
    if (assigneeFilter !== "all") {
      result = result.filter((ticket) => ticket.assignee === assigneeFilter);
    }

    setFilteredTickets(result);
  }, [tickets, searchQuery, statusFilter, priorityFilter, assigneeFilter]);

  // チケットを削除
  const handleDelete = async (ticketId: string) => {
    try {
      await ticketService.deleteTicket(ticketId);
      await fetchTickets(); // 再読み込み
    } catch (err) {
      console.error("Failed to delete ticket:", err);
      alert("チケットの削除に失敗しました");
    }
  };

  // 担当者のユニークリストを取得
  const getUniqueAssignees = (): string[] => {
    const assignees = tickets
      .map((ticket) => ticket.assignee)
      .filter((assignee) => assignee && assignee.trim() !== "");
    return Array.from(new Set(assignees));
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <FontAwesomeIcon icon={faSync} spin size="2x" />
          <p>読み込み中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <p>{error}</p>
          <button onClick={fetchTickets} className={styles.retryButton}>
            再試行
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* ヘッダー */}
      <div className={styles.header}>
        <h2 className={styles.title}>チケット一覧</h2>
        <div className={styles.headerActions}>
          <button onClick={fetchTickets} className={styles.refreshButton}>
            <FontAwesomeIcon icon={faSync} />
          </button>
          {onCreateClick && (
            <button onClick={onCreateClick} className={styles.createButton}>
              <FontAwesomeIcon icon={faPlus} /> 新規作成
            </button>
          )}
        </div>
      </div>

      {/* 検索とフィルター */}
      <div className={styles.filters}>
        {/* 検索バー */}
        <div className={styles.searchBox}>
          <FontAwesomeIcon icon={faSearch} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="タイトル、説明、タグで検索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        {/* フィルター */}
        <div className={styles.filterGroup}>
          <FontAwesomeIcon icon={faFilter} className={styles.filterIcon} />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="all">すべてのステータス</option>
            <option value="todo">未着手</option>
            <option value="in_progress">進行中</option>
            <option value="review">レビュー</option>
            <option value="done">完了</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="all">すべての優先度</option>
            <option value="high">高</option>
            <option value="medium">中</option>
            <option value="low">低</option>
          </select>

          <select
            value={assigneeFilter}
            onChange={(e) => setAssigneeFilter(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="all">すべての担当者</option>
            {getUniqueAssignees().map((assignee) => (
              <option key={assignee} value={assignee}>
                {assignee}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* カウント表示 */}
      <div className={styles.count}>
        {filteredTickets.length} 件のチケット
        {filteredTickets.length !== tickets.length && (
          <span className={styles.totalCount}> (全{tickets.length}件)</span>
        )}
      </div>

      {/* チケットリスト */}
      <div className={styles.ticketList}>
        {filteredTickets.length === 0 ? (
          <div className={styles.emptyState}>
            <p>チケットが見つかりません</p>
            {onCreateClick && (
              <button onClick={onCreateClick} className={styles.createButton}>
                <FontAwesomeIcon icon={faPlus} /> 最初のチケットを作成
              </button>
            )}
          </div>
        ) : (
          filteredTickets.map((ticket) => (
            <TicketCard
              key={ticket.id}
              ticket={ticket}
              onClick={() => onTicketClick && onTicketClick(ticket)}
              onEdit={() => onTicketClick && onTicketClick(ticket)}
              onDelete={() => handleDelete(ticket.id)}
              showActions={true}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default TicketList;
