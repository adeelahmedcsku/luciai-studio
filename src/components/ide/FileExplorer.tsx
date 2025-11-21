import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import {
  ChevronRightIcon,
  ChevronDownIcon,
  FileIcon,
  FolderIcon,
  FolderOpenIcon,
  RefreshCwIcon,
} from "lucide-react";
import { toast } from "../ui/NotificationToast";

interface FileInfo {
  name: string;
  path: string;
  is_directory: boolean;
  size: number;
  modified: number;
}

interface FileExplorerProps {
  projectPath: string;
  onFileSelect: (filePath: string) => void;
  selectedFile: string | null;
}

interface TreeNode {
  info: FileInfo;
  children?: TreeNode[];
  isExpanded?: boolean;
}

export default function FileExplorer({
  projectPath,
  onFileSelect,
  selectedFile,
}: FileExplorerProps) {
  const [tree, setTree] = useState<TreeNode[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDirectory(projectPath);
  }, [projectPath]);

  const loadDirectory = async (path: string, parentPath?: string) => {
    try {
      const result = await invoke<{ path: string; files: FileInfo[] }>(
        "list_directory",
        { path }
      );

      const nodes: TreeNode[] = result.files.map((file) => ({
        info: file,
        children: file.is_directory ? [] : undefined,
        isExpanded: false,
      }));

      if (parentPath) {
        // Update specific directory in tree
        setTree((prevTree) => updateTreeNode(prevTree, parentPath, nodes));
      } else {
        // Initial load
        setTree(nodes);
      }

      setLoading(false);
    } catch (error) {
      console.error("Failed to load directory:", error);
      toast.error("Failed to load directory", error as string);
      setLoading(false);
    }
  };

  const updateTreeNode = (
    tree: TreeNode[],
    targetPath: string,
    newChildren: TreeNode[]
  ): TreeNode[] => {
    return tree.map((node) => {
      if (node.info.path === targetPath) {
        return { ...node, children: newChildren, isExpanded: true };
      }
      if (node.children) {
        return {
          ...node,
          children: updateTreeNode(node.children, targetPath, newChildren),
        };
      }
      return node;
    });
  };

  const toggleDirectory = async (node: TreeNode) => {
    if (!node.info.is_directory) return;

    if (node.isExpanded) {
      // Collapse
      setTree((prevTree) => collapseNode(prevTree, node.info.path));
    } else {
      // Expand - load children if not loaded
      if (!node.children || node.children.length === 0) {
        await loadDirectory(node.info.path, node.info.path);
      } else {
        setTree((prevTree) => expandNode(prevTree, node.info.path));
      }
    }
  };

  const collapseNode = (tree: TreeNode[], targetPath: string): TreeNode[] => {
    return tree.map((node) => {
      if (node.info.path === targetPath) {
        return { ...node, isExpanded: false };
      }
      if (node.children) {
        return { ...node, children: collapseNode(node.children, targetPath) };
      }
      return node;
    });
  };

  const expandNode = (tree: TreeNode[], targetPath: string): TreeNode[] => {
    return tree.map((node) => {
      if (node.info.path === targetPath) {
        return { ...node, isExpanded: true };
      }
      if (node.children) {
        return { ...node, children: expandNode(node.children, targetPath) };
      }
      return node;
    });
  };

  const handleFileClick = (node: TreeNode) => {
    if (node.info.is_directory) {
      toggleDirectory(node);
    } else {
      onFileSelect(node.info.path);
    }
  };

  const renderTree = (nodes: TreeNode[], level: number = 0): JSX.Element[] => {
    return nodes.map((node) => (
      <div key={node.info.path}>
        <div
          onClick={() => handleFileClick(node)}
          className={`flex items-center space-x-2 px-2 py-1 cursor-pointer hover:bg-secondary/50 transition-colors ${
            selectedFile === node.info.path
              ? "bg-primary/10 text-primary"
              : "text-foreground"
          }`}
          style={{ paddingLeft: `${level * 16 + 8}px` }}
        >
          {node.info.is_directory ? (
            <>
              {node.isExpanded ? (
                <ChevronDownIcon className="w-4 h-4 flex-shrink-0" />
              ) : (
                <ChevronRightIcon className="w-4 h-4 flex-shrink-0" />
              )}
              {node.isExpanded ? (
                <FolderOpenIcon className="w-4 h-4 text-primary flex-shrink-0" />
              ) : (
                <FolderIcon className="w-4 h-4 text-primary flex-shrink-0" />
              )}
            </>
          ) : (
            <>
              <span className="w-4" />
              <FileIcon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            </>
          )}
          <span className="text-sm truncate">{node.info.name}</span>
        </div>
        {node.info.is_directory &&
          node.isExpanded &&
          node.children &&
          node.children.length > 0 &&
          renderTree(node.children, level + 1)}
      </div>
    ));
  };

  const handleRefresh = () => {
    setLoading(true);
    loadDirectory(projectPath);
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-xs text-muted-foreground">Loading files...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b border-border px-3 py-2 flex items-center justify-between">
        <span className="text-sm font-semibold">Explorer</span>
        <button
          onClick={handleRefresh}
          className="p-1 hover:bg-secondary rounded transition-colors"
          title="Refresh"
        >
          <RefreshCwIcon className="w-4 h-4" />
        </button>
      </div>

      {/* Tree View */}
      <div className="flex-1 overflow-y-auto">
        {tree.length > 0 ? (
          renderTree(tree)
        ) : (
          <div className="p-4 text-center text-sm text-muted-foreground">
            No files found
          </div>
        )}
      </div>
    </div>
  );
}
