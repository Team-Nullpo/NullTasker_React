import { useProject } from "@/shared/contexts/ProjectContext";

/**
 * 現在のプロジェクト情報を取得するカスタムフック
 */
export const useCurrentProject = () => {
  const { currentProjectId, currentProject, isLoading } = useProject();

  return {
    projectId: currentProjectId,
    project: currentProject,
    isLoading,
    hasProject: !!currentProjectId,
  };
};
