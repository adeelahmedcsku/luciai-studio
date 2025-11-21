import React from 'react';

export interface ProgressBarProps {
  value: number;
  max?: number;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  showPercentage?: boolean;
  striped?: boolean;
  animated?: boolean;
  indeterminate?: boolean;
  label?: string;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  variant = 'default',
  size = 'md',
  showLabel = false,
  showPercentage = false,
  striped = false,
  animated = false,
  indeterminate = false,
  label,
  className = '',
}) => {
  const percentage = indeterminate ? 100 : Math.min(100, Math.max(0, (value / max) * 100));
  
  const variantClasses = {
    default: 'bg-blue-600',
    success: 'bg-green-600',
    warning: 'bg-yellow-600',
    danger: 'bg-red-600',
    info: 'bg-cyan-600',
  };
  
  const sizeClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
  };
  
  const stripedPattern = striped ? 'bg-gradient-to-r from-transparent via-white/30 to-transparent bg-[length:2rem_2rem]' : '';
  const animationClass = animated && !indeterminate ? 'animate-progress-stripes' : '';
  const indeterminateClass = indeterminate ? 'animate-progress-indeterminate' : '';
  
  return (
    <div className={`w-full ${className}`}>
      {(showLabel || label) && (
        <div className="flex justify-between items-center mb-1">
          {label && <span className="text-sm font-medium text-gray-700">{label}</span>}
          {showPercentage && !indeterminate && (
            <span className="text-sm font-medium text-gray-700">{Math.round(percentage)}%</span>
          )}
        </div>
      )}
      
      <div className={`w-full bg-gray-200 rounded-full overflow-hidden ${sizeClasses[size]}`}>
        <div
          className={`
            ${sizeClasses[size]}
            ${variantClasses[variant]}
            ${stripedPattern}
            ${animationClass}
            ${indeterminateClass}
            transition-all duration-300 ease-out
            rounded-full
          `}
          style={{ width: indeterminate ? '30%' : `${percentage}%` }}
          role="progressbar"
          aria-valuenow={indeterminate ? undefined : value}
          aria-valuemin={0}
          aria-valuemax={max}
        />
      </div>
    </div>
  );
};

// Circular Progress variant
export interface CircularProgressProps {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  showLabel?: boolean;
  indeterminate?: boolean;
  className?: string;
}

export const CircularProgress: React.FC<CircularProgressProps> = ({
  value,
  max = 100,
  size = 80,
  strokeWidth = 8,
  variant = 'default',
  showLabel = true,
  indeterminate = false,
  className = '',
}) => {
  const percentage = indeterminate ? 75 : Math.min(100, Math.max(0, (value / max) * 100));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;
  
  const variantColors = {
    default: 'stroke-blue-600',
    success: 'stroke-green-600',
    warning: 'stroke-yellow-600',
    danger: 'stroke-red-600',
    info: 'stroke-cyan-600',
  };
  
  return (
    <div className={`inline-flex items-center justify-center ${className}`}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-gray-200"
        />
        
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={`${variantColors[variant]} transition-all duration-300 ${indeterminate ? 'animate-spin' : ''}`}
        />
        
        {/* Label */}
        {showLabel && !indeterminate && (
          <text
            x="50%"
            y="50%"
            textAnchor="middle"
            dy=".3em"
            className="text-sm font-semibold fill-current transform rotate-90"
            style={{ transformOrigin: 'center' }}
          >
            {Math.round(percentage)}%
          </text>
        )}
      </svg>
    </div>
  );
};

// Add these animations to your global CSS:
/*
@keyframes progress-stripes {
  0% { background-position: 2rem 0; }
  100% { background-position: 0 0; }
}

@keyframes progress-indeterminate {
  0% { left: -30%; }
  100% { left: 100%; }
}

.animate-progress-stripes {
  animation: progress-stripes 1s linear infinite;
}

.animate-progress-indeterminate {
  position: relative;
  animation: progress-indeterminate 1.5s ease-in-out infinite;
}
*/

// Example usage:
/*
<ProgressBar
  value={75}
  variant="success"
  size="md"
  showPercentage
  label="Upload Progress"
/>

<ProgressBar
  value={50}
  striped
  animated
  variant="warning"
/>

<ProgressBar
  value={0}
  indeterminate
  variant="info"
  label="Loading..."
/>

<CircularProgress
  value={65}
  size={100}
  variant="success"
  showLabel
/>
*/
