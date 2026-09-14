import React, { useEffect, useState } from 'react';
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { useApp } from '@/context/AppContext';

const icons = {
  success: <CheckCircle size={18} className="text-[#22C55E]" />,
  error: <AlertCircle size={18} className="text-[#EF4444]" />,
  warning: <AlertTriangle size={18} className="text-[#F59E0B]" />,
  info: <Info size={18} className="text-[#3B82F6]" />,
};

const borders = {
  success: 'border-l-[#22C55E]',
  error: 'border-l-[#EF4444]',
  warning: 'border-l-[#F59E0B]',
  info: 'border-l-[#3B82F6]',
};

export const Toast: React.FC = () => {
  const { state, dispatch } = useApp();
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    if (state.toast) {
      setVisible(true);
      setExiting(false);
      const timer = setTimeout(() => {
        setExiting(true);
        setTimeout(() => {
          setVisible(false);
          dispatch({ type: 'HIDE_TOAST' });
        }, 200);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [state.toast, dispatch]);

  if (!visible || !state.toast) return null;

  return (
    <div
      className={`fixed bottom-6 right-6 z-[120] flex items-start gap-3 bg-[#22252D] border border-[#2E323A] border-l-4 ${borders[state.toast.type]} rounded-lg px-5 py-4 shadow-[0_8px_24px_rgba(0,0,0,0.4)] ${
        exiting ? 'animate-[slideOut_0.2s_ease-in_forwards]' : 'animate-slide-in-right'
      }`}
      style={{
        animation: exiting
          ? 'slideOut 0.2s ease-in forwards'
          : 'slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      {icons[state.toast.type]}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-[#F0F2F5]">{state.toast.message}</p>
      </div>
      <button
        onClick={() => {
          setExiting(true);
          setTimeout(() => {
            setVisible(false);
            dispatch({ type: 'HIDE_TOAST' });
          }, 200);
        }}
        className="p-0.5 rounded text-[#6B7280] hover:text-[#F0F2F5] transition-colors"
      >
        <X size={14} />
      </button>
    </div>
  );
};
