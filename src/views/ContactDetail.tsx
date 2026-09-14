import { ArrowLeft, Edit, Trash2, Mail, Phone, Smartphone, Building2, FileText, Plus, Pencil, CheckCircle, CalendarPlus, Bell, GitBranch, CornerDownRight, Target, MessageCircle, Repeat } from 'lucide-react';
import { generateGoogleCalendarLink, formatReminderDate } from '@/utils/calendar';
import { getWhatsAppLink, getDaysSinceLastActivity, getDaysSinceContactBadge } from '@/utils/contact';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Switch } from '@/components/ui/Switch';
import { Avatar } from '@/components/ui/Avatar';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ActivityType } from '@/types';

const activityIcons: Record<ActivityType, React.ElementType> = {
  call: Phone,
  email: Mail,
  meeting: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  visit: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
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

export const ContactDetail: React.FC = () => {
  const { state, dispatch, navigateTo, openModal, getContact, getAccount, getContactActivities, showToast } = useApp();

  const contact = state.selectedContactId ? getContact(state.selectedContactId) : undefined;

  if (!contact) {
    return (
      <div className="text-center py-16">
        <p className="text-[#6B7280]">Contacto no encontrado</p>
        <Button variant="secondary" onClick={() => navigateTo('contacts')} className="mt-4">Volver a Contactos</Button>
      </div>
    );
  }

  const account = getAccount(contact.accountId);
  const activities = getContactActivities(contact.id);
  const daysSince = getDaysSinceLastActivity(activities);
  const contactBadge = getDaysSinceContactBadge(daysSince);

  const handleDelete = () => {
    if (window.confirm(`¿Eliminar a "${contact.firstName} ${contact.lastName}"?`)) {
      dispatch({ type: 'DELETE_CONTACT', payload: contact.id });
      showToast('Contacto eliminado', 'warning');
      navigateTo('contacts');
    }
  };

  const handleStatusChange = (checked: boolean) => {
    dispatch({
      type: 'UPDATE_CONTACT',
      payload: { ...contact, status: checked ? 'active' : 'inactive', updatedAt: new Date().toISOString() },
    });
    showToast(`Contacto ${checked ? 'activado' : 'desactivado'}`, 'success');
  };

  return (
    <div className="animate-fade-in">
      <button onClick={() => navigateTo('contacts')} className="flex items-center gap-1 text-sm text-[#A0A8B8] hover:text-[#D4A824] transition-colors mb-4">
        <ArrowLeft size={16} /> Contactos
      </button>

      <div className="bg-[#22252D] border border-[#2E323A] rounded-xl p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Avatar name={`${contact.firstName} ${contact.lastName}`} size="xl" />
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl font-bold text-[#F0F2F5]">{contact.firstName} {contact.lastName}</h1>
                {contact.isPrimary && <Badge variant="primary">Contacto Principal</Badge>}
                <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${contactBadge.bgColor} ${contactBadge.color}`}>
                  Último contacto: {contactBadge.text}
                </span>
              </div>
              <p className="text-sm text-[#A0A8B8]">{contact.position || 'Sin cargo'} {contact.department && `• ${contact.department}`}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Switch checked={contact.status === 'active'} onChange={handleStatusChange} label="Activo" />
            <Button variant="secondary" size="sm" leftIcon={<Edit size={14} />} onClick={() => openModal('contact-form', contact.id)}>Editar</Button>
            <Button variant="danger" size="sm" leftIcon={<Trash2 size={14} />} onClick={handleDelete}>Eliminar</Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-[#22252D] border border-[#2E323A] rounded-xl p-6">
          <h3 className="text-base font-semibold text-[#F0F2F5] mb-4">Información de Contacto</h3>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#D4A82415] flex items-center justify-center"><Mail size={16} className="text-[#D4A824]" /></div>
              <div>
                <p className="text-xs text-[#6B7280]">Email</p>
                <a href={`mailto:${contact.email}`} className="text-sm text-[#F0F2F5] hover:text-[#D4A824]">{contact.email}</a>
              </div>
            </div>
            {contact.phone && (
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#22C55E15] flex items-center justify-center"><Phone size={16} className="text-[#22C55E]" /></div>
                <div>
                  <p className="text-xs text-[#6B7280]">Teléfono</p>
                  <a href={`tel:${contact.phone}`} className="text-sm text-[#F0F2F5]">{contact.phone}</a>
                </div>
              </div>
            )}
            {contact.mobile && (
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#3B82F615] flex items-center justify-center"><Smartphone size={16} className="text-[#3B82F6]" /></div>
                <div className="flex-1">
                  <p className="text-xs text-[#6B7280]">Celular</p>
                  <a href={`tel:${contact.mobile}`} className="text-sm text-[#F0F2F5]">{contact.mobile}</a>
                </div>
                <a
                  href={getWhatsAppLink(contact.mobile)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#22C55E]/15 text-[#22C55E] rounded-lg text-xs font-medium hover:bg-[#22C55E]/25 transition-colors"
                >
                  <MessageCircle size={13} />
                  WhatsApp
                </a>
              </div>
            )}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#8B5CF615] flex items-center justify-center"><Building2 size={16} className="text-[#8B5CF6]" /></div>
              <div>
                <p className="text-xs text-[#6B7280]">Cuenta</p>
                <button onClick={() => navigateTo('account-detail', contact.accountId)} className="text-sm text-[#D4A824] hover:underline">
                  {account?.companyName || 'Desconocida'}
                </button>
              </div>
            </div>
          </div>
          {contact.notes && (
            <div className="mt-4 pt-4 border-t border-[#25282F]">
              <p className="text-xs text-[#6B7280] mb-1">Notas</p>
              <p className="text-sm text-[#A0A8B8]">{contact.notes}</p>
            </div>
          )}
        </div>

        <div className="bg-[#22252D] border border-[#2E323A] rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-[#F0F2F5]">Actividades Relacionadas</h3>
            <Button variant="secondary" size="sm" onClick={() => openModal('activity-form', null, contact.accountId, contact.id)} leftIcon={<Plus size={14} />}>Nueva</Button>
          </div>
          {activities.length > 0 ? (
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
              {activities.map((activity) => {
                const Icon = activityIcons[activity.type];
                return (
                  <ContactActivityItem key={activity.id} activity={activity} Icon={Icon} />
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-[#6B7280] text-center py-8">No hay actividades para este contacto</p>
          )}
        </div>
      </div>
    </div>
  );
};

function ContactActivityItem({ activity, Icon }: { activity: import('@/types').Activity; Icon: React.ElementType }) {
  const { state, openModal, dispatch, showToast, getContact, getAccount, getActivity } = useApp();
  const contact = activity.contactId ? getContact(activity.contactId) : null;
  const account = getAccount(activity.accountId);
  const opportunity = activity.opportunityId ? state.opportunities.find((o) => o.id === activity.opportunityId) : null;
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
    <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-[#2D3139] transition-colors group">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${activityColors[activity.type]}`}>
        <Icon />
      </div>
      <div className="flex-1 min-w-0">
        {parentActivity && (
          <div className="flex items-center gap-1 mb-1">
            <CornerDownRight size={10} className="text-[#D4A824]" />
            <span className="text-[10px] text-[#D4A824]">Seguimiento de: {parentActivity.title}</span>
          </div>
        )}
        <div className="flex items-start justify-between">
          <p className="text-sm font-medium text-[#F0F2F5]">{activity.title}</p>
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={handleCreateFollowUp} className="p-1 rounded text-[#A0A8B8] hover:text-[#8B5CF6] hover:bg-[#8B5CF6]/10 transition-colors" title="Crear seguimiento">
              <GitBranch size={12} />
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
                <CalendarPlus size={12} />
              </a>
            )}
            <button onClick={handleEdit} className="p-1 rounded text-[#A0A8B8] hover:text-[#D4A824] hover:bg-[#D4A82415] transition-colors" title="Editar">
              <Pencil size={12} />
            </button>
            {activity.status === 'pending' && (
              <button onClick={handleComplete} className="p-1 rounded text-[#A0A8B8] hover:text-[#22C55E] hover:bg-[#22C55E15] transition-colors" title="Completar">
                <CheckCircle size={12} />
              </button>
            )}
            <button onClick={handleDelete} className="p-1 rounded text-[#A0A8B8] hover:text-[#EF4444] hover:bg-[#EF4444]/10 transition-colors" title="Eliminar">
              <Trash2 size={12} />
            </button>
          </div>
        </div>
        <p className="text-xs text-[#A0A8B8] line-clamp-2">{activity.description}</p>
        <div className="flex items-center gap-2 mt-1">
          <Badge variant={activity.type}>{typeLabels[activity.type]}</Badge>
          <Badge variant={activity.status as 'pending' | 'completed' | 'cancelled'}>{activity.status === 'pending' ? 'Pendiente' : activity.status === 'completed' ? 'Completada' : 'Cancelada'}</Badge>
          {activity.isRecurring && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-[#3B82F6]/10 text-[#3B82F6] rounded text-[10px] font-medium">
              <Repeat size={10} /> Cada {activity.recurringInterval}d
            </span>
          )}
        </div>
        <p className="text-xs text-[#6B7280] mt-1">
          {format(new Date(activity.scheduledDate), 'dd MMM yyyy HH:mm', { locale: es })}
          {activity.duration && <span> • {activity.duration} min</span>}
        </p>
        {opportunity && (
          <div className="flex items-center gap-1 mt-1 text-xs text-[#8B5CF6]">
            <Target size={10} />
            <span>Opp: {opportunity.name}</span>
          </div>
        )}
        {activity.reminderDate && (
          <div className="flex items-center gap-1 mt-1 text-xs text-[#F59E0B]">
            <Bell size={10} />
            <span>Recordatorio: {formatReminderDate(activity.reminderDate)}</span>
          </div>
        )}
      </div>
    </div>
  );
}
