import React, { ReactNode } from 'react';

export interface BadgeProps {
  children: ReactNode;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'md' | 'lg';
  rounded?: boolean;
  removable?: boolean;
  onRemove?: () => void;
  icon?: ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  rounded = false,
  removable = false,
  onRemove,
  icon,
  className = '',
}) => {
  const variantClasses = {
    default: 'bg-gray-100 text-gray-800 border-gray-300',
    primary: 'bg-blue-100 text-blue-800 border-blue-300',
    success: 'bg-green-100 text-green-800 border-green-300',
    warning: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    danger: 'bg-red-100 text-red-800 border-red-300',
    info: 'bg-cyan-100 text-cyan-800 border-cyan-300',
  };
  
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base',
  };
  
  const roundedClass = rounded ? 'rounded-full' : 'rounded-md';
  
  const classes = [
    'inline-flex items-center gap-1 font-medium border',
    variantClasses[variant],
    sizeClasses[size],
    roundedClass,
    className,
  ].filter(Boolean).join(' ');
  
  return (
    <span className={classes}>
      {icon && <span className="inline-flex">{icon}</span>}
      {children}
      {removable && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove?.();
          }}
          className="inline-flex items-center hover:bg-black hover:bg-opacity-10 rounded-full p-0.5 transition-colors"
          aria-label="Remove"
        >
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      )}
    </span>
  );
};

// Chip variant (rounded badge)
export interface ChipProps extends Omit<BadgeProps, 'rounded'> {
  avatar?: ReactNode;
}

export const Chip: React.FC<ChipProps> = ({
  avatar,
  ...props
}) => {
  return (
    <Badge
      {...props}
      rounded={true}
      icon={avatar}
    />
  );
};

// Example usage:
/*
<Badge variant="primary">New</Badge>
<Badge variant="success" size="sm">Active</Badge>
<Badge variant="danger" removable onRemove={() => console.log('Removed')}>
  Error
</Badge>

<Chip
  variant="primary"
  avatar={<img src="/avatar.jpg" className="w-5 h-5 rounded-full" />}
  removable
  onRemove={() => console.log('Removed')}
>
  John Doe
</Chip>
*/
