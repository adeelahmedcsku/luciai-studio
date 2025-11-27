import { useState } from "react";
import { XIcon } from "lucide-react";

interface NewFolderDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (folderName: string) => void;
    defaultPath?: string;
}

export function NewFolderDialog({ isOpen, onClose, onConfirm, defaultPath = "" }: NewFolderDialogProps) {
    const [folderName, setFolderName] = useState("");
    const [error, setError] = useState("");

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!folderName.trim()) {
            setError("Folder name cannot be empty");
            return;
        }

        // Validate folder name
        const invalidChars = /[<>:"/\\|?*]/;
        if (invalidChars.test(folderName)) {
            setError("Folder name contains invalid characters");
            return;
        }

        onConfirm(folderName);
        setFolderName("");
        setError("");
        onClose();
    };

    const handleClose = () => {
        setFolderName("");
        setError("");
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-[#252526] border border-[#454545] rounded-lg shadow-2xl w-[500px]">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-[#454545]">
                    <h2 className="text-sm font-semibold text-[#cccccc]">New Folder</h2>
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
                            Folder Name
                        </label>
                        <input
                            type="text"
                            value={folderName}
                            onChange={(e) => {
                                setFolderName(e.target.value);
                                setError("");
                            }}
                            placeholder="my-folder"
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
                            Create Folder
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
