import React from 'react';
import { cn } from '@/lib/utils';

interface RingProgressProps {
  value: number; // 0-100
  size?: 'sm' | 'md' | 'lg' | 'xl';
  strokeWidth?: number;
  color?: 'primary' | 'success' | 'warning' | 'danger' | 'accent';
  showPercentage?: boolean;
  children?: React.ReactNode;
  className?: string;
}

const RingProgress: React.FC<RingProgressProps> = ({
  value,
  size = 'md',
  strokeWidth,
  color = 'primary',
  showPercentage = true,
  children,
  className,
}) => {
  const sizeConfig = {
    sm: { diameter: 60, defaultStroke: 4 },
    md: { diameter: 80, defaultStroke: 6 },
    lg: { diameter: 120, defaultStroke: 8 },
    xl: { diameter: 160, defaultStroke: 10 },
  };

  const config = sizeConfig[size];
  const stroke = strokeWidth || config.defaultStroke;
  const radius = (config.diameter - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (value / 100) * circumference;

  const colorClasses = {
    primary: 'stroke-primary',
    success: 'stroke-success',
    warning: 'stroke-warning',
    danger: 'stroke-destructive',
    accent: 'stroke-accent',
  };

  return (
    <div 
      className={cn('relative inline-flex items-center justify-center', className)}
      style={{ width: config.diameter, height: config.diameter }}
    >
      <svg
        width={config.diameter}
        height={config.diameter}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={config.diameter / 2}
          cy={config.diameter / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={stroke}
          fill="none"
          className="text-muted/20"
        />
        {/* Progress circle */}
        <circle
          cx={config.diameter / 2}
          cy={config.diameter / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className={cn('transition-all duration-500 ease-out', colorClasses[color])}
        />
      </svg>
      
      {/* Content */}
      <div className="absolute inset-0 flex items-center justify-center">
        {children ? (
          children
        ) : showPercentage ? (
          <span className="text-sm font-semibold font-mono">
            {Math.round(value)}%
          </span>
        ) : null}
      </div>
    </div>
  );
};

export default RingProgress;