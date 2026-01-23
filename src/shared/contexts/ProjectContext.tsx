import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { projectService } from "@/shared/services";
import type { Project } from "@/shared/types";

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
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 初期化: localStorageから復元 & プロジェクト一覧取得
  useEffect(() => {
    const initializeProjects = async () => {
      try {
        setIsLoading(true);

        // プロジェクト一覧を取得
        const projectsData = await projectService.getAllProjects();
        console.log("[ProjectContext] プロジェクト一覧を取得:", projectsData);
        setProjects(projectsData.projects);

        // localStorageから現在のプロジェクトIDを復元
        const savedProjectId = localStorage.getItem("currentProjectId");

        if (
          savedProjectId &&
          projectsData.projects.some((p) => p.id === savedProjectId)
        ) {
          // 保存されているプロジェクトが存在する場合
          await changeCurrentProject(savedProjectId);
        } else if (projectsData.projects.length > 0) {
          // デフォルトで最初のプロジェクトを選択
          await changeCurrentProject(projectsData.projects[0].id);
        }
      } catch (error) {
        console.error("プロジェクトの初期化に失敗しました:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeProjects();
  }, []);

  // 現在のプロジェクトを変更
  const changeCurrentProject = async (projectId: string) => {
    try {
      const project = await projectService.getProjectById(projectId);
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
  };

  // プロジェクト一覧を再取得
  const refreshProjects = async () => {
    try {
      const projectsData = await projectService.getAllProjects();
      setProjects(projectsData.projects);

      // 現在のプロジェクトが削除されていないか確認
      if (
        currentProjectId &&
        !projectsData.projects.some((p) => p.id === currentProjectId)
      ) {
        // 削除されている場合は別のプロジェクトを選択
        if (projectsData.projects.length > 0) {
          await changeCurrentProject(projectsData.projects[0].id);
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
  };

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
