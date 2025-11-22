import { invoke } from '@tauri-apps/api/core';
import { useState, useCallback, useEffect } from 'react';

export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  tech_stack: string[];
  features: string[];
  difficulty: string;
  estimated_files: number;
  thumbnail?: string;
  prompt: string;
}

export function useTemplates() {
  const [templates, setTemplates] = useState<ProjectTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTemplates = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const templateList = await invoke<ProjectTemplate[]>('list_project_templates');
      setTemplates(templateList);
    } catch (err) {
      setError(`Failed to load templates: ${err}`);
      console.error('Failed to load templates:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getTemplate = useCallback(async (templateId: string) => {
    try {
      const template = await invoke<ProjectTemplate>('get_project_template', {
        templateId,
      });
      return template;
    } catch (err) {
      console.error('Failed to get template:', err);
      throw err;
    }
  }, []);

  const searchTemplates = useCallback(async (query: string) => {
    try {
      const results = await invoke<ProjectTemplate[]>('search_templates', {
        query,
      });
      setTemplates(results);
    } catch (err) {
      console.error('Failed to search templates:', err);
      throw err;
    }
  }, []);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  return {
    templates,
    isLoading,
    error,
    loadTemplates,
    getTemplate,
    searchTemplates,
  };
}

// Helper to group templates by category
export function groupByCategory(templates: ProjectTemplate[]): Record<string, ProjectTemplate[]> {
  return templates.reduce((acc, template) => {
    const category = template.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(template);
    return acc;
  }, {} as Record<string, ProjectTemplate[]>);
}

// Helper to get difficulty color
export function getDifficultyColor(difficulty: string): string {
  switch (difficulty) {
    case 'Beginner':
      return 'text-green-400 bg-green-400/10';
    case 'Intermediate':
      return 'text-yellow-400 bg-yellow-400/10';
    case 'Advanced':
      return 'text-red-400 bg-red-400/10';
    default:
      return 'text-gray-400 bg-gray-400/10';
  }
}

// Helper to get category icon
export function getCategoryIcon(category: string): string {
  const icons: Record<string, string> = {
    Web: '🌐',
    Mobile: '📱',
    Desktop: '💻',
    CLI: '⌨️',
    API: '🔌',
    FullStack: '🚀',
    DataScience: '📊',
    GameDev: '🎮',
    Blockchain: '⛓️',
  };
  return icons[category] || '📦';
}
