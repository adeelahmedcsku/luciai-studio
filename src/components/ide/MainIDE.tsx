import { useState } from "react";
import ProjectDashboard from "./ProjectDashboard";
import IDEWorkspace from "./IDEWorkspace";

export default function MainIDE() {
  const [currentView, setCurrentView] = useState<"dashboard" | "workspace">("dashboard");
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);

  const handleOpenProject = (projectId: string) => {
    setCurrentProjectId(projectId);
    setCurrentView("workspace");
  };

  const handleBackToDashboard = () => {
    setCurrentView("dashboard");
    setCurrentProjectId(null);
  };

  if (currentView === "dashboard") {
    return <ProjectDashboard onOpenProject={handleOpenProject} />;
  }

  return (
    <IDEWorkspace
      projectId={currentProjectId!}
      onBack={handleBackToDashboard}
      onSwitchProject={handleOpenProject}
    />
  );
}
