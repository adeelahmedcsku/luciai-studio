import { invoke } from '@tauri-apps/api/core';
import { listen, UnlistenFn } from '@tauri-apps/api/event';
import { useState, useCallback, useRef } from 'react';

export interface GeneratedFile {
  path: string;
  content: string;
  language: string;
}

export interface GenerationProgress {
  stage: PipelineStage;
  progress: number;
  message: string;
}

export type PipelineStage =
  | 'Understanding'
  | 'Planning'
  | 'GeneratingStructure'
  | 'GeneratingCode'
  | 'GeneratingTests'
  | 'GeneratingDocs'
  | 'Validating'
  | 'Complete';

export interface ProjectGenerationRequest {
  description: string;
  projectType: string;
  techStack: string[];
}

export function useProjectGeneration() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState<GenerationProgress | null>(null);
  const [generatedFiles, setGeneratedFiles] = useState<GeneratedFile[]>([]);
  const [error, setError] = useState<string | null>(null);
  const unlistenRef = useRef<UnlistenFn | null>(null);

  const generateProject = useCallback(
    async (request: ProjectGenerationRequest) => {
      setIsGenerating(true);
      setError(null);
      setGeneratedFiles([]);
      setProgress({
        stage: 'Understanding',
        progress: 0,
        message: 'Starting project generation...',
      });

      // Listen for progress updates
      const unlisten = await listen<GenerationProgress>(
        'project-generation-progress',
        (event) => {
          setProgress(event.payload);
        }
      );
      unlistenRef.current = unlisten;

      try {
        const files = await invoke<GeneratedFile[]>('generate_full_project', {
          window: undefined, // Tauri will inject the window
          description: request.description,
          projectType: request.projectType,
          techStack: request.techStack,
        });

        setGeneratedFiles(files);
        setProgress({
          stage: 'Complete',
          progress: 1.0,
          message: `Generated ${files.length} files successfully!`,
        });

        return files;
      } catch (err) {
        const errorMsg = `Project generation failed: ${err}`;
        setError(errorMsg);
        console.error(errorMsg);
        throw err;
      } finally {
        setIsGenerating(false);
        if (unlistenRef.current) {
          unlistenRef.current();
          unlistenRef.current = null;
        }
      }
    },
    []
  );

  const reset = useCallback(() => {
    setIsGenerating(false);
    setProgress(null);
    setGeneratedFiles([]);
    setError(null);
    if (unlistenRef.current) {
      unlistenRef.current();
      unlistenRef.current = null;
    }
  }, []);

  return {
    isGenerating,
    progress,
    generatedFiles,
    error,
    generateProject,
    reset,
  };
}

// Helper function to get stage display name
export function getStageName(stage: PipelineStage): string {
  const stageNames: Record<PipelineStage, string> = {
    Understanding: 'Understanding Requirements',
    Planning: 'Creating Project Plan',
    GeneratingStructure: 'Setting Up Structure',
    GeneratingCode: 'Generating Code',
    GeneratingTests: 'Creating Tests',
    GeneratingDocs: 'Writing Documentation',
    Validating: 'Validating Project',
    Complete: 'Complete',
  };

  return stageNames[stage] || stage;
}

// Helper function to get stage emoji
export function getStageEmoji(stage: PipelineStage): string {
  const stageEmojis: Record<PipelineStage, string> = {
    Understanding: '🤔',
    Planning: '📋',
    GeneratingStructure: '🏗️',
    GeneratingCode: '💻',
    GeneratingTests: '🧪',
    GeneratingDocs: '📝',
    Validating: '✅',
    Complete: '🎉',
  };

  return stageEmojis[stage] || '⚙️';
}

// Helper to organize files by directory
export function organizeFilesByDirectory(
  files: GeneratedFile[]
): Record<string, GeneratedFile[]> {
  const organized: Record<string, GeneratedFile[]> = {};

  for (const file of files) {
    const parts = file.path.split('/');
    const dir = parts.length > 1 ? parts.slice(0, -1).join('/') : 'root';

    if (!organized[dir]) {
      organized[dir] = [];
    }

    organized[dir].push(file);
  }

  return organized;
}

// Helper to count lines of code
export function countLinesOfCode(files: GeneratedFile[]): number {
  return files.reduce((total, file) => {
    return total + file.content.split('\n').length;
  }, 0);
}

// Helper to get file extension statistics
export function getFileStatistics(files: GeneratedFile[]): Record<string, number> {
  const stats: Record<string, number> = {};

  for (const file of files) {
    const ext = file.path.split('.').pop() || 'unknown';
    stats[ext] = (stats[ext] || 0) + 1;
  }

  return stats;
}
