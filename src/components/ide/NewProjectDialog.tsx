import { useState } from "react";
import { XIcon, FolderIcon, CodeIcon, DatabaseIcon, ServerIcon } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { ProjectCreationProgress } from "./ProjectCreationProgress";

interface ProjectTemplate {
    id: string;
    name: string;
    description: string;
    icon: any;
    category: string;
    tags: string[];
}

interface NewProjectDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (templateId: string, projectName: string, location: string, aiPrompt: string) => Promise<void>;
}

const PROJECT_TEMPLATES: ProjectTemplate[] = [
    {
        id: "react-vite",
        name: "React + Vite",
        description: "React application with Vite build tool",
        icon: CodeIcon,
        category: "Frontend",
        tags: ["React", "Vite", "TypeScript"],
    },
    {
        id: "react-nextjs",
        name: "Next.js",
        description: "Full-stack React framework with SSR",
        icon: CodeIcon,
        category: "Frontend",
        tags: ["React", "Next.js", "TypeScript"],
    },
    {
        id: "vue-vite",
        name: "Vue + Vite",
        description: "Vue 3 application with Vite",
        icon: CodeIcon,
        category: "Frontend",
        tags: ["Vue", "Vite", "TypeScript"],
    },
    {
        id: "angular",
        name: "Angular",
        description: "Angular application with CLI",
        icon: CodeIcon,
        category: "Frontend",
        tags: ["Angular", "TypeScript"],
    },
    {
        id: "node-express",
        name: "Node.js + Express",
        description: "Express.js REST API server",
        icon: ServerIcon,
        category: "Backend",
        tags: ["Node.js", "Express", "TypeScript"],
    },
    {
        id: "springboot",
        name: "Spring Boot",
        description: "Java Spring Boot application",
        icon: ServerIcon,
        category: "Backend",
        tags: ["Java", "Spring Boot", "Maven"],
    },
    {
        id: "fastapi",
        name: "FastAPI",
        description: "Modern Python web framework",
        icon: ServerIcon,
        category: "Backend",
        tags: ["Python", "FastAPI"],
    },
    {
        id: "django",
        name: "Django",
        description: "Python web framework",
        icon: ServerIcon,
        category: "Backend",
        tags: ["Python", "Django"],
    },
    {
        id: "rust-actix",
        name: "Rust + Actix",
        description: "Actix web framework for Rust",
        icon: ServerIcon,
        category: "Backend",
        tags: ["Rust", "Actix"],
    },
    {
        id: "tauri-react",
        name: "Tauri + React",
        description: "Desktop app with Tauri and React",
        icon: CodeIcon,
        category: "Desktop",
        tags: ["Tauri", "React", "Rust"],
    },
];

export function NewProjectDialog({ isOpen, onClose, onConfirm }: NewProjectDialogProps) {
    const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
    const [projectName, setProjectName] = useState("");
    const [location, setLocation] = useState("");
    const [aiPrompt, setAiPrompt] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<string>("All");
    const [error, setError] = useState("");
    const [isCreating, setIsCreating] = useState(false);

    if (!isOpen) return null;

    const categories = ["All", "Frontend", "Backend", "Desktop", "Mobile"];

    const filteredTemplates = selectedCategory === "All"
        ? PROJECT_TEMPLATES
        : PROJECT_TEMPLATES.filter(t => t.category === selectedCategory);

    const handleBrowseLocation = async () => {
        try {
            // Dynamically import to ensure it works in the browser/Tauri environment
            const { open } = await import("@tauri-apps/plugin-dialog");
            const selected = await open({
                directory: true,
                multiple: false,
                title: "Select Project Location",
            });

            if (selected) {
                // selected can be string or string[] or null
                const path = Array.isArray(selected) ? selected[0] : selected;
                if (path) {
                    setLocation(path);
                    setError("");
                }
            }
        } catch (error) {
            console.error("Failed to open folder dialog:", error);
            setError("Failed to open file dialog. Please enter path manually.");
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedTemplate) {
            setError("Please select a project template");
            return;
        }

        if (!projectName.trim()) {
            setError("Project name cannot be empty");
            return;
        }

        if (!location.trim()) {
            setError("Please select a location");
            return;
        }

        setIsCreating(true);
        setError("");

        try {
            await onConfirm(selectedTemplate, projectName, location, aiPrompt);
        } catch (err) {
            console.error("Project creation failed:", err);
            setError(err instanceof Error ? err.message : "Failed to create project");
            setIsCreating(false);
        }
    };

    const handleClose = () => {
        if (isCreating) return; // Prevent closing while creating
        setSelectedTemplate(null);
        setProjectName("");
        setLocation("");
        setError("");
        setIsCreating(false);
        onClose();
    };

    const handleProgressComplete = () => {
        setIsCreating(false);
        handleClose();
    };

    const handleProgressError = (message: string) => {
        setIsCreating(false);
        setError(message);
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-gray-900 border border-gray-700 rounded-lg shadow-2xl w-[800px] max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-[#454545]">
                    <h2 className="text-sm font-semibold text-[#cccccc]">Create New Project</h2>
                    <button
                        onClick={handleClose}
                        className="p-1 hover:bg-[#2a2a2a] rounded"
                    >
                        <XIcon className="w-4 h-4 text-[#cccccc]" />
                    </button>
                </div>

                {/* Content */}
                {isCreating ? (
                    <div className="p-8">
                        <ProjectCreationProgress
                            onComplete={handleProgressComplete}
                            onError={handleProgressError}
                        />
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
                        <div className="flex-1 overflow-y-auto p-4">
                            {/* Category Filter */}
                            <div className="mb-4">
                                <div className="flex gap-2">
                                    {categories.map((category) => (
                                        <button
                                            key={category}
                                            type="button"
                                            onClick={() => setSelectedCategory(category)}
                                            className={`px-3 py-1.5 text-xs rounded transition-colors ${selectedCategory === category
                                                ? "bg-blue-600 text-white"
                                                : "bg-[#3c3c3c] text-[#cccccc] hover:bg-[#4a4a4a]"
                                                }`}
                                        >
                                            {category}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Templates Grid */}
                            <div className="grid grid-cols-2 gap-3 mb-4">
                                {filteredTemplates.map((template) => {
                                    const Icon = template.icon;
                                    return (
                                        <button
                                            key={template.id}
                                            type="button"
                                            onClick={() => setSelectedTemplate(template.id)}
                                            className={`p-4 rounded border-2 text-left transition-all ${selectedTemplate === template.id
                                                ? "border-blue-500 bg-blue-500/10"
                                                : "border-[#454545] bg-[#1e1e1e] hover:border-[#555] hover:bg-[#2a2a2a]"
                                                }`}
                                        >
                                            <div className="flex items-start gap-3">
                                                <Icon className="w-8 h-8 text-blue-500 flex-shrink-0" />
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="text-sm font-semibold text-[#cccccc] mb-1">
                                                        {template.name}
                                                    </h3>
                                                    <p className="text-xs text-[#858585] mb-2">
                                                        {template.description}
                                                    </p>
                                                    <div className="flex flex-wrap gap-1">
                                                        {template.tags.map((tag) => (
                                                            <span
                                                                key={tag}
                                                                className="px-2 py-0.5 text-[10px] bg-[#3c3c3c] text-[#cccccc] rounded"
                                                            >
                                                                {tag}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Project Details */}
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-xs text-[#858585] mb-2">
                                        Project Name
                                    </label>
                                    <input
                                        type="text"
                                        value={projectName}
                                        onChange={(e) => {
                                            setProjectName(e.target.value);
                                            setError("");
                                        }}
                                        placeholder="my-awesome-project"
                                        className="w-full bg-[#3c3c3c] border border-[#555] rounded px-3 py-2 text-sm text-[#cccccc] focus:outline-none focus:border-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs text-[#858585] mb-2">
                                        Location
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={location}
                                            onChange={(e) => {
                                                setLocation(e.target.value);
                                                setError("");
                                            }}
                                            placeholder="Select project location..."
                                            className="flex-1 bg-[#3c3c3c] border border-[#555] rounded px-3 py-2 text-sm text-[#cccccc] focus:outline-none focus:border-blue-500"
                                            readOnly
                                        />
                                        <button
                                            type="button"
                                            onClick={handleBrowseLocation}
                                            className="px-4 py-2 text-sm bg-[#3c3c3c] hover:bg-[#4a4a4a] rounded transition-colors text-[#cccccc]"
                                        >
                                            Browse...
                                        </button>
                                    </div>
                                </div>

                                {/* AI Instructions */}
                                <div>
                                    <label className="block text-xs text-[#858585] mb-2">
                                        AI Instructions (Optional)
                                    </label>
                                    <textarea
                                        value={aiPrompt}
                                        onChange={(e) => setAiPrompt(e.target.value)}
                                        placeholder="Describe your project (e.g., 'Create a todo app with React and Tailwind'). The AI agent will help you get started."
                                        className="w-full bg-[#3c3c3c] border border-[#555] rounded px-3 py-2 text-sm text-[#cccccc] focus:outline-none focus:border-blue-500 min-h-[80px] resize-none"
                                    />
                                </div>

                                {error && (
                                    <p className="text-xs text-red-500">{error}</p>
                                )}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end gap-2 px-4 py-3 border-t border-[#454545]">
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
                                Create Project
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
