import { invoke } from '@tauri-apps/api/core';
import { listen, UnlistenFn } from '@tauri-apps/api/event';
import { useState, useCallback, useEffect, useRef } from 'react';

export interface LLMModel {
  name: string;
  size: string;
  installed: boolean;
  description: string;
}

export interface LLMStatus {
  ollama_running: boolean;
  ollama_version: string | null;
  available_models: LLMModel[];
}

export interface GenerationRequest {
  model: string;
  prompt: string;
  system_prompt?: string;
  temperature: number;
  max_tokens: number;
}

export interface GenerationResponse {
  text: string;
  model: string;
  tokens_used: number;
}

export interface StreamCallbacks {
  onStart?: () => void;
  onChunk: (chunk: string) => void;
  onDone: (fullText: string) => void;
  onError: (error: string) => void;
}

export function useLLM() {
  const [status, setStatus] = useState<LLMStatus | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const activeListenersRef = useRef<UnlistenFn[]>([]);

  // Check LLM status on mount
  useEffect(() => {
    checkStatus();
    
    // Cleanup listeners on unmount
    return () => {
      activeListenersRef.current.forEach(unlisten => unlisten());
      activeListenersRef.current = [];
    };
  }, []);

  const checkStatus = useCallback(async () => {
    setIsChecking(true);
    try {
      const llmStatus = await invoke<LLMStatus>('check_llm_status');
      setStatus(llmStatus);
      return llmStatus;
    } catch (error) {
      console.error('Failed to check LLM status:', error);
      setStatus({
        ollama_running: false,
        ollama_version: null,
        available_models: [],
      });
      throw error;
    } finally {
      setIsChecking(false);
    }
  }, []);

  const listModels = useCallback(async () => {
    try {
      const models = await invoke<LLMModel[]>('list_available_models');
      return models;
    } catch (error) {
      console.error('Failed to list models:', error);
      throw error;
    }
  }, []);

  const generate = useCallback(async (request: GenerationRequest): Promise<string> => {
    setIsGenerating(true);
    try {
      const response = await invoke<GenerationResponse>('generate_code', { request });
      return response.text;
    } catch (error) {
      console.error('Code generation failed:', error);
      throw error;
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const generateStream = useCallback(
    async (request: GenerationRequest, callbacks: StreamCallbacks) => {
      const requestId = `req-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      setIsGenerating(true);

      // Setup event listeners
      const unlistenStart = await listen<string>('llm-stream-start', (event) => {
        if (event.payload === requestId) {
          callbacks.onStart?.();
        }
      });

      const unlistenChunk = await listen<[string, string]>('llm-stream-chunk', (event) => {
        const [id, chunk] = event.payload;
        if (id === requestId) {
          callbacks.onChunk(chunk);
        }
      });

      const unlistenDone = await listen<[string, string]>('llm-stream-done', (event) => {
        const [id, fullText] = event.payload;
        if (id === requestId) {
          callbacks.onDone(fullText);
          setIsGenerating(false);
          cleanup();
        }
      });

      const unlistenError = await listen<[string, string]>('llm-stream-error', (event) => {
        const [id, error] = event.payload;
        if (id === requestId) {
          callbacks.onError(error);
          setIsGenerating(false);
          cleanup();
        }
      });

      // Store listeners for cleanup
      const listeners = [unlistenStart, unlistenChunk, unlistenDone, unlistenError];
      activeListenersRef.current.push(...listeners);

      const cleanup = () => {
        listeners.forEach(unlisten => unlisten());
        activeListenersRef.current = activeListenersRef.current.filter(
          l => !listeners.includes(l)
        );
      };

      try {
        await invoke('generate_code_stream', {
          window: undefined, // Tauri will inject the window
          request,
          requestId,
        });
      } catch (error) {
        callbacks.onError(`Streaming failed: ${error}`);
        setIsGenerating(false);
        cleanup();
      }

      // Return cleanup function
      return cleanup;
    },
    []
  );

  const pullModel = useCallback(async (
    modelName: string,
    onProgress?: (status: string, percent: number) => void
  ) => {
    const unlistenProgress = await listen<[string, string, number]>(
      'model-pull-progress',
      (event) => {
        const [name, status, percent] = event.payload;
        if (name === modelName) {
          onProgress?.(status, percent);
        }
      }
    );

    const unlistenComplete = await listen<string>('model-pull-complete', (event) => {
      if (event.payload === modelName) {
        unlistenProgress();
        unlistenComplete();
      }
    });

    try {
      await invoke('pull_model', {
        window: undefined,
        modelName,
      });
    } catch (error) {
      unlistenProgress();
      unlistenComplete();
      throw error;
    }
  }, []);

  return {
    status,
    isChecking,
    isGenerating,
    isConnected: status?.ollama_running ?? false,
    availableModels: status?.available_models ?? [],
    checkStatus,
    listModels,
    generate,
    generateStream,
    pullModel,
  };
}

// Helper hook for simplified streaming
export function useStreamingGeneration() {
  const { generateStream, isGenerating } = useLLM();
  const [response, setResponse] = useState('');
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(
    async (request: GenerationRequest) => {
      setResponse('');
      setError(null);

      return generateStream(request, {
        onStart: () => {
          setResponse('');
        },
        onChunk: (chunk) => {
          setResponse((prev) => prev + chunk);
        },
        onDone: (fullText) => {
          setResponse(fullText);
        },
        onError: (err) => {
          setError(err);
        },
      });
    },
    [generateStream]
  );

  const reset = useCallback(() => {
    setResponse('');
    setError(null);
  }, []);

  return {
    response,
    error,
    isGenerating,
    generate,
    reset,
  };
}
