import { XIcon, FileIcon } from "lucide-react";
import { useAppStore } from "../../store/useAppStore";

interface FileTabsProps {
  onFileSelect: (filePath: string) => void;
}

export default function FileTabs({ onFileSelect }: FileTabsProps) {
  const { openFiles, selectedFile, closeFile } = useAppStore();

  const getFileName = (filePath: string) => {
    return filePath.split("/").pop() || filePath;
  };

  const getFileExtension = (filePath: string) => {
    const parts = filePath.split(".");
    return parts.length > 1 ? parts[parts.length - 1] : "";
  };

  const getFileIcon = (filePath: string) => {
    const ext = getFileExtension(filePath).toLowerCase();
    
    // Color coding by file type
    const colors: Record<string, string> = {
      js: "text-yellow-500",
      jsx: "text-blue-500",
      ts: "text-blue-600",
      tsx: "text-blue-600",
      py: "text-green-600",
      java: "text-red-600",
      go: "text-cyan-600",
      rs: "text-orange-600",
      json: "text-yellow-600",
      md: "text-gray-600",
      html: "text-orange-500",
      css: "text-purple-500",
      default: "text-gray-400",
    };

    return colors[ext] || colors.default;
  };

  const handleTabClick = (filePath: string) => {
    onFileSelect(filePath);
  };

  const handleCloseTab = (e: React.MouseEvent, filePath: string) => {
    e.stopPropagation();
    closeFile(filePath);
  };

  if (openFiles.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center overflow-x-auto border-b border-border bg-secondary/30 scrollbar-thin">
      {openFiles.map((filePath) => {
        const isActive = selectedFile === filePath;
        
        return (
          <div
            key={filePath}
            onClick={() => handleTabClick(filePath)}
            className={`flex items-center space-x-2 px-4 py-2 border-r border-border cursor-pointer transition-colors group min-w-0 ${
              isActive
                ? "bg-background text-foreground border-t-2 border-t-primary"
                : "bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground"
            }`}
          >
            <FileIcon className={`w-4 h-4 flex-shrink-0 ${getFileIcon(filePath)}`} />
            <span className="text-sm truncate max-w-[150px]" title={filePath}>
              {getFileName(filePath)}
            </span>
            <button
              onClick={(e) => handleCloseTab(e, filePath)}
              className={`p-0.5 rounded hover:bg-destructive/10 flex-shrink-0 ${
                isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"
              }`}
              title="Close"
            >
              <XIcon className="w-3 h-3 hover:text-destructive" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
