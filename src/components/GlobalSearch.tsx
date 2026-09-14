import { useState, useEffect, useRef, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { Search, X, Building2, User, Target, Calendar, CornerDownRight } from 'lucide-react';
import type { Account, Contact, Opportunity, Activity } from '@/types';

interface SearchResult {
  type: 'account' | 'contact' | 'opportunity' | 'activity';
  item: Account | Contact | Opportunity | Activity;
  title: string;
  subtitle: string;
}

export function GlobalSearch() {
  const { state, navigateTo } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Hotkey: Ctrl+K or Cmd+K, and custom event from sidebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    const handleOpenEvent = () => setIsOpen(true);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('open-global-search', handleOpenEvent);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('open-global-search', handleOpenEvent);
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const results = useMemo<SearchResult[]>(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase().trim();
    const out: SearchResult[] = [];

    state.accounts.forEach((a) => {
      if (a.companyName.toLowerCase().includes(q) || a.industry?.toLowerCase().includes(q)) {
        out.push({ type: 'account', item: a, title: a.companyName, subtitle: a.industry || 'Sin industria' });
      }
    });

    state.contacts.forEach((c) => {
      const fullName = `${c.firstName} ${c.lastName}`.toLowerCase();
      if (fullName.includes(q) || c.email?.toLowerCase().includes(q) || c.position?.toLowerCase().includes(q)) {
        const account = state.accounts.find((a) => a.id === c.accountId);
        out.push({ type: 'contact', item: c, title: `${c.firstName} ${c.lastName}`, subtitle: account?.companyName || 'Sin empresa' });
      }
    });

    state.opportunities.forEach((o) => {
      if (o.name.toLowerCase().includes(q)) {
        const account = state.accounts.find((a) => a.id === o.accountId);
        out.push({ type: 'opportunity', item: o, title: o.name, subtitle: account?.companyName || 'Sin cuenta' });
      }
    });

    state.activities.forEach((a) => {
      if (a.title.toLowerCase().includes(q) || a.description?.toLowerCase().includes(q)) {
        const account = state.accounts.find((ac) => ac.id === a.accountId);
        out.push({ type: 'activity', item: a, title: a.title, subtitle: account?.companyName || 'Sin cuenta' });
      }
    });

    return out.slice(0, 12);
  }, [query, state.accounts, state.contacts, state.opportunities, state.activities]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [results.length]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((i) => (i + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((i) => (i - 1 + results.length) % results.length);
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      handleSelect(results[selectedIndex]);
    }
  };

  const handleSelect = (result: SearchResult) => {
    setIsOpen(false);
    if (result.type === 'account') {
      navigateTo('account-detail', result.item.id);
    } else if (result.type === 'contact') {
      navigateTo('contact-detail', result.item.id);
    } else if (result.type === 'opportunity') {
      navigateTo('pipeline');
    } else if (result.type === 'activity') {
      navigateTo('activities');
    }
  };

  if (!isOpen) return null;

  const icons = {
    account: <Building2 className="w-4 h-4 text-[#3B82F6]" />,
    contact: <User className="w-4 h-4 text-[#22C55E]" />,
    opportunity: <Target className="w-4 h-4 text-[#8B5CF6]" />,
    activity: <Calendar className="w-4 h-4 text-[#D4A824]" />,
  };

  const labels = {
    account: 'Cuenta',
    contact: 'Contacto',
    opportunity: 'Oportunidad',
    activity: 'Actividad',
  };

  return (
    <div className="fixed inset-0 z-[70] bg-black/50 backdrop-blur-sm flex items-start justify-center pt-[15vh] p-4" onClick={() => setIsOpen(false)}>
      <div
        ref={containerRef}
        className="w-full max-w-xl bg-[#1E2028] border border-[#2A2D3A] rounded-xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[#2A2D3A]">
          <Search className="w-5 h-5 text-[#4B5563]" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Buscar cuentas, contactos, oportunidades..."
            className="flex-1 bg-transparent text-[#F0F2F5] placeholder-[#4B5563] text-sm outline-none"
          />
          <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 bg-[#2A2D3A] rounded text-[10px] text-[#6B7280] font-mono">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto">
          {results.length === 0 && query.trim() && (
            <div className="px-4 py-8 text-center text-sm text-[#6B7280]">
              No se encontraron resultados para "{query}"
            </div>
          )}
          {results.length === 0 && !query.trim() && (
            <div className="px-4 py-8 text-center text-sm text-[#6B7280]">
              Escribe para buscar en todo tu CRM
            </div>
          )}
          {results.map((result, index) => (
            <button
              key={`${result.type}-${result.item.id}-${index}`}
              onClick={() => handleSelect(result)}
              onMouseEnter={() => setSelectedIndex(index)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                index === selectedIndex ? 'bg-[#D4A824]/10' : 'hover:bg-[#2A2D3A]/50'
              }`}
            >
              <div className="w-8 h-8 rounded-lg bg-[#181A20] border border-[#2A2D3A] flex items-center justify-center flex-shrink-0">
                {icons[result.type]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-[#F0F2F5] truncate">{result.title}</p>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#2A2D3A] text-[#6B7280] flex-shrink-0">{labels[result.type]}</span>
                </div>
                <p className="text-xs text-[#6B7280] truncate">{result.subtitle}</p>
              </div>
              {index === selectedIndex && <CornerDownRight className="w-4 h-4 text-[#D4A824] flex-shrink-0" />}
            </button>
          ))}
        </div>

        {/* Footer */}
        {results.length > 0 && (
          <div className="px-4 py-2 border-t border-[#2A2D3A] flex items-center justify-between text-[10px] text-[#4B5563]">
            <div className="flex gap-3">
              <span>↑↓ navegar</span>
              <span>↵ seleccionar</span>
            </div>
            <span>{results.length} resultado{results.length !== 1 ? 's' : ''}</span>
          </div>
        )}
      </div>
    </div>
  );
}
