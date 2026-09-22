import { Building2, Users, ClipboardList, CalendarClock, FolderKanban, CheckCircle2, BarChart3, DollarSign, Percent, TrendingUp, Bell, ArrowUpRight, ArrowDownRight, PhoneCall, Mail, MapPin, FileText } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Badge } from '@/components/ui/Badge';
import { PIPELINE_STAGES } from '@/types';
import { format, isToday, parseISO, isTomorrow } from 'date-fns';
import { es } from 'date-fns/locale';
import { ActivityType } from '@/types';

const lucideActivityIcons: Record<ActivityType, React.ElementType> = {
  call: PhoneCall,
  email: Mail,
  meeting: Users,
  visit: MapPin,
  note: FileText,
};

const activityColors: Record<ActivityType, string> = {
  call: 'bg-[#3B82F6]/10 text-[#3B82F6]',
  email: 'bg-[#22C55E]/10 text-[#22C55E]',
  meeting: 'bg-[#8B5CF6]/10 text-[#8B5CF6]',
  visit: 'bg-[#F97316]/10 text-[#F97316]',
  note: 'bg-[#6B7280]/10 text-[#6B7280]',
};

const typeLabels: Record<ActivityType, string> = {
  call: 'Llamada',
  email: 'Email',
  meeting: 'Reunión',
  visit: 'Visita',
  note: 'Nota',
};

function getUpcomingLabel(dateStr: string): string {
  try {
    const date = parseISO(dateStr);
    if (isToday(date)) return 'Hoy';
    if (isTomorrow(date)) return 'Mañana';
    return format(date, "dd MMM", { locale: es });
  } catch {
    return '';
  }
}

export const DashboardView: React.FC = () => {
  const { state, navigateTo, openModal, getAccount, getContact } = useApp();

  const totalAccounts = state.accounts.length;
  const activeAccounts = state.accounts.filter((a) => a.status === 'active').length;
  const totalContacts = state.contacts.length;
  const totalProjects = state.projects.length;
  const pendingActivities = state.activities.filter((a) => a.status === 'pending').length;
  const todayActivities = state.activities.filter((a) => { try { return isToday(parseISO(a.scheduledDate)); } catch { return false; } }).length;

  // Pipeline KPIs
  const opps = state.opportunities;
  const openOpps = opps.filter((o) => o.stage !== 'closed_won' && o.stage !== 'closed_lost');
  const totalPipelineValue = openOpps.reduce((sum, o) => sum + (o.amount || 0), 0);
  const weightedPipelineValue = openOpps.reduce((sum, o) => sum + (o.amount || 0) * (o.probability / 100), 0);
  const wonValue = opps.filter((o) => o.stage === 'closed_won').reduce((sum, o) => sum + (o.amount || 0), 0);

  const activitiesByType = {
    call: state.activities.filter((a) => a.type === 'call').length,
    email: state.activities.filter((a) => a.type === 'email').length,
    meeting: state.activities.filter((a) => a.type === 'meeting').length,
    visit: state.activities.filter((a) => a.type === 'visit').length,
    note: state.activities.filter((a) => a.type === 'note').length,
  };
  const maxActivities = Math.max(...Object.values(activitiesByType), 1);

  const recentActivities = [...state.activities].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 6);
  const upcomingActivities = state.activities
    .filter((a) => a.status === 'pending')
    .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime())
    .slice(0, 6);

  // Pipeline by stage
  const stageCounts = PIPELINE_STAGES.map((s) => ({
    ...s,
    count: opps.filter((o) => o.stage === s.key).length,
    value: opps.filter((o) => o.stage === s.key).reduce((sum, o) => sum + (o.amount || 0), 0),
  }));
  const maxStageCount = Math.max(...stageCounts.map((s) => s.count), 1);
  const maxStageValue = Math.max(...stageCounts.map((s) => s.value), 1);

  return (
    <div className="animate-fade-in">
      {/* Welcome Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-[#F0F2F5] tracking-tight">Dashboard</h2>
        <p className="text-sm text-[#6B7280] mt-1">
          Resumen de tu pipeline, cuentas y actividades
        </p>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {/* Pipeline Value */}
        <div className="group relative bg-[#22252D] border border-[#ffffff]/[0.06] rounded-2xl p-5 hover:border-[#D4A824]/30 transition-all duration-300 overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#D4A824]/5 rounded-full -translate-y-8 translate-x-8 group-hover:bg-[#D4A824]/10 transition-colors" />
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#D4A824]/10 flex items-center justify-center">
                <DollarSign size={20} className="text-[#D4A824]" />
              </div>
              <Badge variant="active">{openOpps.length} abiertas</Badge>
            </div>
            <p className="text-2xl font-bold text-[#F0F2F5] tracking-tight">
              ${totalPipelineValue > 0 ? (totalPipelineValue / 1000000).toFixed(1) + 'M' : '0'}
            </p>
            <p className="text-xs text-[#6B7280] mt-1 font-medium">Valor pipeline</p>
          </div>
        </div>

        {/* Weighted Value */}
        <div className="group relative bg-[#22252D] border border-[#ffffff]/[0.06] rounded-2xl p-5 hover:border-[#8B5CF6]/30 transition-all duration-300 overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#8B5CF6]/5 rounded-full -translate-y-8 translate-x-8 group-hover:bg-[#8B5CF6]/10 transition-colors" />
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#8B5CF6]/10 flex items-center justify-center">
                <Percent size={20} className="text-[#8B5CF6]" />
              </div>
            </div>
            <p className="text-2xl font-bold text-[#F0F2F5] tracking-tight">
              ${weightedPipelineValue > 0 ? (weightedPipelineValue / 1000000).toFixed(1) + 'M' : '0'}
            </p>
            <p className="text-xs text-[#6B7280] mt-1 font-medium">Valor ponderado</p>
          </div>
        </div>

        {/* Won Value */}
        <div className="group relative bg-[#22252D] border border-[#ffffff]/[0.06] rounded-2xl p-5 hover:border-[#22C55E]/30 transition-all duration-300 overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#22C55E]/5 rounded-full -translate-y-8 translate-x-8 group-hover:bg-[#22C55E]/10 transition-colors" />
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#22C55E]/10 flex items-center justify-center">
                <TrendingUp size={20} className="text-[#22C55E]" />
              </div>
            </div>
            <p className="text-2xl font-bold text-[#22C55E] tracking-tight">
              ${wonValue > 0 ? (wonValue / 1000000).toFixed(1) + 'M' : '0'}
            </p>
            <p className="text-xs text-[#6B7280] mt-1 font-medium">Ganado</p>
          </div>
        </div>

        {/* Pending Activities */}
        <div className="group relative bg-[#22252D] border border-[#ffffff]/[0.06] rounded-2xl p-5 hover:border-[#F59E0B]/30 transition-all duration-300 overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#F59E0B]/5 rounded-full -translate-y-8 translate-x-8 group-hover:bg-[#F59E0B]/10 transition-colors" />
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#F59E0B]/10 flex items-center justify-center">
                <ClipboardList size={20} className="text-[#F59E0B]" />
              </div>
              <Badge variant="pending">{todayActivities} hoy</Badge>
            </div>
            <p className="text-2xl font-bold text-[#F0F2F5] tracking-tight">{pendingActivities}</p>
            <p className="text-xs text-[#6B7280] mt-1 font-medium">Actividades pendientes</p>
          </div>
        </div>
      </div>

      {/* Secondary Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <div className="bg-[#22252D]/60 border border-[#ffffff]/[0.04] rounded-xl p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#D4A824]/10 flex items-center justify-center">
            <Building2 size={17} className="text-[#D4A824]" />
          </div>
          <div>
            <p className="text-lg font-bold text-[#F0F2F5]">{totalAccounts}</p>
            <p className="text-[11px] text-[#6B7280]">{activeAccounts} activas</p>
          </div>
        </div>
        <div className="bg-[#22252D]/60 border border-[#ffffff]/[0.04] rounded-xl p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#3B82F6]/10 flex items-center justify-center">
            <Users size={17} className="text-[#3B82F6]" />
          </div>
          <div>
            <p className="text-lg font-bold text-[#F0F2F5]">{totalContacts}</p>
            <p className="text-[11px] text-[#6B7280]">Contactos</p>
          </div>
        </div>
        <div className="bg-[#22252D]/60 border border-[#ffffff]/[0.04] rounded-xl p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#8B5CF6]/10 flex items-center justify-center">
            <FolderKanban size={17} className="text-[#8B5CF6]" />
          </div>
          <div>
            <p className="text-lg font-bold text-[#F0F2F5]">{totalProjects}</p>
            <p className="text-[11px] text-[#6B7280]">Proyectos</p>
          </div>
        </div>
        <div className="bg-[#22252D]/60 border border-[#ffffff]/[0.04] rounded-xl p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#22C55E]/10 flex items-center justify-center">
            <CalendarClock size={17} className="text-[#22C55E]" />
          </div>
          <div>
            <p className="text-lg font-bold text-[#F0F2F5]">{todayActivities}</p>
            <p className="text-[11px] text-[#6B7280]">Para hoy</p>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Upcoming Activities - Takes 2 columns */}
        <div className="lg:col-span-2 bg-[#22252D] border border-[#ffffff]/[0.06] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base font-semibold text-[#F0F2F5]">Próximas Actividades</h3>
              <p className="text-xs text-[#6B7280] mt-0.5">{upcomingActivities.length} pendientes</p>
            </div>
            <button
              onClick={() => navigateTo('activities')}
              className="text-xs text-[#D4A824] hover:text-[#E8C545] font-medium flex items-center gap-1 transition-colors"
            >
              Ver todas <ArrowUpRight size={14} />
            </button>
          </div>

          {upcomingActivities.length > 0 ? (
            <div className="space-y-2">
              {upcomingActivities.map((act) => {
                const Icon = lucideActivityIcons[act.type];
                const account = getAccount(act.accountId);
                const contact = act.contactId ? getContact(act.contactId) : null;
                const upcomingLabel = getUpcomingLabel(act.scheduledDate);
                const isUrgent = isToday(parseISO(act.scheduledDate));

                return (
                  <div
                    key={act.id}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#ffffff]/[0.03] transition-colors cursor-pointer group"
                    onClick={() => navigateTo('account-detail', act.accountId)}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${activityColors[act.type]}`}>
                      <Icon size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#F0F2F5] truncate group-hover:text-[#D4A824] transition-colors">
                        {act.title}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-[#D4A824]">{account?.companyName}</span>
                        {contact && (
                          <span className="text-xs text-[#6B7280]">• {contact.firstName} {contact.lastName}</span>
                        )}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <Badge variant={isUrgent ? 'urgent' : 'pending'} className="text-[10px]">
                        {upcomingLabel}
                      </Badge>
                      <p className="text-[11px] text-[#6B7280] mt-1">
                        {format(new Date(act.scheduledDate), 'HH:mm', { locale: es })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-10">
              <CheckCircle2 size={32} className="mx-auto text-[#3A3F48] mb-3" />
              <p className="text-sm text-[#6B7280]">No hay actividades pendientes</p>
              <button
                onClick={() => openModal('activity-form')}
                className="text-xs text-[#D4A824] hover:text-[#E8C545] mt-2 font-medium"
              >
                Crear actividad
              </button>
            </div>
          )}
        </div>

        {/* Activities by Type */}
        <div className="bg-[#22252D] border border-[#ffffff]/[0.06] rounded-2xl p-6">
          <h3 className="text-base font-semibold text-[#F0F2F5] mb-5">Actividades por Tipo</h3>
          <div className="space-y-3">
            {(Object.entries(activitiesByType) as [ActivityType, number][]).map(([type, count]) => {
              const Icon = lucideActivityIcons[type];
              const label = { call: 'Llamadas', email: 'Emails', meeting: 'Reuniones', visit: 'Visitas', note: 'Notas' }[type];
              const width = `${(count / maxActivities) * 100}%`;
              return (
                <div key={type} className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${activityColors[type]}`}>
                    <Icon size={14} />
                  </div>
                  <span className="text-sm text-[#A0A8B8] w-24">{label}</span>
                  <div className="flex-1 h-5 bg-[#1E2128] rounded-md overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#D4A824] to-[#E8C545] rounded-md transition-all duration-500"
                      style={{ width }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-[#F0F2F5] w-8 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Pipeline + Recent Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pipeline by Stage */}
        <div className="bg-[#22252D] border border-[#ffffff]/[0.06] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-semibold text-[#F0F2F5]">Pipeline por Etapa</h3>
            <button
              onClick={() => navigateTo('pipeline')}
              className="text-xs text-[#D4A824] hover:text-[#E8C545] font-medium flex items-center gap-1 transition-colors"
            >
              Ver pipeline <ArrowUpRight size={14} />
            </button>
          </div>
          <div className="space-y-3">
            {stageCounts
              .filter((s) => s.count > 0)
              .map((s) => (
                <div key={s.key} className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${s.bgColor}`}>
                    <span className={`text-xs font-bold ${s.color}`}>{s.count}</span>
                  </div>
                  <span className="text-sm text-[#A0A8B8] w-28 font-medium">{s.label}</span>
                  <div className="flex-1 h-5 bg-[#1E2128] rounded-lg overflow-hidden">
                    <div
                      className="h-full rounded-lg transition-all duration-500"
                      style={{
                        width: `${(s.count / maxStageCount) * 100}%`,
                        background: s.key === 'closed_won' ? '#22C55E' : s.key === 'closed_lost' ? '#EF4444' : '#D4A824',
                      }}
                    />
                  </div>
                  <span className="text-xs text-[#6B7280] w-20 text-right font-medium">
                    {s.value > 0 ? `$${(s.value / 1000000).toFixed(1)}M` : '-'}
                  </span>
                </div>
              ))}
            {stageCounts.every((s) => s.count === 0) && (
              <p className="text-sm text-[#6B7280] text-center py-4">Sin oportunidades en el pipeline</p>
            )}
          </div>
        </div>

        {/* Recent Activities */}
        <div className="bg-[#22252D] border border-[#ffffff]/[0.06] rounded-2xl p-6">
          <h3 className="text-base font-semibold text-[#F0F2F5] mb-4">Actividades Recientes</h3>
          {recentActivities.length > 0 ? (
            <div className="space-y-1">
              {recentActivities.map((act) => {
                const Icon = lucideActivityIcons[act.type];
                const account = getAccount(act.accountId);
                const contact = act.contactId ? getContact(act.contactId) : null;
                return (
                  <div
                    key={act.id}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#ffffff]/[0.03] transition-colors cursor-pointer group"
                    onClick={() => navigateTo('account-detail', act.accountId)}
                  >
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${activityColors[act.type]}`}>
                      <Icon size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#F0F2F5] truncate group-hover:text-[#D4A824] transition-colors">
                        {act.title}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-[#D4A824]">{account?.companyName}</span>
                        {contact && (
                          <span className="text-xs text-[#6B7280]">• {contact.firstName} {contact.lastName}</span>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-[#6B7280] whitespace-nowrap">
                      {format(new Date(act.createdAt), 'dd MMM', { locale: es })}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-[#6B7280] text-center py-4">No hay actividades recientes</p>
          )}
        </div>
      </div>
    </div>
  );
};
