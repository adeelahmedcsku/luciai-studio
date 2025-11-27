import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Types
export interface Project {
  id: string;
  name: string;
  description: string;
  project_type: string;
  tech_stack: {
    frontend?: string[];
    backend?: string[];
    database?: string;
  };
  created_at: string;
  last_modified: string;
}

export interface LLMModel {
  name: string;
  size: string;
  installed: boolean;
  description: string;
}

export interface LLMStatus {
  ollama_running: boolean;
  ollama_version: string | null;
  available_models: LLMModel[];
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  editorFontSize: number;
  editorTabSize: number;
  autoSave: boolean;
  autoSaveDelay: number;
  llmModel: string;
  llmTemperature: number;
  llmMaxTokens: number;
}

export interface ThemeState {
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
}

export interface TerminalSession {
  id: string;
  name: string;
  projectPath?: string;
  initialCommand?: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

// Store interface
interface AppStore {
  // Current state
  currentProject: Project | null;
  projects: Project[];
  llmStatus: LLMStatus | null;
  settings: AppSettings;

  // UI state
  leftPanelOpen: boolean;
  rightPanelOpen: boolean;
  bottomPanelOpen: boolean;
  activeRightPanel: 'agent' | 'terminal';
  activeBottomPanel: 'terminal' | 'problems' | 'output';
  selectedFile: string | null;
  openFiles: string[];

  // Agent State
  agentMessages: Message[];
  addAgentMessage: (message: Message) => void;
  clearAgentMessages: () => void;

  // Actions - Projects
  setCurrentProject: (project: Project | null) => void;
  setProjects: (projects: Project[]) => void;
  addProject: (project: Project) => void;
  removeProject: (projectId: string) => void;
  updateProject: (projectId: string, updates: Partial<Project>) => void;

  // Actions - LLM
  setLLMStatus: (status: LLMStatus) => void;

  // Actions - Settings
  updateSettings: (settings: Partial<AppSettings>) => void;

  // Actions - UI
  setLeftPanelOpen: (open: boolean) => void;
  setRightPanelOpen: (open: boolean) => void;
  setBottomPanelOpen: (open: boolean) => void;
  toggleLeftPanel: () => void;
  toggleRightPanel: () => void;
  toggleBottomPanel: () => void;
  setActiveRightPanel: (panel: 'agent' | 'terminal') => void;
  setActiveBottomPanel: (panel: 'terminal' | 'problems' | 'output') => void;
  setSelectedFile: (file: string | null) => void;
  openFile: (file: string) => void;
  closeFile: (file: string) => void;
  closeAllFiles: () => void;

  // Actions - Utility
  reset: () => void;

  // AI Prompt State
  pendingAiPrompt: string | null;
  setPendingAiPrompt: (prompt: string | null) => void;

  // Terminal State
  terminals: TerminalSession[];
  activeTerminalId: string | null;
  addTerminal: () => void;
  removeTerminal: (id: string) => void;
  setActiveTerminal: (id: string) => void;
}

// Default settings
const defaultSettings: AppSettings = {
  theme: 'system',
  editorFontSize: 14,
  editorTabSize: 2,
  autoSave: true,
  autoSaveDelay: 1000,
  llmModel: 'deepseek-coder-v2:33b',
  llmTemperature: 0.7,
  llmMaxTokens: 4096,
};

// Create store with persistence
export const useAppStore = create<AppStore>()(
  persist(
    (set, _get) => ({
      // Initial state
      currentProject: null,
      projects: [],
      llmStatus: null,
      settings: defaultSettings,
      leftPanelOpen: true,
      rightPanelOpen: true,
      bottomPanelOpen: true,
      activeRightPanel: 'agent',
      activeBottomPanel: 'terminal',
      selectedFile: null,
      openFiles: [],
      agentMessages: [],

      // Agent Actions
      addAgentMessage: (message) => set((state) => ({
        agentMessages: [...state.agentMessages, message]
      })),

      clearAgentMessages: () => set({ agentMessages: [] }),

      // Project actions
      setCurrentProject: (project) => set({ currentProject: project }),

      setProjects: (projects) => set({ projects }),

      addProject: (project) =>
        set((state) => ({
          projects: [project, ...state.projects]
        })),

      removeProject: (projectId) =>
        set((state) => ({
          projects: state.projects.filter((p) => p.id !== projectId),
          currentProject: state.currentProject?.id === projectId
            ? null
            : state.currentProject,
        })),

      updateProject: (projectId, updates) =>
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId ? { ...p, ...updates } : p
          ),
          currentProject: state.currentProject?.id === projectId
            ? { ...state.currentProject, ...updates }
            : state.currentProject,
        })),

      // LLM actions
      setLLMStatus: (status) => set({ llmStatus: status }),

      // Settings actions
      updateSettings: (newSettings) =>
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        })),

      // UI actions
      setLeftPanelOpen: (open) => set({ leftPanelOpen: open }),

      setRightPanelOpen: (open) => set({ rightPanelOpen: open }),

      setBottomPanelOpen: (open) => set({ bottomPanelOpen: open }),

      toggleLeftPanel: () =>
        set((state) => ({ leftPanelOpen: !state.leftPanelOpen })),

      toggleRightPanel: () =>
        set((state) => ({ rightPanelOpen: !state.rightPanelOpen })),

      toggleBottomPanel: () =>
        set((state) => ({ bottomPanelOpen: !state.bottomPanelOpen })),

      setActiveRightPanel: (panel) => set({ activeRightPanel: panel }),

      setActiveBottomPanel: (panel) => set({ activeBottomPanel: panel }),

      setSelectedFile: (file) => set({ selectedFile: file }),

      openFile: (file) =>
        set((state) => ({
          openFiles: state.openFiles.includes(file)
            ? state.openFiles
            : [...state.openFiles, file],
          selectedFile: file,
        })),

      closeFile: (file) =>
        set((state) => {
          const newOpenFiles = state.openFiles.filter((f) => f !== file);
          return {
            openFiles: newOpenFiles,
            selectedFile: state.selectedFile === file
              ? newOpenFiles[newOpenFiles.length - 1] || null
              : state.selectedFile,
          };
        }),

      closeAllFiles: () => set({ openFiles: [], selectedFile: null }),

      // Utility
      reset: () =>
        set({
          currentProject: null,
          selectedFile: null,
          openFiles: [],
          leftPanelOpen: true,
          rightPanelOpen: true,
          bottomPanelOpen: true,
          activeRightPanel: 'agent',
          activeBottomPanel: 'terminal',
          pendingAiPrompt: null,
          terminals: [],
          activeTerminalId: null,
          agentMessages: [],
        }),

      pendingAiPrompt: null,
      setPendingAiPrompt: (prompt) => set({ pendingAiPrompt: prompt }),

      // Terminal Actions
      terminals: [],
      activeTerminalId: null,

      addTerminal: () => set((state) => {
        let initialCommand = "";
        const projectType = state.currentProject?.project_type;

        if (state.terminals.length === 0) {
          if (projectType === 'react' || projectType === 'node') {
            initialCommand = 'npm run dev';
          } else if (projectType === 'rust') {
            initialCommand = 'cargo run';
          } else if (projectType === 'python') {
            initialCommand = 'python main.py';
          }
        }

        const newTerminal: TerminalSession = {
          id: Date.now().toString(),
          name: initialCommand ? initialCommand : `Terminal ${state.terminals.length + 1}`,
          projectPath: state.currentProject?.id,
          initialCommand: initialCommand
        };
        return {
          terminals: [...state.terminals, newTerminal],
          activeTerminalId: newTerminal.id,
          rightPanelOpen: true,
          activeRightPanel: 'terminal'
        };
      }),

      removeTerminal: (id) => set((state) => {
        const newTerminals = state.terminals.filter(t => t.id !== id);
        let newActiveId = state.activeTerminalId;

        if (state.activeTerminalId === id) {
          newActiveId = newTerminals.length > 0 ? newTerminals[newTerminals.length - 1].id : null;
        }

        return {
          terminals: newTerminals,
          activeTerminalId: newActiveId
        };
      }),

      setActiveTerminal: (id) => set({ activeTerminalId: id }),
    }),
    {
      name: 'sai-ide-storage',
      partialize: (state) => ({
        settings: state.settings,
        leftPanelOpen: state.leftPanelOpen,
        rightPanelOpen: state.rightPanelOpen,
      }),
    }
  )
);

// Selectors (for optimized re-renders)
export const selectCurrentProject = (state: AppStore) => state.currentProject;
export const selectProjects = (state: AppStore) => state.projects;
export const selectSettings = (state: AppStore) => state.settings;
export const selectLLMStatus = (state: AppStore) => state.llmStatus;
export const selectUIState = (state: AppStore) => ({
  leftPanelOpen: state.leftPanelOpen,
  rightPanelOpen: state.rightPanelOpen,
  activeRightPanel: state.activeRightPanel,
});
export const selectFileState = (state: AppStore) => ({
  selectedFile: state.selectedFile,
  openFiles: state.openFiles,
});
export const useThemeStore = create<ThemeState>((set) => ({
  theme: localStorage.getItem('theme') as 'light' | 'dark' || 'dark',
  setTheme: (theme) => {
    localStorage.setItem('theme', theme);
    set({ theme });
  },
}));