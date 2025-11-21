import { invoke } from "@tauri-apps/api/core";
import { toast } from "../ui/NotificationToast";

export interface AgentAction {
  type: "create_file" | "modify_file" | "delete_file" | "create_directory" | "run_command" | "install_package";
  path?: string;
  content?: string;
  command?: string;
  package?: string;
}

export class AgentActionParser {
  /**
   * Parse agent response for actionable commands
   */
  static parseActions(response: string): AgentAction[] {
    const actions: AgentAction[] = [];

    // Pattern 1: Create file with code blocks
    // Example: "I'll create `src/App.tsx`:\n```typescript\ncode here\n```"
    const fileCreatePattern = /(?:create|add|make)\s+(?:a\s+)?(?:file\s+)?`([^`]+)`[:\s]*\n?```(\w+)?\n([\s\S]*?)```/gi;
    let match;

    while ((match = fileCreatePattern.exec(response)) !== null) {
      const [, path, , content] = match;
      actions.push({
        type: "create_file",
        path: path.trim(),
        content: content.trim(),
      });
    }

    // Pattern 2: Explicit file creation instructions
    // Example: "CREATE_FILE: src/utils/helpers.ts"
    const explicitCreatePattern = /CREATE_FILE:\s*([^\n]+)\n```(?:\w+)?\n([\s\S]*?)```/gi;
    while ((match = explicitCreatePattern.exec(response)) !== null) {
      const [, path, content] = match;
      actions.push({
        type: "create_file",
        path: path.trim(),
        content: content.trim(),
      });
    }

    // Pattern 3: Install packages
    // Example: "run `npm install express`" or "install the `axios` package"
    const installPattern = /(?:install|add)\s+(?:the\s+)?(?:package\s+)?`([^`]+)`|(?:npm|pnpm|yarn)\s+install\s+([^\s\n]+)/gi;
    while ((match = installPattern.exec(response)) !== null) {
      const packageName = match[1] || match[2];
      actions.push({
        type: "install_package",
        package: packageName.trim(),
      });
    }

    // Pattern 4: Run commands
    // Example: "run `npm run build`"
    const commandPattern = /run\s+`([^`]+)`/gi;
    while ((match = commandPattern.exec(response)) !== null) {
      const [, command] = match;
      // Skip install commands (already handled)
      if (!command.includes("install")) {
        actions.push({
          type: "run_command",
          command: command.trim(),
        });
      }
    }

    // Pattern 5: Create directories
    // Example: "create a directory `src/components`"
    const dirPattern = /create\s+(?:a\s+)?(?:directory|folder)\s+`([^`]+)`/gi;
    while ((match = dirPattern.exec(response)) !== null) {
      const [, path] = match;
      actions.push({
        type: "create_directory",
        path: path.trim(),
      });
    }

    return actions;
  }

  /**
   * Execute an action
   */
  static async executeAction(
    action: AgentAction,
    projectPath: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      switch (action.type) {
        case "create_file":
          return await this.createFile(projectPath, action.path!, action.content!);

        case "create_directory":
          return await this.createDirectory(projectPath, action.path!);

        case "run_command":
          return await this.runCommand(projectPath, action.command!);

        case "install_package":
          return await this.installPackage(projectPath, action.package!);

        default:
          return {
            success: false,
            message: `Unknown action type: ${action.type}`,
          };
      }
    } catch (error) {
      return {
        success: false,
        message: `Error executing action: ${error}`,
      };
    }
  }

  /**
   * Create a file with content
   */
  private static async createFile(
    projectPath: string,
    relativePath: string,
    content: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const fullPath = `${projectPath}/${relativePath}`;

      await invoke("write_file", {
        path: fullPath,
        content: content,
      });

      toast.success("File created", relativePath);

      return {
        success: true,
        message: `Created file: ${relativePath}`,
      };
    } catch (error) {
      toast.error("Failed to create file", error as string);
      return {
        success: false,
        message: `Failed to create file: ${error}`,
      };
    }
  }

  /**
   * Create a directory
   */
  private static async createDirectory(
    projectPath: string,
    relativePath: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const fullPath = `${projectPath}/${relativePath}`;

      await invoke("create_directory", {
        path: fullPath,
      });

      toast.success("Directory created", relativePath);

      return {
        success: true,
        message: `Created directory: ${relativePath}`,
      };
    } catch (error) {
      toast.error("Failed to create directory", error as string);
      return {
        success: false,
        message: `Failed to create directory: ${error}`,
      };
    }
  }

  /**
   * Run a command in the project directory
   */
  private static async runCommand(
    projectPath: string,
    command: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Parse command into parts
      const parts = command.split(" ");
      const cmd = parts[0];
      const args = parts.slice(1);

      const result = await invoke<{
        stdout: string;
        stderr: string;
        exit_code: number;
        success: boolean;
      }>("execute_command", {
        request: {
          command: cmd,
          args: args,
          working_dir: projectPath,
        },
      });

      if (result.success) {
        toast.success("Command executed", command);
        return {
          success: true,
          message: `Executed: ${command}\n${result.stdout}`,
        };
      } else {
        toast.error("Command failed", result.stderr);
        return {
          success: false,
          message: `Command failed: ${result.stderr}`,
        };
      }
    } catch (error) {
      toast.error("Failed to execute command", error as string);
      return {
        success: false,
        message: `Failed to execute command: ${error}`,
      };
    }
  }

  /**
   * Install a package
   */
  private static async installPackage(
    projectPath: string,
    packageName: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Detect package manager (prefer pnpm, then npm, then yarn)
      let packageManager = "npm";
      
      try {
        const checkPnpm = await invoke("path_exists", {
          path: `${projectPath}/pnpm-lock.yaml`,
        });
        if (checkPnpm) packageManager = "pnpm";
      } catch {}

      try {
        const checkYarn = await invoke("path_exists", {
          path: `${projectPath}/yarn.lock`,
        });
        if (checkYarn) packageManager = "yarn";
      } catch {}

      const command = `${packageManager} install ${packageName}`;

      toast.info("Installing package", packageName);

      const result = await invoke<{
        stdout: string;
        stderr: string;
        exit_code: number;
        success: boolean;
      }>("execute_command", {
        request: {
          command: packageManager,
          args: ["install", packageName],
          working_dir: projectPath,
        },
      });

      if (result.success) {
        toast.success("Package installed", packageName);
        return {
          success: true,
          message: `Installed: ${packageName}`,
        };
      } else {
        toast.error("Failed to install package", result.stderr);
        return {
          success: false,
          message: `Failed to install: ${result.stderr}`,
        };
      }
    } catch (error) {
      toast.error("Failed to install package", error as string);
      return {
        success: false,
        message: `Failed to install package: ${error}`,
      };
    }
  }

  /**
   * Execute multiple actions in sequence
   */
  static async executeActions(
    actions: AgentAction[],
    projectPath: string,
    onProgress?: (current: number, total: number, message: string) => void
  ): Promise<{ successCount: number; failCount: number; results: string[] }> {
    let successCount = 0;
    let failCount = 0;
    const results: string[] = [];

    for (let i = 0; i < actions.length; i++) {
      const action = actions[i];

      if (onProgress) {
        onProgress(i + 1, actions.length, `Executing: ${action.type}`);
      }

      const result = await this.executeAction(action, projectPath);

      if (result.success) {
        successCount++;
      } else {
        failCount++;
      }

      results.push(result.message);

      // Small delay between actions
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    return { successCount, failCount, results };
  }
}
