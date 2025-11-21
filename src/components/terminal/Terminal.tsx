import { useState, useRef, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { TerminalIcon, XIcon, ChevronRightIcon } from "lucide-react";

interface TerminalOutput {
  id: string;
  command: string;
  output: string;
  error: string;
  exitCode: number;
  timestamp: Date;
}

interface TerminalProps {
  projectPath?: string;
}

export default function Terminal({ projectPath }: TerminalProps) {
  const [history, setHistory] = useState<TerminalOutput[]>([]);
  const [input, setInput] = useState("");
  const [isExecuting, setIsExecuting] = useState(false);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const outputRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [history]);

  const scrollToBottom = () => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  };

  const executeCommand = async () => {
    if (!input.trim() || isExecuting) return;

    const command = input.trim();
    setInput("");
    setIsExecuting(true);

    // Add to command history
    setCommandHistory((prev) => [...prev, command]);
    setHistoryIndex(-1);

    try {
      const result = await invoke<{
        stdout: string;
        stderr: string;
        exit_code: number;
        success: boolean;
      }>("execute_command", {
        request: {
          command: command,
          args: [],
          working_dir: projectPath || null,
        },
      });

      const output: TerminalOutput = {
        id: Date.now().toString(),
        command,
        output: result.stdout,
        error: result.stderr,
        exitCode: result.exit_code,
        timestamp: new Date(),
      };

      setHistory((prev) => [...prev, output]);
    } catch (error) {
      const output: TerminalOutput = {
        id: Date.now().toString(),
        command,
        output: "",
        error: error as string,
        exitCode: 1,
        timestamp: new Date(),
      };

      setHistory((prev) => [...prev, output]);
    } finally {
      setIsExecuting(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      executeCommand();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const newIndex = historyIndex + 1;
        if (newIndex < commandHistory.length) {
          setHistoryIndex(newIndex);
          setInput(commandHistory[commandHistory.length - 1 - newIndex]);
        }
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setInput(commandHistory[commandHistory.length - 1 - newIndex]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setInput("");
      }
    } else if (e.key === "c" && e.ctrlKey) {
      e.preventDefault();
      setInput("");
    } else if (e.key === "l" && e.ctrlKey) {
      e.preventDefault();
      clearTerminal();
    }
  };

  const clearTerminal = () => {
    setHistory([]);
    setInput("");
  };

  return (
    <div className="h-full flex flex-col bg-gray-900 text-gray-100 font-mono text-sm">
      {/* Header */}
      <div className="border-b border-gray-700 px-4 py-2 flex items-center justify-between bg-gray-800">
        <div className="flex items-center space-x-2">
          <TerminalIcon className="w-4 h-4 text-green-400" />
          <span className="text-xs font-semibold">Terminal</span>
          {projectPath && (
            <span className="text-xs text-gray-400">
              {projectPath.split("/").pop()}
            </span>
          )}
        </div>
        <button
          onClick={clearTerminal}
          className="p-1 hover:bg-gray-700 rounded transition-colors"
          title="Clear terminal (Ctrl+L)"
        >
          <XIcon className="w-4 h-4" />
        </button>
      </div>

      {/* Output Area */}
      <div ref={outputRef} className="flex-1 overflow-y-auto p-4 space-y-2">
        {history.length === 0 && (
          <div className="text-gray-500 text-xs">
            <p>Software Developer Agent IDE - Terminal</p>
            <p className="mt-1">Type commands and press Enter to execute.</p>
            <p className="mt-1">
              Tips: ↑↓ for history, Ctrl+C to cancel, Ctrl+L to clear
            </p>
          </div>
        )}

        {history.map((item) => (
          <div key={item.id} className="space-y-1">
            {/* Command */}
            <div className="flex items-center space-x-2 text-gray-300">
              <ChevronRightIcon className="w-3 h-3 text-green-400" />
              <span>{item.command}</span>
            </div>

            {/* Output */}
            {item.output && (
              <pre className="text-gray-400 text-xs whitespace-pre-wrap pl-5">
                {item.output}
              </pre>
            )}

            {/* Error */}
            {item.error && (
              <pre className="text-red-400 text-xs whitespace-pre-wrap pl-5">
                {item.error}
              </pre>
            )}

            {/* Exit code (if not 0) */}
            {item.exitCode !== 0 && (
              <div className="text-red-400 text-xs pl-5">
                Exit code: {item.exitCode}
              </div>
            )}
          </div>
        ))}

        {isExecuting && (
          <div className="flex items-center space-x-2 text-gray-400">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-xs">Executing...</span>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-700 p-3 bg-gray-800">
        <div className="flex items-center space-x-2">
          <ChevronRightIcon className="w-4 h-4 text-green-400 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isExecuting}
            placeholder="Enter command..."
            className="flex-1 bg-transparent outline-none text-gray-100 placeholder-gray-600 disabled:opacity-50"
            autoFocus
          />
        </div>
      </div>

      {/* Status Bar */}
      <div className="border-t border-gray-700 px-3 py-1 flex items-center justify-between text-xs text-gray-500 bg-gray-900">
        <div>
          {projectPath ? `Working dir: ${projectPath}` : "No project loaded"}
        </div>
        <div className="flex items-center space-x-3">
          <span>{history.length} commands</span>
          <span className={isExecuting ? "text-yellow-400" : "text-green-400"}>
            {isExecuting ? "●" : "●"} {isExecuting ? "Running" : "Ready"}
          </span>
        </div>
      </div>
    </div>
  );
}
