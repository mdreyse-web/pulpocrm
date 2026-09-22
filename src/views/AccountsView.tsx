import { useState } from 'react';
import { Building2, Users, ClipboardList, ArrowRight, FolderKanban } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Header } from '@/components/Header';
import { Badge } from '@/components/ui/Badge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Account } from '@/types';

export const AccountsView: React.FC = () => {
  const { state, navigateTo, openModal, getAccountContacts, getAccountActivities, getProject } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [industryFilter, setIndustryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [projectFilter, setProjectFilter] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  const industries = Array.from(new Set(state.accounts.map((a) => a.industry)));

  // Total vendido por cuenta en el año en curso (oportunidades ganadas)
  const yearStart = new Date(new Date().getFullYear(), 0, 1);
  const soldByAccount = new Map<string, number>();
  state.opportunities
    .filter((o) => o.stage === 'closed_won' && new Date(o.actualCloseDate || o.updatedAt) >= yearStart)
    .forEach((o) => soldByAccount.set(o.accountId, (soldByAccount.get(o.accountId) || 0) + (o.amount || 0)));

  const filtered = state.accounts.filter((a) => {
    const matchSearch =
      !searchQuery ||
      a.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.industry.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchIndustry = !industryFilter || a.industry === industryFilter;
    const matchStatus = !statusFilter || a.status === statusFilter;
    const matchProject = !projectFilter
      ? true
      : projectFilter === '__none'
        ? a.projectIds.length === 0
        : a.projectIds.includes(projectFilter);
    return matchSearch && matchIndustry && matchStatus && matchProject;
  });

  return (
    <div className="animate-fade-in">
      <Header
        title="Cuentas"
        subtitle={`${filtered.length} cuenta${filtered.length !== 1 ? 's' : ''}`}
        onNew={() => openModal('account-form')}
        newButtonLabel="Nueva Cuenta"
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        extraActions={
          <div className="flex items-center gap-2 flex-wrap">
            <select value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)} className="bg-[#2A2D35] border border-[#2E323A] rounded-lg px-3 py-2 text-sm text-[#F0F2F5] focus:outline-none focus:border-[#D4A824]">
              <option value="">Todos los proyectos</option>
              <option value="__none">Sin proyecto</option>
              {state.projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <select value={industryFilter} onChange={(e) => setIndustryFilter(e.target.value)} className="bg-[#2A2D35] border border-[#2E323A] rounded-lg px-3 py-2 text-sm text-[#F0F2F5] focus:outline-none focus:border-[#D4A824]">
              <option value="">Todas las industrias</option>
              {industries.map((i) => (
                <option key={i} value={i}>{i}</option>
              ))}
            </select>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="bg-[#2A2D35] border border-[#2E323A] rounded-lg px-3 py-2 text-sm text-[#F0F2F5] focus:outline-none focus:border-[#D4A824]">
              <option value="">Todos los estados</option>
              <option value="active">Activa</option>
              <option value="inactive">Inactiva</option>
            </select>
            <div className="flex bg-[#2A2D35] border border-[#2E323A] rounded-lg overflow-hidden">
              <button onClick={() => setViewMode('grid')} className={`px-3 py-2 text-sm ${viewMode === 'grid' ? 'bg-[#D4A824] text-[#0D0E12]' : 'text-[#A0A8B8]'}`}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></svg>
              </button>
              <button onClick={() => setViewMode('table')} className={`px-3 py-2 text-sm ${viewMode === 'table' ? 'bg-[#D4A824] text-[#0D0E12]' : 'text-[#A0A8B8]'}`}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3h18v18H3z" /><path d="M3 9h18" /><path d="M3 15h18" /><path d="M9 3v18" /></svg>
              </button>
            </div>
          </div>
        }
      />

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <Building2 size={48} className="mx-auto text-[#3A3F48] mb-4" />
          <p className="text-[#6B7280]">No se encontraron cuentas</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filtered.map((account, idx) => (
            <AccountCard key={account.id} account={account} index={idx} />
          ))}
        </div>
      ) : (
        <div className="bg-[#22252D] border border-[#2E323A] rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#2E323A] bg-[#1E2128]">
                <th className="text-left text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider px-4 py-3">Nombre</th>
                <th className="text-left text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider px-4 py-3">RUT</th>
                <th className="text-left text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider px-4 py-3">Proyectos</th>
                <th className="text-left text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider px-4 py-3">Industria</th>
                <th className="text-left text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider px-4 py-3">Contactos</th>
                <th className="text-left text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider px-4 py-3">Estado</th>
                <th className="text-right text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider px-4 py-3">Vendido {new Date().getFullYear()}</th>
                <th className="text-left text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((account) => {
                const contactCount = getAccountContacts(account.id).length;
                return (
                  <tr key={account.id} className="border-b border-[#25282F] hover:bg-[#2D3139] transition-colors cursor-pointer" onClick={() => navigateTo('account-detail', account.id)}>
                    <td className="px-4 py-3 text-sm font-medium text-[#F0F2F5]">{account.companyName}</td>
                    <td className="px-4 py-3 text-sm text-[#A0A8B8] font-mono">{account.rut || <span className="text-xs text-[#6B7280]">-</span>}</td>
                    <td className="px-4 py-3">
                      {account.projectIds.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {account.projectIds.slice(0, 2).map((pid) => {
                            const project = getProject(pid);
                            return (
                              <span key={pid} className="text-xs text-[#D4A824]">{project?.name || pid}</span>
                            );
                          })}
                          {account.projectIds.length > 2 && (
                            <span className="text-xs text-[#6B7280]">+{account.projectIds.length - 2}</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-[#6B7280]">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3"><Badge variant="primary">{account.industry}</Badge></td>
                    <td className="px-4 py-3 text-sm text-[#A0A8B8]">{contactCount}</td>
                    <td className="px-4 py-3"><Badge variant={account.status}>{account.status === 'active' ? 'Activa' : 'Inactiva'}</Badge></td>
                    <td className="px-4 py-3 text-sm text-right font-semibold">
                      {soldByAccount.get(account.id)
                        ? <span className="text-[#22C55E]">${soldByAccount.get(account.id)!.toLocaleString('es-CL')}</span>
                        : <span className="text-xs text-[#6B7280] font-normal">-</span>}
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={(e) => { e.stopPropagation(); navigateTo('account-detail', account.id); }} className="text-[#D4A824] hover:text-[#E8C545] text-sm">Ver</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function AccountCard({ account, index }: { account: Account; index: number }) {
  const { navigateTo, getAccountContacts, getAccountActivities, getProject } = useApp();
  const contacts = getAccountContacts(account.id);
  const activities = getAccountActivities(account.id);
  const lastActivity = activities[0];
  const projects = account.projectIds.map((pid) => getProject(pid)).filter(Boolean);

  return (
    <div
      className="bg-[#22252D] border border-[#2E323A] rounded-xl p-6 hover:border-[#3A3F48] hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(0,0,0,0.2)] transition-all duration-250 cursor-pointer"
      style={{ animationDelay: `${index * 0.06}s` }}
      onClick={() => navigateTo('account-detail', account.id)}
    >
      <div className="flex items-start justify-between mb-2">
        <h3 className="text-base font-semibold text-[#F0F2F5] truncate pr-2">{account.companyName}</h3>
        <Badge variant={account.status}>{account.status === 'active' ? 'Activa' : 'Inactiva'}</Badge>
      </div>

      {/* Multiple projects */}
      {projects.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-1">
          {projects.slice(0, 2).map((project) => (
            <span key={project!.id} className="text-xs text-[#D4A824] flex items-center gap-0.5">
              <FolderKanban size={10} /> {project!.name}
            </span>
          ))}
          {projects.length > 2 && (
            <span className="text-xs text-[#6B7280]">+{projects.length - 2} más</span>
          )}
        </div>
      )}

      <p className="text-xs text-[#A0A8B8] mb-2">{account.industry}</p>
      <p className="text-sm text-[#A0A8B8] line-clamp-2 mb-4">{account.description || 'Sin descripción'}</p>
      <div className="flex items-center gap-4 text-xs text-[#6B7280] mb-4 border-t border-[#25282F] pt-4">
        <span className="flex items-center gap-1"><Users size={12} /> {contacts.length} contactos</span>
        <span className="flex items-center gap-1"><ClipboardList size={12} /> {activities.length} actividades</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs text-[#6B7280]">
          {lastActivity ? `Última: ${format(new Date(lastActivity.createdAt), 'dd MMM', { locale: es })}` : 'Sin actividad'}
        </span>
        <button onClick={(e) => { e.stopPropagation(); navigateTo('account-detail', account.id); }} className="flex items-center gap-1 text-sm text-[#D4A824] hover:text-[#E8C545] transition-colors">
          Ver detalle <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}
