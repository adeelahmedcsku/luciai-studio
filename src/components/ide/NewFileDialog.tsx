import { useState } from "react";
import { XIcon } from "lucide-react";

interface NewFileDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (fileName: string) => void;
    defaultPath?: string;
}

export function NewFileDialog({ isOpen, onClose, onConfirm, defaultPath = "" }: NewFileDialogProps) {
    const [fileName, setFileName] = useState("");
    const [error, setError] = useState("");

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!fileName.trim()) {
            setError("File name cannot be empty");
            return;
        }

        // Validate file name
        const invalidChars = /[<>:"/\\|?*]/;
        if (invalidChars.test(fileName)) {
            setError("File name contains invalid characters");
            return;
        }

        onConfirm(fileName);
        setFileName("");
        setError("");
        onClose();
    };

    const handleClose = () => {
        setFileName("");
        setError("");
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-[#252526] border border-[#454545] rounded-lg shadow-2xl w-[500px]">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-[#454545]">
                    <h2 className="text-sm font-semibold text-[#cccccc]">New File</h2>
                    <button
                        onClick={handleClose}
                        className="p-1 hover:bg-[#2a2a2a] rounded"
                    >
                        <XIcon className="w-4 h-4 text-[#cccccc]" />
                    </button>
                </div>

                {/* Content */}
                <form onSubmit={handleSubmit} className="p-4">
                    <div className="mb-4">
                        <label className="block text-xs text-[#858585] mb-2">
                            File Name (with extension)
                        </label>
                        <input
                            type="text"
                            value={fileName}
                            onChange={(e) => {
                                setFileName(e.target.value);
                                setError("");
                            }}
                            placeholder="example.tsx"
                            className="w-full bg-[#3c3c3c] border border-[#555] rounded px-3 py-2 text-sm text-[#cccccc] focus:outline-none focus:border-blue-500"
                            autoFocus
                        />
                        {error && (
                            <p className="mt-1 text-xs text-red-500">{error}</p>
                        )}
                    </div>

                    {defaultPath && (
                        <div className="mb-4">
                            <label className="block text-xs text-[#858585] mb-1">
                                Location
                            </label>
                            <div className="text-xs text-[#cccccc] bg-[#1e1e1e] px-3 py-2 rounded">
                                {defaultPath}
                            </div>
                        </div>
                    )}

                    {/* Quick Templates */}
                    <div className="mb-4">
                        <label className="block text-xs text-[#858585] mb-2">
                            Quick Templates
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                            {[
                                { name: "TypeScript", ext: ".ts" },
                                { name: "React", ext: ".tsx" },
                                { name: "JavaScript", ext: ".js" },
                                { name: "Python", ext: ".py" },
                                { name: "Rust", ext: ".rs" },
                                { name: "JSON", ext: ".json" },
                            ].map((template) => (
                                <button
                                    key={template.ext}
                                    type="button"
                                    onClick={() => setFileName(`untitled${template.ext}`)}
                                    className="px-3 py-2 text-xs bg-[#3c3c3c] hover:bg-[#4a4a4a] rounded transition-colors text-[#cccccc]"
                                >
                                    {template.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="px-4 py-2 text-sm bg-[#3c3c3c] hover:bg-[#4a4a4a] rounded transition-colors text-[#cccccc]"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 rounded transition-colors text-white font-medium"
                        >
                            Create File
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
