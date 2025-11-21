import { useState, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { SearchIcon, FileIcon, XIcon } from "lucide-react";

interface FileSearchProps {
  projectPath: string;
  isOpen: boolean;
  onClose: () => void;
  onFileSelect: (filePath: string) => void;
}

interface SearchResult {
  name: string;
  path: string;
  relativePath: string;
}

export default function FileSearch({
  projectPath,
  isOpen,
  onClose,
  onFileSelect,
}: FileSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      setQuery("");
      setResults([]);
      setSelectedIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }

    const debounce = setTimeout(() => {
      searchFiles(query);
    }, 300);

    return () => clearTimeout(debounce);
  }, [query]);

  const searchFiles = async (searchQuery: string) => {
    setIsSearching(true);
    try {
      const files = await invoke<
        Array<{
          name: string;
          path: string;
        }>
      >("search_files", {
        directory: projectPath,
        pattern: searchQuery.toLowerCase(),
        maxResults: 20,
      });

      const searchResults: SearchResult[] = files.map((file) => ({
        name: file.name,
        path: file.path,
        relativePath: file.path.replace(projectPath + "/", ""),
      }));

      setResults(searchResults);
      setSelectedIndex(0);
    } catch (error) {
      console.error("Search error:", error);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter" && results.length > 0) {
      handleSelectFile(results[selectedIndex]);
    }
  };

  const handleSelectFile = (result: SearchResult) => {
    onFileSelect(result.path);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 pt-20"
      onClick={onClose}
    >
      <div
        className="bg-card rounded-lg shadow-2xl max-w-2xl w-full mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="flex items-center px-4 py-3 border-b border-border">
          <SearchIcon className="w-5 h-5 text-muted-foreground mr-3" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search files by name..."
            className="flex-1 bg-transparent text-foreground outline-none placeholder:text-muted-foreground"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="p-1 hover:bg-secondary rounded transition-colors"
            >
              <XIcon className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
        </div>

        {/* Results */}
        <div className="max-h-96 overflow-y-auto">
          {isSearching ? (
            <div className="p-8 text-center">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-sm text-muted-foreground">Searching...</p>
            </div>
          ) : results.length > 0 ? (
            <div className="py-2">
              {results.map((result, index) => (
                <button
                  key={result.path}
                  onClick={() => handleSelectFile(result)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`w-full px-4 py-3 flex items-center space-x-3 transition-colors ${
                    index === selectedIndex
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-secondary/50"
                  }`}
                >
                  <FileIcon className="w-4 h-4 flex-shrink-0" />
                  <div className="flex-1 text-left min-w-0">
                    <div className="font-medium text-sm truncate">
                      {result.name}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {result.relativePath}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : query.trim().length >= 2 ? (
            <div className="p-8 text-center text-muted-foreground">
              <FileIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No files found matching "{query}"</p>
            </div>
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              <SearchIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">Type to search for files</p>
              <p className="text-xs mt-2">Use ↑↓ to navigate, Enter to open</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-border bg-secondary/30 text-xs text-muted-foreground flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span>
              <kbd className="px-1.5 py-0.5 bg-background border border-border rounded text-xs">
                ↑↓
              </kbd>{" "}
              Navigate
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 bg-background border border-border rounded text-xs">
                Enter
              </kbd>{" "}
              Open
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 bg-background border border-border rounded text-xs">
                Esc
              </kbd>{" "}
              Close
            </span>
          </div>
          {results.length > 0 && (
            <span>{results.length} result{results.length !== 1 ? "s" : ""}</span>
          )}
        </div>
      </div>
    </div>
  );
}
