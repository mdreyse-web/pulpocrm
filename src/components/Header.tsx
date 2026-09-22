import React from 'react';
import { Plus, Search, X } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onNew?: () => void;
  newButtonLabel?: string;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  showSearch?: boolean;
  extraActions?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  onNew,
  newButtonLabel = 'Nuevo',
  searchQuery = '',
  onSearchChange,
  showSearch = true,
  extraActions,
}) => {
  const { state } = useApp();

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-[#F0F2F5]">{title}</h2>
        {subtitle && <p className="text-sm text-[#6B7280] mt-0.5">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3">
        {showSearch && onSearchChange && (
          <div className="relative w-full sm:w-64">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Buscar..."
              className="w-full bg-[#2A2D35] border border-[#2E323A] rounded-lg pl-9 pr-8 py-2 text-sm text-[#F0F2F5] placeholder:text-[#6B7280] focus:outline-none focus:border-[#D4A824] focus:ring-[3px] focus:ring-[#D4A824]/15 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6B7280] hover:text-[#F0F2F5]"
              >
                <X size={14} />
              </button>
            )}
          </div>
        )}
        {extraActions}
        {onNew && (
          <Button onClick={onNew} leftIcon={<Plus size={16} />}>
            {newButtonLabel}
          </Button>
        )}
      </div>
    </div>
  );
};
