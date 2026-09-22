import React from 'react';
import { cn } from '@/lib/utils';

type BadgeVariant = 'active' | 'inactive' | 'pending' | 'completed' | 'cancelled' | 'call' | 'email' | 'meeting' | 'visit' | 'note' | 'important' | 'primary' | 'urgent';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const variants: Record<BadgeVariant, string> = {
  active: 'bg-[#22C55E15] text-[#22C55E]',
  inactive: 'bg-[#6B728015] text-[#6B7280]',
  pending: 'bg-[#F59E0B15] text-[#F59E0B]',
  completed: 'bg-[#22C55E15] text-[#22C55E]',
  cancelled: 'bg-[#EF444415] text-[#EF4444]',
  call: 'bg-[#3B82F615] text-[#3B82F6]',
  email: 'bg-[#22C55E15] text-[#22C55E]',
  meeting: 'bg-[#8B5CF615] text-[#8B5CF6]',
  visit: 'bg-[#F9731615] text-[#F97316]',
  note: 'bg-[#6B728015] text-[#6B7280]',
  important: 'bg-[#EF444415] text-[#EF4444]',
  primary: 'bg-[#D4A82415] text-[#D4A824]',
  urgent: 'bg-[#EF4444]/20 text-[#EF4444] ring-1 ring-[#EF4444]/30',
};

export const Badge: React.FC<BadgeProps> = ({ variant = 'primary', children, className }) => {
  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-semibold', variants[variant], className)}>
      {children}
    </span>
  );
};
