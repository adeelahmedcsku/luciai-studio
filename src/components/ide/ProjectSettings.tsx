import { useState } from "react";
import { XIcon, FolderIcon, CodeIcon, DatabaseIcon, PackageIcon } from "lucide-react";

interface ProjectSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectName: string;
  projectData: {
    project_type: string;
    tech_stack: {
      frontend?: string[];
      backend?: string[];
      database?: string;
    };
    description: string;
  };
  onSave: (updates: any) => void;
}

export default function ProjectSettings({
  isOpen,
  onClose,
  projectId,
  projectName,
  projectData,
  onSave,
}: ProjectSettingsProps) {
  const [name, setName] = useState(projectName);
  const [description, setDescription] = useState(projectData.description);
  const [frontend, setFrontend] = useState(projectData.tech_stack.frontend || []);
  const [backend, setBackend] = useState(projectData.tech_stack.backend || []);
  const [database, setDatabase] = useState(projectData.tech_stack.database || "");

  if (!isOpen) return null;

  const handleSave = () => {
    onSave({
      name,
      description,
      tech_stack: {
        frontend: frontend.length > 0 ? frontend : null,
        backend: backend.length > 0 ? backend : null,
        database: database || null,
      },
    });
    onClose();
  };

  const frontendOptions = ["React", "Vue", "Angular", "Next.js", "Svelte", "Vanilla JS"];
  const backendOptions = ["Node.js", "Python", "Go", "Rust", "Java", "PHP"];
  const databaseOptions = ["PostgreSQL", "MongoDB", "MySQL", "SQLite", "Redis", "None"];

  const toggleTech = (category: "frontend" | "backend", tech: string) => {
    if (category === "frontend") {
      setFrontend((prev) =>
        prev.includes(tech) ? prev.filter((t) => t !== tech) : [...prev, tech]
      );
    } else {
      setBackend((prev) =>
        prev.includes(tech) ? prev.filter((t) => t !== tech) : [...prev, tech]
      );
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card rounded-lg shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center space-x-2">
            <FolderIcon className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-bold text-card-foreground">
              Project Settings
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-secondary rounded-lg transition-colors"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Basic Info */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
              <CodeIcon className="w-5 h-5" />
              <span>Basic Information</span>
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Project Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Project ID
                </label>
                <input
                  type="text"
                  value={projectId}
                  disabled
                  className="w-full px-4 py-2 border border-border rounded-lg bg-secondary text-muted-foreground"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Project ID cannot be changed
                </p>
              </div>
            </div>
          </div>

          {/* Tech Stack */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
              <PackageIcon className="w-5 h-5" />
              <span>Technology Stack</span>
            </h3>

            <div className="space-y-4">
              {/* Frontend */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Frontend Technologies
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {frontendOptions.map((tech) => (
                    <button
                      key={tech}
                      onClick={() => toggleTech("frontend", tech)}
                      className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                        frontend.includes(tech)
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      {tech}
                    </button>
                  ))}
                </div>
              </div>

              {/* Backend */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Backend Technologies
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {backendOptions.map((tech) => (
                    <button
                      key={tech}
                      onClick={() => toggleTech("backend", tech)}
                      className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                        backend.includes(tech)
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      {tech}
                    </button>
                  ))}
                </div>
              </div>

              {/* Database */}
              <div>
                <label className="block text-sm font-medium mb-2 flex items-center space-x-2">
                  <DatabaseIcon className="w-4 h-4" />
                  <span>Database</span>
                </label>
                <select
                  value={database}
                  onChange={(e) => setDatabase(e.target.value)}
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background"
                >
                  {databaseOptions.map((db) => (
                    <option key={db} value={db}>
                      {db}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Project Type */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Project Type
            </label>
            <input
              type="text"
              value={projectData.project_type}
              disabled
              className="w-full px-4 py-2 border border-border rounded-lg bg-secondary text-muted-foreground"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Project type cannot be changed after creation
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 px-6 py-4 border-t border-border">
          <button
            onClick={onClose}
            className="px-4 py-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
