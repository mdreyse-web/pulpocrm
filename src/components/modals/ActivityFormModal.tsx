import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { ActivityType, ActivityStatus } from '@/types';
import { generateGoogleCalendarLink } from '@/utils/calendar';
import { CalendarPlus, GitBranch, Link2, Repeat } from 'lucide-react';

interface FormErrors {
  title?: string;
  type?: string;
  accountId?: string;
  scheduledDate?: string;
}

const typeOptions = [
  { value: '', label: 'Seleccionar tipo' },
  { value: 'call', label: 'Llamada' },
  { value: 'email', label: 'Email' },
  { value: 'meeting', label: 'Reunión' },
  { value: 'visit', label: 'Visita' },
  { value: 'note', label: 'Nota' },
];

const statusOptions = [
  { value: 'pending', label: 'Pendiente' },
  { value: 'completed', label: 'Completada' },
  { value: 'cancelled', label: 'Cancelada' },
];

export const ActivityFormModal: React.FC = () => {
  const { state, dispatch, closeModal, showToast, getActivity, getAccount, getContact } = useApp();
  const isOpen = state.modalOpen === 'activity-form';
  const editingId = state.editingId;
  const editing = editingId ? getActivity(editingId) : null;
  const preselectedAccountId = state.modalPreselectedAccountId;
  const preselectedContactId = state.modalPreselectedContactId;
  const preselectedOpportunityId = state.modalPreselectedOpportunityId;
  const preselectedRelatedActivityId = state.modalPreselectedRelatedActivityId;

  const [form, setForm] = useState({
    type: '' as string,
    title: '',
    description: '',
    accountId: '',
    contactId: '' as string,
    opportunityId: '' as string,
    scheduledDate: '',
    status: 'pending' as ActivityStatus,
    duration: '',
    outcome: '',
    reminderDate: '' as string,
    isRecurring: false,
    recurringInterval: '7',
    recurringEndDate: '' as string,
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Get related activity info for display
  const relatedActivity = preselectedRelatedActivityId ? getActivity(preselectedRelatedActivityId) : null;
  const relatedAccount = relatedActivity ? getAccount(relatedActivity.accountId) : null;
  const relatedContact = relatedActivity?.contactId ? getContact(relatedActivity.contactId) : null;

  useEffect(() => {
    if (editing) {
      setForm({
        type: editing.type,
        title: editing.title,
        description: editing.description,
        accountId: editing.accountId,
        contactId: editing.contactId || '',
        opportunityId: editing.opportunityId || '',
        scheduledDate: editing.scheduledDate.slice(0, 16),
        status: editing.status,
        duration: editing.duration?.toString() || '',
        outcome: editing.outcome,
        reminderDate: editing.reminderDate ? editing.reminderDate.slice(0, 16) : '',
        isRecurring: editing.isRecurring ?? false,
        recurringInterval: editing.recurringInterval?.toString() || '7',
        recurringEndDate: editing.recurringEndDate ? editing.recurringEndDate.slice(0, 10) : '',
      });
    } else if (relatedActivity) {
      // Cloning from an existing activity - pre-fill fields
      const now = new Date();
      now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
      setForm({
        type: relatedActivity.type,
        title: `Seguimiento: ${relatedActivity.title}`,
        description: `Ref: Actividad previa del ${new Date(relatedActivity.scheduledDate).toLocaleDateString('es-CL')}\n\n${relatedActivity.description}`,
        accountId: relatedActivity.accountId,
        contactId: relatedActivity.contactId || '',
        opportunityId: relatedActivity.opportunityId || preselectedOpportunityId || '',
        scheduledDate: now.toISOString().slice(0, 16),
        status: 'pending',
        duration: relatedActivity.duration?.toString() || '',
        outcome: '',
        reminderDate: '',
        isRecurring: false,
        recurringInterval: '7',
        recurringEndDate: '',
      });
    } else {
      const now = new Date();
      now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
      setForm({
        type: '',
        title: '',
        description: '',
        accountId: preselectedAccountId || '',
        contactId: preselectedContactId || '',
        opportunityId: preselectedOpportunityId || '',
        scheduledDate: now.toISOString().slice(0, 16),
        status: 'pending',
        duration: '',
        outcome: '',
        reminderDate: '',
        isRecurring: false,
        recurringInterval: '7',
        recurringEndDate: '',
      });
    }
    setErrors({});
    setTouched({});
  }, [editing, isOpen, preselectedAccountId, preselectedContactId, preselectedOpportunityId, preselectedRelatedActivityId]);

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!form.type) newErrors.type = 'El tipo es obligatorio';
    if (!form.title.trim()) newErrors.title = 'El título es obligatorio';
    if (!form.accountId) newErrors.accountId = 'Debes seleccionar una cuenta';
    if (!form.scheduledDate) newErrors.scheduledDate = 'La fecha es obligatoria';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      showToast('Por favor corrige los errores del formulario', 'error');
      return;
    }

    const now = new Date().toISOString();
    const payload = {
      type: form.type as ActivityType,
      title: form.title.trim(),
      description: form.description.trim(),
      accountId: form.accountId,
      contactId: form.contactId || null,
      opportunityId: form.opportunityId || null,
      relatedActivityId: editing ? null : (preselectedRelatedActivityId || null),
      scheduledDate: new Date(form.scheduledDate).toISOString(),
      status: form.status as ActivityStatus,
      duration: form.duration ? parseInt(form.duration) : null,
      outcome: form.status === 'completed' ? form.outcome.trim() : '',
      reminderDate: form.reminderDate ? new Date(form.reminderDate).toISOString() : null,
      isRecurring: form.isRecurring,
      recurringInterval: form.isRecurring ? parseInt(form.recurringInterval) || 7 : null,
      recurringEndDate: form.isRecurring && form.recurringEndDate ? new Date(form.recurringEndDate).toISOString() : null,
    };

    if (editing) {
      dispatch({
        type: 'UPDATE_ACTIVITY',
        payload: {
          ...editing,
          ...payload,
          relatedActivityId: editing.relatedActivityId,
          completedDate: form.status === 'completed' ? now : editing.completedDate,
          updatedAt: now,
        },
      });
      showToast('Actividad actualizada correctamente', 'success');
    } else {
      dispatch({
        type: 'ADD_ACTIVITY',
        payload: {
          id: crypto.randomUUID(),
          ...payload,
          completedDate: form.status === 'completed' ? now : null,
          createdAt: now,
          updatedAt: now,
        },
      });
      showToast(relatedActivity ? 'Actividad de seguimiento creada' : 'Actividad creada correctamente', 'success');
    }
    closeModal();
  };

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (touched[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field as keyof FormErrors];
        return next;
      });
    }
  };

  const accountOptions = state.accounts.map((a) => ({ value: a.id, label: a.companyName }));
  const selectedAccountContacts = state.contacts.filter((c) => c.accountId === form.accountId);
  const contactOptions = [
    { value: '', label: 'Sin contacto específico' },
    ...selectedAccountContacts.map((c) => ({
      value: c.id,
      label: `${c.firstName} ${c.lastName} (${c.position || 'Sin cargo'})`,
    })),
  ];

  // Filter opportunities for the selected account
  const accountOpportunities = state.opportunities.filter((o) => o.accountId === form.accountId);
  const opportunityOptions = [
    { value: '', label: 'Sin oportunidad' },
    ...accountOpportunities.map((o) => ({
      value: o.id,
      label: `${o.name} (${o.stage})`,
    })),
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={closeModal}
      title={editing ? 'Editar Actividad' : relatedActivity ? 'Crear Seguimiento' : 'Nueva Actividad'}
    >
      {/* Related activity reference banner */}
      {relatedActivity && (
        <div className="mb-4 p-3 bg-[#D4A824]/5 border border-[#D4A824]/20 rounded-xl">
          <div className="flex items-center gap-2 text-xs text-[#D4A824] mb-1">
            <GitBranch size={14} />
            <span className="font-semibold">Creando seguimiento de:</span>
          </div>
          <p className="text-sm text-[#F0F2F5] font-medium">{relatedActivity.title}</p>
          <div className="flex items-center gap-2 mt-1 text-xs text-[#6B7280]">
            <span>{relatedAccount?.companyName}</span>
            {relatedContact && <span>• {relatedContact.firstName} {relatedContact.lastName}</span>}
            <span>• {new Date(relatedActivity.scheduledDate).toLocaleDateString('es-CL')}</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Tipo"
            value={form.type}
            onChange={(e) => updateField('type', e.target.value)}
            onBlur={() => handleBlur('type')}
            error={touched.type ? errors.type : undefined}
            required
            options={typeOptions}
          />
          <Select
            label="Estado"
            value={form.status}
            onChange={(e) => updateField('status', e.target.value)}
            options={statusOptions}
          />
        </div>

        <Input
          label="Título"
          value={form.title}
          onChange={(e) => updateField('title', e.target.value)}
          onBlur={() => handleBlur('title')}
          error={touched.title ? errors.title : undefined}
          required
          placeholder="Ej: Reunión de seguimiento"
        />

        <Textarea
          label="Descripción"
          value={form.description}
          onChange={(e) => updateField('description', e.target.value)}
          placeholder="Detalles de la actividad..."
        />

        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Cuenta"
            value={form.accountId}
            onChange={(e) => updateField('accountId', e.target.value)}
            onBlur={() => handleBlur('accountId')}
            error={touched.accountId ? errors.accountId : undefined}
            required
            options={[{ value: '', label: 'Seleccionar cuenta' }, ...accountOptions]}
          />
          <Select
            label="Contacto (opcional)"
            value={form.contactId}
            onChange={(e) => updateField('contactId', e.target.value)}
            options={contactOptions}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Oportunidad (opcional)"
            value={form.opportunityId}
            onChange={(e) => updateField('opportunityId', e.target.value)}
            options={form.accountId ? opportunityOptions : [{ value: '', label: 'Selecciona una cuenta primero' }]}
          />
          <Input
            label="Duración (minutos)"
            type="number"
            value={form.duration}
            onChange={(e) => updateField('duration', e.target.value)}
            placeholder="Ej: 30"
            min={0}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Fecha Programada"
            type="datetime-local"
            value={form.scheduledDate}
            onChange={(e) => updateField('scheduledDate', e.target.value)}
            onBlur={() => handleBlur('scheduledDate')}
            error={touched.scheduledDate ? errors.scheduledDate : undefined}
            required
          />
          <Input
            label="Recordatorio (opcional)"
            type="datetime-local"
            value={form.reminderDate}
            onChange={(e) => updateField('reminderDate', e.target.value)}
          />
        </div>

        {/* Recurring section */}
        <div className="space-y-3 p-4 rounded-xl border border-[#2A2D3A] bg-[#181A20]/50">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isRecurring}
              onChange={(e) => updateField('isRecurring', e.target.checked ? 'true' : 'false')}
              className="w-4 h-4 rounded border-[#2A2D3A] bg-[#181A20] text-[#D4A824] focus:ring-[#D4A824]/20"
            />
            <div className="flex items-center gap-2">
              <Repeat className="w-4 h-4 text-[#D4A824]" />
              <span className="text-sm font-medium text-[#F0F2F5]">Repetir esta actividad</span>
            </div>
          </label>

          {form.isRecurring && (
            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-[#2A2D3A]/50">
              <div>
                <label className="block text-xs text-[#9CA3AF] mb-1.5">Repetir cada</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={365}
                    value={form.recurringInterval}
                    onChange={(e) => updateField('recurringInterval', e.target.value)}
                    className="w-20 px-3 py-2 bg-[#181A20] border border-[#2A2D3A] rounded-lg text-sm text-[#F0F2F5] focus:outline-none focus:border-[#D4A824]/50"
                  />
                  <span className="text-sm text-[#9CA3AF]">días</span>
                </div>
              </div>
              <Input
                label="Repetir hasta (opcional)"
                type="date"
                value={form.recurringEndDate}
                onChange={(e) => updateField('recurringEndDate', e.target.value)}
              />
            </div>
          )}
        </div>

        {form.scheduledDate && form.title && (
          <div className="flex items-end">
            <a
              href={generateGoogleCalendarLink(
                {
                  id: editing?.id || 'temp',
                  accountId: form.accountId,
                  contactId: form.contactId || null,
                  opportunityId: form.opportunityId || null,
                  relatedActivityId: null,
                  type: form.type as ActivityType,
                  title: form.title,
                  description: form.description,
                  status: form.status as ActivityStatus,
                  scheduledDate: new Date(form.scheduledDate).toISOString(),
                  completedDate: null,
                  duration: form.duration ? parseInt(form.duration) : null,
                  outcome: '',
                  reminderDate: form.reminderDate ? new Date(form.reminderDate).toISOString() : null,
                  isRecurring: form.isRecurring,
                  recurringInterval: form.isRecurring ? parseInt(form.recurringInterval) || 7 : null,
                  recurringEndDate: form.isRecurring && form.recurringEndDate ? new Date(form.recurringEndDate).toISOString() : null,
                  createdAt: editing?.createdAt || new Date().toISOString(),
                  updatedAt: editing?.updatedAt || new Date().toISOString(),
                },
                state.accounts.find((a) => a.id === form.accountId)?.companyName,
                state.contacts.find((c) => c.id === form.contactId)
                  ? `${state.contacts.find((c) => c.id === form.contactId)?.firstName} ${state.contacts.find((c) => c.id === form.contactId)?.lastName}`
                  : undefined
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#4285F4]/10 text-[#4285F4] hover:bg-[#4285F4]/20 rounded-lg text-sm font-medium transition-colors border border-[#4285F4]/20"
            >
              <CalendarPlus size={16} />
              Agregar a Google Calendar
            </a>
          </div>
        )}

        {form.status === 'completed' && (
          <Textarea
            label="Resultado / Outcome"
            value={form.outcome}
            onChange={(e) => updateField('outcome', e.target.value)}
            placeholder="¿Qué resultado tuvo esta actividad?"
          />
        )}

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="ghost" type="button" onClick={closeModal}>
            Cancelar
          </Button>
          <Button type="submit">
            {editing ? 'Guardar Cambios' : relatedActivity ? 'Crear Seguimiento' : 'Crear Actividad'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
