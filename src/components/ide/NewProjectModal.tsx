import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { XIcon, ChevronRightIcon, ChevronLeftIcon } from "lucide-react";
import TemplateSelector from "../ui/TemplateSelector";
import { ProjectTemplate } from "../../utils/ProjectTemplates";
import { applyTemplate, installTemplateDependencies } from "../../utils/TemplateApplicator";
import { toast } from "../ui/NotificationToast";

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProjectCreated: () => void;
}

type ProjectType = "WebApp" | "MobileApp" | "DesktopApp" | "CLI" | "Backend" | "FullStack";

interface FormData {
  name: string;
  projectType: ProjectType;
  frontend: string[];
  backend: string[];
  database: string;
  description: string;
}

const projectTypes = [
  { value: "FullStack", label: "Full-Stack Application", icon: "🌐" },
  { value: "WebApp", label: "Web Application", icon: "💻" },
  { value: "MobileApp", label: "Mobile App", icon: "📱" },
  { value: "DesktopApp", label: "Desktop Application", icon: "🖥️" },
  { value: "Backend", label: "Backend API", icon: "⚙️" },
  { value: "CLI", label: "CLI Tool", icon: "⌨️" },
];

const frontendOptions = [
  "React", "Vue", "Angular", "Next.js", "Svelte", "Solid.js", "Vanilla JS"
];

const backendOptions = [
  "Node.js", "Python", "Go", "Rust", "Java", "PHP", "Ruby", ".NET"
];

const databaseOptions = [
  "PostgreSQL", "MongoDB", "MySQL", "SQLite", "Redis", "None"
];

export default function NewProjectModal({
  isOpen,
  onClose,
  onProjectCreated,
}: NewProjectModalProps) {
  const [step, setStep] = useState(1);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState("");
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ProjectTemplate | null>(null);

  const [formData, setFormData] = useState<FormData>({
    name: "",
    projectType: "FullStack",
    frontend: [],
    backend: [],
    database: "PostgreSQL",
    description: "",
  });

  const handleNext = () => {
    if (step === 1 && !formData.name.trim()) {
      setError("Please enter a project name");
      return;
    }
    setError("");
    setStep(step + 1);
  };

  const handleBack = () => {
    setError("");
    setStep(step - 1);
  };

  const handleCreate = async () => {
    if (!formData.description.trim()) {
      setError("Please describe what you want to build");
      return;
    }

    setIsCreating(true);
    setError("");

    try {
      // Create the project first
      const projectId = await invoke<string>("create_project", {
        name: formData.name,
        projectType: formData.projectType,
        techStack: {
          frontend: formData.frontend.length > 0 ? formData.frontend : null,
          backend: formData.backend.length > 0 ? formData.backend : null,
          database: formData.database !== "None" ? formData.database : null,
          other: [],
        },
        description: formData.description,
      });

      // Apply template if one was selected
      if (selectedTemplate) {
        toast.info("Applying template", `Setting up ${selectedTemplate.name}...`);
        
        const result = await applyTemplate(
          projectId,
          selectedTemplate,
          (current, total, message) => {
            console.log(`[${current}/${total}] ${message}`);
          }
        );

        if (result.success) {
          toast.success("Template applied", `${result.filesCreated} files created`);
          
          // Install dependencies
          if (selectedTemplate.dependencies) {
            await installTemplateDependencies(projectId);
          }
        } else {
          toast.error("Template partially applied", `${result.errors.length} errors`);
        }
      }

      onProjectCreated();
      onClose();
      resetForm();
    } catch (err) {
      setError(err as string);
      toast.error("Project creation failed", err as string);
    } finally {
      setIsCreating(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      projectType: "FullStack",
      frontend: [],
      backend: [],
      database: "PostgreSQL",
      description: "",
    });
    setStep(1);
    setError("");
  };

  const toggleTech = (category: "frontend" | "backend", tech: string) => {
    setFormData(prev => ({
      ...prev,
      [category]: prev[category].includes(tech)
        ? prev[category].filter(t => t !== tech)
        : [...prev[category], tech],
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card rounded-lg shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h2 className="text-xl font-bold text-card-foreground">Create New Project</h2>
            <p className="text-sm text-muted-foreground">Step {step} of 4</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-secondary rounded-lg transition-colors"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="h-2 bg-secondary">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${(step / 4) * 100}%` }}
          />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-6">
              {/* Template Selection Button */}
              <div className="p-4 bg-gradient-to-r from-primary/10 to-purple-500/10 rounded-lg border border-primary/20">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">
                      ⚡ Quick Start with Template
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {selectedTemplate 
                        ? `Using: ${selectedTemplate.name}` 
                        : "Choose a pre-configured template to get started instantly"}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowTemplateSelector(true)}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
                  >
                    {selectedTemplate ? "Change Template" : "Choose Template"}
                  </button>
                </div>
                {selectedTemplate && (
                  <div className="mt-3 flex items-center space-x-2 text-sm">
                    <span className="text-2xl">{selectedTemplate.icon}</span>
                    <span className="text-muted-foreground">
                      {selectedTemplate.files.length} files • {selectedTemplate.description}
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Project Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="my-awesome-app"
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
                  autoFocus
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Use lowercase letters, numbers, and hyphens
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-3">
                  Project Type *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {projectTypes.map((type) => (
                    <button
                      key={type.value}
                      onClick={() =>
                        setFormData({ ...formData, projectType: type.value as ProjectType })
                      }
                      className={`p-4 border-2 rounded-lg text-left transition-all ${
                        formData.projectType === type.value
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <div className="text-2xl mb-1">{type.icon}</div>
                      <div className="font-medium text-sm">{type.label}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Frontend Tech */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-3">
                  Frontend Framework
                </label>
                <p className="text-sm text-muted-foreground mb-4">
                  Select the frontend technologies (optional)
                </p>
                <div className="grid grid-cols-3 gap-3">
                  {frontendOptions.map((tech) => (
                    <button
                      key={tech}
                      onClick={() => toggleTech("frontend", tech)}
                      className={`px-4 py-3 border-2 rounded-lg text-sm font-medium transition-all ${
                        formData.frontend.includes(tech)
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      {tech}
                    </button>
                  ))}
                </div>
                {formData.frontend.length > 0 && (
                  <div className="mt-4 p-3 bg-primary/5 rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      Selected: <span className="text-primary font-medium">
                        {formData.frontend.join(", ")}
                      </span>
                    </p>
                  </div>
                )}
              </div>

              <div className="p-4 bg-muted/30 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  💡 <strong>Tip:</strong> You can select multiple technologies if you're building 
                  a multi-framework project or want to explore options.
                </p>
              </div>
            </div>
          )}

          {/* Step 3: Backend Tech */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-3">
                  Backend Language/Framework
                </label>
                <p className="text-sm text-muted-foreground mb-4">
                  Select the backend technologies (optional)
                </p>
                <div className="grid grid-cols-3 gap-3">
                  {backendOptions.map((tech) => (
                    <button
                      key={tech}
                      onClick={() => toggleTech("backend", tech)}
                      className={`px-4 py-3 border-2 rounded-lg text-sm font-medium transition-all ${
                        formData.backend.includes(tech)
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      {tech}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-3">
                  Database
                </label>
                <select
                  value={formData.database}
                  onChange={(e) => setFormData({ ...formData, database: e.target.value })}
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary"
                >
                  {databaseOptions.map((db) => (
                    <option key={db} value={db}>
                      {db}
                    </option>
                  ))}
                </select>
              </div>

              {(formData.backend.length > 0 || formData.database !== "None") && (
                <div className="p-3 bg-primary/5 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    Selected backend: <span className="text-primary font-medium">
                      {formData.backend.join(", ") || "None"} 
                      {formData.database !== "None" && ` + ${formData.database}`}
                    </span>
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 4: Description */}
          {step === 4 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Describe Your Project *
                </label>
                <p className="text-sm text-muted-foreground mb-3">
                  Tell the AI agent what you want to build. Be as detailed as possible.
                </p>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Example: Create a task management application with user authentication, project boards, drag-and-drop tasks, real-time collaboration, and calendar integration. Users should be able to invite team members, assign tasks, set deadlines, and track progress with visual charts."
                  rows={8}
                  className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary resize-none"
                  autoFocus
                />
                <p className="text-xs text-muted-foreground mt-2">
                  {formData.description.length} characters
                </p>
              </div>

              {/* Summary */}
              <div className="p-4 bg-muted/30 rounded-lg space-y-2">
                <h4 className="font-semibold text-sm mb-2">Project Summary</h4>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p><strong>Name:</strong> {formData.name || "Not set"}</p>
                  <p><strong>Type:</strong> {projectTypes.find(t => t.value === formData.projectType)?.label}</p>
                  {formData.frontend.length > 0 && (
                    <p><strong>Frontend:</strong> {formData.frontend.join(", ")}</p>
                  )}
                  {formData.backend.length > 0 && (
                    <p><strong>Backend:</strong> {formData.backend.join(", ")}</p>
                  )}
                  {formData.database !== "None" && (
                    <p><strong>Database:</strong> {formData.database}</p>
                  )}
                </div>
              </div>

              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-sm text-blue-900 dark:text-blue-300">
                  🤖 <strong>Next step:</strong> The AI agent will analyze your requirements 
                  and create a complete project structure with all necessary files.
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border">
          <button
            onClick={step === 1 ? onClose : handleBack}
            disabled={isCreating}
            className="px-4 py-2 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50 flex items-center space-x-2"
          >
            {step === 1 ? (
              <>Cancel</>
            ) : (
              <>
                <ChevronLeftIcon className="w-4 h-4" />
                <span>Back</span>
              </>
            )}
          </button>

          {step < 4 ? (
            <button
              onClick={handleNext}
              className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center space-x-2"
            >
              <span>Next</span>
              <ChevronRightIcon className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleCreate}
              disabled={isCreating}
              className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCreating ? (
                <>
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Creating Project...
                </>
              ) : (
                "Create Project"
              )}
            </button>
          )}
        </div>
      </div>

      {/* Template Selector Modal */}
      <TemplateSelector
        isOpen={showTemplateSelector}
        onClose={() => setShowTemplateSelector(false)}
        onSelect={(template) => setSelectedTemplate(template)}
      />
    </div>
  );
}
