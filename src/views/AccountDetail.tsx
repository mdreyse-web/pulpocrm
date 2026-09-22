import { useState } from 'react';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Users,
  ClipboardList,
  FileText,
  Plus,
  Phone,
  Mail,
  MapPin,
  Globe,
  PhoneCall,
  Mail as MailIcon,
  Users2,
  MapPin as MapPinIcon,
  FileText as FileTextIcon,
  FolderKanban,
  X,
  Pencil,
  CheckCircle,
  CalendarPlus,
  Bell,
  GitBranch,
  CornerDownRight,
  Target,
  Repeat,
} from 'lucide-react';
import { generateGoogleCalendarLink, formatReminderDate } from '@/utils/calendar';
import { getDaysSinceLastActivity, getDaysSinceContactBadge } from '@/utils/contact';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Switch } from '@/components/ui/Switch';
import { Avatar } from '@/components/ui/Avatar';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ActivityType, PIPELINE_STAGES } from '@/types';

const activityIcons: Record<ActivityType, React.ElementType> = {
  call: PhoneCall,
  email: MailIcon,
  meeting: Users2,
  visit: MapPinIcon,
  note: FileTextIcon,
};

const activityColors: Record<ActivityType, string> = {
  call: 'bg-[#3B82F615] text-[#3B82F6]',
  email: 'bg-[#22C55E15] text-[#22C55E]',
  meeting: 'bg-[#8B5CF615] text-[#8B5CF6]',
  visit: 'bg-[#F9731615] text-[#F97316]',
  note: 'bg-[#6B728015] text-[#6B7280]',
};

const GOAL_PERIOD_LABELS: Record<string, string> = {
  monthly: 'Mensual',
  quarterly: 'Trimestral',
  annual: 'Anual',
};

const formatCLP = (n: number) => '$' + n.toLocaleString('es-CL');

// Rango de fechas del período en curso (mes, trimestre o año actual)
function getCurrentPeriodStart(period: 'monthly' | 'quarterly' | 'annual'): Date {
  const now = new Date();
  const start = new Date(now);
  if (period === 'monthly') {
    start.setDate(1);
  } else if (period === 'quarterly') {
    start.setMonth(Math.floor(now.getMonth() / 3) * 3, 1);
  } else {
    start.setMonth(0, 1);
  }
  start.setHours(0, 0, 0, 0);
  return start;
}

export const AccountDetail: React.FC = () => {
  const { state, dispatch, navigateTo, openModal, closeModal, getAccountContacts, getAccountActivities, removeAccountFromProject, showToast } = useApp();
  const [activeTab, setActiveTab] = useState<'contacts' | 'opportunities' | 'activities' | 'notes'>('contacts');
  const [showProjectPanel, setShowProjectPanel] = useState(false);
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);

  const account = state.selectedAccountId ? state.accounts.find((a) => a.id === state.selectedAccountId) : undefined;

  if (!account) {
    return (
      <div className="text-center py-16">
        <p className="text-[#6B7280]">Cuenta no encontrada</p>
        <Button variant="secondary" onClick={() => navigateTo('accounts')} className="mt-4">Volver a Cuentas</Button>
      </div>
    );
  }

  const contacts = getAccountContacts(account.id);
  const activities = getAccountActivities(account.id);
  const daysSince = getDaysSinceLastActivity(activities);
  const contactBadge = getDaysSinceContactBadge(daysSince);
  const accountProjects = account.projectIds.map((pid) => state.projects.find((p) => p.id === pid)).filter(Boolean);
  const availableProjects = state.projects.filter((p) => !account.projectIds.includes(p.id));

  // Progreso de la meta de venta: oportunidades ganadas en el período en curso
  const goalProgress = (() => {
    if (!account.salesGoalAmount || !account.salesGoalPeriod) return 0;
    const start = getCurrentPeriodStart(account.salesGoalPeriod);
    return state.opportunities
      .filter((o) => o.accountId === account.id && o.stage === 'closed_won')
      .filter((o) => new Date(o.actualCloseDate || o.updatedAt) >= start)
      .reduce((sum, o) => sum + (o.amount || 0), 0);
  })();
  const goalPercent = account.salesGoalAmount ? (goalProgress / account.salesGoalAmount) * 100 : 0;

  // Oportunidades de la cuenta y total vendido en el año en curso
  const accountOpportunities = state.opportunities.filter((o) => o.accountId === account.id);
  const yearStart = new Date(new Date().getFullYear(), 0, 1);
  const totalSoldYear = accountOpportunities
    .filter((o) => o.stage === 'closed_won' && new Date(o.actualCloseDate || o.updatedAt) >= yearStart)
    .reduce((sum, o) => sum + (o.amount || 0), 0);

  const handleDelete = () => {
    if (window.confirm(`¿Eliminar la cuenta "${account.companyName}"? Se eliminarán también todos sus contactos y actividades.`)) {
      dispatch({ type: 'DELETE_ACCOUNT', payload: account.id });
      showToast('Cuenta eliminada', 'warning');
      navigateTo('accounts');
    }
  };

  const handleStatusChange = (checked: boolean) => {
    dispatch({ type: 'UPDATE_ACCOUNT', payload: { ...account, status: checked ? 'active' : 'inactive', updatedAt: new Date().toISOString() } });
    showToast(`Cuenta ${checked ? 'activada' : 'desactivada'}`, 'success');
  };

  const handleAddProjects = () => {
    if (selectedProjectIds.length === 0) return;
    const now = new Date().toISOString();
    dispatch({
      type: 'UPDATE_ACCOUNT',
      payload: { ...account, projectIds: [...account.projectIds, ...selectedProjectIds], updatedAt: now },
    });
    showToast(`${selectedProjectIds.length} proyecto(s) asignado(s)`, 'success');
    setSelectedProjectIds([]);
    setShowProjectPanel(false);
  };

  const handleRemoveProject = (projectId: string, projectName: string) => {
    if (window.confirm(`¿Quitar esta cuenta del proyecto "${projectName}"?`)) {
      removeAccountFromProject(account.id, projectId);
      showToast('Cuenta removida del proyecto', 'success');
    }
  };

  const toggleProjectSelection = (projectId: string) => {
    setSelectedProjectIds((prev) =>
      prev.includes(projectId) ? prev.filter((id) => id !== projectId) : [...prev, projectId]
    );
  };

  const tabs = [
    { key: 'contacts' as const, label: `Contactos (${contacts.length})`, icon: Users },
    { key: 'opportunities' as const, label: `Oportunidades (${accountOpportunities.length})`, icon: GitBranch },
    { key: 'activities' as const, label: `Actividades (${activities.length})`, icon: ClipboardList },
    { key: 'notes' as const, label: 'Notas', icon: FileText },
  ];

  return (
    <div className="animate-fade-in">
      <button onClick={() => navigateTo('accounts')} className="flex items-center gap-1 text-sm text-[#A0A8B8] hover:text-[#D4A824] transition-colors mb-4">
        <ArrowLeft size={16} /> Cuentas
      </button>

      <div className="bg-[#22252D] border border-[#2E323A] rounded-xl p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-[#F0F2F5]">{account.companyName}</h1>
              <Badge variant={account.status}>{account.status === 'active' ? 'Activa' : 'Inactiva'}</Badge>
              <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${contactBadge.bgColor} ${contactBadge.color}`}>
                Último contacto: {contactBadge.text}
              </span>
            </div>
            <p className="text-sm text-[#D4A824]">{account.industry}</p>
          </div>
          <div className="flex items-center gap-3">
            <Switch checked={account.status === 'active'} onChange={handleStatusChange} label="Activa" />
            <Button variant="secondary" size="sm" leftIcon={<Edit size={14} />} onClick={() => openModal('account-form', account.id)}>Editar</Button>
            <Button variant="danger" size="sm" leftIcon={<Trash2 size={14} />} onClick={handleDelete}>Eliminar</Button>
          </div>
        </div>

        {/* Projects section */}
        <div className="mt-4 pt-4 border-t border-[#25282F]">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs text-[#6B7280] uppercase tracking-wider flex items-center gap-1"><FolderKanban size={12} /> Proyectos asociados ({accountProjects.length})</label>
            {availableProjects.length > 0 && (
              <button onClick={() => setShowProjectPanel(!showProjectPanel)} className="text-xs text-[#D4A824] hover:text-[#E8C545]">
                {showProjectPanel ? 'Cancelar' : '+ Agregar a proyecto'}
              </button>
            )}
          </div>

          {/* Show associated projects */}
          {accountProjects.length > 0 ? (
            <div className="flex flex-wrap gap-2 mb-2">
              {accountProjects.map((project) => (
                <span key={project!.id} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#D4A82415] text-[#D4A824] rounded-md text-xs font-medium">
                  <button onClick={() => navigateTo('project-detail', project!.id)} className="hover:underline">{project!.name}</button>
                  <button onClick={() => handleRemoveProject(project!.id, project!.name)} className="hover:text-[#EF4444]"><X size={12} /></button>
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-[#6B7280] mb-2">Sin proyectos asociados</p>
          )}

          {/* Add to project panel */}
          {showProjectPanel && availableProjects.length > 0 && (
            <div className="p-3 bg-[#1E2128] rounded-lg border border-[#D4A824]/20 mt-2">
              <div className="flex flex-wrap gap-2 mb-2">
                {availableProjects.map((project) => (
                  <label key={project.id} className={`flex items-center gap-1.5 px-2 py-1 rounded cursor-pointer text-xs transition-colors ${selectedProjectIds.includes(project.id) ? 'bg-[#D4A82415] text-[#D4A824]' : 'bg-[#2A2D35] text-[#A0A8B8] hover:bg-[#2D3139]'}`}>
                    <input type="checkbox" checked={selectedProjectIds.includes(project.id)} onChange={() => toggleProjectSelection(project.id)} className="w-3 h-3 accent-[#D4A824]" />
                    {project.name}
                  </label>
                ))}
              </div>
              <Button size="sm" onClick={handleAddProjects} disabled={selectedProjectIds.length === 0}>
                Asignar {selectedProjectIds.length > 0 && `(${selectedProjectIds.length})`}
              </Button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6 pt-6 border-t border-[#25282F]">
          {account.website && (
            <div>
              <label className="text-xs text-[#6B7280] uppercase tracking-wider">Sitio Web</label>
              <a href={`https://${account.website}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-sm text-[#D4A824] hover:underline mt-1">
                <Globe size={14} /> {account.website}
              </a>
            </div>
          )}
          {account.address && (
            <div>
              <label className="text-xs text-[#6B7280] uppercase tracking-wider">Dirección</label>
              <p className="flex items-center gap-1 text-sm text-[#F0F2F5] mt-1"><MapPin size={14} className="text-[#6B7280]" /> {account.address}, {account.city}</p>
            </div>
          )}
          {account.country && (
            <div>
              <label className="text-xs text-[#6B7280] uppercase tracking-wider">País</label>
              <p className="text-sm text-[#F0F2F5] mt-1">{account.country}</p>
            </div>
          )}
          {account.rut && (
            <div>
              <label className="text-xs text-[#6B7280] uppercase tracking-wider">RUT</label>
              <p className="text-sm text-[#F0F2F5] mt-1 font-mono">{account.rut}</p>
            </div>
          )}
          <div>
            <label className="text-xs text-[#6B7280] uppercase tracking-wider">Total vendido ({new Date().getFullYear()})</label>
            <p className="text-sm font-semibold text-[#22C55E] mt-1">{formatCLP(totalSoldYear)}</p>
          </div>
          {account.creditLimit != null && account.creditLimit > 0 && (
            <div>
              <label className="text-xs text-[#6B7280] uppercase tracking-wider">Línea de crédito</label>
              <p className="text-sm text-[#F0F2F5] mt-1">{formatCLP(account.creditLimit)}</p>
            </div>
          )}
          {account.salesGoalAmount != null && account.salesGoalAmount > 0 && account.salesGoalPeriod && (
            <div className="sm:col-span-2 lg:col-span-3">
              <label className="text-xs text-[#6B7280] uppercase tracking-wider flex items-center gap-1">
                <Target size={12} /> Meta de venta {GOAL_PERIOD_LABELS[account.salesGoalPeriod]?.toLowerCase()}
              </label>
              <div className="mt-2">
                <div className="flex items-baseline justify-between mb-1.5">
                  <p className="text-sm text-[#F0F2F5]">
                    <span className="font-semibold text-[#22C55E]">{formatCLP(goalProgress)}</span>
                    <span className="text-[#6B7280]"> de {formatCLP(account.salesGoalAmount)}</span>
                  </p>
                  <span className={`text-xs font-semibold ${goalPercent >= 100 ? 'text-[#22C55E]' : goalPercent >= 50 ? 'text-[#D4A824]' : 'text-[#A0A8B8]'}`}>
                    {Math.round(goalPercent)}%
                  </span>
                </div>
                <div className="h-2 w-full bg-[#1E2128] rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${goalPercent >= 100 ? 'bg-[#22C55E]' : 'bg-[#D4A824]'}`}
                    style={{ width: `${Math.min(goalPercent, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-[#6B7280] mt-1.5">Suma de oportunidades ganadas en el período en curso.</p>
              </div>
            </div>
          )}
          {account.description && (
            <div className="sm:col-span-2 lg:col-span-3">
              <label className="text-xs text-[#6B7280] uppercase tracking-wider">Descripción</label>
              <p className="text-sm text-[#A0A8B8] mt-1">{account.description}</p>
            </div>
          )}
        </div>
      </div>

      <div className="border-b border-[#25282F] mb-6">
        <div className="flex gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === tab.key ? 'text-[#D4A824] border-[#D4A824]' : 'text-[#A0A8B8] border-transparent hover:text-[#F0F2F5]'}`}>
                <Icon size={16} /> {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {activeTab === 'contacts' && (
        <div>
          <div className="flex justify-end mb-4">
            <Button onClick={() => openModal('contact-form')} leftIcon={<Plus size={16} />}>Nuevo Contacto</Button>
          </div>
          {contacts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {contacts.map((contact) => (
                <div key={contact.id} className="bg-[#22252D] border border-[#2E323A] rounded-xl p-5 hover:border-[#3A3F48] transition-all cursor-pointer" onClick={() => navigateTo('contact-detail', contact.id)}>
                  <div className="flex items-start gap-4">
                    <Avatar name={`${contact.firstName} ${contact.lastName}`} size="md" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-sm font-semibold text-[#F0F2F5]">{contact.firstName} {contact.lastName}</h4>
                        {contact.isPrimary && <Badge variant="primary">Principal</Badge>}
                      </div>
                      <p className="text-xs text-[#A0A8B8] mb-2">{contact.position || 'Sin cargo'}</p>
                      {contact.email && <p className="flex items-center gap-1 text-xs text-[#6B7280] mb-1"><Mail size={12} /> {contact.email}</p>}
                      {contact.phone && <p className="flex items-center gap-1 text-xs text-[#6B7280]"><Phone size={12} /> {contact.phone}</p>}
                    </div>
                    <Badge variant={contact.status}>{contact.status === 'active' ? 'Activo' : 'Inactivo'}</Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-[#22252D] border border-[#2E323A] rounded-xl">
              <Users size={40} className="mx-auto text-[#3A3F48] mb-3" />
              <p className="text-[#6B7280]">No hay contactos para esta cuenta</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'opportunities' && (
        <div>
          <div className="flex justify-end mb-4">
            <Button onClick={() => openModal('opportunity-form', null, account.id)} leftIcon={<Plus size={16} />}>Nueva Oportunidad</Button>
          </div>
          {accountOpportunities.length > 0 ? (
            <div className="space-y-3">
              {accountOpportunities.map((opp) => {
                const stageConfig = PIPELINE_STAGES.find((s) => s.key === opp.stage);
                return (
                  <div
                    key={opp.id}
                    className="bg-[#22252D] border border-[#2E323A] rounded-xl p-4 hover:border-[#3A3F48] transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center gap-3"
                    onClick={() => openModal('opportunity-form', opp.id)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h4 className="text-sm font-semibold text-[#F0F2F5]">{opp.name}</h4>
                        {stageConfig && (
                          <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${stageConfig.bgColor} ${stageConfig.color}`}>
                            {stageConfig.label}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#6B7280]">
                        Probabilidad {opp.probability}%
                        {opp.expectedCloseDate && ` · Cierre est. ${format(new Date(opp.expectedCloseDate), 'd MMM yyyy', { locale: es })}`}
                      </p>
                    </div>
                    <p className={`text-sm font-bold whitespace-nowrap ${opp.stage === 'closed_won' ? 'text-[#22C55E]' : opp.stage === 'closed_lost' ? 'text-[#EF4444] line-through' : 'text-[#F0F2F5]'}`}>
                      {opp.amount != null ? formatCLP(opp.amount) : '-'}
                    </p>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 bg-[#22252D] border border-[#2E323A] rounded-xl">
              <GitBranch size={40} className="mx-auto text-[#3A3F48] mb-3" />
              <p className="text-[#6B7280]">No hay oportunidades para esta cuenta</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'activities' && (
        <div>
          <div className="flex justify-end mb-4">
            <Button onClick={() => openModal('activity-form', null, account.id, null)} leftIcon={<Plus size={16} />}>Nueva Actividad</Button>
          </div>
          {activities.length > 0 ? (
            <div className="relative space-y-4 pl-6">
              <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-[#25282F]" />
              {activities.filter((a) => !a.relatedActivityId).map((activity) => (
                <ActivityTimelineItem key={activity.id} activity={activity} allActivities={activities} />
              ))}
              {/* Show orphaned follow-ups (whose parent was deleted) at the bottom */}
              {activities.filter((a) => a.relatedActivityId && !activities.find((parent) => parent.id === a.relatedActivityId)).length > 0 && (
                <div className="mt-6 pt-4 border-t border-[#2E323A]">
                  <p className="text-[11px] text-[#6B7280] uppercase tracking-wider mb-3">Seguimientos sin referencia</p>
                  {activities
                    .filter((a) => a.relatedActivityId && !activities.find((parent) => parent.id === a.relatedActivityId))
                    .map((activity) => (
                      <ActivityTimelineItem key={activity.id} activity={activity} allActivities={activities} />
                    ))}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 bg-[#22252D] border border-[#2E323A] rounded-xl">
              <ClipboardList size={40} className="mx-auto text-[#3A3F48] mb-3" />
              <p className="text-[#6B7280]">No hay actividades para esta cuenta</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'notes' && (
        <div className="bg-[#22252D] border border-[#2E323A] rounded-xl p-6">
          <h3 className="text-base font-semibold text-[#F0F2F5] mb-4">Notas de la Cuenta</h3>
          <textarea className="w-full bg-[#1E2128] border border-[#2E323A] rounded-lg px-4 py-3 text-sm text-[#F0F2F5] placeholder:text-[#6B7280] focus:outline-none focus:border-[#D4A824] focus:ring-[3px] focus:ring-[#D4A824]/15 min-h-[200px] resize-y" placeholder="Escribe notas generales sobre esta cuenta..." defaultValue={account.description} />
          <div className="flex justify-end mt-3">
            <Button variant="secondary" size="sm" onClick={() => showToast('Notas guardadas', 'success')}>Guardar Notas</Button>
          </div>
        </div>
      )}
    </div>
  );
};

function ActivityTimelineItem({ activity, allActivities }: { activity: import('@/types').Activity; allActivities: import('@/types').Activity[] }) {
  const { state, getContact, getActivity, openModal, dispatch, showToast } = useApp();
  const Icon = activityIcons[activity.type];
  const contact = activity.contactId ? getContact(activity.contactId) : null;
  const account = state.accounts.find((a) => a.id === activity.accountId);
  const opportunity = activity.opportunityId ? state.opportunities.find((o) => o.id === activity.opportunityId) : null;

  // Find activities that are follow-ups of this one
  const followUps = allActivities.filter((a) => a.relatedActivityId === activity.id);

  // Get parent activity if this is a follow-up
  const parentActivity = activity.relatedActivityId ? getActivity(activity.relatedActivityId) : null;

  const handleEdit = () => openModal('activity-form', activity.id);

  const handleDelete = () => {
    if (window.confirm(`¿Eliminar la actividad "${activity.title}"?`)) {
      dispatch({ type: 'DELETE_ACTIVITY', payload: activity.id });
      showToast('Actividad eliminada', 'warning');
    }
  };

  const handleComplete = () => {
    dispatch({
      type: 'UPDATE_ACTIVITY',
      payload: { ...activity, status: 'completed', completedDate: new Date().toISOString(), updatedAt: new Date().toISOString() },
    });
    showToast('Actividad marcada como completada', 'success');
  };

  const handleCreateFollowUp = () => {
    openModal('activity-form', null, activity.accountId, activity.contactId || null, activity.opportunityId || null, activity.id);
  };

  const calendarLink = generateGoogleCalendarLink(
    activity,
    account?.companyName,
    contact ? `${contact.firstName} ${contact.lastName}` : undefined
  );

  return (
    <div className="relative">
      <div className="flex items-start gap-4 group">
        <div className={`absolute -left-4 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${activityColors[activity.type]}`}>
          <Icon size={14} />
        </div>
        <div className="flex-1 bg-[#22252D] border border-[#2E323A] rounded-lg p-4 hover:border-[#3A3F48] transition-colors">
          {/* Parent reference badge */}
          {parentActivity && (
            <div className="flex items-center gap-1.5 mb-2 px-2 py-1 bg-[#D4A824]/5 rounded-md">
              <CornerDownRight size={12} className="text-[#D4A824]" />
              <span className="text-[11px] text-[#D4A824]">Seguimiento de: {parentActivity.title}</span>
            </div>
          )}

          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-semibold text-[#F0F2F5]">{activity.title}</h4>
              {followUps.length > 0 && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-[#D4A824]/10 text-[#D4A824] rounded text-[10px] font-medium">
                  <GitBranch size={10} /> {followUps.length} seguimiento{followUps.length > 1 ? 's' : ''}
                </span>
              )}
              {activity.isRecurring && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-[#3B82F6]/10 text-[#3B82F6] rounded text-[10px] font-medium">
                  <Repeat size={10} /> Cada {activity.recurringInterval}d
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <Badge variant={activity.status as 'pending' | 'completed' | 'cancelled'}>{activity.status === 'pending' ? 'Pendiente' : activity.status === 'completed' ? 'Completada' : 'Cancelada'}</Badge>
              <div className="flex items-center gap-0.5 ml-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={handleCreateFollowUp} className="p-1 rounded text-[#A0A8B8] hover:text-[#8B5CF6] hover:bg-[#8B5CF6]/10 transition-colors" title="Crear seguimiento">
                  <GitBranch size={14} />
                </button>
                {calendarLink && (
                  <a
                    href={calendarLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1 rounded text-[#A0A8B8] hover:text-[#4285F4] hover:bg-[#4285F4]/10 transition-colors"
                    title="Agregar a Google Calendar"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <CalendarPlus size={14} />
                  </a>
                )}
                <button onClick={handleEdit} className="p-1 rounded text-[#A0A8B8] hover:text-[#D4A824] hover:bg-[#D4A82415] transition-colors" title="Editar">
                  <Pencil size={14} />
                </button>
                {activity.status === 'pending' && (
                  <button onClick={handleComplete} className="p-1 rounded text-[#A0A8B8] hover:text-[#22C55E] hover:bg-[#22C55E15] transition-colors" title="Completar">
                    <CheckCircle size={14} />
                  </button>
                )}
                <button onClick={handleDelete} className="p-1 rounded text-[#A0A8B8] hover:text-[#EF4444] hover:bg-[#EF4444]/10 transition-colors" title="Eliminar">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
          <p className="text-sm text-[#A0A8B8] mb-2">{activity.description}</p>
          {contact && <p className="text-xs text-[#D4A824] mb-2">Con: {contact.firstName} {contact.lastName}</p>}
          {opportunity && (
            <div className="flex items-center gap-1 mb-2 text-xs text-[#8B5CF6]">
              <Target size={12} />
              <span>Opp: {opportunity.name}</span>
            </div>
          )}
          <div className="flex items-center gap-3 text-xs text-[#6B7280]">
            <span>{format(new Date(activity.scheduledDate), 'dd MMM yyyy HH:mm', { locale: es })}</span>
            {activity.duration && <span>• {activity.duration} min</span>}
          </div>
          {activity.reminderDate && (
            <div className="flex items-center gap-1 mt-2 text-xs text-[#F59E0B]">
              <Bell size={12} />
              <span>Recordatorio: {formatReminderDate(activity.reminderDate)}</span>
            </div>
          )}
          {activity.outcome && <p className="mt-2 text-xs text-[#22C55E] bg-[#22C55E10] rounded px-2 py-1">{activity.outcome}</p>}
        </div>
      </div>

      {/* Render follow-up activities indented */}
      {followUps.length > 0 && (
        <div className="ml-8 mt-3 space-y-3 relative">
          <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-[#D4A824]/20" />
          {followUps.map((followUp) => (
            <ActivityTimelineItem key={followUp.id} activity={followUp} allActivities={allActivities} />
          ))}
        </div>
      )}
    </div>
  );
}
