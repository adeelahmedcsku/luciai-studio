import { invoke } from '@tauri-apps/api/tauri';
import { useState, useCallback } from 'react';

export interface GitStatus {
  branch: string;
  ahead: number;
  behind: number;
  staged: string[];
  modified: string[];
  untracked: string[];
  conflicted: string[];
}

export interface GitCommit {
  hash: string;
  short_hash: string;
  author: string;
  date: string;
  message: string;
}

export interface GitBranch {
  name: string;
  is_current: boolean;
  is_remote: boolean;
  last_commit?: string;
}

export function useGit(repoPath: string) {
  const [status, setStatus] = useState<GitStatus | null>(null);
  const [commits, setCommits] = useState<GitCommit[]>([]);
  const [branches, setBranches] = useState<GitBranch[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const init = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      await invoke('git_init', { repoPath });
      await refreshStatus();
    } catch (err) {
      setError(`Failed to initialize repository: ${err}`);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [repoPath]);

  const refreshStatus = useCallback(async () => {
    try {
      const gitStatus = await invoke<GitStatus>('git_status', { repoPath });
      setStatus(gitStatus);
      return gitStatus;
    } catch (err) {
      setError(`Failed to get status: ${err}`);
      throw err;
    }
  }, [repoPath]);

  const add = useCallback(
    async (paths: string[] = []) => {
      setIsLoading(true);
      setError(null);
      try {
        await invoke('git_add', { repoPath, paths });
        await refreshStatus();
      } catch (err) {
        setError(`Failed to stage files: ${err}`);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [repoPath, refreshStatus]
  );

  const commit = useCallback(
    async (message: string) => {
      setIsLoading(true);
      setError(null);
      try {
        const hash = await invoke<string>('git_commit', { repoPath, message });
        await refreshStatus();
        await loadHistory(10);
        return hash;
      } catch (err) {
        setError(`Failed to commit: ${err}`);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [repoPath, refreshStatus]
  );

  const loadHistory = useCallback(
    async (count: number = 20) => {
      try {
        const history = await invoke<GitCommit[]>('git_log', { repoPath, count });
        setCommits(history);
        return history;
      } catch (err) {
        setError(`Failed to load history: ${err}`);
        throw err;
      }
    },
    [repoPath]
  );

  const loadBranches = useCallback(async () => {
    try {
      const branchList = await invoke<GitBranch[]>('git_branches', { repoPath });
      setBranches(branchList);
      return branchList;
    } catch (err) {
      setError(`Failed to load branches: ${err}`);
      throw err;
    }
  }, [repoPath]);

  const createBranch = useCallback(
    async (name: string) => {
      setIsLoading(true);
      setError(null);
      try {
        await invoke('git_create_branch', { repoPath, name });
        await loadBranches();
      } catch (err) {
        setError(`Failed to create branch: ${err}`);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [repoPath, loadBranches]
  );

  const checkout = useCallback(
    async (branch: string) => {
      setIsLoading(true);
      setError(null);
      try {
        await invoke('git_checkout', { repoPath, branch });
        await refreshStatus();
        await loadBranches();
      } catch (err) {
        setError(`Failed to checkout branch: ${err}`);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [repoPath, refreshStatus, loadBranches]
  );

  const pull = useCallback(
    async (remote: string = 'origin', branch?: string) => {
      setIsLoading(true);
      setError(null);
      try {
        const currentBranch = branch || status?.branch || 'main';
        const result = await invoke<string>('git_pull', {
          repoPath,
          remote,
          branch: currentBranch,
        });
        await refreshStatus();
        await loadHistory(10);
        return result;
      } catch (err) {
        setError(`Failed to pull: ${err}`);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [repoPath, status, refreshStatus, loadHistory]
  );

  const push = useCallback(
    async (remote: string = 'origin', branch?: string) => {
      setIsLoading(true);
      setError(null);
      try {
        const currentBranch = branch || status?.branch || 'main';
        const result = await invoke<string>('git_push', {
          repoPath,
          remote,
          branch: currentBranch,
        });
        await refreshStatus();
        return result;
      } catch (err) {
        setError(`Failed to push: ${err}`);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [repoPath, status, refreshStatus]
  );

  const addRemote = useCallback(
    async (name: string, url: string) => {
      setIsLoading(true);
      setError(null);
      try {
        await invoke('git_add_remote', { repoPath, name, url });
      } catch (err) {
        setError(`Failed to add remote: ${err}`);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [repoPath]
  );

  const getDiff = useCallback(
    async (file?: string) => {
      try {
        const diff = await invoke<string>('git_diff', { repoPath, file });
        return diff;
      } catch (err) {
        setError(`Failed to get diff: ${err}`);
        throw err;
      }
    },
    [repoPath]
  );

  return {
    status,
    commits,
    branches,
    isLoading,
    error,
    init,
    refreshStatus,
    add,
    commit,
    loadHistory,
    loadBranches,
    createBranch,
    checkout,
    pull,
    push,
    addRemote,
    getDiff,
  };
}

// Helper to check if changes are dirty
export function isDirty(status: GitStatus | null): boolean {
  if (!status) return false;
  return (
    status.staged.length > 0 ||
    status.modified.length > 0 ||
    status.untracked.length > 0
  );
}

// Helper to get total change count
export function getTotalChanges(status: GitStatus | null): number {
  if (!status) return 0;
  return status.staged.length + status.modified.length + status.untracked.length;
}

// Helper to format commit date
export function formatCommitDate(date: string): string {
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
}
