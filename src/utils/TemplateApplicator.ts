import { invoke } from "@tauri-apps/api/core";
import { ProjectTemplate } from "./ProjectTemplates";
import { toast } from "../components/ui/NotificationToast";

export interface TemplateApplicationResult {
  success: boolean;
  filesCreated: number;
  errors: string[];
}

/**
 * Apply a template to a project directory
 */
export async function applyTemplate(
  projectPath: string,
  template: ProjectTemplate,
  onProgress?: (current: number, total: number, message: string) => void
): Promise<TemplateApplicationResult> {
  const errors: string[] = [];
  let filesCreated = 0;

  try {
    const totalSteps = template.files.length + 1; // +1 for package.json update
    let currentStep = 0;

    // Create all files
    for (const file of template.files) {
      currentStep++;
      
      if (onProgress) {
        onProgress(currentStep, totalSteps, `Creating ${file.path}...`);
      }

      try {
        const fullPath = `${projectPath}/${file.path}`;
        
        await invoke("write_file", {
          path: fullPath,
          content: file.content,
        });

        filesCreated++;
      } catch (error) {
        errors.push(`Failed to create ${file.path}: ${error}`);
        console.error(`Error creating ${file.path}:`, error);
      }
    }

    // Update package.json with dependencies if it exists
    if (template.dependencies) {
      currentStep++;
      
      if (onProgress) {
        onProgress(currentStep, totalSteps, "Updating dependencies...");
      }

      try {
        await updatePackageJson(projectPath, template);
      } catch (error) {
        errors.push(`Failed to update package.json: ${error}`);
        console.error("Error updating package.json:", error);
      }
    }

    return {
      success: errors.length === 0,
      filesCreated,
      errors,
    };
  } catch (error) {
    errors.push(`Template application failed: ${error}`);
    return {
      success: false,
      filesCreated,
      errors,
    };
  }
}

/**
 * Update package.json with template dependencies
 */
async function updatePackageJson(
  projectPath: string,
  template: ProjectTemplate
): Promise<void> {
  const packageJsonPath = `${projectPath}/package.json`;

  try {
    // Read existing package.json
    const content = await invoke<string>("read_file", {
      path: packageJsonPath,
    });

    const packageJson = JSON.parse(content);

    // Add dependencies
    if (template.dependencies?.npm) {
      packageJson.dependencies = packageJson.dependencies || {};
      for (const dep of template.dependencies.npm) {
        // Use latest version by default
        packageJson.dependencies[dep] = "latest";
      }
    }

    // Add dev dependencies
    if (template.dependencies?.dev) {
      packageJson.devDependencies = packageJson.devDependencies || {};
      for (const dep of template.dependencies.dev) {
        packageJson.devDependencies[dep] = "latest";
      }
    }

    // Add scripts
    if (template.scripts) {
      packageJson.scripts = packageJson.scripts || {};
      Object.assign(packageJson.scripts, template.scripts);
    }

    // Write back
    await invoke("write_file", {
      path: packageJsonPath,
      content: JSON.stringify(packageJson, null, 2),
    });
  } catch (error) {
    console.error("Error updating package.json:", error);
    throw error;
  }
}

/**
 * Install template dependencies
 */
export async function installTemplateDependencies(
  projectPath: string,
  onProgress?: (message: string) => void
): Promise<{ success: boolean; error?: string }> {
  try {
    // Detect package manager
    let packageManager = "npm";
    
    try {
      const hasPnpm = await invoke<boolean>("path_exists", {
        path: `${projectPath}/pnpm-lock.yaml`,
      });
      if (hasPnpm) packageManager = "pnpm";
    } catch {}

    try {
      const hasYarn = await invoke<boolean>("path_exists", {
        path: `${projectPath}/yarn.lock`,
      });
      if (hasYarn) packageManager = "yarn";
    } catch {}

    if (onProgress) {
      onProgress(`Installing dependencies with ${packageManager}...`);
    }

    toast.info("Installing dependencies", `Using ${packageManager}...`);

    // Run install command
    const result = await invoke<{
      stdout: string;
      stderr: string;
      exit_code: number;
      success: boolean;
    }>("execute_command", {
      request: {
        command: packageManager,
        args: ["install"],
        working_dir: projectPath,
      },
    });

    if (result.success) {
      toast.success("Dependencies installed", "Ready to start coding!");
      return { success: true };
    } else {
      toast.error("Installation failed", result.stderr);
      return { success: false, error: result.stderr };
    }
  } catch (error) {
    const errorMsg = error as string;
    toast.error("Installation failed", errorMsg);
    return { success: false, error: errorMsg };
  }
}

/**
 * Create project from template in one step
 */
export async function createProjectFromTemplate(
  projectPath: string,
  template: ProjectTemplate,
  installDeps: boolean = true,
  onProgress?: (current: number, total: number, message: string) => void
): Promise<{
  success: boolean;
  filesCreated: number;
  errors: string[];
}> {
  // Apply template
  const result = await applyTemplate(projectPath, template, onProgress);

  if (!result.success) {
    return result;
  }

  // Install dependencies if requested
  if (installDeps && template.dependencies) {
    const installResult = await installTemplateDependencies(
      projectPath,
      (msg) => {
        if (onProgress) {
          onProgress(100, 100, msg);
        }
      }
    );

    if (!installResult.success) {
      result.errors.push(installResult.error || "Dependency installation failed");
      result.success = false;
    }
  }

  return result;
}
