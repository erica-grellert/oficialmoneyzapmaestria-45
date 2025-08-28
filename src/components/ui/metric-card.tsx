import React from 'react';
import { cn } from '@/lib/utils';
import { Card } from './card-modern';
import { motion } from 'framer-motion';

interface MetricCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: React.ReactNode;
  variant?: 'default' | 'success' | 'danger' | 'warning' | 'accent';
  className?: string;
  onClick?: () => void;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  description,
  icon,
  variant = 'default',
  className,
  onClick,
}) => {
  const variantStyles = {
    default: 'border-border',
    success: 'border-success/20 bg-success/5',
    danger: 'border-destructive/20 bg-destructive/5',
    warning: 'border-warning/20 bg-warning/5',
    accent: 'border-accent/20 bg-accent/5',
  };

  const iconStyles = {
    default: 'text-muted-foreground',
    success: 'text-success',
    danger: 'text-destructive',
    warning: 'text-warning',
    accent: 'text-accent',
  };

  return (
    <motion.div
      whileHover={onClick ? { y: -2 } : undefined}
      whileTap={onClick ? { scale: 0.98 } : undefined}
    >
      <Card
        variant={onClick ? 'interactive' : 'default'}
        className={cn(
          'p-6 transition-all duration-200',
          variantStyles[variant],
          onClick && 'cursor-pointer',
          className
        )}
        onClick={onClick}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-semibold font-mono mt-2">{value}</p>
            {description && (
              <p className="text-sm text-muted-foreground mt-1">{description}</p>
            )}
          </div>
          {icon && (
            <div className={cn('p-2 rounded-button', iconStyles[variant])}>
              {icon}
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
};

export default MetricCard;