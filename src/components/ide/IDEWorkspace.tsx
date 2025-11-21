import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { 
  ArrowLeftIcon, 
  PanelLeftIcon, 
  PanelRightIcon,
  TerminalIcon,
  BotIcon,
  FolderIcon 
} from "lucide-react";
import FileExplorer from "./FileExplorer";
import AgentChat from "./AgentChat";
import MonacoEditor from "../editor/MonacoEditor";
import FileTabs from "../editor/FileTabs";
import Terminal from "../terminal/Terminal";

interface IDEWorkspaceProps {
  projectId: string;
  onBack: () => void;
}

interface ProjectMetadata {
  project: {
    id: string;
    name: string;
    project_type: string;
    tech_stack: {
      frontend?: string[];
      backend?: string[];
      database?: string;
    };
  };
}

export default function IDEWorkspace({ projectId, onBack }: IDEWorkspaceProps) {
  const [project, setProject] = useState<ProjectMetadata | null>(null);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [activePanel, setActivePanel] = useState<"agent" | "terminal">("agent");

  useEffect(() => {
    loadProject();
  }, [projectId]);

  const loadProject = async () => {
    try {
      const metadata = await invoke<ProjectMetadata>("open_project", {
        projectId,
      });
      setProject(metadata);
    } catch (error) {
      console.error("Failed to load project:", error);
    }
  };

  const handleFileSave = async (content: string) => {
    console.log("Saving file:", selectedFile, content);
    // TODO: Implement actual file saving via Tauri
  };

  const getTechStack = (): string[] => {
    if (!project) return [];
    const stack: string[] = [];
    if (project.project.tech_stack.frontend) {
      stack.push(...project.project.tech_stack.frontend);
    }
    if (project.project.tech_stack.backend) {
      stack.push(...project.project.tech_stack.backend);
    }
    if (project.project.tech_stack.database) {
      stack.push(project.project.tech_stack.database);
    }
    return stack;
  };

  if (!project) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading project...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-background">
      {/* Top Bar */}
      <header className="border-b border-border px-4 py-2 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-secondary rounded-lg transition-colors"
            title="Back to Projects"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </button>
          <div className="flex items-center space-x-2">
            <FolderIcon className="w-5 h-5 text-primary" />
            <h1 className="text-lg font-semibold">{project.project.name}</h1>
          </div>
          <div className="flex items-center space-x-2">
            {getTechStack().map((tech) => (
              <span
                key={tech}
                className="px-2 py-1 text-xs bg-primary/10 text-primary rounded"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setLeftPanelOpen(!leftPanelOpen)}
            className={`p-2 rounded-lg transition-colors ${
              leftPanelOpen ? "bg-primary/10 text-primary" : "hover:bg-secondary"
            }`}
            title="Toggle File Explorer"
          >
            <PanelLeftIcon className="w-5 h-5" />
          </button>
          <button
            onClick={() => setRightPanelOpen(!rightPanelOpen)}
            className={`p-2 rounded-lg transition-colors ${
              rightPanelOpen ? "bg-primary/10 text-primary" : "hover:bg-secondary"
            }`}
            title="Toggle Side Panel"
          >
            <PanelRightIcon className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - File Explorer */}
        {leftPanelOpen && (
          <div className="w-64 border-r border-border flex-shrink-0">
            <FileExplorer
              projectPath={project.project.id}
              onFileSelect={setSelectedFile}
              selectedFile={selectedFile}
            />
          </div>
        )}

        {/* Center - Code Editor */}
        <div className="flex-1 flex flex-col min-w-0">
          {selectedFile ? (
            <>
              <FileTabs onFileSelect={setSelectedFile} />
              <MonacoEditor
                filePath={selectedFile}
                language="typescript"
                onSave={handleFileSave}
              />
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center">
              <FileIcon className="w-16 h-16 text-muted-foreground mb-4 opacity-50" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                No File Open
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Select a file from the explorer to start editing
              </p>
              <p className="text-xs text-muted-foreground">
                Or press <kbd className="px-2 py-1 bg-secondary rounded">Ctrl+P</kbd> to quickly open a file
              </p>
            </div>
          )}
        </div>

        {/* Right Sidebar - Agent & Terminal */}
        {rightPanelOpen && (
          <div className="w-96 border-l border-border flex-shrink-0 flex flex-col">
            {/* Panel Tabs */}
            <div className="border-b border-border flex">
              <button
                onClick={() => setActivePanel("agent")}
                className={`flex-1 px-4 py-2 flex items-center justify-center space-x-2 transition-colors ${
                  activePanel === "agent"
                    ? "border-b-2 border-primary text-primary bg-primary/5"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <BotIcon className="w-4 h-4" />
                <span className="text-sm font-medium">Agent</span>
              </button>
              <button
                onClick={() => setActivePanel("terminal")}
                className={`flex-1 px-4 py-2 flex items-center justify-center space-x-2 transition-colors ${
                  activePanel === "terminal"
                    ? "border-b-2 border-primary text-primary bg-primary/5"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <TerminalIcon className="w-4 h-4" />
                <span className="text-sm font-medium">Terminal</span>
              </button>
            </div>

            {/* Panel Content */}
            <div className="flex-1 overflow-hidden">
              {activePanel === "agent" ? (
                <AgentChat
                  projectId={project.project.id}
                  projectType={project.project.project_type}
                  techStack={getTechStack()}
                />
              ) : (
                <Terminal projectPath={project.project.id} />
              )}
            </div>
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="border-t border-border px-4 py-1 flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center space-x-4">
          <span>🟢 Ready</span>
          <span>Project: {project.project.name}</span>
        </div>
        <div className="flex items-center space-x-4">
          <span>{selectedFile || "No file selected"}</span>
          <span>Software Developer Agent IDE v0.1</span>
        </div>
      </div>
    </div>
  );
}
