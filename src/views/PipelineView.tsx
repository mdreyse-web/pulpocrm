import { useState } from 'react';
import { BarChart3, Pencil, Trash2, ArrowRight, DollarSign, Percent, CalendarDays, Building2, Users, ClipboardList, Plus, PhoneCall, Mail, Users2, MapPin, FileText } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Header } from '@/components/Header';
import { Badge } from '@/components/ui/Badge';
import { PIPELINE_STAGES, PipelineStage, ActivityType } from '@/types';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

const activityIcons: Record<ActivityType, React.ElementType> = {
  call: PhoneCall,
  email: Mail,
  meeting: Users2,
  visit: MapPin,
  note: FileText,
};

export const PipelineView: React.FC = () => {
  const { state, navigateTo, openModal, getAccount, getContact, dispatch, showToast } = useApp();
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  const filtered = state.opportunities.filter((o) => {
    const account = getAccount(o.accountId);
    const matchSearch = !searchQuery || o.name.toLowerCase().includes(searchQuery.toLowerCase()) || o.description.toLowerCase().includes(searchQuery.toLowerCase()) || account?.companyName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStage = !stageFilter || o.stage === stageFilter;
    const matchPriority = !priorityFilter || o.priority === priorityFilter;
    return matchSearch && matchStage && matchPriority;
  });

  const totalValue = filtered.reduce((sum, o) => sum + (o.amount || 0), 0);
  const weightedValue = filtered.reduce((sum, o) => sum + (o.amount || 0) * (o.probability / 100), 0);
  const wonValue = filtered.filter((o) => o.stage === 'closed_won').reduce((sum, o) => sum + (o.amount || 0), 0);

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`¿Eliminar la oportunidad "${name}"?`)) {
      dispatch({ type: 'DELETE_OPPORTUNITY', payload: id });
      showToast('Oportunidad eliminada', 'warning');
    }
  };

  const handleStageChange = (oppId: string, newStage: PipelineStage) => {
    const opp = state.opportunities.find((o) => o.id === oppId);
    if (!opp) return;
    const stageConfig = PIPELINE_STAGES.find((s) => s.key === newStage);
    const isTerminal = newStage === 'closed_won' || newStage === 'closed_lost';
    dispatch({
      type: 'UPDATE_OPPORTUNITY',
      payload: {
        ...opp,
        stage: newStage,
        probability: stageConfig ? { lead: 10, qualified: 25, proposal: 50, negotiation: 75, on_hold: 30, closed_won: 100, closed_lost: 0 }[newStage] : opp.probability,
        actualCloseDate: isTerminal ? (opp.actualCloseDate || new Date().toISOString()) : null,
        updatedAt: new Date().toISOString(),
      },
    });
    showToast('Etapa actualizada', 'success');
  };

  return (
    <div className="animate-fade-in">
      <Header
        title="Pipeline"
        subtitle={`${filtered.length} oportunidad${filtered.length !== 1 ? 'es' : ''}`}
        onNew={() => openModal('opportunity-form')}
        newButtonLabel="Nueva Oportunidad"
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        extraActions={
          <div className="flex items-center gap-2">
            <select value={stageFilter} onChange={(e) => setStageFilter(e.target.value)} className="bg-[#2A2D35] border border-[#2E323A] rounded-lg px-3 py-2 text-sm text-[#F0F2F5] focus:outline-none focus:border-[#D4A824]">
              <option value="">Todas las etapas</option>
              {PIPELINE_STAGES.map((s) => (<option key={s.key} value={s.key}>{s.label}</option>))}
            </select>
            <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} className="bg-[#2A2D35] border border-[#2E323A] rounded-lg px-3 py-2 text-sm text-[#F0F2F5] focus:outline-none focus:border-[#D4A824]">
              <option value="">Todas las prioridades</option>
              <option value="low">Baja</option>
              <option value="medium">Media</option>
              <option value="high">Alta</option>
              <option value="urgent">Urgente</option>
            </select>
            <div className="flex bg-[#2A2D35] border border-[#2E323A] rounded-lg overflow-hidden">
              <button onClick={() => setViewMode('kanban')} className={`px-3 py-2 text-sm ${viewMode === 'kanban' ? 'bg-[#D4A824] text-[#0D0E12]' : 'text-[#A0A8B8]'}`}>Kanban</button>
              <button onClick={() => setViewMode('list')} className={`px-3 py-2 text-sm ${viewMode === 'list' ? 'bg-[#D4A824] text-[#0D0E12]' : 'text-[#A0A8B8]'}`}>Lista</button>
            </div>
          </div>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-[#22252D] border border-[#2E323A] rounded-xl p-5">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign size={16} className="text-[#D4A824]" />
            <span className="text-xs text-[#6B7280]">Valor total pipeline</span>
          </div>
          <p className="text-2xl font-bold text-[#F0F2F5]">${totalValue.toLocaleString('es-CL')}</p>
        </div>
        <div className="bg-[#22252D] border border-[#2E323A] rounded-xl p-5">
          <div className="flex items-center gap-2 mb-1">
            <Percent size={16} className="text-[#8B5CF6]" />
            <span className="text-xs text-[#6B7280]">Valor ponderado</span>
          </div>
          <p className="text-2xl font-bold text-[#F0F2F5]">${Math.round(weightedValue).toLocaleString('es-CL')}</p>
        </div>
        <div className="bg-[#22252D] border border-[#2E323A] rounded-xl p-5">
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 size={16} className="text-[#22C55E]" />
            <span className="text-xs text-[#6B7280]">Ganado</span>
          </div>
          <p className="text-2xl font-bold text-[#22C55E]">${wonValue.toLocaleString('es-CL')}</p>
        </div>
      </div>

      {viewMode === 'kanban' ? (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {PIPELINE_STAGES.filter((s) => !stageFilter || s.key === stageFilter).map((stage) => {
            const stageOpps = filtered.filter((o) => o.stage === stage.key);
            const stageValue = stageOpps.reduce((sum, o) => sum + (o.amount || 0), 0);
            return (
              <div key={stage.key} className="flex-shrink-0 w-[300px]">
                <div className={`flex items-center justify-between px-3 py-2 rounded-t-lg ${stage.bgColor}`}>
                  <span className={`text-sm font-semibold ${stage.color}`}>{stage.label}</span>
                  <span className={`text-xs ${stage.color} font-medium`}>{stageOpps.length}</span>
                </div>
                <div className="bg-[#22252D] border border-t-0 border-[#2E323A] rounded-b-lg p-2 space-y-2 max-h-[calc(100vh-340px)] overflow-y-auto">
                  {stageOpps.length === 0 && (
                    <p className="text-xs text-[#6B7280] text-center py-4">Sin oportunidades</p>
                  )}
                  {stageOpps.map((opp) => (
                    <OppCard key={opp.id} opp={opp} onStageChange={handleStageChange} onDelete={handleDelete} />
                  ))}
                  {stageValue > 0 && stageOpps.length > 0 && (
                    <div className="pt-2 border-t border-[#25282F] text-xs text-[#6B7280] text-right">
                      Total: ${stageValue.toLocaleString('es-CL')}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-[#22252D] border border-[#2E323A] rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#2E323A] bg-[#1E2128]">
                <th className="text-left text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider px-4 py-3">Nombre</th>
                <th className="text-left text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider px-4 py-3">Cuenta</th>
                <th className="text-left text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider px-4 py-3">Etapa</th>
                <th className="text-left text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider px-4 py-3">Monto</th>
                <th className="text-left text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider px-4 py-3">%</th>
                <th className="text-left text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider px-4 py-3">Cierre</th>
                <th className="text-left text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider px-4 py-3">Actividades</th>
                <th className="text-left text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider px-4 py-3">Prioridad</th>
                <th className="text-left text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((opp) => {
                const account = getAccount(opp.accountId);
                const stageCfg = PIPELINE_STAGES.find((s) => s.key === opp.stage);
                const priorityColors = { low: 'text-[#6B7280]', medium: 'text-[#3B82F6]', high: 'text-[#F59E0B]', urgent: 'text-[#EF4444]' };
                const priorityLabels = { low: 'Baja', medium: 'Media', high: 'Alta', urgent: 'Urgente' };
                const oppActCount = state.activities.filter((a) => a.opportunityId === opp.id).length;
                return (
                  <tr key={opp.id} className="border-b border-[#25282F] hover:bg-[#2D3139] transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-[#F0F2F5]">{opp.name}</td>
                    <td className="px-4 py-3 text-sm text-[#D4A824]">{account?.companyName || '-'}</td>
                    <td className="px-4 py-3">
                      <select value={opp.stage} onChange={(e) => handleStageChange(opp.id, e.target.value as PipelineStage)} className="bg-transparent text-xs text-[#F0F2F5] border border-[#2E323A] rounded px-1.5 py-0.5 focus:border-[#D4A824]">
                        {PIPELINE_STAGES.map((s) => (<option key={s.key} value={s.key} className="bg-[#22252D]">{s.label}</option>))}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-sm text-[#F0F2F5]">{opp.amount ? `$${opp.amount.toLocaleString('es-CL')}` : '-'}</td>
                    <td className="px-4 py-3 text-sm text-[#A0A8B8]">{opp.probability}%</td>
                    <td className="px-4 py-3 text-sm text-[#A0A8B8]">{opp.expectedCloseDate ? formatDate(opp.expectedCloseDate) : '-'}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => openModal('activity-form', null, opp.accountId, opp.contactId || null, opp.id, null)}
                        className="inline-flex items-center gap-1 text-xs text-[#A0A8B8] hover:text-[#D4A824] transition-colors"
                      >
                        <ClipboardList size={12} />
                        {oppActCount > 0 ? oppActCount : '+'}
                      </button>
                    </td>
                    <td className={`px-4 py-3 text-sm font-medium ${priorityColors[opp.priority]}`}>{priorityLabels[opp.priority]}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button onClick={() => openModal('opportunity-form', opp.id)} className="p-1 rounded text-[#A0A8B8] hover:text-[#D4A824]"><Pencil size={14} /></button>
                        <button onClick={() => handleDelete(opp.id, opp.name)} className="p-1 rounded text-[#A0A8B8] hover:text-[#EF4444]"><Trash2 size={14} /></button>
                      </div>
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
};

function OppCard({ opp, onStageChange, onDelete }: { opp: import('@/types').Opportunity; onStageChange: (id: string, stage: PipelineStage) => void; onDelete: (id: string, name: string) => void }) {
  const { state, navigateTo, openModal, getAccount, getContact } = useApp();
  const account = getAccount(opp.accountId);
  const contact = opp.contactId ? getContact(opp.contactId) : null;
  const stageCfg = PIPELINE_STAGES.find((s) => s.key === opp.stage);
  const oppActivities = state.activities.filter((a) => a.opportunityId === opp.id);

  const priorityBadge = {
    low: { label: 'B', color: 'bg-[#6B728015] text-[#6B7280]' },
    medium: { label: 'M', color: 'bg-[#3B82F615] text-[#3B82F6]' },
    high: { label: 'A', color: 'bg-[#F59E0B15] text-[#F59E0B]' },
    urgent: { label: 'U', color: 'bg-[#EF444415] text-[#EF4444]' },
  }[opp.priority];

  return (
    <div className="bg-[#1E2128] rounded-lg p-3 border border-[#2E323A] hover:border-[#3A3F48] transition-all group cursor-pointer" onClick={() => openModal('opportunity-form', opp.id)}>
      <div className="flex items-start justify-between mb-1.5">
        <h4 className="text-sm font-semibold text-[#F0F2F5] line-clamp-2 pr-1">{opp.name}</h4>
        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" onClick={(e) => e.stopPropagation()}>
          <button onClick={() => openModal('activity-form', null, opp.accountId, opp.contactId || null, opp.id, null)} className="p-0.5 rounded text-[#A0A8B8] hover:text-[#22C55E]" title="Nueva actividad"><Plus size={12} /></button>
          <button onClick={() => openModal('opportunity-form', opp.id)} className="p-0.5 rounded text-[#A0A8B8] hover:text-[#D4A824]"><Pencil size={12} /></button>
          <button onClick={() => onDelete(opp.id, opp.name)} className="p-0.5 rounded text-[#A0A8B8] hover:text-[#EF4444]"><Trash2 size={12} /></button>
        </div>
      </div>
      <p className="text-xs text-[#A0A8B8] mb-2 flex items-center gap-1"><Building2 size={10} /> {account?.companyName || '-'}</p>
      {contact && <p className="text-xs text-[#6B7280] mb-1.5">{contact.firstName} {contact.lastName}</p>}
      {opp.amount && (
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-sm font-bold text-[#D4A824]">${(opp.amount / 1000000).toFixed(1)}M</span>
          <span className="text-xs text-[#A0A8B8]">{opp.probability}%</span>
        </div>
      )}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold ${priorityBadge.color}`}>{priorityBadge.label}</span>
          {opp.expectedCloseDate && (
            <span className="flex items-center gap-0.5 text-[10px] text-[#6B7280]"><CalendarDays size={9} /> {formatDateShort(opp.expectedCloseDate)}</span>
          )}
        </div>
        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          {oppActivities.length > 0 && (
            <button
              onClick={() => navigateTo('account-detail', opp.accountId)}
              className="flex items-center gap-0.5 text-[10px] text-[#A0A8B8] hover:text-[#D4A824] transition-colors"
              title="Ver actividades"
            >
              <ClipboardList size={10} /> {oppActivities.length}
            </button>
          )}
          <select
            value={opp.stage}
            onChange={(e) => { e.stopPropagation(); onStageChange(opp.id, e.target.value as PipelineStage); }}
            className="bg-transparent text-[10px] text-[#A0A8B8] border border-[#2E323A] rounded px-1 py-0.5 focus:border-[#D4A824]"
          >
            {PIPELINE_STAGES.map((s) => (<option key={s.key} value={s.key} className="bg-[#22252D]">{s.label}</option>))}
          </select>
        </div>
      </div>
    </div>
  );
}

function formatDate(d: string) {
  try { return format(parseISO(d), 'dd MMM yyyy', { locale: es }); } catch { return d; }
}
function formatDateShort(d: string) {
  try { return format(parseISO(d), 'dd MMM', { locale: es }); } catch { return d; }
}
