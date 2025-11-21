import React, { useState } from 'react';
import { Sparkles, Loader2, CheckCircle, XCircle, FileCode, Download } from 'lucide-react';
import {
  useProjectGeneration,
  getStageName,
  getStageEmoji,
  countLinesOfCode,
  getFileStatistics,
} from '../../hooks/useProjectGeneration';
import { useProjectManagement } from '../../hooks/useProjectManagement';

interface ProjectGeneratorProps {
  onComplete?: (projectId: string) => void;
}

export default function ProjectGenerator({ onComplete }: ProjectGeneratorProps) {
  const [description, setDescription] = useState('');
  const [projectName, setProjectName] = useState('');
  const [techStack, setTechStack] = useState<string[]>([]);
  const [techInput, setTechInput] = useState('');

  const { isGenerating, progress, generatedFiles, error, generateProject } =
    useProjectGeneration();
  const { createProject, saveMultipleFiles } = useProjectManagement();

  const handleAddTech = () => {
    if (techInput.trim() && !techStack.includes(techInput.trim())) {
      setTechStack([...techStack, techInput.trim()]);
      setTechInput('');
    }
  };

  const handleRemoveTech = (tech: string) => {
    setTechStack(techStack.filter((t) => t !== tech));
  };

  const handleGenerate = async () => {
    if (!description.trim() || !projectName.trim()) {
      alert('Please provide a project name and description');
      return;
    }

    try {
      const files = await generateProject({
        description: description.trim(),
        projectType: 'WebApp',
        techStack: techStack.length > 0 ? techStack : ['React', 'TypeScript'],
      });

      // Create the project
      const project = await createProject(
        projectName,
        'WebApp',
        {
          frontend: techStack.filter((t) =>
            ['React', 'Vue', 'Angular', 'Svelte'].includes(t)
          ),
          backend: techStack.filter((t) =>
            ['Node.js', 'Express', 'NestJS', 'FastAPI', 'Django'].includes(t)
          ),
          database: techStack.find((t) =>
            ['PostgreSQL', 'MongoDB', 'MySQL', 'SQLite'].includes(t)
          ),
          other: techStack,
        },
        description
      );

      // Save all generated files
      const filesToSave: [string, string][] = files.map((f) => [f.path, f.content]);
      await saveMultipleFiles(project.id, filesToSave);

      if (onComplete) {
        onComplete(project.id);
      }
    } catch (err) {
      console.error('Generation failed:', err);
    }
  };

  const fileStats = generatedFiles.length > 0 ? getFileStatistics(generatedFiles) : {};
  const totalLines = generatedFiles.length > 0 ? countLinesOfCode(generatedFiles) : 0;

  return (
    <div className="flex flex-col h-full bg-gray-900 text-white">
      {/* Header */}
      <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-700 bg-gray-800">
        <Sparkles className="w-6 h-6 text-purple-400" />
        <h2 className="text-xl font-semibold">AI Project Generator</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {!isGenerating && generatedFiles.length === 0 && (
          <div className="max-w-3xl mx-auto space-y-6">
            {/* Project Name */}
            <div>
              <label className="block text-sm font-medium mb-2">Project Name</label>
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="my-awesome-app"
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Describe Your Project
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="I want to build a task management app with user authentication, real-time updates, and a modern UI..."
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                rows={6}
              />
            </div>

            {/* Tech Stack */}
            <div>
              <label className="block text-sm font-medium mb-2">Tech Stack</label>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={techInput}
                  onChange={(e) => setTechInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTech();
                    }
                  }}
                  placeholder="e.g., React, Node.js, PostgreSQL"
                  className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <button
                  onClick={handleAddTech}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
                >
                  Add
                </button>
              </div>

              {techStack.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {techStack.map((tech) => (
                    <span
                      key={tech}
                      className="px-3 py-1 bg-purple-600/20 border border-purple-500/30 rounded-full text-sm flex items-center gap-2"
                    >
                      {tech}
                      <button
                        onClick={() => handleRemoveTech(tech)}
                        className="hover:text-red-400"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={!description.trim() || !projectName.trim()}
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-700 disabled:to-gray-700 disabled:cursor-not-allowed rounded-lg font-medium flex items-center justify-center gap-2 transition-all"
            >
              <Sparkles className="w-5 h-5" />
              Generate Project
            </button>

            {/* Examples */}
            <div className="mt-8 p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
              <p className="text-sm font-medium mb-2">💡 Example Prompts:</p>
              <ul className="text-sm text-gray-400 space-y-1">
                <li>• A todo app with user auth and real-time sync</li>
                <li>• E-commerce store with Stripe payment integration</li>
                <li>• Blog platform with markdown support and comments</li>
                <li>• REST API for a social media app with posts and likes</li>
              </ul>
            </div>
          </div>
        )}

        {/* Generation Progress */}
        {isGenerating && progress && (
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="text-center">
              <div className="text-6xl mb-4">{getStageEmoji(progress.stage)}</div>
              <h3 className="text-2xl font-semibold mb-2">
                {getStageName(progress.stage)}
              </h3>
              <p className="text-gray-400">{progress.message}</p>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-600 to-blue-600 transition-all duration-500"
                style={{ width: `${progress.progress * 100}%` }}
              />
            </div>

            <div className="text-center text-sm text-gray-400">
              {Math.round(progress.progress * 100)}% Complete
            </div>

            <div className="flex items-center justify-center gap-2 text-gray-400">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>This may take a minute...</span>
            </div>
          </div>
        )}

        {/* Results */}
        {!isGenerating && generatedFiles.length > 0 && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-3 p-4 bg-green-900/20 border border-green-500/30 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-400" />
              <div>
                <p className="font-medium text-green-400">
                  Project Generated Successfully!
                </p>
                <p className="text-sm text-gray-400">
                  {generatedFiles.length} files • {totalLines.toLocaleString()} lines of
                  code
                </p>
              </div>
            </div>

            {/* File Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(fileStats).map(([ext, count]) => (
                <div
                  key={ext}
                  className="p-4 bg-gray-800 border border-gray-700 rounded-lg"
                >
                  <div className="text-2xl font-bold text-purple-400">{count}</div>
                  <div className="text-sm text-gray-400">.{ext} files</div>
                </div>
              ))}
            </div>

            {/* File List */}
            <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-700 font-medium">
                Generated Files
              </div>
              <div className="max-h-96 overflow-y-auto">
                {generatedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="px-4 py-2 border-b border-gray-700 last:border-b-0 hover:bg-gray-700/50 flex items-center gap-3"
                  >
                    <FileCode className="w-4 h-4 text-gray-400" />
                    <span className="flex-1 font-mono text-sm">{file.path}</span>
                    <span className="text-xs text-gray-500">
                      {file.content.split('\n').length} lines
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4">
              <button
                onClick={() => window.location.reload()}
                className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
              >
                Generate Another Project
              </button>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-3 p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
              <XCircle className="w-6 h-6 text-red-400" />
              <div>
                <p className="font-medium text-red-400">Generation Failed</p>
                <p className="text-sm text-gray-400">{error}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
