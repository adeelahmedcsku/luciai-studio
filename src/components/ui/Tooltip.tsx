import React, { useState, useRef, useEffect, ReactNode } from 'react';
import { createPortal } from 'react-dom';

export interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  arrow?: boolean;
  variant?: 'dark' | 'light';
  disabled?: boolean;
  maxWidth?: number;
  className?: string;
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  placement = 'top',
  delay = 200,
  arrow = true,
  variant = 'dark',
  disabled = false,
  maxWidth = 300,
  className = '',
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const targetRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();
  
  const variantClasses = {
    dark: 'bg-gray-900 text-white',
    light: 'bg-white text-gray-900 border border-gray-200 shadow-lg',
  };
  
  const arrowClasses = {
    dark: 'bg-gray-900',
    light: 'bg-white border border-gray-200',
  };
  
  useEffect(() => {
    if (isVisible && targetRef.current && tooltipRef.current) {
      calculatePosition();
    }
  }, [isVisible, placement]);
  
  const calculatePosition = () => {
    if (!targetRef.current || !tooltipRef.current) return;
    
    const targetRect = targetRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    
    let top = 0;
    let left = 0;
    
    const offset = 8; // Gap between target and tooltip
    const arrowSize = arrow ? 6 : 0;
    
    switch (placement) {
      case 'top':
        top = targetRect.top - tooltipRect.height - offset - arrowSize;
        left = targetRect.left + (targetRect.width - tooltipRect.width) / 2;
        break;
      case 'bottom':
        top = targetRect.bottom + offset + arrowSize;
        left = targetRect.left + (targetRect.width - tooltipRect.width) / 2;
        break;
      case 'left':
        top = targetRect.top + (targetRect.height - tooltipRect.height) / 2;
        left = targetRect.left - tooltipRect.width - offset - arrowSize;
        break;
      case 'right':
        top = targetRect.top + (targetRect.height - tooltipRect.height) / 2;
        left = targetRect.right + offset + arrowSize;
        break;
    }
    
    // Keep tooltip within viewport
    const padding = 8;
    if (left < padding) left = padding;
    if (left + tooltipRect.width > window.innerWidth - padding) {
      left = window.innerWidth - tooltipRect.width - padding;
    }
    if (top < padding) top = padding;
    if (top + tooltipRect.height > window.innerHeight - padding) {
      top = window.innerHeight - tooltipRect.height - padding;
    }
    
    setPosition({ top, left });
  };
  
  const handleMouseEnter = () => {
    if (disabled) return;
    
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delay);
  };
  
  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };
  
  const getArrowPosition = () => {
    switch (placement) {
      case 'top':
        return 'bottom-[-6px] left-1/2 -translate-x-1/2 rotate-45';
      case 'bottom':
        return 'top-[-6px] left-1/2 -translate-x-1/2 rotate-45';
      case 'left':
        return 'right-[-6px] top-1/2 -translate-y-1/2 rotate-45';
      case 'right':
        return 'left-[-6px] top-1/2 -translate-y-1/2 rotate-45';
    }
  };
  
  return (
    <>
      <div
        ref={targetRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="inline-block"
      >
        {children}
      </div>
      
      {isVisible && !disabled && createPortal(
        <div
          ref={tooltipRef}
          className={`
            fixed z-50 px-3 py-2 text-sm rounded-lg
            ${variantClasses[variant]}
            animate-fade-in
            ${className}
          `}
          style={{
            top: `${position.top}px`,
            left: `${position.left}px`,
            maxWidth: `${maxWidth}px`,
          }}
        >
          {content}
          
          {arrow && (
            <div
              className={`
                absolute w-3 h-3
                ${arrowClasses[variant]}
                ${getArrowPosition()}
              `}
            />
          )}
        </div>,
        document.body
      )}
    </>
  );
};

// Add this to your global CSS:
/*
@keyframes fade-in {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.animate-fade-in {
  animation: fade-in 0.15s ease-out;
}
*/

// Example usage:
/*
<Tooltip content="This is a helpful tooltip">
  <button>Hover me</button>
</Tooltip>

<Tooltip
  content="This tooltip appears on the right"
  placement="right"
  variant="light"
  arrow
>
  <span>Hover for info</span>
</Tooltip>

<Tooltip
  content={
    <div>
      <strong>Pro Tip:</strong>
      <p>You can use rich content in tooltips!</p>
    </div>
  }
  maxWidth={400}
>
  <button>Rich Content</button>
</Tooltip>
*/
