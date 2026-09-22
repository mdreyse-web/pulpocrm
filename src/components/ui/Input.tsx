import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, icon, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-xs font-medium text-[#A0A8B8] mb-1.5">
            {label}
            {props.required && <span className="text-[#EF4444] ml-1">*</span>}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280]">{icon}</div>
          )}
          <input
            ref={ref}
            className={cn(
              'w-full bg-[#2A2D35] border border-[#2E323A] rounded-lg px-3.5 py-2.5 text-sm text-[#F0F2F5] placeholder:text-[#6B7280] transition-all duration-200',
              'focus:outline-none focus:border-[#D4A824] focus:ring-[3px] focus:ring-[#D4A824]/15',
              error && 'border-[#EF4444] focus:border-[#EF4444] focus:ring-[#EF4444]/10',
              icon && 'pl-10',
              className
            )}
            {...props}
          />
        </div>
        {error && <p className="mt-1 text-xs text-[#EF4444]">{error}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';
