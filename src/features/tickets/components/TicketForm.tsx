import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSave,
  faTimes,
  faPlus,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import ticketService from "../../../shared/services/ticketService";
import type { Ticket, TicketFormData } from "@/shared/types";
import styles from "./TicketForm.module.css";

type TicketFormProps = {
  ticket?: Ticket | null;
  projectId?: string;
  onSave?: (ticket: Ticket) => void;
  onCancel?: () => void;
};

/**
 * チケット作成・編集フォームコンポーネント
 */
export const TicketForm: React.FC<TicketFormProps> = ({
  ticket,
  projectId,
  onSave,
  onCancel,
}) => {
  const [formData, setFormData] = useState<TicketFormData>({
    project: projectId || ticket?.project || "",
    title: ticket?.title || "",
    description: ticket?.description || "",
    assignee: ticket?.assignee || "",
    category: ticket?.category || "",
    priority: ticket?.priority || "medium",
    status: ticket?.status || "todo",
    progress: ticket?.progress || 0,
    start_date: ticket?.start_date || null,
    due_date: ticket?.due_date || null,
    estimated_hours: ticket?.estimated_hours || 0,
    actual_hours: ticket?.actual_hours || 0,
    tags: ticket?.tags || [],
    parent_task: ticket?.parent_task || null,
  });

  const [tagInput, setTagInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditMode = !!ticket;

  // フォーム入力変更ハンドラ
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // 数値入力変更ハンドラ
  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: parseFloat(value) || 0,
    }));
  };

  // タグ追加
  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags?.includes(tagInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...(prev.tags || []), tagInput.trim()],
      }));
      setTagInput("");
    }
  };

  // タグ削除
  const handleRemoveTag = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: (prev.tags || []).filter((tag) => tag !== tagToRemove),
    }));
  };

  // フォーム送信
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // バリデーション
    if (!formData.project) {
      setError("プロジェクトを選択してください");
      return;
    }
    if (!formData.title.trim()) {
      setError("タイトルを入力してください");
      return;
    }

    try {
      setLoading(true);
      let savedTicket: Ticket;

      if (isEditMode && ticket) {
        // 更新
        savedTicket = await ticketService.updateTicket(ticket.id, formData);
      } else {
        // 新規作成
        savedTicket = await ticketService.createTicket(formData);
      }

      if (onSave) {
        onSave(savedTicket);
      }
    } catch (err) {
      console.error("Failed to save ticket:", err);
      setError(
        isEditMode
          ? "チケットの更新に失敗しました"
          : "チケットの作成に失敗しました",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`${styles.container} modal`}>
      <div className={styles.header}>
        <h2 className={styles.title}>
          {isEditMode ? "チケット編集" : "新規チケット作成"}
        </h2>
        {onCancel && (
          <button onClick={onCancel} className={styles.closeButton}>
            <FontAwesomeIcon icon={faTimes} />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        {/* プロジェクトID（hidden or disabled） */}
        <div className={styles.formGroup}>
          <label className={styles.label}>
            プロジェクトID <span className={styles.required}>*</span>
          </label>
          <input
            type="text"
            name="project"
            value={formData.project}
            onChange={handleChange}
            className={styles.input}
            disabled={!!projectId}
            required
          />
        </div>

        {/* タイトル */}
        <div className={styles.formGroup}>
          <label className={styles.label}>
            タイトル <span className={styles.required}>*</span>
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className={styles.input}
            placeholder="チケットのタイトルを入力"
            required
          />
        </div>

        {/* 説明 */}
        <div className={styles.formGroup}>
          <label className={styles.label}>説明</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            className={styles.textarea}
            placeholder="チケットの詳細を入力"
            rows={4}
          />
        </div>

        {/* 担当者とカテゴリ */}
        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label className={styles.label}>担当者</label>
            <input
              type="text"
              name="assignee"
              value={formData.assignee}
              onChange={handleChange}
              className={styles.input}
              placeholder="担当者ID"
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>カテゴリ</label>
            <input
              type="text"
              name="category"
              value={formData.category}
              onChange={handleChange}
              className={styles.input}
              placeholder="例: バグ, 機能追加"
            />
          </div>
        </div>

        {/* 優先度とステータス */}
        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label className={styles.label}>優先度</label>
            <select
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              className={styles.select}
            >
              <option value="low">低</option>
              <option value="medium">中</option>
              <option value="high">高</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>ステータス</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className={styles.select}
            >
              <option value="todo">未着手</option>
              <option value="in_progress">進行中</option>
              <option value="review">レビュー</option>
              <option value="done">完了</option>
            </select>
          </div>
        </div>

        {/* 開始日と期限 */}
        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label className={styles.label}>開始日</label>
            <input
              type="date"
              name="start_date"
              value={formData.start_date || ""}
              onChange={handleChange}
              className={styles.input}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>期限</label>
            <input
              type="date"
              name="due_date"
              value={formData.due_date || ""}
              onChange={handleChange}
              className={styles.input}
            />
          </div>
        </div>

        {/* 工数と進捗 */}
        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label className={styles.label}>見積工数（時間）</label>
            <input
              type="number"
              name="estimated_hours"
              value={formData.estimated_hours}
              onChange={handleNumberChange}
              className={styles.input}
              min="0"
              step="0.5"
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>実績工数（時間）</label>
            <input
              type="number"
              name="actual_hours"
              value={formData.actual_hours}
              onChange={handleNumberChange}
              className={styles.input}
              min="0"
              step="0.5"
            />
          </div>
        </div>

        {/* 進捗 */}
        <div className={styles.formGroup}>
          <label className={styles.label}>進捗: {formData.progress}%</label>
          <input
            type="range"
            name="progress"
            value={formData.progress}
            onChange={handleNumberChange}
            className={styles.slider}
            min="0"
            max="100"
            step="5"
          />
        </div>

        {/* タグ */}
        <div className={styles.formGroup}>
          <label className={styles.label}>タグ</label>
          <div className={styles.tagInput}>
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddTag();
                }
              }}
              className={styles.input}
              placeholder="タグを入力してEnter"
            />
            <button
              type="button"
              onClick={handleAddTag}
              className={styles.addTagButton}
            >
              <FontAwesomeIcon icon={faPlus} />
            </button>
          </div>
          <div className={styles.tags}>
            {formData.tags?.map((tag, index) => (
              <span key={index} className={styles.tag}>
                {tag}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className={styles.removeTagButton}
                >
                  <FontAwesomeIcon icon={faTrash} />
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* アクションボタン */}
        <div className={styles.actions}>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className={styles.cancelButton}
              disabled={loading}
            >
              キャンセル
            </button>
          )}
          <button
            type="submit"
            className={styles.submitButton}
            disabled={loading}
          >
            <FontAwesomeIcon icon={faSave} />
            {loading ? "保存中..." : isEditMode ? "更新" : "作成"}
          </button>
        </div>

        {error && <div className={styles.error}>{error}</div>}
      </form>
    </div>
  );
};

export default TicketForm;
