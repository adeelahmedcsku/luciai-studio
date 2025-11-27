import { ChevronDownIcon, ChevronRightIcon, XIcon, RefreshCwIcon } from "lucide-react";
import FileExplorer from "./FileExplorer";
import SearchPanel from "./SearchPanel";
import GitPanel from "./GitPanel";

interface SidebarProps {
    activePanel: string;
    projectPath: string;
    selectedFile?: string | null;
    onFileSelect: (filePath: string) => void;
    onClose: () => void;
}

export function Sidebar({
    activePanel,
    projectPath,
    selectedFile,
    onFileSelect,
    onClose
}: SidebarProps) {
    const getPanelTitle = (panelId: string): string => {
        const titles: Record<string, string> = {
            explorer: "EXPLORER",
            search: "SEARCH",
            git: "SOURCE CONTROL",
            debug: "RUN AND DEBUG",
            extensions: "EXTENSIONS",
            settings: "SETTINGS",
        };
        return titles[panelId] || panelId.toUpperCase();
    };

    const getPanelActions = (panelId: string) => {
        switch (panelId) {
            case "explorer":
                return (
                    <>
                        <button
                            className="p-1 hover:bg-[#2a2a2a] rounded"
                            title="New File"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </button>
                        <button
                            className="p-1 hover:bg-[#2a2a2a] rounded"
                            title="New Folder"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                            </svg>
                        </button>
                        <button
                            className="p-1 hover:bg-[#2a2a2a] rounded"
                            title="Refresh Explorer"
                        >
                            <RefreshCwIcon className="w-4 h-4" />
                        </button>
                    </>
                );
            case "search":
                return (
                    <button
                        className="p-1 hover:bg-[#2a2a2a] rounded"
                        title="Clear Search Results"
                    >
                        <XIcon className="w-4 h-4" />
                    </button>
                );
            case "git":
                return (
                    <>
                        <button
                            className="p-1 hover:bg-[#2a2a2a] rounded"
                            title="Refresh"
                        >
                            <RefreshCwIcon className="w-4 h-4" />
                        </button>
                        <button
                            className="p-1 hover:bg-[#2a2a2a] rounded"
                            title="View History"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </button>
                    </>
                );
            default:
                return null;
        }
    };

    return (
        <div className="w-80 bg-sidebar flex flex-col border-r border-border">
            {/* Panel Header */}
            <div className="h-9 border-b border-border px-4 flex items-center justify-between">
                <span className="text-xs font-semibold text-sidebar-foreground">
                    {getPanelTitle(activePanel)}
                </span>
                <div className="flex gap-1 items-center">
                    {/* Panel-specific actions */}
                    {getPanelActions(activePanel)}

                    {/* Close button */}
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-sidebar-foreground/10 rounded ml-2"
                        title="Close Sidebar (Ctrl+B)"
                    >
                        <XIcon className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Panel Content */}
            <div className="flex-1 overflow-hidden">
                {activePanel === "explorer" && (
                    <FileExplorer
                        projectPath={projectPath}
                        onFileSelect={onFileSelect}
                        selectedFile={selectedFile || null}
                    />
                )}
                {activePanel === "search" && <SearchPanel />}
                {activePanel === "git" && <GitPanel projectPath={projectPath} />}
                {activePanel === "debug" && (
                    <div className="p-4 text-muted-foreground text-sm">
                        <p>Run and Debug panel</p>
                        <p className="mt-2 text-xs">Coming soon...</p>
                    </div >
                )}
                {
                    activePanel === "extensions" && (
                        <div className="p-4 text-muted-foreground text-sm">
                            <p>Extensions panel</p>
                            <p className="mt-2 text-xs">Coming soon...</p>
                        </div>
                    )
                }
                {
                    activePanel === "settings" && (
                        <div className="p-4 text-muted-foreground text-sm">
                            <p>Settings panel</p>
                            <p className="mt-2 text-xs">Coming soon...</p>
                        </div>
                    )
                }
            </div >
        </div >
    );
}
