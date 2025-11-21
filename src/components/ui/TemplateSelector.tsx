import { useState } from "react";
import { XIcon, CheckIcon, CodeIcon, ServerIcon, LayersIcon } from "lucide-react";
import { PROJECT_TEMPLATES, ProjectTemplate } from "../../utils/ProjectTemplates";

interface TemplateSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (template: ProjectTemplate) => void;
}

export default function TemplateSelector({
  isOpen,
  onClose,
  onSelect,
}: TemplateSelectorProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<ProjectTemplate | null>(null);

  if (!isOpen) return null;

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "frontend":
        return <CodeIcon className="w-5 h-5" />;
      case "backend":
        return <ServerIcon className="w-5 h-5" />;
      case "fullstack":
        return <LayersIcon className="w-5 h-5" />;
      default:
        return <CodeIcon className="w-5 h-5" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "frontend":
        return "text-blue-500 bg-blue-50 dark:bg-blue-900/20";
      case "backend":
        return "text-green-500 bg-green-50 dark:bg-green-900/20";
      case "fullstack":
        return "text-purple-500 bg-purple-50 dark:bg-purple-900/20";
      default:
        return "text-gray-500 bg-gray-50 dark:bg-gray-900/20";
    }
  };

  const handleSelect = () => {
    if (selectedTemplate) {
      onSelect(selectedTemplate);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card rounded-lg shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h2 className="text-xl font-bold text-card-foreground">
              Choose a Template
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Start with a pre-configured project structure
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-secondary rounded-lg transition-colors"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {PROJECT_TEMPLATES.map((template) => (
              <div
                key={template.id}
                onClick={() => setSelectedTemplate(template)}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  selectedTemplate?.id === template.id
                    ? "border-primary bg-primary/5 shadow-md"
                    : "border-border hover:border-primary/50 hover:shadow"
                }`}
              >
                {/* Template Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="text-3xl">{template.icon}</div>
                    <div>
                      <h3 className="font-semibold text-foreground">
                        {template.name}
                      </h3>
                      <div
                        className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded text-xs mt-1 ${getTypeColor(
                          template.type
                        )}`}
                      >
                        {getTypeIcon(template.type)}
                        <span className="capitalize">{template.type}</span>
                      </div>
                    </div>
                  </div>
                  {selectedTemplate?.id === template.id && (
                    <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                      <CheckIcon className="w-4 h-4 text-primary-foreground" />
                    </div>
                  )}
                </div>

                {/* Description */}
                <p className="text-sm text-muted-foreground mb-3">
                  {template.description}
                </p>

                {/* Stats */}
                <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                  <span>{template.files.length} files</span>
                  {template.dependencies && (
                    <>
                      <span>•</span>
                      <span>
                        {(template.dependencies.npm?.length || 0) +
                          (template.dependencies.dev?.length || 0)}{" "}
                        packages
                      </span>
                    </>
                  )}
                </div>

                {/* Tech Stack Preview */}
                {template.dependencies && (
                  <div className="mt-3 pt-3 border-t border-border">
                    <p className="text-xs font-medium text-muted-foreground mb-2">
                      Includes:
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {template.dependencies.npm
                        ?.slice(0, 4)
                        .map((dep) => (
                          <span
                            key={dep}
                            className="px-2 py-0.5 bg-secondary text-xs rounded"
                          >
                            {dep}
                          </span>
                        ))}
                      {template.dependencies.npm &&
                        template.dependencies.npm.length > 4 && (
                          <span className="px-2 py-0.5 bg-secondary text-xs rounded">
                            +{template.dependencies.npm.length - 4} more
                          </span>
                        )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* No Template Option */}
          <div
            onClick={() => setSelectedTemplate(null)}
            className={`mt-4 p-4 border-2 rounded-lg cursor-pointer transition-all ${
              selectedTemplate === null
                ? "border-primary bg-primary/5 shadow-md"
                : "border-border hover:border-primary/50 hover:shadow"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center">
                  <CodeIcon className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">
                    Empty Project
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Start from scratch with no template
                  </p>
                </div>
              </div>
              {selectedTemplate === null && (
                <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                  <CheckIcon className="w-4 h-4 text-primary-foreground" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border">
          <div className="text-sm text-muted-foreground">
            {selectedTemplate ? (
              <>
                Selected: <span className="font-medium">{selectedTemplate.name}</span>
              </>
            ) : (
              "No template selected"
            )}
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSelect}
              disabled={!selectedTemplate}
              className={`px-6 py-2 rounded-lg transition-colors ${
                selectedTemplate
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "bg-secondary text-muted-foreground cursor-not-allowed"
              }`}
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
