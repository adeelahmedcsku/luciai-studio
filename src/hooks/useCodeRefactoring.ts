import { invoke } from '@tauri-apps/api/core';
import { useState, useCallback } from 'react';

export interface RefactoringResult {
  original_code: string;
  refactored_code: string;
  changes: RefactoringChange[];
  improvement_summary: string;
  impact: RefactoringImpact;
}

export interface RefactoringChange {
  change_type: string;
  description: string;
  line_range?: [number, number];
  benefit: string;
}

export interface RefactoringImpact {
  readability: number;
  performance: number;
  maintainability: number;
  testability: number;
}

export type RefactorFocus = 
  | 'readability'
  | 'performance'
  | 'maintainability'
  | 'testability'
  | 'security'
  | 'all';

export function useCodeRefactoring() {
  const [isRefactoring, setIsRefactoring] = useState(false);
  const [result, setResult] = useState<RefactoringResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refactor = useCallback(
    async (code: string, language: string, focus: RefactorFocus = 'all') => {
      setIsRefactoring(true);
      setError(null);
      setResult(null);

      try {
        const refactoringResult = await invoke<RefactoringResult>('refactor_code', {
          code,
          language,
          focus,
        });
        setResult(refactoringResult);
        return refactoringResult;
      } catch (err) {
        const errorMsg = `Refactoring failed: ${err}`;
        setError(errorMsg);
        throw err;
      } finally {
        setIsRefactoring(false);
      }
    },
    []
  );

  const explain = useCallback(async (code: string, language: string) => {
    setIsRefactoring(true);
    setError(null);

    try {
      const explanation = await invoke<string>('explain_code', {
        code,
        language,
      });
      return explanation;
    } catch (err) {
      const errorMsg = `Explanation failed: ${err}`;
      setError(errorMsg);
      throw err;
    } finally {
      setIsRefactoring(false);
    }
  }, []);

  const convertLanguage = useCallback(
    async (code: string, fromLanguage: string, toLanguage: string) => {
      setIsRefactoring(true);
      setError(null);

      try {
        const converted = await invoke<string>('convert_code_language', {
          code,
          fromLanguage,
          toLanguage,
        });
        return converted;
      } catch (err) {
        const errorMsg = `Conversion failed: ${err}`;
        setError(errorMsg);
        throw err;
      } finally {
        setIsRefactoring(false);
      }
    },
    []
  );

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return {
    isRefactoring,
    result,
    error,
    refactor,
    explain,
    convertLanguage,
    reset,
  };
}

// Helper to get change type icon
export function getChangeTypeIcon(changeType: string): string {
  const icons: Record<string, string> = {
    ExtractFunction: '🔄',
    RenameVariable: '✏️',
    SimplifyLogic: '🧹',
    RemoveDuplication: '🔗',
    ImprovePerformance: '⚡',
    EnhanceReadability: '📖',
    AddErrorHandling: '🛡️',
    TypeSafety: '🔒',
  };
  return icons[changeType] || '✨';
}

// Helper to get impact color
export function getImpactColor(value: number): string {
  if (value > 20) return 'text-green-400';
  if (value > 0) return 'text-green-300';
  if (value === 0) return 'text-gray-400';
  if (value > -20) return 'text-yellow-400';
  return 'text-red-400';
}

// Helper to format impact value
export function formatImpact(value: number): string {
  if (value > 0) return `+${value}`;
  return value.toString();
}

// Helper to calculate overall improvement score
export function calculateOverallScore(impact: RefactoringImpact): number {
  return Math.round(
    (impact.readability +
      impact.performance +
      impact.maintainability +
      impact.testability) /
      4
  );
}
