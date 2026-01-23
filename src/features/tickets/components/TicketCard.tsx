import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUser,
  faClock,
  faCalendarAlt,
  faTag,
  faChartLine,
  faExclamationCircle,
} from "@fortawesome/free-solid-svg-icons";
import type { Ticket } from "@/shared/types";
import styles from "./TicketCard.module.css";
import { useProject } from "@/shared/contexts";

type TicketCardProps = {
  ticket: Ticket;
  onClick?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  showActions?: boolean;
};

/**
 * チケットカードコンポーネント
 * チケット情報を視覚的に表示する
 */
export const TicketCard: React.FC<TicketCardProps> = ({
  ticket,
  onClick,
  onEdit,
  onDelete,
  showActions = true,
}) => {
  const { currentProject } = useProject();
  const settings = currentProject?.settings;

  const getPriorityColor = (priority: string): string => {
    const color = settings?.priorities.find((p) => p.value === priority)?.color;
    return color || "#6b7280";
  };

  const getStatusColor = (status: string): string => {
    const color = settings?.statuses.find((s) => s.value === status)?.color;
    return color || "#6b7280";
  };

  const getStatusLabel = (status: string): string => {
    const label = settings?.statuses.find((s) => s.value === status)?.label;
    return label || status;
  };

  const getPriorityLabel = (priority: string): string => {
    const label = settings?.priorities.find((p) => p.value === priority)?.label;
    return label || priority;
  };

  const formatDate = (dateStr: string | null): string => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return date.toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  const isOverdue = (): boolean => {
    if (!ticket.due_date) return false;
    const dueDate = new Date(ticket.due_date);
    const today = new Date();
    return dueDate < today && ticket.status !== "done";
  };

  const handleCardClick = (e: React.MouseEvent) => {
    if (onClick && !(e.target as HTMLElement).closest("button")) {
      onClick();
    }
  };

  return (
    <div
      className={`${styles.ticketCard} ${isOverdue() ? styles.overdue : ""}`}
      onClick={handleCardClick}
    >
      {/* ヘッダー */}
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <h3 className={styles.title}>{ticket.title}</h3>
          <div className={styles.badges}>
            <span
              className={styles.priorityBadge}
              style={{ backgroundColor: getPriorityColor(ticket.priority) }}
            >
              {getPriorityLabel(ticket.priority)}
            </span>
            <span
              className={styles.statusBadge}
              style={{ backgroundColor: getStatusColor(ticket.status) }}
            >
              {getStatusLabel(ticket.status)}
            </span>
          </div>
        </div>
        {ticket.category && (
          <span className={styles.category}>
            <FontAwesomeIcon icon={faTag} /> {ticket.category}
          </span>
        )}
      </div>

      {/* 説明 */}
      {ticket.description && (
        <p className={styles.description}>{ticket.description}</p>
      )}

      {/* メタデータ */}
      <div className={styles.metadata}>
        {/* 担当者 */}
        {ticket.assignee && (
          <div className={styles.metaItem}>
            <FontAwesomeIcon icon={faUser} className={styles.icon} />
            <span>{ticket.assignee}</span>
          </div>
        )}

        {/* 期限 */}
        {ticket.due_date && (
          <div
            className={`${styles.metaItem} ${isOverdue() ? styles.overdueText : ""}`}
          >
            <FontAwesomeIcon icon={faCalendarAlt} className={styles.icon} />
            <span>{formatDate(ticket.due_date)}</span>
            {isOverdue() && (
              <FontAwesomeIcon
                icon={faExclamationCircle}
                className={styles.overdueIcon}
              />
            )}
          </div>
        )}

        {/* 工数 */}
        {(ticket.estimated_hours > 0 || ticket.actual_hours > 0) && (
          <div className={styles.metaItem}>
            <FontAwesomeIcon icon={faClock} className={styles.icon} />
            <span>
              {ticket.actual_hours || 0}h / {ticket.estimated_hours || 0}h
            </span>
          </div>
        )}
      </div>

      {/* 進捗バー */}
      <div className={styles.progressSection}>
        <div className={styles.progressHeader}>
          <FontAwesomeIcon icon={faChartLine} className={styles.icon} />
          <span className={styles.progressLabel}>進捗: {ticket.progress}%</span>
        </div>
        <div className={styles.progressBar}>
          <div
            className={styles.progressFill}
            style={{
              width: `${ticket.progress}%`,
              backgroundColor: getStatusColor(ticket.status),
            }}
          />
        </div>
      </div>

      {/* タグ */}
      {ticket.tags && ticket.tags.length > 0 && (
        <div className={styles.tags}>
          {ticket.tags.map((tag, index) => (
            <span key={index} className={styles.tag}>
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* アクション */}
      {showActions && (
        <div className={styles.actions}>
          {onEdit && (
            <button
              className={`${styles.actionButton} ${styles.editButton}`}
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
            >
              編集
            </button>
          )}
          {onDelete && (
            <button
              className={`${styles.actionButton} ${styles.deleteButton}`}
              onClick={(e) => {
                e.stopPropagation();
                if (window.confirm("このチケットを削除しますか？")) {
                  onDelete();
                }
              }}
            >
              削除
            </button>
          )}
        </div>
      )}

      {/* フッター */}
      <div className={styles.footer}>
        <span className={styles.ticketId}>{ticket.id}</span>
        <span className={styles.timestamp}>
          更新: {formatDate(ticket.updated_at)}
        </span>
      </div>
    </div>
  );
};

export default TicketCard;
