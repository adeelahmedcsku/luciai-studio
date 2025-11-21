import { useState, useEffect, useRef } from "react";
import {
  SearchIcon,
  FileIcon,
  FolderIcon,
  SaveIcon,
  PlayIcon,
  TerminalIcon,
  SettingsIcon,
  XIcon,
} from "lucide-react";

interface Command {
  id: string;
  label: string;
  description: string;
  icon: JSX.Element;
  category: string;
  action: () => void;
  shortcut?: string;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  commands: Command[];
}

export default function CommandPalette({
  isOpen,
  onClose,
  commands,
}: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [filteredCommands, setFilteredCommands] = useState<Command[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      setQuery("");
      setFilteredCommands(commands);
      setSelectedIndex(0);
    }
  }, [isOpen, commands]);

  useEffect(() => {
    if (query.trim() === "") {
      setFilteredCommands(commands);
      setSelectedIndex(0);
      return;
    }

    const filtered = commands.filter((cmd) => {
      const searchText = `${cmd.label} ${cmd.description} ${cmd.category}`.toLowerCase();
      return searchText.includes(query.toLowerCase());
    });

    setFilteredCommands(filtered);
    setSelectedIndex(0);
  }, [query, commands]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        Math.min(prev + 1, filteredCommands.length - 1)
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter" && filteredCommands.length > 0) {
      handleExecuteCommand(filteredCommands[selectedIndex]);
    }
  };

  const handleExecuteCommand = (command: Command) => {
    command.action();
    onClose();
  };

  const groupCommandsByCategory = () => {
    const grouped: Record<string, Command[]> = {};

    filteredCommands.forEach((cmd) => {
      if (!grouped[cmd.category]) {
        grouped[cmd.category] = [];
      }
      grouped[cmd.category].push(cmd);
    });

    return grouped;
  };

  if (!isOpen) return null;

  const groupedCommands = groupCommandsByCategory();

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
            placeholder="Type a command or search..."
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

        {/* Commands */}
        <div className="max-h-96 overflow-y-auto">
          {filteredCommands.length > 0 ? (
            <div className="py-2">
              {Object.entries(groupedCommands).map(([category, cmds]) => (
                <div key={category}>
                  <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase">
                    {category}
                  </div>
                  {cmds.map((command, index) => {
                    const globalIndex = filteredCommands.indexOf(command);
                    return (
                      <button
                        key={command.id}
                        onClick={() => handleExecuteCommand(command)}
                        onMouseEnter={() => setSelectedIndex(globalIndex)}
                        className={`w-full px-4 py-3 flex items-center justify-between transition-colors ${
                          globalIndex === selectedIndex
                            ? "bg-primary/10 text-primary"
                            : "hover:bg-secondary/50"
                        }`}
                      >
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                          <div className="flex-shrink-0">{command.icon}</div>
                          <div className="flex-1 text-left min-w-0">
                            <div className="font-medium text-sm">
                              {command.label}
                            </div>
                            <div className="text-xs text-muted-foreground truncate">
                              {command.description}
                            </div>
                          </div>
                        </div>
                        {command.shortcut && (
                          <div className="flex items-center space-x-1 ml-3">
                            {command.shortcut.split("+").map((key, i) => (
                              <kbd
                                key={i}
                                className="px-2 py-0.5 bg-background border border-border rounded text-xs"
                              >
                                {key}
                              </kbd>
                            ))}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              <SearchIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No commands found matching "{query}"</p>
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
              Execute
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 bg-background border border-border rounded text-xs">
                Esc
              </kbd>{" "}
              Close
            </span>
          </div>
          {filteredCommands.length > 0 && (
            <span>
              {filteredCommands.length} command
              {filteredCommands.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Hook to create default commands
 */
export function useDefaultCommands(handlers: {
  onSaveFile?: () => void;
  onNewFile?: () => void;
  onNewFolder?: () => void;
  onOpenFile?: () => void;
  onRunProject?: () => void;
  onOpenTerminal?: () => void;
  onSettings?: () => void;
}): Command[] {
  return [
    {
      id: "save-file",
      label: "Save File",
      description: "Save the current file",
      icon: <SaveIcon className="w-4 h-4" />,
      category: "File",
      shortcut: "Ctrl+S",
      action: handlers.onSaveFile || (() => {}),
    },
    {
      id: "new-file",
      label: "New File",
      description: "Create a new file",
      icon: <FileIcon className="w-4 h-4" />,
      category: "File",
      shortcut: "Ctrl+N",
      action: handlers.onNewFile || (() => {}),
    },
    {
      id: "new-folder",
      label: "New Folder",
      description: "Create a new folder",
      icon: <FolderIcon className="w-4 h-4" />,
      category: "File",
      action: handlers.onNewFolder || (() => {}),
    },
    {
      id: "open-file",
      label: "Open File",
      description: "Quick file search and open",
      icon: <SearchIcon className="w-4 h-4" />,
      category: "File",
      shortcut: "Ctrl+P",
      action: handlers.onOpenFile || (() => {}),
    },
    {
      id: "run-project",
      label: "Run Project",
      description: "Start the development server",
      icon: <PlayIcon className="w-4 h-4" />,
      category: "Project",
      shortcut: "Ctrl+R",
      action: handlers.onRunProject || (() => {}),
    },
    {
      id: "open-terminal",
      label: "Open Terminal",
      description: "Open integrated terminal",
      icon: <TerminalIcon className="w-4 h-4" />,
      category: "View",
      shortcut: "Ctrl+`",
      action: handlers.onOpenTerminal || (() => {}),
    },
    {
      id: "settings",
      label: "Settings",
      description: "Open IDE settings",
      icon: <SettingsIcon className="w-4 h-4" />,
      category: "Preferences",
      shortcut: "Ctrl+,",
      action: handlers.onSettings || (() => {}),
    },
  ];
}
