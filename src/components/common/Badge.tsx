import React from 'react';

export type BadgeVariant = 'success' | 'danger' | 'info' | 'warning' | 'neutral' | 'navy';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
  icon?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  className = '',
  icon,
  size = 'md',
}) => {
  const variantStyles: Record<BadgeVariant, string> = {
    success: 'bg-emerald-50 text-[#10B981] border-emerald-200',
    danger: 'bg-red-50 text-[#EF4444] border-red-200',
    info: 'bg-[#EFF6FF] text-[#2563EB] border-blue-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    navy: 'bg-[#1E3A8A]/10 text-[#1E3A8A] border-[#1E3A8A]/20',
    neutral: 'bg-gray-100 text-gray-700 border-gray-200',
  };

  const sizeStyles = {
    sm: 'text-[11px] px-2 py-0.5 rounded-md',
    md: 'text-xs px-2.5 py-1 rounded-lg',
    lg: 'text-sm px-3 py-1.5 rounded-xl',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-bold border ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </span>
  );
};
