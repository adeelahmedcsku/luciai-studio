import { useState, useEffect, useRef } from "react";
import { SearchIcon, FileIcon, FolderIcon } from "lucide-react";

interface QuickOpenModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFileSelect: (filePath: string) => void;
  files: string[];
}

export default function QuickOpenModal({
  isOpen,
  onClose,
  onFileSelect,
  files,
}: QuickOpenModalProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      setQuery("");
      setSelectedIndex(0);
    }
  }, [isOpen]);

  const filteredFiles = files.filter((file) =>
    file.toLowerCase().includes(query.toLowerCase())
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev < filteredFiles.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filteredFiles[selectedIndex]) {
        onFileSelect(filteredFiles[selectedIndex]);
        onClose();
      }
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  const handleFileClick = (filePath: string) => {
    onFileSelect(filePath);
    onClose();
  };

  const getFileName = (filePath: string) => {
    return filePath.split("/").pop() || filePath;
  };

  const getFilePath = (filePath: string) => {
    const parts = filePath.split("/");
    parts.pop();
    return parts.join("/") || "/";
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center pt-20 z-50">
      <div className="bg-card rounded-lg shadow-2xl max-w-2xl w-full mx-4 overflow-hidden">
        {/* Search Input */}
        <div className="flex items-center space-x-3 px-4 py-3 border-b border-border">
          <SearchIcon className="w-5 h-5 text-muted-foreground" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search files... (type to filter)"
            className="flex-1 bg-transparent outline-none text-foreground placeholder-muted-foreground"
          />
          <span className="text-xs text-muted-foreground">
            {filteredFiles.length} files
          </span>
        </div>

        {/* File List */}
        <div className="max-h-96 overflow-y-auto">
          {filteredFiles.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No files found</p>
            </div>
          ) : (
            <div>
              {filteredFiles.map((file, index) => (
                <div
                  key={file}
                  onClick={() => handleFileClick(file)}
                  className={`flex items-center space-x-3 px-4 py-2 cursor-pointer transition-colors ${
                    index === selectedIndex
                      ? "bg-primary/10 border-l-2 border-primary"
                      : "hover:bg-secondary/50"
                  }`}
                >
                  <FileIcon className="w-4 h-4 text-primary flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-foreground truncate">
                      {getFileName(file)}
                    </div>
                    <div className="text-xs text-muted-foreground truncate flex items-center space-x-1">
                      <FolderIcon className="w-3 h-3" />
                      <span>{getFilePath(file)}</span>
                    </div>
                  </div>
                  {index === selectedIndex && (
                    <kbd className="px-2 py-1 text-xs bg-background border border-border rounded">
                      ↵
                    </kbd>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border px-4 py-2 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center space-x-4">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>Esc Close</span>
          </div>
          <span>Ctrl+P to open</span>
        </div>
      </div>
    </div>
  );
}
