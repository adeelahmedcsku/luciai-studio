import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import {
    ArrowLeftIcon,
    PanelLeftIcon,
    PanelRightIcon,
    TerminalIcon,
    BotIcon,
    FolderIcon,
    FileIcon,
    SaveIcon,
    FilePlusIcon,
    SearchIcon,
    LayoutTemplateIcon
} from "lucide-react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import FileExplorer from "./FileExplorer";
import AgentChat from "./AgentChat";
import MonacoEditor from "../editor/MonacoEditor";
import FileTabs from "../editor/FileTabs";
import BottomPanel from "../layout/BottomPanel";
import CommandPalette from "./CommandPalette";
import { MenuBar } from "./MenuBar";
import { useAppStore } from "../../store/useAppStore";
import { ActivityBar } from "./ActivityBar";
import { Sidebar } from "./Sidebar";
import { NewFileDialog } from "./NewFileDialog";
import { NewFolderDialog } from "./NewFolderDialog";
import { NewProjectDialog } from "./NewProjectDialog";

interface IDEWorkspaceProps {
    projectId: string;
    onBack: () => void;
    onSwitchProject?: (projectId: string) => void;
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

export default function IDEWorkspace({ projectId, onBack, onSwitchProject }: IDEWorkspaceProps) {
    const [project, setProject] = useState<ProjectMetadata | null>(null);
    const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
    const [newFileDialogOpen, setNewFileDialogOpen] = useState(false);
    const [newFolderDialogOpen, setNewFolderDialogOpen] = useState(false);
    const [newProjectDialogOpen, setNewProjectDialogOpen] = useState(false);
    const [activeSidebarPanel, setActiveSidebarPanel] = useState("explorer");

    const {
        leftPanelOpen,
        rightPanelOpen,
        bottomPanelOpen,
        setLeftPanelOpen,
        setRightPanelOpen,
        setBottomPanelOpen,
        selectedFile,
        setSelectedFile,
        openFile,
        openFiles,
        activeBottomPanel,
        setActiveBottomPanel
    } = useAppStore();

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

    // Define actions for Command Palette
    const actions = [
        {
            id: "save-file",
            label: "Save File",
            shortcut: ["Ctrl", "S"],
            icon: <SaveIcon className="w-4 h-4" />,
            perform: () => {
                // Trigger save logic (would need to be connected to editor)
                console.log("Save triggered from palette");
            },
            section: "File"
        },
        {
            id: "new-file",
            label: "New File",
            icon: <FilePlusIcon className="w-4 h-4" />,
            perform: () => {
                // Focus file explorer creation input (requires ref or state lift)
                console.log("New File triggered");
            },
            section: "File"
        },
        {
            id: "toggle-sidebar",
            label: "Toggle Sidebar",
            shortcut: ["Ctrl", "B"],
            icon: <PanelLeftIcon className="w-4 h-4" />,
            perform: () => setLeftPanelOpen(!leftPanelOpen),
            section: "View"
        },
        {
            id: "toggle-panel",
            label: "Toggle Right Panel",
            shortcut: ["Ctrl", "L"],
            icon: <PanelRightIcon className="w-4 h-4" />,
            perform: () => setRightPanelOpen(!rightPanelOpen),
            section: "View"
        },
        {
            id: "toggle-bottom-panel",
            label: "Toggle Bottom Panel",
            shortcut: ["Ctrl", "J"],
            icon: <LayoutTemplateIcon className="w-4 h-4" />,
            perform: () => setBottomPanelOpen(!bottomPanelOpen),
            section: "View"
        },
        {
            id: "show-agent",
            label: "Show AI Agent",
            icon: <BotIcon className="w-4 h-4" />,
            perform: () => {
                setRightPanelOpen(true);
            },
            section: "AI"
        },
        {
            id: "show-terminal",
            label: "Show Terminal",
            icon: <TerminalIcon className="w-4 h-4" />,
            perform: () => {
                setBottomPanelOpen(true);
                setActiveBottomPanel("terminal");
            },
            section: "View"
        }
    ];

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
            <CommandPalette
                open={commandPaletteOpen}
                onOpenChange={setCommandPaletteOpen}
                actions={actions}
            />

            {/* Dialogs */}
            {project && (
                <>
                    <NewFileDialog
                        isOpen={newFileDialogOpen}
                        onClose={() => setNewFileDialogOpen(false)}
                        onConfirm={async (fileName) => {
                            const newFilePath = `${project.project.id}/${fileName}`;
                            try {
                                await invoke("write_file", {
                                    path: newFilePath,
                                    content: "",
                                });
                                openFile(newFilePath);
                                setSelectedFile(newFilePath);
                            } catch (error) {
                                console.error("Failed to create new file:", error);
                            }
                        }}
                        defaultPath={project.project.id}
                    />

                    <NewFolderDialog
                        isOpen={newFolderDialogOpen}
                        onClose={() => setNewFolderDialogOpen(false)}
                        onConfirm={async (folderName) => {
                            const newFolderPath = `${project.project.id}/${folderName}`;
                            try {
                                await invoke("create_directory", {
                                    path: newFolderPath,
                                });
                            } catch (error) {
                                console.error("Failed to create folder:", error);
                            }
                        }}
                        defaultPath={project.project.id}
                    />

                    <NewProjectDialog
                        isOpen={newProjectDialogOpen}
                        onClose={() => setNewProjectDialogOpen(false)}
                        onConfirm={async (templateId, projectName, location) => {
                            console.log("Creating project:", { templateId, projectName, location });
                            try {
                                const projectPath = await invoke<string>("create_project_from_template", {
                                    templateId,
                                    projectName,
                                    location,
                                });
                                // Switch to the new project
                                if (onSwitchProject) {
                                    onSwitchProject(projectPath);
                                }
                            } catch (error) {
                                console.error("Failed to create project:", error);
                            }
                        }}
                    />
                </>
            )}

            {/* Menu Bar */}
            <MenuBar
                onNewFile={() => setNewFileDialogOpen(true)}
                onNewProject={() => setNewProjectDialogOpen(true)}
                onOpenFolder={async () => {
                    try {
                        const { open } = await import("@tauri-apps/plugin-dialog");
                        const selected = await open({
                            directory: true,
                            multiple: false,
                        });
                        if (selected) {
                            console.log("Selected folder:", selected);
                            try {
                                // Verify/Load the project first
                                await invoke("open_project", {
                                    projectId: selected,
                                });
                                // Switch to the new project
                                if (onSwitchProject) {
                                    onSwitchProject(selected as string);
                                }
                            } catch (error) {
                                console.error("Failed to open project:", error);
                            }
                        }
                    } catch (error) {
                        console.error("Failed to open folder dialog:", error);
                    }
                }}
                onSave={async () => {
                    // Save the currently selected file
                    if (selectedFile) {
                        // Trigger save via Monaco editor's save function
                        // The editor already has Ctrl+S handler
                        console.log("Saving file:", selectedFile);
                    }
                }}
                onSaveAll={async () => {
                    // Save all open files with progress indicator
                    if (openFiles.length === 0) return;

                    let savedCount = 0;
                    let errorCount = 0;

                    for (const filePath of openFiles) {
                        try {
                            // Read current content from editor or file
                            const content = await invoke<string>("read_file", { path: filePath });
                            await invoke("write_file", {
                                path: filePath,
                                content: content,
                            });
                            savedCount++;
                        } catch (error) {
                            console.error(`Failed to save ${filePath}:`, error);
                            errorCount++;
                        }
                    }

                    // Show result notification
                    if (errorCount === 0) {
                        console.log(`✅ Saved ${savedCount} file(s)`);
                    } else {
                        console.log(`⚠️ Saved ${savedCount} file(s), ${errorCount} failed`);
                    }
                }}
                onToggleSidebar={() => setLeftPanelOpen(!leftPanelOpen)}
                onTogglePanel={() => setBottomPanelOpen(!bottomPanelOpen)}
                onCommandPalette={() => setCommandPaletteOpen(true)}
            />

            {/* Search Bar / Quick Access */}
            <div className="h-9 bg-secondary border-b border-border flex items-center justify-between px-4 select-none shrink-0">
                <div className="flex items-center gap-4">
                    {/* Back Button */}
                    <button
                        onClick={onBack}
                        className="p-1 hover:bg-secondary-foreground/10 rounded text-muted-foreground hover:text-foreground transition-colors"
                        title="Back to Dashboard"
                    >
                        <ArrowLeftIcon className="w-4 h-4" />
                    </button>

                    {/* Project Info */}
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-foreground font-medium">{project.project.name}</span>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            {getTechStack().map((tech) => (
                                <span
                                    key={tech}
                                    className="px-2 py-0.5 bg-background/50 rounded"
                                >
                                    {tech}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Quick Search / Command Palette Trigger */}
                <button
                    onClick={() => setCommandPaletteOpen(true)}
                    className="flex items-center gap-2 bg-background hover:bg-accent border border-border rounded px-3 py-1.5 text-sm text-muted-foreground transition-colors min-w-[300px]"
                >
                    <SearchIcon className="w-4 h-4" />
                    <span className="flex-1 text-left">{project.project.name}</span>
                    <div className="flex items-center gap-1">
                        <kbd className="px-1.5 py-0.5 text-[10px] bg-secondary border border-border rounded">Ctrl</kbd>
                        <kbd className="px-1.5 py-0.5 text-[10px] bg-secondary border border-border rounded">Shift</kbd>
                        <kbd className="px-1.5 py-0.5 text-[10px] bg-secondary border border-border rounded">P</kbd>
                    </div>
                </button>
            </div>

            {/* Main Content Area with Resizable Panels */}
            <div className="flex-1 overflow-hidden flex">
                {/* Activity Bar */}
                <ActivityBar
                    activePanel={activeSidebarPanel}
                    onPanelChange={setActiveSidebarPanel}
                    gitChangesCount={0}
                />

                {/* Sidebar */}
                {leftPanelOpen && (
                    <Sidebar
                        activePanel={activeSidebarPanel}
                        projectPath={project.project.id}
                        selectedFile={selectedFile}
                        onFileSelect={setSelectedFile}
                        onClose={() => setLeftPanelOpen(false)}
                    />
                )}

                {/* Main Editor Area & Bottom Panel */}
                <PanelGroup direction="horizontal">
                    {/* Center Column: Editor + Bottom Panel */}
                    <Panel minSize={30} className="flex flex-col min-w-0">
                        <PanelGroup direction="vertical">
                            {/* Editor */}
                            <Panel minSize={30} className="flex flex-col">
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
                            </Panel>

                            {/* Bottom Panel (Terminal/Output) */}
                            {bottomPanelOpen && (
                                <>
                                    <PanelResizeHandle className="h-1 bg-border hover:bg-primary/50 transition-colors cursor-row-resize" />
                                    <Panel defaultSize={30} minSize={10} maxSize={80}>
                                        <BottomPanel
                                            height={300} // Dynamic height handled by panel
                                            onClose={() => setBottomPanelOpen(false)}
                                        />
                                    </Panel>
                                </>
                            )}
                        </PanelGroup>
                    </Panel>

                    {/* Right Sidebar - Agent */}
                    {rightPanelOpen && (
                        <>
                            <PanelResizeHandle className="w-1 bg-border hover:bg-primary/50 transition-colors cursor-col-resize" />
                            <Panel defaultSize={25} minSize={20} maxSize={40} className="border-l border-border flex flex-col">
                                <AgentChat
                                    projectId={project.project.id}
                                    projectType={project.project.project_type}
                                    techStack={getTechStack()}
                                />
                            </Panel>
                        </>
                    )}
                </PanelGroup>
            </div>

            {/* Status Bar */}
            <div className="border-t border-border px-4 py-1 flex items-center justify-between text-xs text-muted-foreground shrink-0 bg-secondary">
                <div className="flex items-center space-x-4">
                    <button
                        onClick={() => setBottomPanelOpen(!bottomPanelOpen)}
                        className="flex items-center gap-1 hover:text-foreground"
                    >
                        <LayoutTemplateIcon className="w-3 h-3" />
                        <span>{bottomPanelOpen ? "Hide Panel" : "Show Panel"}</span>
                    </button>
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