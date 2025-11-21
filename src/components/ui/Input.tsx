import React, { forwardRef, InputHTMLAttributes } from 'react';

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  variant?: 'outlined' | 'filled' | 'underlined';
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  size = 'md',
  fullWidth = false,
  variant = 'outlined',
  className = '',
  disabled,
  ...props
}, ref) => {
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-5 py-3 text-lg',
  };
  
  const variantClasses = {
    outlined: 'border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200',
    filled: 'border-0 bg-gray-100 rounded-lg focus:bg-gray-200 focus:ring-2 focus:ring-blue-500',
    underlined: 'border-0 border-b-2 border-gray-300 rounded-none focus:border-blue-500 px-0',
  };
  
  const baseClasses = 'w-full transition-all duration-200 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed';
  
  const inputClasses = [
    baseClasses,
    sizeClasses[size],
    variantClasses[variant],
    leftIcon && 'pl-10',
    rightIcon && 'pr-10',
    error && 'border-red-500 focus:border-red-500 focus:ring-red-200',
    className,
  ].filter(Boolean).join(' ');
  
  return (
    <div className={fullWidth ? 'w-full' : ''}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      
      <div className="relative">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            {leftIcon}
          </div>
        )}
        
        <input
          ref={ref}
          className={inputClasses}
          disabled={disabled}
          {...props}
        />
        
        {rightIcon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
            {rightIcon}
          </div>
        )}
      </div>
      
      {(error || helperText) && (
        <p className={`mt-1 text-sm ${error ? 'text-red-600' : 'text-gray-500'}`}>
          {error || helperText}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

// Example usage:
/*
<Input label="Email" type="email" placeholder="Enter your email" />
<Input label="Password" type="password" error="Password is required" />
<Input label="Search" leftIcon={<SearchIcon />} />
<Input size="lg" fullWidth placeholder="Large input" />
*/
