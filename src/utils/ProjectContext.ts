import { invoke } from "@tauri-apps/api/core";

export interface ProjectContext {
  projectPath: string;
  projectType: string;
  techStack: string[];
  fileStructure: FileNode[];
  recentFiles: string[];
  totalFiles: number;
  languages: string[];
}

export interface FileNode {
  name: string;
  path: string;
  isDirectory: boolean;
  children?: FileNode[];
}

/**
 * Build comprehensive project context for the AI agent
 */
export async function buildProjectContext(
  projectPath: string,
  projectType: string,
  techStack: string[]
): Promise<ProjectContext> {
  const context: ProjectContext = {
    projectPath,
    projectType,
    techStack,
    fileStructure: [],
    recentFiles: [],
    totalFiles: 0,
    languages: [],
  };

  try {
    // Build file structure (limited depth)
    context.fileStructure = await buildFileTree(projectPath, 3);

    // Count files and detect languages
    const stats = await analyzeProject(projectPath);
    context.totalFiles = stats.totalFiles;
    context.languages = stats.languages;

    // Get recently modified files
    context.recentFiles = stats.recentFiles;
  } catch (error) {
    console.error("Error building project context:", error);
  }

  return context;
}

/**
 * Build file tree structure
 */
async function buildFileTree(
  path: string,
  maxDepth: number,
  currentDepth: number = 0
): Promise<FileNode[]> {
  if (currentDepth >= maxDepth) {
    return [];
  }

  try {
    const result = await invoke<{
      path: string;
      files: Array<{
        name: string;
        path: string;
        is_directory: boolean;
      }>;
    }>("list_directory", { path });

    const nodes: FileNode[] = [];

    for (const file of result.files) {
      // Skip common directories to ignore
      if (shouldIgnore(file.name)) {
        continue;
      }

      const node: FileNode = {
        name: file.name,
        path: file.path,
        isDirectory: file.is_directory,
      };

      // Recursively build tree for directories
      if (file.is_directory && currentDepth < maxDepth - 1) {
        node.children = await buildFileTree(
          file.path,
          maxDepth,
          currentDepth + 1
        );
      }

      nodes.push(node);
    }

    return nodes;
  } catch (error) {
    console.error(`Error reading directory ${path}:`, error);
    return [];
  }
}

/**
 * Analyze project to gather statistics
 */
async function analyzeProject(
  projectPath: string
): Promise<{
  totalFiles: number;
  languages: string[];
  recentFiles: string[];
}> {
  const stats = {
    totalFiles: 0,
    languages: new Set<string>(),
    recentFiles: [] as string[],
  };

  try {
    // Search for all files (limited to 500)
    const files = await invoke<
      Array<{
        name: string;
        path: string;
        modified: number;
      }>
    >("search_files", {
      directory: projectPath,
      pattern: "",
      maxResults: 500,
    });

    stats.totalFiles = files.length;

    // Detect languages from extensions
    const filesByTime = [...files]
      .filter((f) => !shouldIgnore(f.name))
      .sort((a, b) => b.modified - a.modified);

    for (const file of filesByTime) {
      const ext = getFileExtension(file.name);
      if (ext) {
        const lang = extensionToLanguage(ext);
        if (lang) {
          stats.languages.add(lang);
        }
      }
    }

    // Get 10 most recent files
    stats.recentFiles = filesByTime.slice(0, 10).map((f) => f.path);
  } catch (error) {
    console.error("Error analyzing project:", error);
  }

  return {
    totalFiles: stats.totalFiles,
    languages: Array.from(stats.languages),
    recentFiles: stats.recentFiles,
  };
}

/**
 * Check if file/directory should be ignored
 */
function shouldIgnore(name: string): boolean {
  const ignoreList = [
    "node_modules",
    ".git",
    "dist",
    "build",
    "target",
    ".next",
    ".cache",
    "coverage",
    ".vscode",
    ".idea",
    "*.log",
    ".DS_Store",
  ];

  return ignoreList.some((pattern) => {
    if (pattern.startsWith("*.")) {
      return name.endsWith(pattern.slice(1));
    }
    return name === pattern;
  });
}

/**
 * Get file extension
 */
function getFileExtension(filename: string): string | null {
  const parts = filename.split(".");
  if (parts.length > 1) {
    return parts[parts.length - 1].toLowerCase();
  }
  return null;
}

/**
 * Map extension to language name
 */
function extensionToLanguage(ext: string): string | null {
  const map: Record<string, string> = {
    js: "JavaScript",
    jsx: "JavaScript",
    ts: "TypeScript",
    tsx: "TypeScript",
    py: "Python",
    rs: "Rust",
    go: "Go",
    java: "Java",
    cpp: "C++",
    c: "C",
    cs: "C#",
    rb: "Ruby",
    php: "PHP",
    swift: "Swift",
    kt: "Kotlin",
    dart: "Dart",
    html: "HTML",
    css: "CSS",
    scss: "SCSS",
    json: "JSON",
    md: "Markdown",
    yaml: "YAML",
    yml: "YAML",
    toml: "TOML",
    sql: "SQL",
  };

  return map[ext] || null;
}

/**
 * Format context for AI prompt
 */
export function formatContextForPrompt(context: ProjectContext): string {
  let prompt = `Project Context:\n`;
  prompt += `- Type: ${context.projectType}\n`;
  prompt += `- Tech Stack: ${context.techStack.join(", ")}\n`;
  prompt += `- Total Files: ${context.totalFiles}\n`;
  
  if (context.languages.length > 0) {
    prompt += `- Languages: ${context.languages.join(", ")}\n`;
  }

  if (context.fileStructure.length > 0) {
    prompt += `\nProject Structure:\n`;
    prompt += formatFileTree(context.fileStructure, 0);
  }

  if (context.recentFiles.length > 0) {
    prompt += `\nRecent Files:\n`;
    context.recentFiles.forEach((file, i) => {
      prompt += `${i + 1}. ${file.split("/").pop()}\n`;
    });
  }

  return prompt;
}

/**
 * Format file tree for display
 */
function formatFileTree(
  nodes: FileNode[],
  depth: number,
  prefix: string = ""
): string {
  let output = "";

  nodes.forEach((node, index) => {
    const isLast = index === nodes.length - 1;
    const connector = isLast ? "└── " : "├── ";
    const childPrefix = isLast ? "    " : "│   ";

    output += prefix + connector + node.name;
    if (node.isDirectory) {
      output += "/";
    }
    output += "\n";

    if (node.children && node.children.length > 0) {
      output += formatFileTree(
        node.children,
        depth + 1,
        prefix + childPrefix
      );
    }
  });

  return output;
}

/**
 * Get relevant files for a specific task
 */
export async function getRelevantFiles(
  projectPath: string,
  keywords: string[]
): Promise<string[]> {
  const relevantFiles: Set<string> = new Set();

  for (const keyword of keywords) {
    try {
      const files = await invoke<
        Array<{
          path: string;
        }>
      >("search_files", {
        directory: projectPath,
        pattern: keyword.toLowerCase(),
        maxResults: 20,
      });

      files.forEach((f) => relevantFiles.add(f.path));
    } catch (error) {
      console.error(`Error searching for ${keyword}:`, error);
    }
  }

  return Array.from(relevantFiles);
}
