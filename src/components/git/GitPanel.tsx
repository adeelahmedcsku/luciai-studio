import { useState, useEffect } from "react";
import {
  GitBranchIcon,
  GitCommitIcon,
  GitPullRequestIcon,
  RefreshCwIcon,
  CheckIcon,
  PlusIcon,
  UploadIcon,
  DownloadIcon,
} from "lucide-react";
import {
  getStatus,
  stageFiles,
  stageAll,
  commit,
  getCommits,
  createBranch,
  switchBranch,
  getBranches,
  push,
  pull,
  initRepository,
  isGitRepository,
  GitStatus,
  GitCommit,
} from "../../utils/GitIntegration";
import { toast } from "../ui/NotificationToast";

interface GitPanelProps {
  projectPath: string;
}

export default function GitPanel({ projectPath }: GitPanelProps) {
  const [status, setStatus] = useState<GitStatus | null>(null);
  const [commits, setCommits] = useState<GitCommit[]>([]);
  const [branches, setBranches] = useState<{ current: string; branches: string[] }>({
    current: "",
    branches: [],
  });
  const [commitMessage, setCommitMessage] = useState("");
  const [newBranchName, setNewBranchName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isGitRepo, setIsGitRepo] = useState(false);
  const [showNewBranch, setShowNewBranch] = useState(false);

  useEffect(() => {
    loadGitData();
  }, [projectPath]);

  const loadGitData = async () => {
    setIsLoading(true);
    
    const isRepo = await isGitRepository(projectPath);
    setIsGitRepo(isRepo);

    if (isRepo) {
      const [gitStatus, gitCommits, gitBranches] = await Promise.all([
        getStatus(projectPath),
        getCommits(projectPath),
        getBranches(projectPath),
      ]);

      setStatus(gitStatus);
      setCommits(gitCommits);
      setBranches(gitBranches);
    }

    setIsLoading(false);
  };

  const handleInitRepo = async () => {
    const result = await initRepository(projectPath);
    if (result.success) {
      await loadGitData();
    }
  };

  const handleStageAll = async () => {
    const result = await stageAll(projectPath);
    if (result.success) {
      await loadGitData();
    }
  };

  const handleStageFile = async (file: string) => {
    const result = await stageFiles(projectPath, [file]);
    if (result.success) {
      await loadGitData();
    }
  };

  const handleCommit = async () => {
    if (!commitMessage.trim()) {
      toast.error("Commit message required", "Please enter a message");
      return;
    }

    const result = await commit(projectPath, commitMessage);
    if (result.success) {
      setCommitMessage("");
      await loadGitData();
    }
  };

  const handleCreateBranch = async () => {
    if (!newBranchName.trim()) {
      toast.error("Branch name required", "Please enter a name");
      return;
    }

    const result = await createBranch(projectPath, newBranchName);
    if (result.success) {
      setNewBranchName("");
      setShowNewBranch(false);
      await loadGitData();
    }
  };

  const handleSwitchBranch = async (branchName: string) => {
    const result = await switchBranch(projectPath, branchName);
    if (result.success) {
      await loadGitData();
    }
  };

  const handlePush = async () => {
    const result = await push(projectPath);
    if (result.success) {
      await loadGitData();
    }
  };

  const handlePull = async () => {
    const result = await pull(projectPath);
    if (result.success) {
      await loadGitData();
    }
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-xs text-muted-foreground">Loading Git...</p>
        </div>
      </div>
    );
  }

  if (!isGitRepo) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center">
        <GitBranchIcon className="w-16 h-16 text-muted-foreground mb-4 opacity-50" />
        <h3 className="text-lg font-semibold mb-2">No Git Repository</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Initialize Git to start version control
        </p>
        <button
          onClick={handleInitRepo}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          Initialize Git
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b border-border px-3 py-2 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <GitBranchIcon className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold">Source Control</span>
        </div>
        <button
          onClick={loadGitData}
          className="p-1 hover:bg-secondary rounded transition-colors"
          title="Refresh"
        >
          <RefreshCwIcon className="w-4 h-4" />
        </button>
      </div>

      {/* Branch Info */}
      <div className="border-b border-border px-3 py-2 bg-secondary/30">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <GitBranchIcon className="w-4 h-4 text-primary" />
            <select
              value={branches.current}
              onChange={(e) => handleSwitchBranch(e.target.value)}
              className="bg-transparent text-sm font-medium border-none outline-none cursor-pointer"
            >
              {branches.branches.map((branch) => (
                <option key={branch} value={branch}>
                  {branch}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={() => setShowNewBranch(!showNewBranch)}
            className="p-1 hover:bg-secondary rounded transition-colors"
            title="New branch"
          >
            <PlusIcon className="w-4 h-4" />
          </button>
        </div>

        {showNewBranch && (
          <div className="flex space-x-2 mt-2">
            <input
              type="text"
              value={newBranchName}
              onChange={(e) => setNewBranchName(e.target.value)}
              placeholder="New branch name"
              className="flex-1 px-2 py-1 text-xs border border-border rounded bg-background"
              onKeyPress={(e) => e.key === "Enter" && handleCreateBranch()}
            />
            <button
              onClick={handleCreateBranch}
              className="px-2 py-1 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90"
            >
              Create
            </button>
          </div>
        )}

        {status && (status.ahead > 0 || status.behind > 0) && (
          <div className="flex items-center space-x-3 mt-2 text-xs text-muted-foreground">
            {status.ahead > 0 && (
              <span className="flex items-center space-x-1">
                <UploadIcon className="w-3 h-3" />
                <span>{status.ahead} ahead</span>
              </span>
            )}
            {status.behind > 0 && (
              <span className="flex items-center space-x-1">
                <DownloadIcon className="w-3 h-3" />
                <span>{status.behind} behind</span>
              </span>
            )}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Changes Section */}
        {status && !status.clean && (
          <div className="border-b border-border">
            <div className="px-3 py-2 flex items-center justify-between bg-secondary/20">
              <span className="text-xs font-semibold uppercase">Changes</span>
              <button
                onClick={handleStageAll}
                className="text-xs text-primary hover:underline"
              >
                Stage All
              </button>
            </div>

            {/* Modified Files */}
            {status.modified.length > 0 && (
              <div>
                {status.modified.map((file) => (
                  <div
                    key={file}
                    className="px-3 py-2 hover:bg-secondary/50 flex items-center justify-between group"
                  >
                    <span className="text-xs truncate">{file}</span>
                    <button
                      onClick={() => handleStageFile(file)}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-secondary rounded transition-all"
                      title="Stage file"
                    >
                      <PlusIcon className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Staged Files */}
            {status.staged.length > 0 && (
              <div className="mt-2">
                <div className="px-3 py-1 text-xs font-semibold text-green-600">
                  Staged
                </div>
                {status.staged.map((file) => (
                  <div
                    key={file}
                    className="px-3 py-2 hover:bg-secondary/50 flex items-center space-x-2"
                  >
                    <CheckIcon className="w-3 h-3 text-green-600" />
                    <span className="text-xs truncate">{file}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Untracked Files */}
            {status.untracked.length > 0 && (
              <div className="mt-2">
                <div className="px-3 py-1 text-xs font-semibold text-muted-foreground">
                  Untracked
                </div>
                {status.untracked.map((file) => (
                  <div
                    key={file}
                    className="px-3 py-2 hover:bg-secondary/50 flex items-center justify-between group"
                  >
                    <span className="text-xs truncate">{file}</span>
                    <button
                      onClick={() => handleStageFile(file)}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-secondary rounded transition-all"
                      title="Stage file"
                    >
                      <PlusIcon className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Commit Input */}
            {status.staged.length > 0 && (
              <div className="p-3 border-t border-border">
                <textarea
                  value={commitMessage}
                  onChange={(e) => setCommitMessage(e.target.value)}
                  placeholder="Commit message"
                  className="w-full px-2 py-1 text-xs border border-border rounded bg-background resize-none"
                  rows={3}
                />
                <div className="flex space-x-2 mt-2">
                  <button
                    onClick={handleCommit}
                    disabled={!commitMessage.trim()}
                    className="flex-1 px-3 py-1 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Commit
                  </button>
                  <button
                    onClick={handlePush}
                    className="px-3 py-1 text-xs border border-border rounded hover:bg-secondary"
                    title="Push"
                  >
                    <UploadIcon className="w-3 h-3" />
                  </button>
                  <button
                    onClick={handlePull}
                    className="px-3 py-1 text-xs border border-border rounded hover:bg-secondary"
                    title="Pull"
                  >
                    <DownloadIcon className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Clean State */}
        {status && status.clean && (
          <div className="p-8 text-center">
            <CheckIcon className="w-12 h-12 text-green-600 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              No changes to commit
            </p>
          </div>
        )}

        {/* Commits Section */}
        {commits.length > 0 && (
          <div>
            <div className="px-3 py-2 bg-secondary/20">
              <span className="text-xs font-semibold uppercase">
                Recent Commits
              </span>
            </div>
            {commits.map((commitItem) => (
              <div
                key={commitItem.hash}
                className="px-3 py-2 hover:bg-secondary/50 border-b border-border"
              >
                <div className="flex items-center space-x-2 mb-1">
                  <GitCommitIcon className="w-3 h-3 text-primary" />
                  <span className="text-xs font-mono text-muted-foreground">
                    {commitItem.hash}
                  </span>
                </div>
                <p className="text-xs mb-1">{commitItem.message}</p>
                <p className="text-xs text-muted-foreground">
                  {commitItem.author} • {new Date(commitItem.date).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
