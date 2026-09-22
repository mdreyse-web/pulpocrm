import { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { TagInput } from '@/components/ui/TagInput';
import { PipelineStage, PIPELINE_STAGES, STAGE_PROBABILITY } from '@/types';

interface FormErrors {
  name?: string;
  accountId?: string;
}

const priorityOptions = [
  { value: 'low', label: 'Baja' },
  { value: 'medium', label: 'Media' },
  { value: 'high', label: 'Alta' },
  { value: 'urgent', label: 'Urgente' },
];

const stageOptions = PIPELINE_STAGES.map((s) => ({ value: s.key, label: s.label }));

export const OpportunityFormModal: React.FC = () => {
  const { state, dispatch, closeModal, showToast } = useApp();
  const isOpen = state.modalOpen === 'opportunity-form';
  const editingId = state.editingId;
  const editing = editingId ? state.opportunities.find((o) => o.id === editingId) : null;
  const preselectedAccountId = state.selectedAccountId;

  const [form, setForm] = useState({
    name: '',
    description: '',
    accountId: '',
    contactId: '',
    projectId: '',
    stage: 'lead' as PipelineStage,
    amount: '',
    probability: 10,
    expectedCloseDate: '',
    lossReason: '',
    notes: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    tags: [] as string[],
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (editing) {
      setForm({
        name: editing.name,
        description: editing.description,
        accountId: editing.accountId,
        contactId: editing.contactId || '',
        projectId: editing.projectId || '',
        stage: editing.stage,
        amount: editing.amount?.toString() || '',
        probability: editing.probability,
        expectedCloseDate: editing.expectedCloseDate ? editing.expectedCloseDate.slice(0, 10) : '',
        lossReason: editing.lossReason,
        notes: editing.notes,
        priority: editing.priority,
        tags: [...(editing.tags || [])],
      });
    } else {
      setForm({
        name: '', description: '', accountId: preselectedAccountId || '',
        contactId: '', projectId: '', stage: 'lead', amount: '',
        probability: STAGE_PROBABILITY['lead'], expectedCloseDate: '',
        lossReason: '', notes: '', priority: 'medium', tags: [],
      });
    }
    setErrors({});
    setTouched({});
  }, [editing, isOpen, preselectedAccountId]);

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!form.name.trim()) newErrors.name = 'El nombre es obligatorio';
    if (!form.accountId) newErrors.accountId = 'Debes seleccionar una cuenta';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleBlur = (field: string) => setTouched((prev) => ({ ...prev, [field]: true }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) { showToast('Corrige los errores del formulario', 'error'); return; }
    const now = new Date().toISOString();
    const isWon = form.stage === 'closed_won';
    const isLost = form.stage === 'closed_lost';
    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      accountId: form.accountId,
      contactId: form.contactId || null,
      projectId: form.projectId || null,
      stage: form.stage,
      amount: form.amount ? parseFloat(form.amount) : null,
      probability: form.probability,
      expectedCloseDate: form.expectedCloseDate ? new Date(form.expectedCloseDate).toISOString() : null,
      actualCloseDate: isWon || isLost ? (editing?.actualCloseDate || now) : null,
      lossReason: isLost ? form.lossReason.trim() : '',
      notes: form.notes.trim(),
      priority: form.priority,
      tags: form.tags,
    };
    if (editing) {
      dispatch({ type: 'UPDATE_OPPORTUNITY', payload: { ...editing, ...payload, updatedAt: now } });
      showToast('Oportunidad actualizada', 'success');
    } else {
      dispatch({ type: 'ADD_OPPORTUNITY', payload: { id: crypto.randomUUID(), ...payload, createdAt: now, updatedAt: now } });
      showToast('Oportunidad creada', 'success');
    }
    closeModal();
  };

  const updateField = (field: string, value: string | number) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === 'stage' && typeof value === 'string') {
        next.probability = STAGE_PROBABILITY[value as PipelineStage];
      }
      return next;
    });
    if (touched[field]) setErrors((prev) => { const n = { ...prev }; delete n[field as keyof FormErrors]; return n; });
  };

  const accountOptions = state.accounts.map((a) => ({ value: a.id, label: a.companyName }));
  const contactOptions = [{ value: '', label: 'Sin contacto' }, ...state.contacts.filter((c) => c.accountId === form.accountId).map((c) => ({ value: c.id, label: `${c.firstName} ${c.lastName}` }))];
  const projectOptions = [{ value: '', label: 'Sin proyecto' }, ...state.projects.map((p) => ({ value: p.id, label: p.name }))];

  return (
    <Modal isOpen={isOpen} onClose={closeModal} title={editing ? 'Editar Oportunidad' : 'Nueva Oportunidad'} maxWidth="max-w-[600px]">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Nombre de la oportunidad" value={form.name} onChange={(e) => updateField('name', e.target.value)} onBlur={() => handleBlur('name')} error={touched.name ? errors.name : undefined} required placeholder="Ej: Suministro Anclajes Metro" />

        <div className="grid grid-cols-2 gap-4">
          <Select label="Cuenta *" value={form.accountId} onChange={(e) => updateField('accountId', e.target.value)} onBlur={() => handleBlur('accountId')} error={touched.accountId ? errors.accountId : undefined} required options={[{ value: '', label: 'Seleccionar cuenta' }, ...accountOptions]} />
          <Select label="Contacto" value={form.contactId} onChange={(e) => updateField('contactId', e.target.value)} options={contactOptions} />
        </div>

        <Select label="Proyecto (opcional)" value={form.projectId} onChange={(e) => updateField('projectId', e.target.value)} options={projectOptions} />

        <div className="grid grid-cols-2 gap-4">
          <Select label="Etapa" value={form.stage} onChange={(e) => updateField('stage', e.target.value)} options={stageOptions} />
          <Select label="Prioridad" value={form.priority} onChange={(e) => updateField('priority', e.target.value)} options={priorityOptions} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input label="Monto estimado (CLP)" type="number" value={form.amount} onChange={(e) => updateField('amount', e.target.value)} placeholder="45000000" min={0} />
          <div>
            <label className="block text-xs font-medium text-[#A0A8B8] mb-1.5">Probabilidad (%)</label>
            <div className="flex items-center gap-3">
              <input type="range" min={0} max={100} step={5} value={form.probability} onChange={(e) => updateField('probability', parseInt(e.target.value))} className="flex-1 accent-[#D4A824]" />
              <span className="text-sm font-semibold text-[#F0F2F5] w-10 text-right">{form.probability}%</span>
            </div>
          </div>
        </div>

        <Input label="Fecha cierre estimada" type="date" value={form.expectedCloseDate} onChange={(e) => updateField('expectedCloseDate', e.target.value)} />

        {form.stage === 'closed_lost' && (
          <Textarea label="Razón de pérdida" value={form.lossReason} onChange={(e) => updateField('lossReason', e.target.value)} placeholder="¿Por qué se perdió esta oportunidad?" />
        )}

        <Textarea label="Descripción" value={form.description} onChange={(e) => updateField('description', e.target.value)} placeholder="Descripción de la oportunidad..." />
        <Textarea label="Notas internas" value={form.notes} onChange={(e) => updateField('notes', e.target.value)} placeholder="Notas de seguimiento..." />

        <TagInput tags={form.tags} onChange={(tags) => setForm((prev) => ({ ...prev, tags }))} />

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="ghost" type="button" onClick={closeModal}>Cancelar</Button>
          <Button type="submit">{editing ? 'Guardar Cambios' : 'Crear Oportunidad'}</Button>
        </div>
      </form>
    </Modal>
  );
};
