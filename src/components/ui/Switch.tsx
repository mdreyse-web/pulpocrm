import React from 'react';
import { cn } from '@/lib/utils';

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  className?: string;
}

export const Switch: React.FC<SwitchProps> = ({ checked, onChange, label, className }) => {
  return (
    <label className={cn('inline-flex items-center gap-3 cursor-pointer', className)}>
      <div
        className={cn(
          'relative w-11 h-6 rounded-full transition-colors duration-200',
          checked ? 'bg-[#D4A824]' : 'bg-[#2E323A]'
        )}
        onClick={() => onChange(!checked)}
      >
        <div
          className={cn(
            'absolute top-0.5 left-0.5 w-5 h-5 rounded-full transition-transform duration-200',
            checked ? 'translate-x-5 bg-white' : 'translate-x-0 bg-[#A0A8B8]'
          )}
        />
      </div>
      {label && <span className="text-sm text-[#A0A8B8]">{label}</span>}
    </label>
  );
};
