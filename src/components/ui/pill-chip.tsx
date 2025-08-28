import React from 'react';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

interface PillChipProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'danger' | 'warning' | 'accent' | 'outline' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  selected?: boolean;
  removable?: boolean;
  onRemove?: () => void;
  onClick?: () => void;
  className?: string;
}

const PillChip: React.FC<PillChipProps> = ({
  children,
  variant = 'default',
  size = 'md',
  selected = false,
  removable = false,
  onRemove,
  onClick,
  className,
}) => {
  const baseStyles = 'inline-flex items-center gap-1.5 rounded-full font-medium transition-all duration-200 cursor-pointer select-none';
  
  const variantStyles = {
    default: selected 
      ? 'bg-primary text-primary-foreground shadow-sm ring-1 ring-primary/20' 
      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700',
    success: selected 
      ? 'bg-emerald-500 text-white shadow-sm ring-1 ring-emerald-500/20' 
      : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-300 dark:hover:bg-emerald-800/40',
    danger: selected 
      ? 'bg-red-500 text-white shadow-sm ring-1 ring-red-500/20' 
      : 'bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-800/40',
    destructive: selected 
      ? 'bg-red-500 text-white shadow-sm ring-1 ring-red-500/20' 
      : 'bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-800/40',
    warning: selected 
      ? 'bg-amber-500 text-white shadow-sm ring-1 ring-amber-500/20' 
      : 'bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-300 dark:hover:bg-amber-800/40',
    accent: selected 
      ? 'bg-blue-500 text-white shadow-sm ring-1 ring-blue-500/20' 
      : 'bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-800/40',
    outline: selected 
      ? 'bg-primary/10 text-primary border border-primary/30 shadow-sm' 
      : 'border border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800',
  };

  const sizeStyles = {
    sm: 'px-2.5 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base',
  };

  const hoverEffects = onClick ? 'hover:scale-105 hover:shadow-md' : '';

  return (
    <span
      className={cn(
        baseStyles,
        variantStyles[variant],
        sizeStyles[size],
        hoverEffects,
        selected && 'transform scale-105',
        className
      )}
      onClick={onClick}
    >
      {children}
      {removable && onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="p-0.5 rounded-full hover:bg-current/20 transition-colors ml-1"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </span>
  );
};

export default PillChip;