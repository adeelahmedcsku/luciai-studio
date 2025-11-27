import {
    FolderIcon,
    SearchIcon,
    GitBranchIcon,
    PlayIcon,
    PackageIcon,
    SettingsIcon,
    FileTextIcon
} from "lucide-react";

interface ActivityBarProps {
    activePanel: string;
    onPanelChange: (panelId: string) => void;
    gitChangesCount?: number;
}

export function ActivityBar({
    activePanel,
    onPanelChange,
    gitChangesCount = 0
}: ActivityBarProps) {
    const topItems = [
        { id: "explorer", icon: FolderIcon, label: "Explorer", shortcut: "Ctrl+Shift+E" },
        { id: "search", icon: SearchIcon, label: "Search", shortcut: "Ctrl+Shift+F" },
        { id: "git", icon: GitBranchIcon, label: "Source Control", shortcut: "Ctrl+Shift+G", badge: gitChangesCount },
        { id: "debug", icon: PlayIcon, label: "Run and Debug", shortcut: "Ctrl+Shift+D" },
        { id: "extensions", icon: PackageIcon, label: "Extensions", shortcut: "Ctrl+Shift+X" },
    ];

    const bottomItems = [
        { id: "settings", icon: SettingsIcon, label: "Settings", shortcut: "Ctrl+," },
    ];

    return (
        <div className="w-12 bg-activity-bar flex flex-col justify-between border-r border-border">
            {/* Top Items */}
            <div className="flex flex-col">
                {topItems.map((item) => (
                    <ActivityBarButton
                        key={item.id}
                        item={item}
                        isActive={activePanel === item.id}
                        onClick={() => onPanelChange(item.id)}
                    />
                ))}
            </div>

            {/* Bottom Items */}
            <div className="flex flex-col">
                {bottomItems.map((item) => (
                    <ActivityBarButton
                        key={item.id}
                        item={item}
                        isActive={activePanel === item.id}
                        onClick={() => onPanelChange(item.id)}
                    />
                ))}
            </div>
        </div>
    );
}

interface ActivityBarButtonProps {
    item: {
        id: string;
        icon: any;
        label: string;
        shortcut?: string;
        badge?: number;
    };
    isActive: boolean;
    onClick: () => void;
}

function ActivityBarButton({ item, isActive, onClick }: ActivityBarButtonProps) {
    const Icon = item.icon;

    return (
        <button
            onClick={onClick}
            className={`
        relative w-12 h-12 flex items-center justify-center
        hover:bg-activity-bar-foreground/10 transition-colors
        ${isActive ? "border-l-2 border-activity-bar-foreground bg-background" : "border-l-2 border-transparent"}
      `}
            title={`${item.label}${item.shortcut ? ` (${item.shortcut})` : ""}`}
        >
            <Icon className={`w-6 h-6 ${isActive ? "text-activity-bar-foreground" : "text-muted-foreground"}`} />

            {/* Badge for notifications */}
            {item.badge !== undefined && item.badge > 0 && (
                <span className="absolute top-1 right-1 bg-primary text-primary-foreground text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
                    {item.badge > 99 ? "99+" : item.badge}
                </span>
            )}
        </button>
    );
}
