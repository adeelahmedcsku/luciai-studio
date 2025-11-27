import { useState } from "react";
import { XIcon, TerminalIcon, AlertCircleIcon, FileTextIcon } from "lucide-react";
import TerminalPanel from "../terminal/TerminalPanel";

interface BottomPanelProps {
    height: number;
    onClose: () => void;
}

type BottomTab = "terminal" | "problems" | "output";

export default function BottomPanel({ height, onClose }: BottomPanelProps) {
    const [activeTab, setActiveTab] = useState<BottomTab>("terminal");

    return (
        <div className="h-full flex flex-col bg-gray-900 border-t border-gray-700">
            {/* Header / Tabs */}
            <div className="flex items-center justify-between bg-gray-800 border-b border-gray-700 px-2">
                <div className="flex items-center">
                    <button
                        onClick={() => setActiveTab("problems")}
                        className={`flex items-center gap-2 px-3 py-2 text-xs border-t-2 transition-colors ${activeTab === "problems"
                            ? "border-blue-500 text-white bg-gray-900"
                            : "border-transparent text-gray-400 hover:text-gray-200 hover:bg-gray-700"
                            }`}
                    >
                        <AlertCircleIcon className="w-3 h-3" />
                        <span>Problems</span>
                        <span className="bg-gray-700 text-gray-300 px-1.5 rounded-full text-[10px]">0</span>
                    </button>
                    <button
                        onClick={() => setActiveTab("output")}
                        className={`flex items-center gap-2 px-3 py-2 text-xs border-t-2 transition-colors ${activeTab === "output"
                            ? "border-blue-500 text-white bg-gray-900"
                            : "border-transparent text-gray-400 hover:text-gray-200 hover:bg-gray-700"
                            }`}
                    >
                        <FileTextIcon className="w-3 h-3" />
                        <span>Output</span>
                    </button>
                    <button
                        onClick={() => setActiveTab("terminal")}
                        className={`flex items-center gap-2 px-3 py-2 text-xs border-t-2 transition-colors ${activeTab === "terminal"
                            ? "border-blue-500 text-white bg-gray-900"
                            : "border-transparent text-gray-400 hover:text-gray-200 hover:bg-gray-700"
                            }`}
                    >
                        <TerminalIcon className="w-3 h-3" />
                        <span>Terminal</span>
                    </button>
                </div>

                <div className="flex items-center">
                    <button
                        onClick={onClose}
                        className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded"
                        title="Close Panel"
                    >
                        <XIcon className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden">
                <div className={`h-full ${activeTab === "problems" ? "block" : "hidden"}`}>
                    <div className="p-4 text-gray-400 text-sm flex flex-col items-center justify-center h-full">
                        <p>No problems detected in workspace.</p>
                    </div>
                </div>

                <div className={`h-full ${activeTab === "output" ? "block" : "hidden"}`}>
                    <div className="p-4 text-gray-400 text-sm font-mono">
                        <div className="flex items-center gap-2 text-green-400 mb-2">
                            <span>✓</span>
                            <span>Build finished successfully</span>
                        </div>
                        <div className="text-gray-500">
                            [Info] Ready for new tasks...
                        </div>
                    </div>
                </div>

                <div className={`h-full ${activeTab === "terminal" ? "block" : "hidden"}`}>
                    <TerminalPanel />
                </div>
            </div>
        </div>
    );
}
