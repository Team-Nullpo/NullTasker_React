import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { projectService } from "@/shared/services";
import type { Project } from "@nulltasker/shared-types";
import { isErrorResponse } from "@/shared/utils";
import { useAuth } from "@/features/auth";

interface ProjectContextType {
  currentProjectId: string | null;
  currentProject: Project | null;
  projects: Project[];
  isLoading: boolean;
  changeCurrentProject: (projectId: string) => Promise<void>;
  refreshProjects: () => Promise<void>;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const useProject = () => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error("useProject must be used within a ProjectProvider");
  }
  return context;
};

interface ProjectProviderProps {
  children: ReactNode;
}

export const ProjectProvider = ({ children }: ProjectProviderProps) => {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 現在のプロジェクトを変更
  const changeCurrentProject = useCallback(async (projectId: string) => {
    try {
      const project = await projectService.getProjectById(projectId);
      if (isErrorResponse(project)) {
        throw new Error(project.message);
      }
      setCurrentProjectId(projectId);
      setCurrentProject(project);

      // localStorageに保存
      localStorage.setItem("currentProjectId", projectId);

      console.log(
        "[ProjectContext] プロジェクトを切り替えました:",
        project.name,
      );
    } catch (error) {
      console.error("プロジェクトの取得に失敗しました:", error);
      throw error;
    }
  }, []);

  // 初期化: localStorageから復元 & プロジェクト一覧取得
  // isAuthenticated が変更されたとき（ログイン成功時）にも再実行
  useEffect(() => {
    // 認証がロード中の場合は待機
    if (isAuthLoading) {
      return;
    }

    // 認証されていない場合はプロジェクト情報をクリア
    if (!isAuthenticated) {
      setProjects([]);
      setCurrentProjectId(null);
      setCurrentProject(null);
      setIsLoading(false);
      return;
    }

    const initializeProjects = async () => {
      try {
        setIsLoading(true);

        // プロジェクト一覧を取得
        const projectsData = await projectService.getAllProjects();
        if (isErrorResponse(projectsData)) {
          throw new Error(projectsData.message);
        }
        console.log("[ProjectContext] プロジェクト一覧を取得:", projectsData);
        setProjects(projectsData);

        // localStorageから現在のプロジェクトIDを復元
        const savedProjectId = localStorage.getItem("currentProjectId");

        if (
          savedProjectId &&
          projectsData.some((p) => p.id === savedProjectId)
        ) {
          // 保存されているプロジェクトが存在する場合
          await changeCurrentProject(savedProjectId);
        } else if (projectsData.length > 0) {
          // デフォルトで最初のプロジェクトを選択
          await changeCurrentProject(projectsData[0].id);
        }
      } catch (error) {
        console.error("プロジェクトの初期化に失敗しました:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeProjects();
  }, [isAuthenticated, isAuthLoading, changeCurrentProject]);

  // プロジェクト一覧を再取得
  const refreshProjects = useCallback(async () => {
    try {
      const projectsData = await projectService.getAllProjects();
      if (isErrorResponse(projectsData)) {
        throw new Error(projectsData.message);
      }
      setProjects(projectsData);

      // 現在のプロジェクトが削除されていないか確認
      if (
        currentProjectId &&
        !projectsData.some((p) => p.id === currentProjectId)
      ) {
        // 削除されている場合は別のプロジェクトを選択
        if (projectsData.length > 0) {
          await changeCurrentProject(projectsData[0].id);
        } else {
          setCurrentProjectId(null);
          setCurrentProject(null);
          localStorage.removeItem("currentProjectId");
        }
      }
    } catch (error) {
      console.error("プロジェクト一覧の取得に失敗しました:", error);
      throw error;
    }
  }, [currentProjectId, changeCurrentProject]);

  const value: ProjectContextType = {
    currentProjectId,
    currentProject,
    projects,
    isLoading,
    changeCurrentProject,
    refreshProjects,
  };

  return (
    <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>
  );
};
