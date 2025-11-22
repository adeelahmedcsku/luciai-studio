import React from 'react';
import { Sparkles, Code, Zap, Book } from 'lucide-react';

interface LicenseInfo {
  status: 'active' | 'expired' | 'invalid';
  expiryDate: string;
}

interface WelcomeScreenProps {
  licenseStatus?: LicenseInfo;
  onNewProject?: () => void;
  onOpenProject?: () => void;
}

export default function WelcomeScreen({
  licenseStatus,
  onNewProject,
  onOpenProject,
}: WelcomeScreenProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
      {/* Header */}
      <div className="absolute top-0 right-0 p-4">
        {licenseStatus && (
          <div
            className={`px-3 py-1 rounded-full text-sm ${
              licenseStatus.status === 'active'
                ? 'bg-green-900 text-green-200'
                : 'bg-red-900 text-red-200'
            }`}
          >
            License: {licenseStatus.status}
          </div>
        )}
      </div>

      <div className="flex items-center justify-center min-h-screen">
        <div className="max-w-4xl mx-auto px-6">
          {/* Logo/Title */}
          <div className="text-center mb-12">
            <div className="inline-block p-3 bg-blue-600 rounded-lg mb-4">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-5xl font-bold mb-4">Lucia AI Studio</h1>
            <p className="text-xl text-gray-400">
              Advanced AI-powered development environment
            </p>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="bg-gray-800 rounded-lg p-6 hover:bg-gray-750 transition">
              <Code className="w-12 h-12 text-blue-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Smart Coding</h3>
              <p className="text-gray-400">
                AI-powered code completion and generation
              </p>
            </div>

            <div className="bg-gray-800 rounded-lg p-6 hover:bg-gray-750 transition">
              <Zap className="w-12 h-12 text-yellow-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Fast Performance</h3>
              <p className="text-gray-400">
                Lightning-fast analysis and processing
              </p>
            </div>

            <div className="bg-gray-800 rounded-lg p-6 hover:bg-gray-750 transition">
              <Book className="w-12 h-12 text-green-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Full Documentation</h3>
              <p className="text-gray-400">
                Comprehensive guides and tutorials
              </p>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={onNewProject}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-lg transition flex items-center justify-center gap-2"
            >
              <Sparkles className="w-5 h-5" />
              New Project
            </button>
            <button
              onClick={onOpenProject}
              className="bg-gray-700 hover:bg-gray-600 text-white font-semibold px-8 py-3 rounded-lg transition"
            >
              Open Project
            </button>
          </div>

          {/* Footer */}
          <div className="text-center mt-12 text-gray-500 text-sm">
            <p>© 2024 Lucia AI Studio. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  );
}