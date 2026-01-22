import apiClient from "./apiClient";
import type {
  Ticket,
  TicketsResponse,
  TicketFormData,
  ApiResponse,
} from "../types";

/**
 * チケット管理APIサービス
 */
export const ticketService = {
  /**
   * すべてのチケットを取得
   */
  async getAllTickets(): Promise<TicketsResponse> {
    const response = await apiClient.get<TicketsResponse>("/tasks");
    return response.data;
  },

  /**
   * 特定のチケットを取得
   */
  async getTicketById(ticketId: string): Promise<Ticket> {
    const response = await apiClient.get<Ticket>(`/tasks/${ticketId}`);
    return response.data;
  },

  /**
   * プロジェクトIDでチケットを取得
   */
  async getTicketsByProject(projectId: string): Promise<Ticket[]> {
    const response = await apiClient.get<TicketsResponse>("/tasks");
    return response.data.tasks.filter((ticket) => ticket.project === projectId);
  },

  /**
   * 担当者IDでチケットを取得
   */
  async getTicketsByAssignee(assigneeId: string): Promise<Ticket[]> {
    const response = await apiClient.get<TicketsResponse>("/tasks");
    return response.data.tasks.filter(
      (ticket) => ticket.assignee === assigneeId,
    );
  },

  /**
   * ステータスでチケットを取得
   */
  async getTicketsByStatus(status: string): Promise<Ticket[]> {
    const response = await apiClient.get<TicketsResponse>("/tasks");
    return response.data.tasks.filter((ticket) => ticket.status === status);
  },

  /**
   * 新しいチケットを作成
   */
  async createTicket(ticketData: TicketFormData): Promise<Ticket> {
    const response = await apiClient.post<Ticket>("/tasks", ticketData);
    return response.data;
  },

  /**
   * チケットを更新
   */
  async updateTicket(
    ticketId: string,
    ticketData: Partial<TicketFormData>,
  ): Promise<Ticket> {
    const response = await apiClient.put<Ticket>(
      `/tasks/${ticketId}`,
      ticketData,
    );
    return response.data;
  },

  /**
   * チケットを削除
   */
  async deleteTicket(ticketId: string): Promise<void> {
    await apiClient.delete(`/tasks/${ticketId}`);
  },

  /**
   * バックアップを作成
   */
  async createBackup(): Promise<ApiResponse<{ backupFile: string }>> {
    const response =
      await apiClient.post<ApiResponse<{ backupFile: string }>>("/backup");
    return response.data;
  },

  /**
   * チケットの進捗を更新
   */
  async updateProgress(ticketId: string, progress: number): Promise<Ticket> {
    return this.updateTicket(ticketId, { progress });
  },

  /**
   * チケットのステータスを更新
   */
  async updateStatus(ticketId: string, status: string): Promise<Ticket> {
    return this.updateTicket(ticketId, { status: status as any });
  },

  /**
   * チケットに実績工数を追加
   */
  async addActualHours(ticketId: string, hours: number): Promise<Ticket> {
    const ticket = await this.getTicketById(ticketId);
    const newActualHours = (ticket.actual_hours || 0) + hours;
    return this.updateTicket(ticketId, { actual_hours: newActualHours });
  },

  /**
   * チケットにタグを追加
   */
  async addTag(ticketId: string, tag: string): Promise<Ticket> {
    const ticket = await this.getTicketById(ticketId);
    const newTags = [...(ticket.tags || []), tag];
    return this.updateTicket(ticketId, { tags: newTags });
  },

  /**
   * チケットからタグを削除
   */
  async removeTag(ticketId: string, tag: string): Promise<Ticket> {
    const ticket = await this.getTicketById(ticketId);
    const newTags = (ticket.tags || []).filter((t) => t !== tag);
    return this.updateTicket(ticketId, { tags: newTags });
  },
};

export default ticketService;
