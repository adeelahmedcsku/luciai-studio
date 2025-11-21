import { invoke } from "@tauri-apps/api/core";
import { toast } from "../components/ui/NotificationToast";

export interface GitStatus {
  branch: string;
  modified: string[];
  staged: string[];
  untracked: string[];
  ahead: number;
  behind: number;
  clean: boolean;
}

export interface GitCommit {
  hash: string;
  author: string;
  date: string;
  message: string;
}

/**
 * Initialize a new Git repository
 */
export async function initRepository(
  projectPath: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const result = await invoke<{
      stdout: string;
      stderr: string;
      success: boolean;
    }>("execute_command", {
      request: {
        command: "git",
        args: ["init"],
        working_dir: projectPath,
      },
    });

    if (result.success) {
      toast.success("Git initialized", "Repository created");
      return { success: true };
    } else {
      toast.error("Git init failed", result.stderr);
      return { success: false, error: result.stderr };
    }
  } catch (error) {
    const errorMsg = error as string;
    toast.error("Git init failed", errorMsg);
    return { success: false, error: errorMsg };
  }
}

/**
 * Get current Git status
 */
export async function getStatus(
  projectPath: string
): Promise<GitStatus | null> {
  try {
    const result = await invoke<{
      stdout: string;
      stderr: string;
      success: boolean;
    }>("execute_command", {
      request: {
        command: "git",
        args: ["status", "--porcelain", "--branch"],
        working_dir: projectPath,
      },
    });

    if (!result.success) {
      return null;
    }

    return parseGitStatus(result.stdout);
  } catch (error) {
    console.error("Error getting Git status:", error);
    return null;
  }
}

/**
 * Parse git status output
 */
function parseGitStatus(output: string): GitStatus {
  const lines = output.split("\n").filter((line) => line.trim());
  
  let branch = "main";
  let ahead = 0;
  let behind = 0;
  const modified: string[] = [];
  const staged: string[] = [];
  const untracked: string[] = [];

  for (const line of lines) {
    if (line.startsWith("##")) {
      // Branch info
      const branchMatch = line.match(/## (.+?)(?:\.\.\.|$)/);
      if (branchMatch) {
        branch = branchMatch[1];
      }
      
      const aheadMatch = line.match(/ahead (\d+)/);
      if (aheadMatch) {
        ahead = parseInt(aheadMatch[1]);
      }
      
      const behindMatch = line.match(/behind (\d+)/);
      if (behindMatch) {
        behind = parseInt(behindMatch[1]);
      }
    } else {
      const status = line.substring(0, 2);
      const file = line.substring(3);

      if (status[0] !== " " && status[0] !== "?") {
        staged.push(file);
      }
      
      if (status[1] === "M" || status[0] === "M") {
        modified.push(file);
      }
      
      if (status === "??") {
        untracked.push(file);
      }
    }
  }

  return {
    branch,
    modified,
    staged,
    untracked,
    ahead,
    behind,
    clean: modified.length === 0 && staged.length === 0 && untracked.length === 0,
  };
}

/**
 * Stage files for commit
 */
export async function stageFiles(
  projectPath: string,
  files: string[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const result = await invoke<{
      stdout: string;
      stderr: string;
      success: boolean;
    }>("execute_command", {
      request: {
        command: "git",
        args: ["add", ...files],
        working_dir: projectPath,
      },
    });

    if (result.success) {
      toast.success("Files staged", `${files.length} file(s)`);
      return { success: true };
    } else {
      toast.error("Stage failed", result.stderr);
      return { success: false, error: result.stderr };
    }
  } catch (error) {
    const errorMsg = error as string;
    toast.error("Stage failed", errorMsg);
    return { success: false, error: errorMsg };
  }
}

/**
 * Stage all changes
 */
export async function stageAll(
  projectPath: string
): Promise<{ success: boolean; error?: string }> {
  return stageFiles(projectPath, ["."]);
}

/**
 * Commit staged changes
 */
export async function commit(
  projectPath: string,
  message: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const result = await invoke<{
      stdout: string;
      stderr: string;
      success: boolean;
    }>("execute_command", {
      request: {
        command: "git",
        args: ["commit", "-m", message],
        working_dir: projectPath,
      },
    });

    if (result.success) {
      toast.success("Committed", message);
      return { success: true };
    } else {
      toast.error("Commit failed", result.stderr);
      return { success: false, error: result.stderr };
    }
  } catch (error) {
    const errorMsg = error as string;
    toast.error("Commit failed", errorMsg);
    return { success: false, error: errorMsg };
  }
}

/**
 * Get commit history
 */
export async function getCommits(
  projectPath: string,
  limit: number = 20
): Promise<GitCommit[]> {
  try {
    const result = await invoke<{
      stdout: string;
      stderr: string;
      success: boolean;
    }>("execute_command", {
      request: {
        command: "git",
        args: [
          "log",
          `--max-count=${limit}`,
          "--pretty=format:%H|%an|%ai|%s",
        ],
        working_dir: projectPath,
      },
    });

    if (!result.success) {
      return [];
    }

    return parseCommits(result.stdout);
  } catch (error) {
    console.error("Error getting commits:", error);
    return [];
  }
}

/**
 * Parse commit history
 */
function parseCommits(output: string): GitCommit[] {
  const lines = output.split("\n").filter((line) => line.trim());
  const commits: GitCommit[] = [];

  for (const line of lines) {
    const [hash, author, date, ...messageParts] = line.split("|");
    commits.push({
      hash: hash.substring(0, 7), // Short hash
      author,
      date,
      message: messageParts.join("|"),
    });
  }

  return commits;
}

/**
 * Create a new branch
 */
export async function createBranch(
  projectPath: string,
  branchName: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const result = await invoke<{
      stdout: string;
      stderr: string;
      success: boolean;
    }>("execute_command", {
      request: {
        command: "git",
        args: ["checkout", "-b", branchName],
        working_dir: projectPath,
      },
    });

    if (result.success) {
      toast.success("Branch created", branchName);
      return { success: true };
    } else {
      toast.error("Branch creation failed", result.stderr);
      return { success: false, error: result.stderr };
    }
  } catch (error) {
    const errorMsg = error as string;
    toast.error("Branch creation failed", errorMsg);
    return { success: false, error: errorMsg };
  }
}

/**
 * Switch to a branch
 */
export async function switchBranch(
  projectPath: string,
  branchName: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const result = await invoke<{
      stdout: string;
      stderr: string;
      success: boolean;
    }>("execute_command", {
      request: {
        command: "git",
        args: ["checkout", branchName],
        working_dir: projectPath,
      },
    });

    if (result.success) {
      toast.success("Switched branch", branchName);
      return { success: true };
    } else {
      toast.error("Switch failed", result.stderr);
      return { success: false, error: result.stderr };
    }
  } catch (error) {
    const errorMsg = error as string;
    toast.error("Switch failed", errorMsg);
    return { success: false, error: errorMsg };
  }
}

/**
 * Get list of branches
 */
export async function getBranches(
  projectPath: string
): Promise<{ current: string; branches: string[] }> {
  try {
    const result = await invoke<{
      stdout: string;
      stderr: string;
      success: boolean;
    }>("execute_command", {
      request: {
        command: "git",
        args: ["branch"],
        working_dir: projectPath,
      },
    });

    if (!result.success) {
      return { current: "", branches: [] };
    }

    const lines = result.stdout.split("\n").filter((line) => line.trim());
    const branches: string[] = [];
    let current = "";

    for (const line of lines) {
      const isCurrent = line.startsWith("*");
      const branchName = line.replace("*", "").trim();
      
      if (branchName) {
        branches.push(branchName);
        if (isCurrent) {
          current = branchName;
        }
      }
    }

    return { current, branches };
  } catch (error) {
    console.error("Error getting branches:", error);
    return { current: "", branches: [] };
  }
}

/**
 * Push to remote
 */
export async function push(
  projectPath: string,
  remote: string = "origin",
  branch?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const args = ["push", remote];
    if (branch) {
      args.push(branch);
    }

    const result = await invoke<{
      stdout: string;
      stderr: string;
      success: boolean;
    }>("execute_command", {
      request: {
        command: "git",
        args,
        working_dir: projectPath,
      },
    });

    if (result.success) {
      toast.success("Pushed", "Changes pushed to remote");
      return { success: true };
    } else {
      toast.error("Push failed", result.stderr);
      return { success: false, error: result.stderr };
    }
  } catch (error) {
    const errorMsg = error as string;
    toast.error("Push failed", errorMsg);
    return { success: false, error: errorMsg };
  }
}

/**
 * Pull from remote
 */
export async function pull(
  projectPath: string,
  remote: string = "origin",
  branch?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const args = ["pull", remote];
    if (branch) {
      args.push(branch);
    }

    const result = await invoke<{
      stdout: string;
      stderr: string;
      success: boolean;
    }>("execute_command", {
      request: {
        command: "git",
        args,
        working_dir: projectPath,
      },
    });

    if (result.success) {
      toast.success("Pulled", "Changes pulled from remote");
      return { success: true };
    } else {
      toast.error("Pull failed", result.stderr);
      return { success: false, error: result.stderr };
    }
  } catch (error) {
    const errorMsg = error as string;
    toast.error("Pull failed", errorMsg);
    return { success: false, error: errorMsg };
  }
}

/**
 * Check if Git is installed
 */
export async function isGitInstalled(): Promise<boolean> {
  try {
    const result = await invoke<{
      stdout: string;
      stderr: string;
      success: boolean;
    }>("execute_command", {
      request: {
        command: "git",
        args: ["--version"],
        working_dir: "/",
      },
    });

    return result.success;
  } catch (error) {
    return false;
  }
}

/**
 * Check if directory is a Git repository
 */
export async function isGitRepository(projectPath: string): Promise<boolean> {
  try {
    const exists = await invoke<boolean>("path_exists", {
      path: `${projectPath}/.git`,
    });

    return exists;
  } catch (error) {
    return false;
  }
}
