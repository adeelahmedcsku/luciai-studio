import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { FolderIcon, PlusIcon, CodeIcon, SearchIcon } from "lucide-react";
import NewProjectModal from "./NewProjectModal";

interface Project {
  id: string;
  name: string;
  description: string;
  created_at: string;
  last_modified: string;
  tech_stack: {
    frontend?: string[];
    backend?: string[];
    database?: string;
  };
}

interface ProjectDashboardProps {
  onOpenProject: (projectId: string) => void;
}

export default function ProjectDashboard({ onOpenProject }: ProjectDashboardProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const projectList = await invoke<Project[]>("list_projects");
      setProjects(projectList);
    } catch (error) {
      console.error("Failed to load projects:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredProjects = projects.filter((project) =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <CodeIcon className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-xl font-bold text-foreground">
                Software Developer Agent IDE
              </h1>
              <p className="text-sm text-muted-foreground">
                AI-Powered Development Environment
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowNewProjectModal(true)}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center space-x-2"
          >
            <PlusIcon className="w-4 h-4" />
            <span>New Project</span>
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-auto p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Search Bar */}
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search projects..."
              className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          {/* Projects Grid */}
          {isLoading ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Loading projects...</p>
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="text-center py-12">
              <FolderIcon className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {searchQuery ? "No projects found" : "No projects yet"}
              </h3>
              <p className="text-muted-foreground mb-6">
                {searchQuery
                  ? "Try a different search term"
                  : "Create your first project to get started"}
              </p>
              {!searchQuery && (
                <button
                  onClick={() => setShowNewProjectModal(true)}
                  className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                  Create Project
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProjects.map((project) => (
                <div
                  key={project.id}
                  onClick={() => onOpenProject(project.id)}
                  className="p-6 border border-border rounded-lg hover:border-primary hover:shadow-lg transition-all cursor-pointer bg-card"
                >
                  <div className="flex items-start justify-between mb-3">
                    <FolderIcon className="w-8 h-8 text-primary" />
                    <span className="text-xs text-muted-foreground">
                      {formatDate(project.last_modified)}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-card-foreground mb-2">
                    {project.name}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {project.description}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {project.tech_stack.frontend?.map((tech) => (
                      <span
                        key={tech}
                        className="px-2 py-1 text-xs bg-primary/10 text-primary rounded"
                      >
                        {tech}
                      </span>
                    ))}
                    {project.tech_stack.backend?.map((tech) => (
                      <span
                        key={tech}
                        className="px-2 py-1 text-xs bg-secondary/10 text-secondary-foreground rounded"
                      >
                        {tech}
                      </span>
                    ))}
                    {project.tech_stack.database && (
                      <span className="px-2 py-1 text-xs bg-accent/10 text-accent-foreground rounded">
                        {project.tech_stack.database}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* New Project Modal */}
      <NewProjectModal
        isOpen={showNewProjectModal}
        onClose={() => setShowNewProjectModal(false)}
        onProjectCreated={loadProjects}
      />
    </div>
  );
}
