import { useEffect } from "react";

interface KeyboardShortcut {
    key: string;
    ctrl?: boolean;
    shift?: boolean;
    alt?: boolean;
    action: () => void;
    description: string;
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            for (const shortcut of shortcuts) {
                const ctrlMatch = shortcut.ctrl === undefined || shortcut.ctrl === (event.ctrlKey || event.metaKey);
                const shiftMatch = shortcut.shift === undefined || shortcut.shift === event.shiftKey;
                const altMatch = shortcut.alt === undefined || shortcut.alt === event.altKey;
                const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();

                if (ctrlMatch && shiftMatch && altMatch && keyMatch) {
                    event.preventDefault();
                    shortcut.action();
                    break;
                }
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [shortcuts]);
}

// Global keyboard shortcuts registry
export const globalShortcuts = {
    newFile: { key: "n", ctrl: true },
    openFile: { key: "o", ctrl: true },
    openFolder: { key: "o", ctrl: true, shift: true },
    save: { key: "s", ctrl: true },
    saveAll: { key: "s", ctrl: true, alt: true },
    commandPalette: { key: "p", ctrl: true, shift: true },
    find: { key: "f", ctrl: true },
    replace: { key: "h", ctrl: true },
    toggleSidebar: { key: "b", ctrl: true },
    togglePanel: { key: "j", ctrl: true },
    toggleTerminal: { key: "`", ctrl: true },
};
