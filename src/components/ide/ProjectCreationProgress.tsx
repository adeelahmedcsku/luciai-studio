import { useEffect, useState } from 'react';
import { listen } from '@tauri-apps/api/event';

interface ProgressData {
    stage: 'initializing' | 'downloading' | 'extracting' | 'installing' | 'complete' | 'error';
    progress: number;
    message: string;
}

interface ProjectCreationProgressProps {
    onComplete?: () => void;
    onError?: (message: string) => void;
}

export function ProjectCreationProgress({ onComplete, onError }: ProjectCreationProgressProps) {
    const [progress, setProgress] = useState<ProgressData>({
        stage: 'initializing',
        progress: 0,
        message: 'Starting...'
    });

    useEffect(() => {
        let unlisten: (() => void) | null = null;

        const setupListener = async () => {
            unlisten = await listen<ProgressData>('template-progress', (event) => {
                const data = event.payload;
                setProgress(data);

                if (data.stage === 'complete' && onComplete) {
                    setTimeout(onComplete, 500);
                } else if (data.stage === 'error' && onError) {
                    onError(data.message);
                }
            });
        };

        setupListener();

        return () => {
            if (unlisten) {
                unlisten();
            }
        };
    }, [onComplete, onError]);

    const getStageIcon = () => {
        switch (progress.stage) {
            case 'initializing':
                return '🔧';
            case 'downloading':
                return '⬇️';
            case 'extracting':
                return '📦';
            case 'installing':
                return '⚙️';
            case 'complete':
                return '✅';
            case 'error':
                return '❌';
            default:
                return '⏳';
        }
    };

    const getProgressColor = () => {
        if (progress.stage === 'error') return 'bg-red-600';
        if (progress.stage === 'complete') return 'bg-green-600';
        return 'bg-blue-600';
    };

    return (
        <div className="space-y-3 p-4 bg-gray-800 rounded-lg border border-gray-700">
            <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                    <span className="text-2xl">{getStageIcon()}</span>
                    <span className="text-gray-200">{progress.message}</span>
                </div>
                <span className="text-gray-400 font-mono">
                    {Math.round(progress.progress * 100)}%
                </span>
            </div>

            <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                <div
                    className={`h-2 rounded-full transition-all duration-300 ${getProgressColor()}`}
                    style={{ width: `${progress.progress * 100}%` }}
                />
            </div>

            {progress.stage === 'error' && (
                <div className="mt-2 p-2 bg-red-900/30 border border-red-700 rounded text-red-200 text-sm">
                    <strong>Error:</strong> {progress.message}
                </div>
            )}
        </div>
    );
}
