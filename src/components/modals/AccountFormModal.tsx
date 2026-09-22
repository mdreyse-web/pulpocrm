import { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Switch } from '@/components/ui/Switch';
import { Button } from '@/components/ui/Button';
import { TagInput } from '@/components/ui/TagInput';
import { X } from 'lucide-react';

interface FormErrors {
  companyName?: string;
  industry?: string;
}

const industries = [
  'Construcción',
  'Minería',
  'Industria',
  'Energía',
  'Tecnología',
  'Retail',
  'Salud',
  'Educación',
  'Transporte',
  'Otro',
];

export const AccountFormModal: React.FC = () => {
  const { state, dispatch, closeModal, showToast, getAccount } = useApp();
  const isOpen = state.modalOpen === 'account-form';
  const editingId = state.editingId;
  const editing = editingId ? getAccount(editingId) : null;
  const preselectedProjectId = state.selectedProjectId;

  const [form, setForm] = useState({
    companyName: '',
    industry: '',
    description: '',
    website: '',
    address: '',
    city: '',
    country: 'Chile',
    rut: '',
    creditLimit: '',
    salesGoalAmount: '',
    salesGoalPeriod: '' as '' | 'monthly' | 'quarterly' | 'annual',
    projectIds: [] as string[],
    status: true,
    tags: [] as string[],
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (editing) {
      setForm({
        companyName: editing.companyName,
        industry: editing.industry,
        description: editing.description,
        website: editing.website,
        address: editing.address,
        city: editing.city,
        country: editing.country,
        rut: editing.rut || '',
        creditLimit: editing.creditLimit != null ? String(editing.creditLimit) : '',
        salesGoalAmount: editing.salesGoalAmount != null ? String(editing.salesGoalAmount) : '',
        salesGoalPeriod: editing.salesGoalPeriod || '',
        projectIds: [...editing.projectIds],
        status: editing.status === 'active',
        tags: [...(editing.tags || [])],
      });
    } else {
      setForm({
        companyName: '', industry: '', description: '', website: '',
        address: '', city: '', country: 'Chile',
        rut: '', creditLimit: '', salesGoalAmount: '', salesGoalPeriod: '',
        projectIds: preselectedProjectId ? [preselectedProjectId] : [],
        status: true,
        tags: [],
      });
    }
    setErrors({});
    setTouched({});
  }, [editing, isOpen, preselectedProjectId]);

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!form.companyName.trim()) newErrors.companyName = 'El nombre de la empresa es obligatorio';
    if (!form.industry) newErrors.industry = 'La industria es obligatoria';
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
    const parseMoney = (v: string) => {
      const n = parseInt(v.replace(/[^\d]/g, ''), 10);
      return isNaN(n) ? null : n;
    };
    const payload = {
      companyName: form.companyName.trim(),
      industry: form.industry,
      description: form.description.trim(),
      website: form.website.trim(),
      address: form.address.trim(),
      city: form.city.trim(),
      country: form.country.trim(),
      rut: form.rut.trim(),
      creditLimit: parseMoney(form.creditLimit),
      salesGoalAmount: parseMoney(form.salesGoalAmount),
      salesGoalPeriod: form.salesGoalPeriod,
      projectIds: form.projectIds,
      status: (form.status ? 'active' : 'inactive') as 'active' | 'inactive',
      tags: form.tags,
    };

    if (editing) {
      dispatch({ type: 'UPDATE_ACCOUNT', payload: { ...editing, ...payload, updatedAt: now } });
      showToast('Cuenta actualizada correctamente', 'success');
    } else {
      dispatch({ type: 'ADD_ACCOUNT', payload: { id: crypto.randomUUID(), ...payload, createdAt: now, updatedAt: now } });
      showToast('Cuenta creada correctamente', 'success');
    }
    closeModal();
  };

  const updateField = (field: string, value: string | boolean | string[]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (touched[field]) {
      setErrors((prev) => { const next = { ...prev }; delete next[field as keyof FormErrors]; return next; });
    }
  };

  const toggleProject = (projectId: string) => {
    setForm((prev) => ({
      ...prev,
      projectIds: prev.projectIds.includes(projectId)
        ? prev.projectIds.filter((id) => id !== projectId)
        : [...prev.projectIds, projectId],
    }));
  };

  const availableProjects = state.projects.filter((p) => !form.projectIds.includes(p.id));

  return (
    <Modal isOpen={isOpen} onClose={closeModal} title={editing ? 'Editar Cuenta' : 'Nueva Cuenta'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Nombre de la Empresa"
          value={form.companyName}
          onChange={(e) => updateField('companyName', e.target.value)}
          onBlur={() => handleBlur('companyName')}
          error={touched.companyName ? errors.companyName : undefined}
          required
          placeholder="Ej: Constructora del Sur S.A."
        />

        <Select
          label="Industria"
          value={form.industry}
          onChange={(e) => updateField('industry', e.target.value)}
          onBlur={() => handleBlur('industry')}
          error={touched.industry ? errors.industry : undefined}
          required
          options={[{ value: '', label: 'Seleccionar industria' }, ...industries.map((i) => ({ value: i, label: i }))]}
        />

        {/* Multi-project selector */}
        <div className="w-full">
          <label className="block text-xs font-medium text-[#A0A8B8] mb-1.5">Proyectos asociados</label>
          {/* Selected projects badges */}
          {form.projectIds.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {form.projectIds.map((pid) => {
                const project = state.projects.find((p) => p.id === pid);
                return (
                  <span key={pid} className="inline-flex items-center gap-1 px-2 py-1 bg-[#D4A82415] text-[#D4A824] rounded-md text-xs font-medium">
                    {project?.name || pid}
                    <button type="button" onClick={() => toggleProject(pid)} className="hover:text-[#EF4444]">
                      <X size={12} />
                    </button>
                  </span>
                );
              })}
            </div>
          )}
          {/* Add project dropdown */}
          {availableProjects.length > 0 && (
            <select
              value=""
              onChange={(e) => { if (e.target.value) toggleProject(e.target.value); }}
              className="w-full bg-[#2A2D35] border border-[#2E323A] rounded-lg px-3.5 py-2.5 text-sm text-[#F0F2F5] focus:outline-none focus:border-[#D4A824] focus:ring-[3px] focus:ring-[#D4A824]/15"
            >
              <option value="">+ Agregar proyecto...</option>
              {availableProjects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          )}
        </div>

        <Textarea label="Descripción" value={form.description} onChange={(e) => updateField('description', e.target.value)} placeholder="Descripción de la empresa..." />

        <div className="grid grid-cols-2 gap-4">
          <Input label="Sitio Web" value={form.website} onChange={(e) => updateField('website', e.target.value)} placeholder="www.ejemplo.cl" />
          <Input label="Ciudad" value={form.city} onChange={(e) => updateField('city', e.target.value)} placeholder="Santiago" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input label="RUT" value={form.rut} onChange={(e) => updateField('rut', e.target.value)} placeholder="76.543.210-K" />
          <Input label="Línea de crédito (CLP)" type="number" value={form.creditLimit} onChange={(e) => updateField('creditLimit', e.target.value)} placeholder="5000000" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input label="Meta de venta (CLP)" type="number" value={form.salesGoalAmount} onChange={(e) => updateField('salesGoalAmount', e.target.value)} placeholder="20000000" />
          <Select
            label="Período de la meta"
            value={form.salesGoalPeriod}
            onChange={(e) => updateField('salesGoalPeriod', e.target.value)}
            options={[
              { value: '', label: 'Sin meta' },
              { value: 'monthly', label: 'Mensual' },
              { value: 'quarterly', label: 'Trimestral' },
              { value: 'annual', label: 'Anual' },
            ]}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input label="Dirección" value={form.address} onChange={(e) => updateField('address', e.target.value)} placeholder="Av. Ejemplo 1234" />
          <Input label="País" value={form.country} onChange={(e) => updateField('country', e.target.value)} placeholder="Chile" />
        </div>

        <TagInput tags={form.tags} onChange={(tags) => updateField('tags', tags)} />

        <Switch checked={form.status} onChange={(checked) => updateField('status', checked)} label="Cuenta activa" />

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="ghost" type="button" onClick={closeModal}>Cancelar</Button>
          <Button type="submit">{editing ? 'Guardar Cambios' : 'Crear Cuenta'}</Button>
        </div>
      </form>
    </Modal>
  );
};
