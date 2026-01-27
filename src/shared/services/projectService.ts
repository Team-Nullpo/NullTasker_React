import apiClient from "@/lib/apiClient";
import type { ApiResBody, ProjectFormData } from "@/shared/types";
import type { Project } from "@nulltasker/shared-types";
import { isErrorResponse } from "@/shared/utils";

/**
 * プロジェクト管理APIサービス
 * 状態を持たず、APIとのやり取りのみを担当
 */
export const projectService = {
  /**
   * すべてのプロジェクトを取得
   */
  async getAllProjects(): Promise<ApiResBody<Project[]>> {
    const response = await apiClient.get<ApiResBody<Project[]>>("/projects");
    return response.data;
  },

  /**
   * 特定のプロジェクトを取得
   */
  async getProjectById(projectId: string): Promise<ApiResBody<Project>> {
    const response = await apiClient.get<ApiResBody<Project>>(
      `/projects/${projectId}`,
    );
    return response.data;
  },

  /**
   * 新しいプロジェクトを作成
   */
  async createProject(
    projectData: ProjectFormData,
  ): Promise<ApiResBody<Project>> {
    const response = await apiClient.post<ApiResBody<Project>>(
      "/projects",
      projectData,
    );
    return response.data;
  },

  /**
   * プロジェクトを更新
   */
  async updateProject(
    projectId: string,
    projectData: Partial<ProjectFormData>,
  ): Promise<ApiResBody<Project>> {
    const response = await apiClient.put<ApiResBody<Project>>(
      `/projects/${projectId}`,
      projectData,
    );
    return response.data;
  },

  /**
   * プロジェクトを削除
   */
  async deleteProject(projectId: string): Promise<void> {
    await apiClient.delete(`/projects/${projectId}`);
  },

  /**
   * プロジェクトのメンバーを取得
   */
  async getProjectMembers(projectId: string): Promise<string[]> {
    const project = await this.getProjectById(projectId);
    if (isErrorResponse(project)) {
      throw new Error(project.message);
    }
    return project.members;
  },

  /**
   * プロジェクトにメンバーを追加
   */
  async addMember(
    projectId: string,
    userId: string,
  ): Promise<ApiResBody<Project>> {
    const project = await this.getProjectById(projectId);
    if (isErrorResponse(project)) {
      throw new Error(project.message);
    }
    const updatedMembers = [...project.members, userId];
    return this.updateProject(projectId, { members: updatedMembers } as any);
  },

  /**
   * プロジェクトからメンバーを削除
   */
  async removeMember(
    projectId: string,
    userId: string,
  ): Promise<ApiResBody<Project>> {
    const project = await this.getProjectById(projectId);
    if (isErrorResponse(project)) {
      throw new Error(project.message);
    }
    const updatedMembers = project.members.filter((id) => id !== userId);
    return this.updateProject(projectId, { members: updatedMembers } as any);
  },
};

export default projectService;
