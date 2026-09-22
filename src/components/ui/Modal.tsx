import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: string;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, maxWidth = 'max-w-[560px]' }) => {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-start sm:items-center justify-center p-3 sm:p-4 overflow-y-auto" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" />
      <div
        className={cn(
          'relative bg-[#22252D] border border-[#2E323A] rounded-2xl w-full shadow-2xl animate-scale-in',
          'flex flex-col max-h-[calc(100dvh-2rem)] sm:max-h-[90vh] my-auto',
          maxWidth
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 pb-0 flex-shrink-0">
          <h3 className="text-lg font-semibold text-[#F0F2F5]">{title}</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#6B7280] hover:text-[#F0F2F5] hover:bg-[#2D3139] transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto overscroll-contain" style={{ WebkitOverflowScrolling: 'touch' }}>{children}</div>
      </div>
    </div>
  );
};
