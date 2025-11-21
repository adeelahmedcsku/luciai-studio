import { invoke } from '@tauri-apps/api/tauri';
import { useState, useCallback } from 'react';

export interface Project {
  id: string;
  name: string;
  path: string;
  project_type: ProjectType;
  tech_stack: TechStack;
  created_at: string;
  last_modified: string;
  description: string;
}

export interface ProjectType {
  WebApp?: null;
  MobileApp?: null;
  DesktopApp?: null;
  CLI?: null;
  Backend?: null;
  FullStack?: null;
}

export interface TechStack {
  frontend?: string[];
  backend?: string[];
  database?: string;
  other: string[];
}

export interface ProjectMetadata {
  project: Project;
  prompt_history: PromptEntry[];
  file_count: number;
  total_lines: number;
}

export interface PromptEntry {
  id: string;
  timestamp: string;
  user_prompt: string;
  agent_response: string;
  files_modified: string[];
}

export function useProjectManagement() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<ProjectMetadata | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProjects = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const projectList = await invoke<Project[]>('list_projects');
      setProjects(projectList);
    } catch (err) {
      setError(`Failed to load projects: ${err}`);
      console.error('Failed to load projects:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createProject = useCallback(
    async (
      name: string,
      projectType: string,
      techStack: TechStack,
      description: string
    ) => {
      setIsLoading(true);
      setError(null);
      try {
        // Convert project type string to enum format
        const typeEnum = { [projectType]: null };

        const project = await invoke<Project>('create_project', {
          name,
          projectType: typeEnum,
          techStack,
          description,
        });

        await loadProjects(); // Refresh list
        return project;
      } catch (err) {
        setError(`Failed to create project: ${err}`);
        console.error('Failed to create project:', err);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [loadProjects]
  );

  const openProject = useCallback(async (projectId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const metadata = await invoke<ProjectMetadata>('open_project', {
        projectId,
      });
      setCurrentProject(metadata);
      return metadata;
    } catch (err) {
      setError(`Failed to open project: ${err}`);
      console.error('Failed to open project:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteProject = useCallback(
    async (projectId: string) => {
      setIsLoading(true);
      setError(null);
      try {
        await invoke('delete_project', { projectId });
        await loadProjects(); // Refresh list
        if (currentProject?.project.id === projectId) {
          setCurrentProject(null);
        }
      } catch (err) {
        setError(`Failed to delete project: ${err}`);
        console.error('Failed to delete project:', err);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [loadProjects, currentProject]
  );

  const saveFile = useCallback(
    async (projectId: string, filePath: string, content: string) => {
      try {
        await invoke('save_file', {
          projectId,
          filePath,
          content,
        });
      } catch (err) {
        console.error('Failed to save file:', err);
        throw err;
      }
    },
    []
  );

  const saveMultipleFiles = useCallback(
    async (projectId: string, files: [string, string][]) => {
      try {
        await invoke('save_multiple_files', {
          projectId,
          files,
        });
      } catch (err) {
        console.error('Failed to save files:', err);
        throw err;
      }
    },
    []
  );

  const getFile = useCallback(async (projectId: string, filePath: string) => {
    try {
      const content = await invoke<string>('get_file', {
        projectId,
        filePath,
      });
      return content;
    } catch (err) {
      console.error('Failed to get file:', err);
      throw err;
    }
  }, []);

  const listFiles = useCallback(async (projectId: string) => {
    try {
      const files = await invoke<string[]>('list_project_files', {
        projectId,
      });
      return files;
    } catch (err) {
      console.error('Failed to list files:', err);
      throw err;
    }
  }, []);

  const addPromptToHistory = useCallback(
    async (
      projectId: string,
      userPrompt: string,
      agentResponse: string,
      filesModified: string[]
    ) => {
      try {
        await invoke('add_prompt_to_history', {
          projectId,
          userPrompt,
          agentResponse,
          filesModified,
        });
      } catch (err) {
        console.error('Failed to add prompt to history:', err);
        throw err;
      }
    },
    []
  );

  return {
    projects,
    currentProject,
    isLoading,
    error,
    loadProjects,
    createProject,
    openProject,
    deleteProject,
    saveFile,
    saveMultipleFiles,
    getFile,
    listFiles,
    addPromptToHistory,
  };
}

// Helper to create default tech stack
export function createTechStack(
  frontend?: string[],
  backend?: string[],
  database?: string,
  other: string[] = []
): TechStack {
  return {
    frontend,
    backend,
    database,
    other,
  };
}

// Helper to parse project type string
export function parseProjectType(type: string): string {
  const typeMap: Record<string, string> = {
    'web': 'WebApp',
    'webapp': 'WebApp',
    'mobile': 'MobileApp',
    'desktop': 'DesktopApp',
    'cli': 'CLI',
    'backend': 'Backend',
    'fullstack': 'FullStack',
    'full-stack': 'FullStack',
  };

  return typeMap[type.toLowerCase()] || 'WebApp';
}
