import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { GitBranchIcon, RefreshCwIcon, PlusIcon, MinusIcon, FileIcon, CheckIcon, TrashIcon } from "lucide-react";
import { toast } from "../ui/NotificationToast";
import { Modal } from "../ui/Modal";

interface GitStatus {
    branch: string;
    ahead: number;
    behind: number;
    staged: string[];
    modified: string[];
    untracked: string[];
    conflicted: string[];
}

interface GitBranch {
    name: string;
    is_current: boolean;
    is_remote: boolean;
    last_commit?: string;
}

export default function GitPanel({ projectPath }: { projectPath: string }) {
    const [gitStatus, setGitStatus] = useState<GitStatus | null>(null);
    const [branches, setBranches] = useState<GitBranch[]>([]);
    const [showBranchModal, setShowBranchModal] = useState(false);
    const [newBranchName, setNewBranchName] = useState("");
    const [commitMessage, setCommitMessage] = useState("");
    const [isCommitting, setIsCommitting] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);

    useEffect(() => {
        loadGitStatus();
    }, [projectPath]);

    const loadGitStatus = async () => {
        setIsRefreshing(true);
        try {
            const status = await invoke<GitStatus>("git_status", {
                repoPath: projectPath,
            });
            console.log("Git Status:", status);
            setGitStatus(status);
        } catch (error) {
            console.error("Failed to load git status:", error);
            setGitStatus(null);
        } finally {
            setIsRefreshing(false);
        }
    };

    const loadBranches = async () => {
        try {
            const branches = await invoke<GitBranch[]>("git_branches", {
                repoPath: projectPath,
            });
            setBranches(branches);
        } catch (error) {
            console.error("Failed to load branches:", error);
            toast.error("Failed to load branches");
        }
    };

    const handleOpenBranchModal = () => {
        loadBranches();
        setShowBranchModal(true);
    };

    const handleCreateBranch = async () => {
        if (!newBranchName.trim()) return;
        try {
            await invoke("git_create_branch", {
                repoPath: projectPath,
                name: newBranchName,
            });
            toast.success(`Created branch ${newBranchName}`);
            setNewBranchName("");
            await loadBranches();
            await loadGitStatus();
        } catch (error) {
            console.error("Failed to create branch:", error);
            toast.error("Failed to create branch");
        }
    };

    const handleDeleteBranch = async (branchName: string) => {
        try {
            await invoke("git_delete_branch", {
                repoPath: projectPath,
                name: branchName,
            });
            toast.success(`Deleted branch ${branchName}`);
            await loadBranches();
        } catch (error) {
            console.error("Failed to delete branch:", error);
            toast.error("Failed to delete branch");
        }
    };

    const handleCheckoutBranch = async (branchName: string) => {
        try {
            await invoke("git_checkout", {
                repoPath: projectPath,
                branch: branchName,
            });
            toast.success(`Checked out ${branchName}`);
            await loadBranches();
            await loadGitStatus();
            setShowBranchModal(false);
        } catch (error) {
            console.error("Failed to checkout branch:", error);
            toast.error("Failed to checkout branch");
        }
    };

    const handleStage = async (path: string) => {
        try {
            await invoke("git_add", {
                repoPath: projectPath,
                paths: [path],
            });
            await loadGitStatus();
        } catch (error) {
            console.error("Failed to stage:", error);
            toast.error("Failed to stage file");
        }
    };

    const handleUnstage = async (path: string) => {
        try {
            await invoke("git_reset", {
                repoPath: projectPath,
                paths: [path],
            });
            await loadGitStatus();
        } catch (error) {
            console.error("Failed to unstage:", error);
            toast.error("Failed to unstage file");
        }
    };

    const handleStageAll = async () => {
        if (!gitStatus) return;
        const allUnstaged = [...gitStatus.modified, ...gitStatus.untracked];
        if (allUnstaged.length === 0) return;

        try {
            await invoke("git_add", {
                repoPath: projectPath,
                paths: ["."],
            });
            await loadGitStatus();
        } catch (error) {
            console.error("Failed to stage all:", error);
            toast.error("Failed to stage all files");
        }
    };

    const handleUnstageAll = async () => {
        if (!gitStatus || gitStatus.staged.length === 0) return;

        try {
            await invoke("git_reset", {
                repoPath: projectPath,
                paths: ["."],
            });
            await loadGitStatus();
        } catch (error) {
            console.error("Failed to unstage all:", error);
            toast.error("Failed to unstage all files");
        }
    };

    const handleCommit = async () => {
        if (!commitMessage.trim() || !gitStatus || gitStatus.staged.length === 0) {
            return;
        }

        setIsCommitting(true);
        try {
            await invoke("git_commit", {
                repoPath: projectPath,
                message: commitMessage,
            });

            setCommitMessage("");
            await loadGitStatus();
            toast.success("Committed changes");
        } catch (error) {
            console.error("Failed to commit:", error);
            toast.error("Failed to commit");
        } finally {
            setIsCommitting(false);
        }
    };

    const handleInit = async () => {
        try {
            await invoke("git_init", { repoPath: projectPath });
            await loadGitStatus();
            toast.success("Git repository initialized");
        } catch (error) {
            console.error("Failed to init git:", error);
            toast.error("Failed to initialize git repository");
        }
    };

    const handlePush = async () => {
        if (!gitStatus) return;
        try {
            await invoke("git_push", {
                repoPath: projectPath,
                remote: "origin",
                branch: gitStatus.branch,
            });
            await loadGitStatus();
            toast.success("Pushed to origin/" + gitStatus.branch);
        } catch (error) {
            console.error("Failed to push:", error);
            toast.error("Failed to push");
        }
    };

    const handlePull = async () => {
        if (!gitStatus) return;
        try {
            await invoke("git_pull", {
                repoPath: projectPath,
                remote: "origin",
                branch: gitStatus.branch,
            });
            await loadGitStatus();
            toast.success("Pulled from origin/" + gitStatus.branch);
        } catch (error) {
            console.error("Failed to pull:", error);
            toast.error("Failed to pull");
        }
    };

    const getFileName = (path: string) => {
        return path.split("/").pop() || path;
    };

    if (!gitStatus) {
        return (
            <div className="p-4 text-muted-foreground text-sm">
                <p>No Git repository found</p>
                <p className="mt-2 text-xs">Initialize a repository to use source control</p>
                <div className="flex gap-2 mt-4">
                    <button
                        onClick={handleInit}
                        className="px-4 py-2 bg-primary hover:bg-primary/90 rounded text-primary-foreground text-sm"
                    >
                        Initialize Repository
                    </button>
                    <button
                        onClick={loadGitStatus}
                        className="px-4 py-2 bg-secondary hover:bg-secondary/80 rounded text-secondary-foreground text-sm"
                    >
                        Refresh
                    </button>
                </div>
            </div>
        );
    }

    const hasStagedChanges = gitStatus.staged.length > 0;
    const hasUnstagedChanges = gitStatus.modified.length > 0 || gitStatus.untracked.length > 0 || gitStatus.conflicted.length > 0;

    return (
        <div className="flex flex-col h-full text-foreground">
            {/* Branch Info */}
            <div className="px-4 py-2 border-b border-border flex items-center justify-between bg-secondary/30">
                <button
                    onClick={handleOpenBranchModal}
                    className="flex items-center gap-2 hover:bg-accent px-2 py-1 rounded -ml-2 transition-colors"
                    title="Manage Branches"
                >
                    <GitBranchIcon className="w-4 h-4" />
                    <span className="text-sm font-medium">{gitStatus.branch}</span>
                    {(gitStatus.ahead > 0 || gitStatus.behind > 0) && (
                        <span className="text-xs text-muted-foreground flex gap-1">
                            {gitStatus.ahead > 0 && <span title="Ahead">↑{gitStatus.ahead}</span>}
                            {gitStatus.behind > 0 && <span title="Behind">↓{gitStatus.behind}</span>}
                        </span>
                    )}
                </button>
                <div className="flex items-center gap-1">
                    <button
                        onClick={handlePull}
                        className="p-1 hover:bg-accent rounded"
                        title="Pull"
                    >
                        <span className="text-xs">↓</span>
                    </button>
                    <button
                        onClick={handlePush}
                        className="p-1 hover:bg-accent rounded"
                        title="Push"
                    >
                        <span className="text-xs">↑</span>
                    </button>
                    <button
                        onClick={loadGitStatus}
                        disabled={isRefreshing}
                        className="p-1 hover:bg-accent rounded"
                        title="Refresh"
                    >
                        <RefreshCwIcon className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
                    </button>
                </div>
            </div>

            {/* Commit Message */}
            <div className="px-4 py-3 border-b border-border">
                <textarea
                    value={commitMessage}
                    onChange={(e) => setCommitMessage(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.ctrlKey && e.key === "Enter") {
                            handleCommit();
                        }
                    }}
                    placeholder="Message (Ctrl+Enter to commit)"
                    className="w-full bg-input border border-border rounded px-3 py-2 text-sm resize-none focus:outline-none focus:border-primary placeholder:text-muted-foreground"
                    rows={2}
                />
                <button
                    onClick={handleCommit}
                    disabled={!commitMessage.trim() || !hasStagedChanges || isCommitting}
                    className="w-full mt-2 bg-primary hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed px-3 py-1.5 rounded text-sm font-medium transition-colors text-primary-foreground flex items-center justify-center gap-2"
                >
                    {isCommitting ? <RefreshCwIcon className="w-3 h-3 animate-spin" /> : <CheckIcon className="w-3 h-3" />}
                    {isCommitting ? "Committing..." : "Commit"}
                </button>
            </div>

            {/* Changes List */}
            <div className="flex-1 overflow-y-auto">
                {/* Staged Changes */}
                <div className="py-2">
                    <div className="px-4 flex items-center justify-between group mb-1">
                        <span className="text-xs font-semibold text-muted-foreground uppercase">Staged Changes</span>
                        {hasStagedChanges && (
                            <button
                                onClick={handleUnstageAll}
                                className="text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Unstage All"
                            >
                                <MinusIcon className="w-3 h-3" />
                            </button>
                        )}
                    </div>
                    {gitStatus.staged.map((path) => (
                        <div key={path} className="px-4 py-1 hover:bg-accent flex items-center justify-between group text-sm">
                            <div className="flex items-center gap-2 truncate">
                                <FileIcon className="w-3 h-3 text-muted-foreground" />
                                <span className="truncate" title={path}>{getFileName(path)}</span>
                                <span className="text-xs text-green-500">A</span>
                            </div>
                            <button
                                onClick={() => handleUnstage(path)}
                                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-background rounded"
                                title="Unstage"
                            >
                                <MinusIcon className="w-3 h-3" />
                            </button>
                        </div>
                    ))}
                </div>

                {/* Unstaged Changes */}
                <div className="py-2 border-t border-border">
                    <div className="px-4 flex items-center justify-between group mb-1">
                        <span className="text-xs font-semibold text-muted-foreground uppercase">Changes</span>
                        {hasUnstagedChanges && (
                            <button
                                onClick={handleStageAll}
                                className="text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Stage All"
                            >
                                <PlusIcon className="w-3 h-3" />
                            </button>
                        )}
                    </div>

                    {[...gitStatus.modified, ...gitStatus.conflicted].map((path) => (
                        <div key={path} className="px-4 py-1 hover:bg-accent flex items-center justify-between group text-sm">
                            <div className="flex items-center gap-2 truncate">
                                <FileIcon className="w-3 h-3 text-muted-foreground" />
                                <span className="truncate" title={path}>{getFileName(path)}</span>
                                <span className="text-xs text-yellow-500">M</span>
                            </div>
                            <button
                                onClick={() => handleStage(path)}
                                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-background rounded"
                                title="Stage"
                            >
                                <PlusIcon className="w-3 h-3" />
                            </button>
                        </div>
                    ))}

                    {gitStatus.untracked.map((path) => (
                        <div key={path} className="px-4 py-1 hover:bg-accent flex items-center justify-between group text-sm">
                            <div className="flex items-center gap-2 truncate">
                                <FileIcon className="w-3 h-3 text-muted-foreground" />
                                <span className="truncate" title={path}>{getFileName(path)}</span>
                                <span className="text-xs text-green-500">U</span>
                            </div>
                            <button
                                onClick={() => handleStage(path)}
                                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-background rounded"
                                title="Stage"
                            >
                                <PlusIcon className="w-3 h-3" />
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Branch Management Modal */}
            <Modal
                isOpen={showBranchModal}
                onClose={() => setShowBranchModal(false)}
                title="Manage Branches"
            >
                <div className="space-y-4">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={newBranchName}
                            onChange={(e) => setNewBranchName(e.target.value)}
                            placeholder="New branch name"
                            className="flex-1 bg-input border border-border rounded px-3 py-2 text-sm focus:outline-none focus:border-primary"
                        />
                        <button
                            onClick={handleCreateBranch}
                            disabled={!newBranchName.trim()}
                            className="px-4 py-2 bg-primary hover:bg-primary/90 rounded text-primary-foreground text-sm font-medium disabled:opacity-50"
                        >
                            Create
                        </button>
                    </div>

                    <div className="space-y-1 max-h-60 overflow-y-auto">
                        {branches.map((branch) => (
                            <div
                                key={branch.name}
                                className={`flex items-center justify-between px-3 py-2 rounded hover:bg-accent group ${branch.is_current ? "bg-accent/50" : ""
                                    }`}
                            >
                                <div className="flex items-center gap-2">
                                    <GitBranchIcon className={`w-4 h-4 ${branch.is_current ? "text-primary" : "text-muted-foreground"}`} />
                                    <span className={`text-sm ${branch.is_current ? "font-medium" : ""}`}>
                                        {branch.name}
                                    </span>
                                    {branch.is_current && (
                                        <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">Current</span>
                                    )}
                                </div>
                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {!branch.is_current && (
                                        <>
                                            <button
                                                onClick={() => handleCheckoutBranch(branch.name)}
                                                className="text-xs hover:text-primary hover:underline"
                                            >
                                                Checkout
                                            </button>
                                            <button
                                                onClick={() => handleDeleteBranch(branch.name)}
                                                className="p-1 hover:bg-destructive/10 hover:text-destructive rounded"
                                                title="Delete Branch"
                                            >
                                                <TrashIcon className="w-3.5 h-3.5" />
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </Modal>
        </div>
    );
}
