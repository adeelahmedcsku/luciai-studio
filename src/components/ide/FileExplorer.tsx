
import { useState, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import {
  ChevronRightIcon,
  ChevronDownIcon,
  FileIcon,
  FolderIcon,
  FolderOpenIcon,
  RefreshCwIcon,
  PlusIcon,
  FolderPlusIcon,
  CheckIcon,
  XIcon,
} from "lucide-react";
import { toast } from "../ui/NotificationToast";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

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

// Drag item type
const ITEM_TYPE = "FILE_NODE";

interface DragItem {
  path: string;
  name: string;
  isDirectory: boolean;
}

// Draggable File Node Component
const FileNode = ({
  node,
  level,
  selectedFile,
  onFileClick,
  onToggle,
  onMove,
  startCreating,
  creatingType,
  creationPath,
  newItemName,
  setNewItemName,
  confirmCreating,
  cancelCreating,
  renderChildren,
  onContextMenu
}: {
  node: TreeNode;
  level: number;
  selectedFile: string | null;
  onFileClick: (node: TreeNode) => void;
  onToggle: (node: TreeNode) => void;
  onMove: (sourcePath: string, targetPath: string) => void;
  startCreating: (type: "file" | "folder", path: string) => void;
  creatingType: "file" | "folder" | null;
  creationPath: string | null;
  newItemName: string;
  setNewItemName: (name: string) => void;
  confirmCreating: () => void;
  cancelCreating: () => void;
  renderChildren: (nodes: TreeNode[], level: number) => JSX.Element[];
  onContextMenu: (e: React.MouseEvent, node: TreeNode) => void;
}) => {
  const ref = useRef<HTMLDivElement>(null);

  const [{ isDragging }, drag] = useDrag({
    type: ITEM_TYPE,
    item: { path: node.info.path, name: node.info.name, isDirectory: node.info.is_directory } as DragItem,
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [{ isOver, canDrop }, drop] = useDrop({
    accept: ITEM_TYPE,
    canDrop: (item: DragItem) => {
      // Can't drop on itself or non-directories (unless we want to drop INTO the parent of the file, but let's stick to folders for now)
      // Also can't drop into its own children (circular)
      if (item.path === node.info.path) return false;
      if (!node.info.is_directory) return false;
      // Prevent dropping parent into child
      if (node.info.path.startsWith(item.path)) return false;
      return true;
    },
    drop: (item: DragItem) => {
      onMove(item.path, node.info.path);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  drag(drop(ref));

  return (
    <div key={node.info.path} onContextMenu={(e) => onContextMenu(e, node)}>
      <div
        ref={ref}
        className={`group flex items - center space - x - 2 px - 2 py - 1 cursor - pointer transition - colors ${selectedFile === node.info.path
          ? "bg-primary/10 text-primary"
          : "text-foreground"
          } ${isOver && canDrop ? "bg-primary/20 border-2 border-primary border-dashed" : "hover:bg-secondary/50"} ${isDragging ? "opacity-50" : ""
          } `}
        style={{ paddingLeft: `${level * 16 + 8} px` }}
      >
        <div
          className="flex-1 flex items-center space-x-2 overflow-hidden"
          onClick={() => onFileClick(node)}
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

        {/* Context Actions (visible on hover) */}
        {node.info.is_directory && (
          <div className="hidden group-hover:flex items-center space-x-1">
            <button
              onClick={(e) => { e.stopPropagation(); startCreating("file", node.info.path); }}
              className="p-0.5 hover:bg-background rounded text-muted-foreground hover:text-foreground"
              title="New File"
            >
              <PlusIcon className="w-3 h-3" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); startCreating("folder", node.info.path); }}
              className="p-0.5 hover:bg-background rounded text-muted-foreground hover:text-foreground"
              title="New Folder"
            >
              <FolderPlusIcon className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>

      {/* Inline Creation Input */}
      {creatingType && creationPath === node.info.path && node.isExpanded && (
        <div
          className="flex items-center space-x-2 px-2 py-1"
          style={{ paddingLeft: `${(level + 1) * 16 + 8} px` }}
        >
          <span className="w-4" />
          {creatingType === "folder" ? (
            <FolderIcon className="w-4 h-4 text-primary flex-shrink-0" />
          ) : (
            <FileIcon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          )}
          <input
            type="text"
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") confirmCreating();
              if (e.key === "Escape") cancelCreating();
            }}
            autoFocus
            className="flex-1 h-6 text-sm bg-background border border-primary/50 rounded px-1 focus:outline-none"
            placeholder={creatingType === "file" ? "filename.ext" : "foldername"}
          />
          <button onClick={confirmCreating} className="text-green-500 hover:text-green-400"><CheckIcon className="w-4 h-4" /></button>
          <button onClick={cancelCreating} className="text-red-500 hover:text-red-400"><XIcon className="w-4 h-4" /></button>
        </div>
      )}

      {node.info.is_directory &&
        node.isExpanded &&
        node.children &&
        node.children.length > 0 &&
        renderChildren(node.children, level + 1)}
    </div>
  );
};

function FileExplorerContent({
  projectPath,
  onFileSelect,
  selectedFile,
}: FileExplorerProps) {
  const [tree, setTree] = useState<TreeNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [creatingType, setCreatingType] = useState<"file" | "folder" | null>(null);
  const [newItemName, setNewItemName] = useState("");
  const [creationPath, setCreationPath] = useState<string | null>(null);

  useEffect(() => {
    loadDirectory(projectPath);
  }, [projectPath]);

  const loadDirectory = async (path: string, parentPath?: string) => {
    if (!path) return;

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

      // Sort: Directories first, then files
      nodes.sort((a, b) => {
        if (a.info.is_directory === b.info.is_directory) {
          return a.info.name.localeCompare(b.info.name);
        }
        return a.info.is_directory ? -1 : 1;
      });

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

  const startCreating = (type: "file" | "folder", path: string | null = null) => {
    setCreatingType(type);
    setCreationPath(path || projectPath);
    setNewItemName("");
  };

  const cancelCreating = () => {
    setCreatingType(null);
    setNewItemName("");
    setCreationPath(null);
  };

  const confirmCreating = async () => {
    if (!newItemName.trim() || !creationPath) return;

    // Simple path join (assumes Windows for now based on user OS, but ideally should use path separator)
    const separator = creationPath.includes("\\") ? "\\" : "/";
    const fullPath = `${creationPath}${separator}${newItemName} `;

    try {
      if (creatingType === "file") {
        await invoke("write_file", { path: fullPath, content: "" });
        toast.success("File created", newItemName);
      } else {
        await invoke("create_directory", { path: fullPath });
        toast.success("Folder created", newItemName);
      }

      // Refresh the directory where item was created
      await loadDirectory(creationPath, creationPath === projectPath ? undefined : creationPath);
      cancelCreating();
    } catch (error) {
      console.error("Failed to create item:", error);
      toast.error("Failed to create item", error as string);
    }
  };

  const handleMoveFile = async (sourcePath: string, targetPath: string) => {
    const fileName = sourcePath.split(/[\\/]/).pop();
    const separator = targetPath.includes("\\") ? "\\" : "/";
    const newPath = `${targetPath}${separator}${fileName} `;

    if (sourcePath === newPath) return;

    try {
      await invoke("rename_path", { oldPath: sourcePath, newPath });
      toast.success("Moved", `${fileName} to ${targetPath.split(/[\\/]/).pop()} `);

      // Refresh both source parent and target directory
      // Finding source parent is tricky without full tree traversal or path parsing
      // For now, just refresh root or we could try to be smart. 
      // Simplest: Refresh everything (expensive) or just the target and hope source updates?
      // Better: Reload the target directory. The source node will still be in the tree until we refresh its parent.
      // Let's just reload the whole tree for correctness for now, or at least the target.

      // Reload target
      await loadDirectory(targetPath, targetPath === projectPath ? undefined : targetPath);

      // Reload source parent (approximate)
      // const sourceParent = sourcePath.substring(0, sourcePath.lastIndexOf(separator));
      // await loadDirectory(sourceParent, sourceParent === projectPath ? undefined : sourceParent);

      // For now, just triggering a full refresh might be safest to ensure UI consistency
      loadDirectory(projectPath);

    } catch (error) {
      console.error("Failed to move file:", error);
      toast.error("Failed to move file", error as string);
    }
  };

  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    node: TreeNode;
  } | null>(null);

  useEffect(() => {
    const handleClickOutside = () => setContextMenu(null);
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const handleContextMenu = (e: React.MouseEvent, node: TreeNode) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, node });
  };

  const handleDelete = async (node: TreeNode) => {
    if (!confirm(`Are you sure you want to delete ${node.info.name}?`)) return;

    try {
      if (node.info.is_directory) {
        await invoke("delete_directory", { path: node.info.path });
      } else {
        await invoke("delete_file", { path: node.info.path });
      }
      toast.success("Deleted", node.info.name);
      loadDirectory(projectPath);
    } catch (error) {
      console.error("Failed to delete:", error);
      toast.error("Failed to delete", error as string);
    }
  };

  const handleRename = async (node: TreeNode) => {
    const newName = prompt("Enter new name:", node.info.name);
    if (!newName || newName === node.info.name) return;

    const separator = node.info.path.includes("\\") ? "\\" : "/";
    const parentPath = node.info.path.substring(0, node.info.path.lastIndexOf(separator));
    const newPath = `${parentPath}${separator}${newName}`;

    try {
      await invoke("rename_path", { oldPath: node.info.path, newPath });
      toast.success("Renamed", `${node.info.name} to ${newName}`);
      loadDirectory(projectPath);
    } catch (error) {
      console.error("Failed to rename:", error);
      toast.error("Failed to rename", error as string);
    }
  };

  const renderTree = (nodes: TreeNode[], level: number = 0): JSX.Element[] => {
    return nodes.map((node) => (
      <FileNode
        key={node.info.path}
        node={node}
        level={level}
        selectedFile={selectedFile}
        onFileClick={handleFileClick}
        onToggle={toggleDirectory}
        onMove={handleMoveFile}
        startCreating={startCreating}
        creatingType={creatingType}
        creationPath={creationPath}
        newItemName={newItemName}
        setNewItemName={setNewItemName}
        confirmCreating={confirmCreating}
        cancelCreating={cancelCreating}
        renderChildren={renderTree}
        onContextMenu={handleContextMenu}
      />
    ));
  };

  const handleRefresh = () => {
    setLoading(true);
    loadDirectory(projectPath);
  };

  const [{ isOver, canDrop }, drop] = useDrop({
    accept: ITEM_TYPE,
    canDrop: (item: DragItem) => {
      // Can drop if not already in root (simple check, might need more robust path check)
      // Also prevent dropping root folder into itself (not possible here as we only drag files/folders inside)
      const parentPath = item.path.substring(0, item.path.lastIndexOf(item.path.includes("\\") ? "\\" : "/"));
      return parentPath !== projectPath;
    },
    drop: (item: DragItem) => {
      handleMoveFile(item.path, projectPath);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

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
    <div className="h-full flex flex-col relative">
      {/* Header */}
      <div className="border-b border-border px-3 py-2 flex items-center justify-between shrink-0">
        <span className="text-sm font-semibold">Explorer</span>
        <div className="flex items-center space-x-1">
          <button
            onClick={() => startCreating("file", projectPath)}
            className="p-1 hover:bg-secondary rounded transition-colors"
            title="New File"
          >
            <PlusIcon className="w-4 h-4" />
          </button>
          <button
            onClick={() => startCreating("folder", projectPath)}
            className="p-1 hover:bg-secondary rounded transition-colors"
            title="New Folder"
          >
            <FolderPlusIcon className="w-4 h-4" />
          </button>
          <button
            onClick={handleRefresh}
            className="p-1 hover:bg-secondary rounded transition-colors"
            title="Refresh"
          >
            <RefreshCwIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tree View */}
      <div
        ref={drop}
        className={`flex-1 overflow-y-auto ${isOver && canDrop ? "bg-primary/5" : ""}`}
        onContextMenu={(e) => e.preventDefault()}
      >
        {/* Root Level Creation Input */}
        {creatingType && creationPath === projectPath && (
          <div className="flex items-center space-x-2 px-2 py-1 pl-2">
            {creatingType === "folder" ? (
              <FolderIcon className="w-4 h-4 text-primary flex-shrink-0" />
            ) : (
              <FileIcon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            )}
            <input
              type="text"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") confirmCreating();
                if (e.key === "Escape") cancelCreating();
              }}
              autoFocus
              className="flex-1 h-6 text-sm bg-background border border-primary/50 rounded px-1 focus:outline-none"
              placeholder={creatingType === "file" ? "filename.ext" : "foldername"}
            />
            <button onClick={confirmCreating} className="text-green-500 hover:text-green-400"><CheckIcon className="w-4 h-4" /></button>
            <button onClick={cancelCreating} className="text-red-500 hover:text-red-400"><XIcon className="w-4 h-4" /></button>
          </div>
        )}

        {tree.length > 0 ? (
          renderTree(tree)
        ) : (
          !creatingType && (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No files found
            </div>
          )
        )}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="fixed z-50 bg-popover border border-border rounded-md shadow-md py-1 min-w-[160px]"
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          {contextMenu.node.info.is_directory && (
            <>
              <button
                className="w-full text-left px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors flex items-center gap-2"
                onClick={() => {
                  startCreating("file", contextMenu.node.info.path);
                  setContextMenu(null);
                }}
              >
                <FileIcon className="w-3 h-3" /> New File
              </button>
              <button
                className="w-full text-left px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors flex items-center gap-2"
                onClick={() => {
                  startCreating("folder", contextMenu.node.info.path);
                  setContextMenu(null);
                }}
              >
                <FolderPlusIcon className="w-3 h-3" /> New Folder
              </button>
              <div className="h-px bg-border my-1" />
            </>
          )}

          <button
            className="w-full text-left px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
            onClick={() => {
              navigator.clipboard.writeText(contextMenu.node.info.path);
              toast.success("Copied path to clipboard");
              setContextMenu(null);
            }}
          >
            Copy Path
          </button>
          <button
            className="w-full text-left px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
            onClick={() => {
              // Simple relative path logic (remove project path)
              const relPath = contextMenu.node.info.path.replace(projectPath, "").replace(/^[\\/]/, "");
              navigator.clipboard.writeText(relPath);
              toast.success("Copied relative path");
              setContextMenu(null);
            }}
          >
            Copy Relative Path
          </button>

          <div className="h-px bg-border my-1" />

          <button
            className="w-full text-left px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
            onClick={() => {
              handleRename(contextMenu.node);
              setContextMenu(null);
            }}
          >
            Rename
          </button>
          <button
            className="w-full text-left px-4 py-2 text-sm hover:bg-destructive/10 text-destructive transition-colors"
            onClick={() => {
              handleDelete(contextMenu.node);
              setContextMenu(null);
            }}
          >
            Delete
          </button>

          <div className="h-px bg-border my-1" />

          <button
            className="w-full text-left px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
            onClick={async () => {
              try {
                await invoke("reveal_in_explorer", { path: contextMenu.node.info.path });
                setContextMenu(null);
              } catch (error) {
                console.error("Failed to reveal in explorer:", error);
                toast.error("Failed to reveal in explorer");
              }
            }}
          >
            Reveal in Explorer
          </button>
        </div>
      )}
    </div>
  );
}

export default function FileExplorer(props: FileExplorerProps) {
  return (
    <DndProvider backend={HTML5Backend}>
      <FileExplorerContent {...props} />
    </DndProvider>
  );
}

