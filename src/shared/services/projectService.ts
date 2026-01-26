import apiClient from "@/lib/apiClient";
import type { Project, ProjectsData, ProjectFormData } from "@/shared/types";

/**
 * プロジェクト管理APIサービス
 * 状態を持たず、APIとのやり取りのみを担当
 */
export const projectService = {
  /**
   * すべてのプロジェクトを取得
   */
  async getAllProjects(): Promise<ProjectsData> {
    const response = await apiClient.get<ProjectsData>("/projects");
    return response.data;
  },

  /**
   * 特定のプロジェクトを取得
   */
  async getProjectById(projectId: string): Promise<Project> {
    const response = await apiClient.get<Project>(`/projects/${projectId}`);
    return response.data;
  },

  /**
   * 新しいプロジェクトを作成
   */
  async createProject(projectData: ProjectFormData): Promise<Project> {
    const response = await apiClient.post<Project>("/projects", projectData);
    return response.data;
  },

  /**
   * プロジェクトを更新
   */
  async updateProject(
    projectId: string,
    projectData: Partial<ProjectFormData>,
  ): Promise<Project> {
    const response = await apiClient.put<Project>(
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
    return project.members;
  },

  /**
   * プロジェクトにメンバーを追加
   */
  async addMember(projectId: string, userId: string): Promise<Project> {
    const project = await this.getProjectById(projectId);
    const updatedMembers = [...project.members, userId];
    return this.updateProject(projectId, { members: updatedMembers } as any);
  },

  /**
   * プロジェクトからメンバーを削除
   */
  async removeMember(projectId: string, userId: string): Promise<Project> {
    const project = await this.getProjectById(projectId);
    const updatedMembers = project.members.filter((id) => id !== userId);
    return this.updateProject(projectId, { members: updatedMembers } as any);
  },
};

export default projectService;
