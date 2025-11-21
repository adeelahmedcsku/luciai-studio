/**
 * Luciai Studio Branding Component
 * 
 * Main branding and header component with logo integration
 * 
 * @version 2.0.0
 */

import React from 'react';

interface LuciaiHeaderProps {
  showLogo?: boolean;
  showVersion?: boolean;
  className?: string;
}

/**
 * Luciai Studio Header Component
 */
export const LuciaiHeader: React.FC<LuciaiHeaderProps> = ({
  showLogo = true,
  showVersion = true,
  className = ''
}) => {
  return (
    <div className={`luciai-header flex items-center gap-4 ${className}`}>
      {showLogo && (
        <div className="luciai-logo flex items-center gap-3">
          <img 
            src="/luciai-logo.jpg" 
            alt="Luciai Studio" 
            className="w-12 h-12 rounded-lg object-cover shadow-lg"
          />
          <div className="flex flex-col">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              Luciai Studio
            </h1>
            {showVersion && (
              <span className="text-xs text-gray-400">
                v2.0.0 Collaboration Edition
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Luciai Studio Logo (standalone)
 */
export const LuciaiLogo: React.FC<{ size?: 'sm' | 'md' | 'lg'; className?: string }> = ({ 
  size = 'md',
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };

  return (
    <img 
      src="/luciai-logo.jpg" 
      alt="Luciai Studio" 
      className={`${sizeClasses[size]} rounded-lg object-cover shadow-lg ${className}`}
    />
  );
};

/**
 * Luciai Studio Welcome Screen
 */
export const LuciaiWelcome: React.FC = () => {
  return (
    <div className="luciai-welcome flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 text-white p-8">
      <div className="text-center max-w-4xl">
        <LuciaiLogo size="lg" className="mx-auto mb-6" />
        
        <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent">
          Luciai Studio
        </h1>
        
        <p className="text-2xl text-gray-300 mb-2">
          Cloud-Powered AI-Enabled IDE
        </p>
        
        <p className="text-lg text-gray-400 mb-8">
          Version 2.0.0 - Collaboration Edition
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white/5 backdrop-blur-sm rounded-lg p-6 border border-white/10">
            <div className="text-4xl mb-3">⚡</div>
            <h3 className="text-xl font-semibold mb-2">132 Features</h3>
            <p className="text-gray-400">Complete development toolkit</p>
          </div>

          <div className="bg-white/5 backdrop-blur-sm rounded-lg p-6 border border-white/10">
            <div className="text-4xl mb-3">🤖</div>
            <h3 className="text-xl font-semibold mb-2">AI-Powered</h3>
            <p className="text-gray-400">Intelligent code assistance</p>
          </div>

          <div className="bg-white/5 backdrop-blur-sm rounded-lg p-6 border border-white/10">
            <div className="text-4xl mb-3">👥</div>
            <h3 className="text-xl font-semibold mb-2">Real-time Collaboration</h3>
            <p className="text-gray-400">Live Share & team features</p>
          </div>
        </div>

        <div className="flex flex-col items-center gap-4">
          <h2 className="text-2xl font-semibold mb-2">New in v2.0</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-3xl">
            <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-lg p-4 border border-blue-400/30">
              <h4 className="font-semibold mb-2">📚 Code Snippet Library</h4>
              <p className="text-sm text-gray-300">
                Personal & team snippets with search
              </p>
            </div>

            <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg p-4 border border-purple-400/30">
              <h4 className="font-semibold mb-2">🎨 Project Templates</h4>
              <p className="text-sm text-gray-300">
                Custom templates & marketplace
              </p>
            </div>

            <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-lg p-4 border border-green-400/30">
              <h4 className="font-semibold mb-2">🔗 Live Collaboration</h4>
              <p className="text-sm text-gray-300">
                Real-time editing & code review
              </p>
            </div>
          </div>
        </div>

        <div className="mt-12 text-sm text-gray-500">
          <p>Professional IDE · Free & Open Source · $6,629+/year Value</p>
        </div>
      </div>
    </div>
  );
};

/**
 * Luciai Studio Footer
 */
export const LuciaiFooter: React.FC = () => {
  return (
    <footer className="luciai-footer border-t border-gray-700 bg-gray-900 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <LuciaiLogo size="sm" />
          <div className="text-sm">
            <p className="text-gray-300 font-medium">Luciai Studio</p>
            <p className="text-gray-500 text-xs">v2.0.0 Collaboration Edition</p>
          </div>
        </div>
        
        <div className="flex gap-6 text-sm text-gray-400">
          <span>132 Features</span>
          <span>•</span>
          <span>AI-Powered</span>
          <span>•</span>
          <span>Cloud-Native</span>
        </div>
      </div>
    </footer>
  );
};

/**
 * Status Badge
 */
export const StatusBadge: React.FC<{ 
  status: 'online' | 'offline' | 'away' | 'busy';
  label?: string;
}> = ({ status, label }) => {
  const colors = {
    online: 'bg-green-500',
    offline: 'bg-gray-500',
    away: 'bg-yellow-500',
    busy: 'bg-red-500'
  };

  return (
    <div className="flex items-center gap-2">
      <div className={`w-2 h-2 rounded-full ${colors[status]} animate-pulse`} />
      {label && <span className="text-sm text-gray-400">{label}</span>}
    </div>
  );
};

/**
 * Feature Badge
 */
export const FeatureBadge: React.FC<{ 
  icon: string;
  label: string;
  color?: string;
}> = ({ icon, label, color = 'blue' }) => {
  const colorClasses = {
    blue: 'bg-blue-500/20 border-blue-400/30 text-blue-300',
    green: 'bg-green-500/20 border-green-400/30 text-green-300',
    purple: 'bg-purple-500/20 border-purple-400/30 text-purple-300',
    red: 'bg-red-500/20 border-red-400/30 text-red-300',
    yellow: 'bg-yellow-500/20 border-yellow-400/30 text-yellow-300'
  };

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm ${colorClasses[color as keyof typeof colorClasses] || colorClasses.blue}`}>
      <span>{icon}</span>
      <span className="font-medium">{label}</span>
    </div>
  );
};

export default LuciaiHeader;
