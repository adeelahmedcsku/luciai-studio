import { useState, useRef, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { XIcon, MinusIcon, SquareIcon } from "lucide-react";
import { useAppStore } from "../../store/useAppStore";

interface MenuItem {
    label?: string;
    shortcut?: string;
    separator?: boolean;
    submenu?: MenuItem[];
    action?: () => void;
    disabled?: boolean;
}

interface MenuBarProps {
    onNewFile?: () => void;
    onNewProject?: () => void;
    onOpenFolder?: () => void;
    onSave?: () => void;
    onSaveAll?: () => void;
    onToggleSidebar?: () => void;
    onTogglePanel?: () => void;
    onCommandPalette?: () => void;
}

export function MenuBar({
    onNewFile,
    onNewProject,
    onOpenFolder,
    onSave,
    onSaveAll,
    onToggleSidebar,
    onTogglePanel,
    onCommandPalette,
}: MenuBarProps) {
    const [activeMenu, setActiveMenu] = useState<string | null>(null);
    const [isMaximized, setIsMaximized] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const { addTerminal } = useAppStore();

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setActiveMenu(null);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const fileMenu: MenuItem[] = [
        { label: "New File", shortcut: "Ctrl+N", action: onNewFile },
        { label: "New Folder", shortcut: "Ctrl+Shift+N" },
        { label: "New Project...", action: onNewProject },
        { separator: true },
        { label: "Open File...", shortcut: "Ctrl+O" },
        { label: "Open Folder...", shortcut: "Ctrl+K Ctrl+O", action: onOpenFolder },
        { label: "Open Recent", submenu: [] },
        { separator: true },
        { label: "Save", shortcut: "Ctrl+S", action: onSave },
        { label: "Save As...", shortcut: "Ctrl+Shift+S" },
        { label: "Save All", shortcut: "Ctrl+K S", action: onSaveAll },
        { separator: true },
        {
            label: "Preferences", submenu: [
                { label: "Settings", shortcut: "Ctrl+," },
                { label: "Keyboard Shortcuts", shortcut: "Ctrl+K Ctrl+S" },
                { separator: true },
                { label: "Color Theme", shortcut: "Ctrl+K Ctrl+T" },
            ]
        },
        { separator: true },
        { label: "Exit", shortcut: "Alt+F4", action: () => window.close() },
    ];

    const editMenu: MenuItem[] = [
        { label: "Undo", shortcut: "Ctrl+Z" },
        { label: "Redo", shortcut: "Ctrl+Y" },
        { separator: true },
        { label: "Cut", shortcut: "Ctrl+X" },
        { label: "Copy", shortcut: "Ctrl+C" },
        { label: "Paste", shortcut: "Ctrl+V" },
        { separator: true },
        { label: "Find", shortcut: "Ctrl+F" },
        { label: "Replace", shortcut: "Ctrl+H" },
        { separator: true },
        { label: "Find in Files", shortcut: "Ctrl+Shift+F" },
        { label: "Replace in Files", shortcut: "Ctrl+Shift+H" },
    ];

    const selectionMenu: MenuItem[] = [
        { label: "Select All", shortcut: "Ctrl+A" },
        { label: "Expand Selection", shortcut: "Shift+Alt+Right" },
        { label: "Shrink Selection", shortcut: "Shift+Alt+Left" },
        { separator: true },
        { label: "Copy Line Up", shortcut: "Shift+Alt+Up" },
        { label: "Copy Line Down", shortcut: "Shift+Alt+Down" },
        { label: "Move Line Up", shortcut: "Alt+Up" },
        { label: "Move Line Down", shortcut: "Alt+Down" },
    ];

    const viewMenu: MenuItem[] = [
        { label: "Command Palette...", shortcut: "Ctrl+Shift+P", action: onCommandPalette },
        { label: "Open View..." },
        { separator: true },
        {
            label: "Appearance", submenu: [
                { label: "Full Screen", shortcut: "F11" },
                { label: "Zen Mode", shortcut: "Ctrl+K Z" },
                { separator: true },
                { label: "Show Side Bar", shortcut: "Ctrl+B", action: onToggleSidebar },
                { label: "Show Panel", shortcut: "Ctrl+J", action: onTogglePanel },
            ]
        },
        { separator: true },
        { label: "Explorer", shortcut: "Ctrl+Shift+E" },
        { label: "Search", shortcut: "Ctrl+Shift+F" },
        { label: "Source Control", shortcut: "Ctrl+Shift+G" },
        { separator: true },
        { label: "Terminal", shortcut: "Ctrl+`" },
    ];

    const goMenu: MenuItem[] = [
        { label: "Back", shortcut: "Alt+Left" },
        { label: "Forward", shortcut: "Alt+Right" },
        { separator: true },
        { label: "Go to File...", shortcut: "Ctrl+P" },
        { label: "Go to Line/Column...", shortcut: "Ctrl+G" },
    ];

    const runMenu: MenuItem[] = [
        { label: "Start Debugging", shortcut: "F5" },
        { label: "Run Without Debugging", shortcut: "Ctrl+F5" },
        { separator: true },
        { label: "Toggle Breakpoint", shortcut: "F9" },
    ];

    const terminalMenu: MenuItem[] = [
        {
            label: "New Terminal", shortcut: "Ctrl+Shift+`", action: () => {
                addTerminal();
                onTogglePanel?.();
            }
        },
        { label: "Split Terminal", shortcut: "Ctrl+Shift+5" },
        { separator: true },
        { label: "Run Task...", shortcut: "Ctrl+Shift+B" },
    ];

    const helpMenu: MenuItem[] = [
        { label: "Welcome" },
        { label: "Documentation" },
        { separator: true },
        { label: "Toggle Developer Tools", shortcut: "Ctrl+Shift+I" },
        { label: "About" },
    ];

    const menus = {
        File: fileMenu,
        Edit: editMenu,
        Selection: selectionMenu,
        View: viewMenu,
        Go: goMenu,
        Run: runMenu,
        Terminal: terminalMenu,
        Help: helpMenu,
    };

    const handleMenuClick = (menuName: string) => {
        setActiveMenu(activeMenu === menuName ? null : menuName);
    };

    const handleMenuItemClick = (item: MenuItem) => {
        if (item.action) {
            item.action();
            setActiveMenu(null);
        }
    };

    const handleMinimize = async () => {
        try {
            await invoke("minimize_window");
        } catch (error) {
            console.error("Failed to minimize:", error);
        }
    };

    const handleMaximize = async () => {
        try {
            await invoke("toggle_maximize");
            setIsMaximized(!isMaximized);
        } catch (error) {
            console.error("Failed to maximize:", error);
        }
    };

    const handleClose = async () => {
        try {
            await invoke("close_window");
        } catch (error) {
            console.error("Failed to close:", error);
            window.close();
        }
    };

    return (
        <div
            ref={menuRef}
            className="h-9 bg-background border-b border-border flex items-center justify-between select-none text-foreground"
            data-tauri-drag-region
        >
            {/* Left: Menu Items */}
            <div className="flex items-center h-full">
                {Object.keys(menus).map((menuName) => (
                    <div key={menuName} className="relative">
                        <button
                            className={`px-3 h-full text-sm hover:bg-accent transition-colors ${activeMenu === menuName ? "bg-accent" : ""
                                }`}
                            onClick={() => handleMenuClick(menuName)}
                        >
                            {menuName}
                        </button>

                        {/* Dropdown Menu */}
                        {activeMenu === menuName && (
                            <div className="absolute top-full left-0 min-w-[280px] bg-popover border border-border shadow-lg z-50 py-1">
                                {menus[menuName as keyof typeof menus].map((item, index) => (
                                    <MenuItemComponent
                                        key={index}
                                        item={item}
                                        onClick={() => handleMenuItemClick(item)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Center: Window Title */}
            <div className="flex-1 text-center text-sm text-muted-foreground" data-tauri-drag-region>
                luciai-studio v2.2 ADVANCED-DEVOPS
            </div>

            {/* Right: Window Controls */}
            <div className="flex items-center h-full">
                <button
                    onClick={handleMinimize}
                    className="w-12 h-full flex items-center justify-center hover:bg-accent transition-colors"
                    title="Minimize"
                >
                    <MinusIcon className="w-4 h-4" />
                </button>
                <button
                    onClick={handleMaximize}
                    className="w-12 h-full flex items-center justify-center hover:bg-accent transition-colors"
                    title={isMaximized ? "Restore" : "Maximize"}
                >
                    <SquareIcon className="w-3.5 h-3.5" />
                </button>
                <button
                    onClick={handleClose}
                    className="w-12 h-full flex items-center justify-center hover:bg-destructive hover:text-destructive-foreground transition-colors"
                    title="Close"
                >
                    <XIcon className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}

function MenuItemComponent({ item, onClick }: { item: MenuItem; onClick: () => void }) {
    const [showSubmenu, setShowSubmenu] = useState(false);

    if (item.separator) {
        return <div className="h-px bg-border my-1" />;
    }

    return (
        <div
            className="relative"
            onMouseEnter={() => item.submenu && setShowSubmenu(true)}
            onMouseLeave={() => item.submenu && setShowSubmenu(false)}
        >
            <button
                onClick={onClick}
                disabled={item.disabled}
                className={`w-full px-4 py-1.5 text-sm text-left hover:bg-accent flex items-center justify-between ${item.disabled ? "opacity-50 cursor-not-allowed" : ""
                    }`}
            >
                <span>{item.label}</span>
                {item.shortcut && (
                    <span className="text-xs text-muted-foreground ml-8">{item.shortcut}</span>
                )}
                {item.submenu && (
                    <span className="ml-2">›</span>
                )}
            </button>

            {/* Submenu */}
            {item.submenu && showSubmenu && (
                <div className="absolute left-full top-0 min-w-[280px] bg-popover border border-border shadow-lg py-1">
                    {item.submenu.map((subItem, index) => (
                        <MenuItemComponent
                            key={index}
                            item={subItem}
                            onClick={onClick}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
