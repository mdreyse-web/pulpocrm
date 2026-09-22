import React, { forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: SelectOption[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, options, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-xs font-medium text-[#A0A8B8] mb-1.5">
            {label}
            {props.required && <span className="text-[#EF4444] ml-1">*</span>}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            className={cn(
              'w-full bg-[#2A2D35] border border-[#2E323A] rounded-lg px-3.5 py-2.5 text-sm text-[#F0F2F5] appearance-none transition-all duration-200',
              'focus:outline-none focus:border-[#D4A824] focus:ring-[3px] focus:ring-[#D4A824]/15',
              error && 'border-[#EF4444] focus:border-[#EF4444] focus:ring-[#EF4444]/10',
              className
            )}
            {...props}
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-[#22252D] text-[#F0F2F5]">
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7280] pointer-events-none" />
        </div>
        {error && <p className="mt-1 text-xs text-[#EF4444]">{error}</p>}
      </div>
    );
  }
);
Select.displayName = 'Select';
