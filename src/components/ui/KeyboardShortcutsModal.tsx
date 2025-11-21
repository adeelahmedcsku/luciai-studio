import { XIcon, KeyboardIcon } from "lucide-react";

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Shortcut {
  keys: string[];
  description: string;
  category: string;
}

const shortcuts: Shortcut[] = [
  // File Operations
  { keys: ["Ctrl", "S"], description: "Save current file", category: "File" },
  { keys: ["Ctrl", "W"], description: "Close current file", category: "File" },
  { keys: ["Ctrl", "Shift", "N"], description: "New project", category: "File" },
  
  // Navigation
  { keys: ["Ctrl", "B"], description: "Toggle file explorer", category: "Navigation" },
  { keys: ["Ctrl", "J"], description: "Toggle terminal", category: "Navigation" },
  { keys: ["Ctrl", "P"], description: "Quick open file", category: "Navigation" },
  { keys: ["Ctrl", "Shift", "P"], description: "Command palette", category: "Navigation" },
  
  // Editor
  { keys: ["Ctrl", "F"], description: "Find in file", category: "Editor" },
  { keys: ["Ctrl", "H"], description: "Find and replace", category: "Editor" },
  { keys: ["Ctrl", "/"], description: "Toggle comment", category: "Editor" },
  { keys: ["Ctrl", "D"], description: "Duplicate line", category: "Editor" },
  { keys: ["Alt", "↑"], description: "Move line up", category: "Editor" },
  { keys: ["Alt", "↓"], description: "Move line down", category: "Editor" },
  
  // Terminal
  { keys: ["Ctrl", "C"], description: "Cancel input", category: "Terminal" },
  { keys: ["Ctrl", "L"], description: "Clear terminal", category: "Terminal" },
  { keys: ["↑"], description: "Previous command", category: "Terminal" },
  { keys: ["↓"], description: "Next command", category: "Terminal" },
  
  // Agent
  { keys: ["Ctrl", "Enter"], description: "Send message to agent", category: "Agent" },
  { keys: ["Shift", "Enter"], description: "New line in message", category: "Agent" },
  
  // General
  { keys: ["Ctrl", ","], description: "Open settings", category: "General" },
  { keys: ["Ctrl", "K"], description: "Show shortcuts", category: "General" },
  { keys: ["Esc"], description: "Close modal/panel", category: "General" },
];

export default function KeyboardShortcutsModal({
  isOpen,
  onClose,
}: KeyboardShortcutsModalProps) {
  if (!isOpen) return null;

  const categories = Array.from(new Set(shortcuts.map((s) => s.category)));

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card rounded-lg shadow-2xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center space-x-2">
            <KeyboardIcon className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-bold text-card-foreground">
              Keyboard Shortcuts
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-secondary rounded-lg transition-colors"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {categories.map((category) => (
              <div key={category}>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                  {category}
                </h3>
                <div className="space-y-2">
                  {shortcuts
                    .filter((s) => s.category === category)
                    .map((shortcut, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg"
                      >
                        <span className="text-sm text-foreground">
                          {shortcut.description}
                        </span>
                        <div className="flex items-center space-x-1">
                          {shortcut.keys.map((key, keyIndex) => (
                            <span key={keyIndex} className="flex items-center">
                              <kbd className="px-2 py-1 text-xs font-mono bg-background border border-border rounded shadow-sm">
                                {key}
                              </kbd>
                              {keyIndex < shortcut.keys.length - 1 && (
                                <span className="mx-1 text-muted-foreground">
                                  +
                                </span>
                              )}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>

          {/* Footer Note */}
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-sm text-blue-900 dark:text-blue-300">
              💡 <strong>Tip:</strong> On macOS, use <kbd>Cmd</kbd> instead of{" "}
              <kbd>Ctrl</kbd> for most shortcuts.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-border px-6 py-4">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
