import { useState } from 'react';
import {
  ClipboardList,
  PhoneCall,
  Mail,
  Users2,
  MapPin,
  FileText,
  CheckCircle,
  Pencil,
  Trash2,
  CalendarPlus,
  Bell,
  GitBranch,
  CornerDownRight,
  Target,
  Repeat,
} from 'lucide-react';
import { generateGoogleCalendarLink, formatReminderDate } from '@/utils/calendar';
import { useApp } from '@/context/AppContext';
import { Header } from '@/components/Header';
import { Badge } from '@/components/ui/Badge';
import { format, isToday, isYesterday, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Activity, ActivityType } from '@/types';

const activityIcons: Record<ActivityType, React.ElementType> = {
  call: PhoneCall,
  email: Mail,
  meeting: Users2,
  visit: MapPin,
  note: FileText,
};

const activityColors: Record<ActivityType, string> = {
  call: 'bg-[#3B82F615] text-[#3B82F6]',
  email: 'bg-[#22C55E15] text-[#22C55E]',
  meeting: 'bg-[#8B5CF615] text-[#8B5CF6]',
  visit: 'bg-[#F9731615] text-[#F97316]',
  note: 'bg-[#6B728015] text-[#6B7280]',
};

const typeLabels: Record<ActivityType, string> = {
  call: 'Llamada',
  email: 'Email',
  meeting: 'Reunión',
  visit: 'Visita',
  note: 'Nota',
};

function getDateGroup(dateStr: string): string {
  try {
    const date = parseISO(dateStr);
    if (isToday(date)) return 'Hoy';
    if (isYesterday(date)) return 'Ayer';
    return format(date, "dd 'de' MMMM yyyy", { locale: es });
  } catch {
    return 'Fecha desconocida';
  }
}

export const ActivitiesView: React.FC = () => {
  const { state, navigateTo, openModal, getAccount, getContact, dispatch, showToast } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [viewMode, setViewMode] = useState<'timeline' | 'table'>('timeline');

  const filtered = state.activities.filter((a) => {
    const matchSearch =
      !searchQuery ||
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchType = !typeFilter || a.type === typeFilter;
    const matchStatus = !statusFilter || a.status === statusFilter;
    return matchSearch && matchType && matchStatus;
  });

  const sortedActivities = [...filtered].sort(
    (a, b) => new Date(b.scheduledDate).getTime() - new Date(a.scheduledDate).getTime()
  );

  const grouped = sortedActivities.reduce<Record<string, Activity[]>>((acc, activity) => {
    const group = getDateGroup(activity.scheduledDate);
    if (!acc[group]) acc[group] = [];
    acc[group].push(activity);
    return acc;
  }, {});

  const handleComplete = (activity: Activity) => {
    dispatch({
      type: 'UPDATE_ACTIVITY',
      payload: { ...activity, status: 'completed', completedDate: new Date().toISOString(), updatedAt: new Date().toISOString() },
    });
    showToast('Actividad marcada como completada', 'success');
  };

  const handleEdit = (activityId: string) => {
    openModal('activity-form', activityId);
  };

  const handleDelete = (activity: Activity) => {
    if (window.confirm(`¿Eliminar la actividad "${activity.title}"?`)) {
      dispatch({ type: 'DELETE_ACTIVITY', payload: activity.id });
      showToast('Actividad eliminada', 'warning');
    }
  };

  return (
    <div className="animate-fade-in">
      <Header
        title="Actividades"
        subtitle={`${filtered.length} actividad${filtered.length !== 1 ? 'es' : ''}`}
        onNew={() => openModal('activity-form')}
        newButtonLabel="Nueva Actividad"
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        extraActions={
          <div className="flex items-center gap-2">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-[#2A2D35] border border-[#2E323A] rounded-lg px-3 py-2 text-sm text-[#F0F2F5] focus:outline-none focus:border-[#D4A824]"
            >
              <option value="">Todos los tipos</option>
              {(['call', 'email', 'meeting', 'visit', 'note'] as ActivityType[]).map((t) => (
                <option key={t} value={t}>{typeLabels[t]}</option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-[#2A2D35] border border-[#2E323A] rounded-lg px-3 py-2 text-sm text-[#F0F2F5] focus:outline-none focus:border-[#D4A824]"
            >
              <option value="">Todos los estados</option>
              <option value="pending">Pendiente</option>
              <option value="completed">Completada</option>
              <option value="cancelled">Cancelada</option>
            </select>
            <div className="flex bg-[#2A2D35] border border-[#2E323A] rounded-lg overflow-hidden">
              <button onClick={() => setViewMode('timeline')} className={`px-3 py-2 text-sm ${viewMode === 'timeline' ? 'bg-[#D4A824] text-[#0D0E12]' : 'text-[#A0A8B8]'}`}>T</button>
              <button onClick={() => setViewMode('table')} className={`px-3 py-2 text-sm ${viewMode === 'table' ? 'bg-[#D4A824] text-[#0D0E12]' : 'text-[#A0A8B8]'}`}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3h18v18H3z" /><path d="M3 9h18" /><path d="M3 15h18" /><path d="M9 3v18" /></svg>
              </button>
            </div>
          </div>
        }
      />

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <ClipboardList size={48} className="mx-auto text-[#3A3F48] mb-4" />
          <p className="text-[#6B7280]">No se encontraron actividades</p>
        </div>
      ) : viewMode === 'timeline' ? (
        <div className="space-y-8">
          {Object.entries(grouped).map(([group, activities]) => (
            <div key={group}>
              <h3 className="text-sm font-semibold text-[#A0A8B8] mb-3 sticky top-0 bg-[#181A20] py-2 z-10">{group}</h3>
              <div className="relative space-y-4 pl-6">
                <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-[#25282F]" />
                {activities.map((activity) => {
                  const Icon = activityIcons[activity.type];
                  const account = getAccount(activity.accountId);
                  const contact = activity.contactId ? getContact(activity.contactId) : null;
                  return (
                    <div key={activity.id} className="relative flex items-start gap-4 group">
                      <div className={`absolute -left-4 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${activityColors[activity.type]}`}>
                        <Icon size={14} />
                      </div>
                      <div className="flex-1 bg-[#22252D] border border-[#2E323A] rounded-lg p-4 hover:border-[#3A3F48] transition-colors">
                        {/* Parent reference */}
                        {activity.relatedActivityId && state.activities.find((a) => a.id === activity.relatedActivityId) && (
                          <div className="flex items-center gap-1 mb-2">
                            <CornerDownRight size={12} className="text-[#D4A824]" />
                            <span className="text-[11px] text-[#D4A824]">Seguimiento de: {state.activities.find((a) => a.id === activity.relatedActivityId)?.title}</span>
                          </div>
                        )}
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-semibold text-[#F0F2F5]">{activity.title}</h4>
                            {activity.isRecurring && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-[#3B82F6]/10 text-[#3B82F6] rounded text-[10px] font-medium">
                                <Repeat size={10} /> Cada {activity.recurringInterval}d
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <Badge variant={activity.status}>{activity.status === 'pending' ? 'Pendiente' : activity.status === 'completed' ? 'Completada' : 'Cancelada'}</Badge>
                            {/* Action buttons */}
                            <div className="flex items-center gap-0.5 ml-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => openModal('activity-form', null, activity.accountId, activity.contactId || null, activity.opportunityId || null, activity.id)} className="p-1 rounded text-[#A0A8B8] hover:text-[#8B5CF6] hover:bg-[#8B5CF6]/10 transition-colors" title="Crear seguimiento">
                                <GitBranch size={14} />
                              </button>
                              {generateGoogleCalendarLink(activity, account?.companyName, contact ? `${contact.firstName} ${contact.lastName}` : undefined) && (
                                <a
                                  href={generateGoogleCalendarLink(activity, account?.companyName, contact ? `${contact.firstName} ${contact.lastName}` : undefined)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1 rounded text-[#A0A8B8] hover:text-[#4285F4] hover:bg-[#4285F4]/10 transition-colors"
                                  title="Agregar a Google Calendar"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <CalendarPlus size={14} />
                                </a>
                              )}
                              <button onClick={() => handleEdit(activity.id)} className="p-1 rounded text-[#A0A8B8] hover:text-[#D4A824] hover:bg-[#D4A82415] transition-colors" title="Editar">
                                <Pencil size={14} />
                              </button>
                              {activity.status === 'pending' && (
                                <button onClick={() => handleComplete(activity)} className="p-1 rounded text-[#A0A8B8] hover:text-[#22C55E] hover:bg-[#22C55E15] transition-colors" title="Completar">
                                  <CheckCircle size={14} />
                                </button>
                              )}
                              <button onClick={() => handleDelete(activity)} className="p-1 rounded text-[#A0A8B8] hover:text-[#EF4444] hover:bg-[#EF4444]/10 transition-colors" title="Eliminar">
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        </div>
                        <p className="text-sm text-[#A0A8B8] mb-2">{activity.description}</p>
                        <div className="flex items-center gap-2 mb-2">
                          <button onClick={() => navigateTo('account-detail', activity.accountId)} className="text-xs text-[#D4A824] hover:underline">{account?.companyName}</button>
                          {contact && <span className="text-xs text-[#6B7280]">• {contact.firstName} {contact.lastName}</span>}
                        </div>
                        {activity.opportunityId && state.opportunities.find((o) => o.id === activity.opportunityId) && (
                          <div className="flex items-center gap-1 mb-2 text-xs text-[#8B5CF6]">
                            <Target size={10} />
                            <span>Opp: {state.opportunities.find((o) => o.id === activity.opportunityId)?.name}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-3">
                          <Badge variant={activity.type}>{typeLabels[activity.type]}</Badge>
                          <span className="text-xs text-[#6B7280]">{format(new Date(activity.scheduledDate), 'HH:mm', { locale: es })}</span>
                          {activity.duration && <span className="text-xs text-[#6B7280]">• {activity.duration} min</span>}
                        </div>
                        {activity.reminderDate && (
                          <div className="flex items-center gap-1 mt-2 text-xs text-[#F59E0B]">
                            <Bell size={10} />
                            <span>Recordatorio: {formatReminderDate(activity.reminderDate)}</span>
                          </div>
                        )}
                        {activity.outcome && (
                          <p className="mt-2 text-xs text-[#22C55E] bg-[#22C55E10] rounded px-2 py-1">{activity.outcome}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-[#22252D] border border-[#2E323A] rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#2E323A] bg-[#1E2128]">
                <th className="text-left text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider px-4 py-3">Tipo</th>
                <th className="text-left text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider px-4 py-3">Titulo</th>
                <th className="text-left text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider px-4 py-3">Cuenta</th>
                <th className="text-left text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider px-4 py-3">Contacto</th>
                <th className="text-left text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider px-4 py-3">Fecha</th>
                <th className="text-left text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider px-4 py-3">Estado</th>
                <th className="text-left text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider px-4 py-3">Recurrente</th>
                <th className="text-left text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider px-4 py-3">Recordatorio</th>
                <th className="text-left text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {sortedActivities.map((activity) => {
                const account = getAccount(activity.accountId);
                const contact = activity.contactId ? getContact(activity.contactId) : null;
                return (
                  <tr key={activity.id} className="border-b border-[#25282F] hover:bg-[#2D3139] transition-colors">
                    <td className="px-4 py-3"><Badge variant={activity.type}>{typeLabels[activity.type]}</Badge></td>
                    <td className="px-4 py-3 text-sm text-[#F0F2F5]">{activity.title}</td>
                    <td className="px-4 py-3 text-sm text-[#D4A824]">{account?.companyName || '-'}</td>
                    <td className="px-4 py-3 text-sm text-[#A0A8B8]">{contact ? `${contact.firstName} ${contact.lastName}` : '-'}</td>
                    <td className="px-4 py-3 text-sm text-[#A0A8B8]">{format(new Date(activity.scheduledDate), 'dd MMM HH:mm', { locale: es })}</td>
                    <td className="px-4 py-3"><Badge variant={activity.status}>{activity.status === 'pending' ? 'Pendiente' : activity.status === 'completed' ? 'Completada' : 'Cancelada'}</Badge></td>
                    <td className="px-4 py-3 text-xs text-[#3B82F6]">
                      {activity.isRecurring ? (
                        <span className="inline-flex items-center gap-1">
                          <Repeat size={10} /> Cada {activity.recurringInterval}d
                        </span>
                      ) : '-'}
                    </td>
                    <td className="px-4 py-3 text-xs text-[#F59E0B]">
                      {activity.reminderDate ? formatReminderDate(activity.reminderDate) : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {generateGoogleCalendarLink(activity, account?.companyName, contact ? `${contact.firstName} ${contact.lastName}` : undefined) && (
                          <a
                            href={generateGoogleCalendarLink(activity, account?.companyName, contact ? `${contact.firstName} ${contact.lastName}` : undefined)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 rounded text-[#A0A8B8] hover:text-[#4285F4] transition-colors"
                            title="Agregar a Google Calendar"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <CalendarPlus size={14} />
                          </a>
                        )}
                        <button onClick={() => handleEdit(activity.id)} className="p-1 rounded text-[#A0A8B8] hover:text-[#D4A824] transition-colors" title="Editar">
                          <Pencil size={14} />
                        </button>
                        {activity.status === 'pending' && (
                          <button onClick={() => handleComplete(activity)} className="p-1 rounded text-[#A0A8B8] hover:text-[#22C55E] transition-colors" title="Completar">
                            <CheckCircle size={14} />
                          </button>
                        )}
                        <button onClick={() => handleDelete(activity)} className="p-1 rounded text-[#A0A8B8] hover:text-[#EF4444] transition-colors" title="Eliminar">
                          <Trash2 size={14} />
                        </button>
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
