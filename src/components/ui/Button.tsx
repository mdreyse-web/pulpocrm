import React from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, leftIcon, rightIcon, children, disabled, ...props }, ref) => {
    const variants = {
      primary: 'bg-[#D4A824] text-[#0D0E12] font-semibold hover:bg-[#E8C545] hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(212,168,36,0.3)] active:translate-y-0 active:shadow-none disabled:bg-[#D4A824]/40 disabled:cursor-not-allowed',
      secondary: 'bg-transparent text-[#F0F2F5] font-semibold border border-[#2E323A] hover:bg-[#2D3139] hover:border-[#3A3F48] disabled:opacity-50',
      ghost: 'bg-transparent text-[#A0A8B8] font-medium hover:bg-[#2D3139] hover:text-[#F0F2F5] disabled:opacity-50',
      danger: 'bg-transparent text-[#EF4444] font-medium border border-[#EF4444]/30 hover:bg-[#EF4444]/10 disabled:opacity-50',
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-xs',
      md: 'px-5 py-2.5 text-sm',
      lg: 'px-6 py-3 text-base',
      icon: 'p-2',
    };

    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center gap-2 rounded-lg transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#D4A824]/50',
          variants[variant],
          sizes[size],
          className
        )}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && (
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        )}
        {!isLoading && leftIcon}
        {children}
        {!isLoading && rightIcon}
      </button>
    );
  }
);
Button.displayName = 'Button';
