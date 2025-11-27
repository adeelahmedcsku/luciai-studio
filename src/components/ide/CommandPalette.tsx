import { useEffect, useState } from "react";
import { Command } from "cmdk";
import {
    SearchIcon,
    FileIcon,
    SettingsIcon,
    TerminalIcon,
    BotIcon,
    SaveIcon,
    FolderPlusIcon,
    FilePlusIcon
} from "lucide-react";

interface CommandPaletteProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    actions: {
        id: string;
        label: string;
        shortcut?: string[];
        icon?: React.ReactNode;
        perform: () => void;
        section?: string;
    }[];
}

export default function CommandPalette({ open, onOpenChange, actions }: CommandPaletteProps) {
    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "p" && (e.metaKey || e.ctrlKey) && e.shiftKey) {
                e.preventDefault();
                onOpenChange(!open);
            }
        };

        document.addEventListener("keydown", down);
        return () => document.removeEventListener("keydown", down);
    }, [open, onOpenChange]);

    return (
        <Command.Dialog
            open={open}
            onOpenChange={onOpenChange}
            label="Global Command Menu"
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[640px] max-w-[90vw] bg-gray-900 border border-gray-700 rounded-xl shadow-2xl overflow-hidden z-50 p-2"
        >
            <div className="flex items-center border-b border-gray-800 px-3 pb-2 mb-2">
                <SearchIcon className="w-5 h-5 text-gray-500 mr-2" />
                <Command.Input
                    className="flex-1 bg-transparent text-white text-lg placeholder:text-gray-500 focus:outline-none"
                    placeholder="Type a command or search..."
                />
            </div>

            <Command.List className="max-h-[300px] overflow-y-auto overflow-x-hidden">
                <Command.Empty className="py-6 text-center text-gray-500">
                    No results found.
                </Command.Empty>

                {/* Group actions by section */}
                {["General", "File", "View", "AI"].map(section => {
                    const sectionActions = actions.filter(a => (a.section || "General") === section);
                    if (sectionActions.length === 0) return null;

                    return (
                        <Command.Group key={section} heading={section} className="text-gray-500 text-xs font-medium mb-2 px-2">
                            {sectionActions.map(action => (
                                <Command.Item
                                    key={action.id}
                                    onSelect={() => {
                                        action.perform();
                                        onOpenChange(false);
                                    }}
                                    className="flex items-center justify-between px-2 py-2 rounded-lg text-gray-300 text-sm cursor-pointer hover:bg-blue-600 hover:text-white aria-selected:bg-blue-600 aria-selected:text-white transition-colors"
                                >
                                    <div className="flex items-center gap-2">
                                        {action.icon}
                                        <span>{action.label}</span>
                                    </div>
                                    {action.shortcut && (
                                        <div className="flex items-center gap-1">
                                            {action.shortcut.map(key => (
                                                <kbd key={key} className="bg-gray-800 text-gray-400 px-1.5 py-0.5 rounded text-[10px] uppercase font-sans">
                                                    {key}
                                                </kbd>
                                            ))}
                                        </div>
                                    )}
                                </Command.Item>
                            ))}
                        </Command.Group>
                    );
                })}
            </Command.List>
        </Command.Dialog>
    );
}
