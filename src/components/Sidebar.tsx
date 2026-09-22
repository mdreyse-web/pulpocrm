import { LayoutDashboard, BarChart3, FolderKanban, Building2, Users, ClipboardList, Settings, ExternalLink, Menu, X, HardHat, Search, ShieldCheck, Megaphone } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { ViewType } from '@/types';
import { cn } from '@/lib/utils';

const ALL_NAV_ITEMS: { view: ViewType; label: string; icon: React.ElementType }[] = [
  { view: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { view: 'pipeline', label: 'Pipeline', icon: BarChart3 },
  { view: 'projects', label: 'Proyectos', icon: FolderKanban },
  { view: 'accounts', label: 'Cuentas', icon: Building2 },
  { view: 'contacts', label: 'Contactos', icon: Users },
  { view: 'activities', label: 'Actividades', icon: ClipboardList },
  { view: 'campaigns', label: 'Campañas', icon: Megaphone },
  { view: 'settings', label: 'Configuración', icon: Settings },
];

export const Sidebar: React.FC = () => {
  const { state, dispatch, navigateTo, exportToJSON } = useApp();
  const isCollapsed = state.sidebarCollapsed;
  const tenant = state.tenantConfig;

  // Filter nav items by tenant config (fallback to all if no config loaded yet)
  const visibleViews = tenant?.visibleModules ?? ALL_NAV_ITEMS.map((i) => i.view);
  const navItems = ALL_NAV_ITEMS.filter((item) => visibleViews.includes(item.view));

  // La administración de clientes se accede desde la landing (dominio raíz),
  // no desde el CRM del cliente, para que no vean el panel admin.
  const showAdmin = false;

  const primaryColor = tenant?.primaryColor || '#D4A824';
  const primaryColorLight = tenant?.primaryColorLight || '#E8C545';
  const logoText = tenant?.logoText || (tenant?.name || 'CRM');
  const tagline = tenant?.tagline || '';
  const name = tenant?.name || 'CRM';

  const handleNavClick = (view: ViewType) => {
    navigateTo(view);
    if (window.innerWidth < 768) {
      dispatch({ type: 'TOGGLE_SIDEBAR' });
    }
  };

  return (
    <>
      {/* Mobile overlay */}
      {isCollapsed && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[99] md:hidden transition-opacity"
          onClick={() => dispatch({ type: 'TOGGLE_SIDEBAR' })}
        />
      )}

      {/* Mobile toggle button */}
      <button
        className="fixed top-4 left-4 z-[101] md:hidden p-2.5 rounded-xl bg-[#1E2128]/90 border border-[#2E323A] text-[#F0F2F5] shadow-lg backdrop-blur-sm"
        onClick={() => dispatch({ type: 'TOGGLE_SIDEBAR' })}
      >
        {isCollapsed ? <X size={20} /> : <Menu size={20} />}
      </button>

      <aside
        className={cn(
          'fixed left-0 top-0 h-screen z-[100] flex flex-col transition-all duration-300 ease-out',
          'bg-[#0D0E12]/95 backdrop-blur-xl',
          'border-r border-[#ffffff]/[0.06]',
          isCollapsed ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
          'w-[280px] md:w-[280px]'
        )}
      >
        {/* Logo section */}
        <div className="flex items-center gap-3.5 px-6 py-6 border-b border-[#ffffff]/[0.06]">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg"
            style={{
              background: `linear-gradient(135deg, ${primaryColor}, ${primaryColorLight})`,
              boxShadow: `0 10px 15px -3px ${primaryColor}33`,
            }}
          >
            {tenant?.logoBase64 ? (
              <img
                src={tenant.logoBase64}
                alt={name}
                className="w-8 h-8 object-contain"
              />
            ) : (
              <HardHat size={24} className="text-[#0D0E12]" />
            )}
          </div>
          <div className="overflow-hidden flex-1">
            <h1 className="text-base font-bold text-[#F0F2F5] whitespace-nowrap tracking-tight">{logoText}</h1>
            {tagline && (
              <p className="text-[11px] text-[#6B7280] whitespace-nowrap font-medium tracking-wide">{tagline.toUpperCase()}</p>
            )}
          </div>
        </div>

        {/* Global search trigger */}
        <div className="px-5 pt-4 pb-1">
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('open-global-search'))}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg bg-[#181A20] border border-[#2A2D3A] text-[#6B7280] hover:text-[#F0F2F5] hover:border-[#3A3D4A] transition-all text-left group"
          >
            <Search size={16} className="text-[#4B5563] group-hover:text-[#9CA3AF] transition-colors" />
            <span className="text-[13px] flex-1">Buscar...</span>
            <kbd className="hidden md:inline-flex items-center px-1.5 py-0.5 bg-[#2A2D3A] rounded text-[10px] text-[#4B5563] font-mono">Ctrl K</kbd>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-5 overflow-y-auto">
          <div className="mb-4 px-4">
            <p className="text-[10px] font-semibold text-[#6B7280] uppercase tracking-[0.15em]">Principal</p>
          </div>
          <div className="space-y-0.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                state.activeView === item.view ||
                (item.view === 'projects' && state.activeView === 'project-detail') ||
                (item.view === 'accounts' && state.activeView === 'account-detail') ||
                (item.view === 'contacts' && state.activeView === 'contact-detail');
              return (
                <button
                  key={item.view}
                  onClick={() => handleNavClick(item.view)}
                  className={cn(
                    'w-full flex items-center gap-3.5 px-4 h-[44px] rounded-xl transition-all duration-200 text-left relative group',
                    isActive
                      ? 'bg-[#D4A824]/10 text-[#D4A824]'
                      : 'text-[#A0A8B8] hover:bg-[#ffffff]/[0.04] hover:text-[#F0F2F5]'
                  )}
                  style={isActive ? { backgroundColor: `${primaryColor}15`, color: primaryColor } : undefined}
                >
                  {isActive && (
                    <div
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-r-full"
                      style={{ backgroundColor: primaryColor }}
                    />
                  )}
                  <Icon
                    size={19}
                    className={cn(
                      'transition-colors',
                      isActive ? 'text-[#D4A824]' : 'text-[#6B7280] group-hover:text-[#A0A8B8]'
                    )}
                    style={isActive ? { color: primaryColor } : undefined}
                  />
                  <span className={cn('text-[13px] font-medium whitespace-nowrap', isActive && 'font-semibold')}>
                    {item.label}
                  </span>
                  {isActive && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full" style={{ backgroundColor: primaryColor }} />
                  )}
                </button>
              );
            })}

            {/* Admin link (deshabilitado: el admin vive en la landing) */}
            {showAdmin && (
              <button
                onClick={() => handleNavClick('tenant-admin')}
                className={cn(
                  'w-full flex items-center gap-3.5 px-4 h-[44px] rounded-xl transition-all duration-200 text-left relative group mt-2',
                  state.activeView === 'tenant-admin'
                    ? 'bg-[#8B5CF6]/10 text-[#8B5CF6]'
                    : 'text-[#A0A8B8] hover:bg-[#ffffff]/[0.04] hover:text-[#F0F2F5]'
                )}
              >
                {state.activeView === 'tenant-admin' && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-[#8B5CF6] rounded-r-full" />
                )}
                <ShieldCheck size={19} className={state.activeView === 'tenant-admin' ? 'text-[#8B5CF6]' : 'text-[#6B7280] group-hover:text-[#A0A8B8]'} />
                <span className="text-[13px] font-medium whitespace-nowrap">Admin Clientes</span>
              </button>
            )}
          </div>
        </nav>

        {/* Bottom actions */}
        <div className="px-4 pb-5 pt-4 border-t border-[#ffffff]/[0.06]">
          <button
            onClick={exportToJSON}
            className="w-full flex items-center gap-2.5 px-4 py-3 rounded-xl border border-dashed transition-all duration-200 text-left group"
            style={{
              borderColor: `${primaryColor}66`,
              color: primaryColor,
            }}
          >
            <ExternalLink size={15} className="group-hover:translate-x-0.5 transition-transform" />
            <span className="text-xs font-semibold tracking-wide">Exportar Backup JSON</span>
          </button>
          <p className="text-[10px] text-[#6B7280] text-center mt-3 tracking-wide">
            {name} v2.1
          </p>
        </div>
      </aside>
    </>
  );
};
