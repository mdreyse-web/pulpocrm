import { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';

interface FormErrors {
  name?: string;
  startDate?: string;
}

const statusOptions = [
  { value: 'active', label: 'Activo' },
  { value: 'inactive', label: 'Inactivo' },
  { value: 'completed', label: 'Completado' },
];

export const ProjectFormModal: React.FC = () => {
  const { state, dispatch, closeModal, showToast } = useApp();
  const isOpen = state.modalOpen === 'project-form';
  const editingId = state.editingId;
  const editing = editingId ? state.projects.find((p) => p.id === editingId) : null;

  const [form, setForm] = useState({
    name: '',
    description: '',
    location: '',
    startDate: '',
    endDate: '',
    status: 'active',
    budget: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (editing) {
      setForm({
        name: editing.name,
        description: editing.description,
        location: editing.location,
        startDate: editing.startDate.slice(0, 10),
        endDate: editing.endDate ? editing.endDate.slice(0, 10) : '',
        status: editing.status,
        budget: editing.budget?.toString() || '',
      });
    } else {
      const now = new Date();
      const today = now.toISOString().slice(0, 10);
      setForm({ name: '', description: '', location: '', startDate: today, endDate: '', status: 'active', budget: '' });
    }
    setErrors({});
    setTouched({});
  }, [editing, isOpen]);

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!form.name.trim()) newErrors.name = 'El nombre del proyecto es obligatorio';
    if (!form.startDate) newErrors.startDate = 'La fecha de inicio es obligatoria';
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
      name: form.name.trim(),
      description: form.description.trim(),
      location: form.location.trim(),
      startDate: new Date(form.startDate).toISOString(),
      endDate: form.endDate ? new Date(form.endDate).toISOString() : null,
      status: form.status as 'active' | 'inactive' | 'completed',
      budget: form.budget ? parseFloat(form.budget) : null,
    };

    if (editing) {
      dispatch({
        type: 'UPDATE_PROJECT',
        payload: { ...editing, ...payload, updatedAt: now },
      });
      showToast('Proyecto actualizado correctamente', 'success');
    } else {
      dispatch({
        type: 'ADD_PROJECT',
        payload: {
          id: crypto.randomUUID(),
          ...payload,
          createdAt: now,
          updatedAt: now,
        },
      });
      showToast('Proyecto creado correctamente', 'success');
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

  return (
    <Modal isOpen={isOpen} onClose={closeModal} title={editing ? 'Editar Proyecto' : 'Nuevo Proyecto'} maxWidth="max-w-[600px]">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Nombre del Proyecto"
          value={form.name}
          onChange={(e) => updateField('name', e.target.value)}
          onBlur={() => handleBlur('name')}
          error={touched.name ? errors.name : undefined}
          required
          placeholder="Ej: Línea 3 Metro de Santiago"
        />

        <Textarea
          label="Descripción"
          value={form.description}
          onChange={(e) => updateField('description', e.target.value)}
          placeholder="Describe el proyecto..."
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Ubicación"
            value={form.location}
            onChange={(e) => updateField('location', e.target.value)}
            placeholder="Ej: Santiago, Chile"
          />
          <Input
            label="Presupuesto (CLP)"
            type="number"
            value={form.budget}
            onChange={(e) => updateField('budget', e.target.value)}
            placeholder="1500000000"
            min={0}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Fecha de Inicio"
            type="date"
            value={form.startDate}
            onChange={(e) => updateField('startDate', e.target.value)}
            onBlur={() => handleBlur('startDate')}
            error={touched.startDate ? errors.startDate : undefined}
            required
          />
          <Input
            label="Fecha de Término (opcional)"
            type="date"
            value={form.endDate}
            onChange={(e) => updateField('endDate', e.target.value)}
          />
        </div>

        <Select
          label="Estado"
          value={form.status}
          onChange={(e) => updateField('status', e.target.value)}
          options={statusOptions}
        />

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="ghost" type="button" onClick={closeModal}>Cancelar</Button>
          <Button type="submit">{editing ? 'Guardar Cambios' : 'Crear Proyecto'}</Button>
        </div>
      </form>
    </Modal>
  );
};
