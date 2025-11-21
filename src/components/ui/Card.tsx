import React from 'react';
import './Card.css';

export interface CardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  footer?: React.ReactNode;
  hoverable?: boolean;
  bordered?: boolean;
  loading?: boolean;
  className?: string;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({
  children,
  title,
  subtitle,
  footer,
  hoverable = false,
  bordered = true,
  loading = false,
  className = '',
  onClick,
}) => {
  const classes = [
    'card',
    hoverable && 'card-hoverable',
    bordered && 'card-bordered',
    onClick && 'card-clickable',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={classes} onClick={onClick}>
      {(title || subtitle) && (
        <div className="card-header">
          {title && <h3 className="card-title">{title}</h3>}
          {subtitle && <p className="card-subtitle">{subtitle}</p>}
        </div>
      )}
      
      <div className="card-body">
        {loading ? (
          <div className="card-loading">
            <div className="card-skeleton" />
            <div className="card-skeleton" />
            <div className="card-skeleton" />
          </div>
        ) : (
          children
        )}
      </div>
      
      {footer && (
        <div className="card-footer">
          {footer}
        </div>
      )}
    </div>
  );
};

export const cardStyles = `
.card {
  background: white;
  border-radius: 0.5rem;
  overflow: hidden;
  transition: all 0.2s;
}

.card-bordered {
  border: 1px solid #e5e7eb;
}

.card-hoverable:hover {
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.card-clickable {
  cursor: pointer;
}

.card-header {
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.card-title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #111827;
}

.card-subtitle {
  margin: 0.25rem 0 0;
  font-size: 0.875rem;
  color: #6b7280;
}

.card-body {
  padding: 1.5rem;
}

.card-footer {
  padding: 1rem 1.5rem;
  background: #f9fafb;
  border-top: 1px solid #e5e7eb;
}

.card-loading {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.card-skeleton {
  height: 1rem;
  background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%);
  background-size: 200% 100%;
  animation: loading 1.5s ease-in-out infinite;
  border-radius: 0.25rem;
}

@keyframes loading {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}
`;
