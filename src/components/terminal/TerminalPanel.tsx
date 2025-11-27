import { useEffect } from "react";
import { PlusIcon, XIcon, TerminalIcon } from "lucide-react";
import { useAppStore } from "../../store/useAppStore";
import Terminal from "./Terminal";

export default function TerminalPanel() {
    const {
        terminals,
        activeTerminalId,
        addTerminal,
        removeTerminal,
        setActiveTerminal,
        currentProject
    } = useAppStore();

    // Ensure at least one terminal exists if panel is open and no terminals
    useEffect(() => {
        if (terminals.length === 0 && currentProject) {
            addTerminal();
        }
    }, [terminals.length, currentProject, addTerminal]);

    const activeTerminal = terminals.find(t => t.id === activeTerminalId);

    return (
        <div className="h-full flex flex-col">
            {/* Tabs Header */}
            <div className="flex items-center bg-gray-800 border-b border-gray-700 overflow-x-auto no-scrollbar">
                {terminals.map((terminal) => (
                    <div
                        key={terminal.id}
                        className={`
              group flex items-center gap-2 px-3 py-2 text-xs cursor-pointer border-r border-gray-700 min-w-[120px] max-w-[200px]
              ${activeTerminalId === terminal.id
                                ? "bg-gray-900 text-white border-t-2 border-t-blue-500"
                                : "text-gray-400 hover:bg-gray-700 hover:text-gray-200"
                            }
            `}
                        onClick={() => setActiveTerminal(terminal.id)}
                    >
                        <TerminalIcon className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate flex-1">{terminal.name}</span>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                removeTerminal(terminal.id);
                            }}
                            className={`
                p-0.5 rounded hover:bg-gray-600 opacity-0 group-hover:opacity-100 transition-opacity
                ${activeTerminalId === terminal.id ? "opacity-100" : ""}
              `}
                        >
                            <XIcon className="w-3 h-3" />
                        </button>
                    </div>
                ))}

                {/* New Terminal Button */}
                <button
                    onClick={addTerminal}
                    className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
                    title="New Terminal"
                >
                    <PlusIcon className="w-4 h-4" />
                </button>
            </div>

            {/* Terminal Content */}
            <div className="flex-1 overflow-hidden relative">
                {terminals.length > 0 ? (
                    terminals.map((terminal) => (
                        <div
                            key={terminal.id}
                            className={`h-full w-full ${activeTerminalId === terminal.id ? 'block' : 'hidden'}`}
                        >
                            <Terminal
                                projectPath={terminal.projectPath}
                                initialCommand={terminal.initialCommand}
                            />
                        </div>
                    ))
                ) : (
                    <div className="flex items-center justify-center h-full text-gray-500 text-sm">
                        No active terminal
                    </div>
                )}
            </div>
        </div>
    );
}
