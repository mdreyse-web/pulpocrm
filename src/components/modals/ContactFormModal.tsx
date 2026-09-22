import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Switch } from '@/components/ui/Switch';
import { Button } from '@/components/ui/Button';
import { TagInput } from '@/components/ui/TagInput';

interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  accountId?: string;
}

export const ContactFormModal: React.FC = () => {
  const { state, dispatch, closeModal, showToast, getContact, getAccountContacts } = useApp();
  const isOpen = state.modalOpen === 'contact-form';
  const editingId = state.editingId;
  const editing = editingId ? getContact(editingId) : null;
  const preselectedAccountId = state.selectedAccountId;

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    mobile: '',
    position: '',
    department: '',
    accountId: '',
    isPrimary: false,
    notes: '',
    status: true,
    tags: [] as string[],
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (editing) {
      setForm({
        firstName: editing.firstName,
        lastName: editing.lastName,
        email: editing.email,
        phone: editing.phone,
        mobile: editing.mobile,
        position: editing.position,
        department: editing.department,
        accountId: editing.accountId,
        isPrimary: editing.isPrimary,
        notes: editing.notes,
        status: editing.status === 'active',
        tags: [...(editing.tags || [])],
      });
    } else {
      setForm({
        firstName: '', lastName: '', email: '', phone: '', mobile: '',
        position: '', department: '', accountId: preselectedAccountId || '',
        isPrimary: false, notes: '', status: true, tags: [],
      });
    }
    setErrors({});
    setTouched({});
  }, [editing, isOpen, preselectedAccountId]);

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!form.firstName.trim()) newErrors.firstName = 'El nombre es obligatorio';
    if (!form.lastName.trim()) newErrors.lastName = 'El apellido es obligatorio';
    if (!form.email.trim()) newErrors.email = 'El email es obligatorio';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) newErrors.email = 'Formato de email inválido';
    if (!form.accountId) newErrors.accountId = 'Debes seleccionar una cuenta';
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
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      mobile: form.mobile.trim(),
      position: form.position.trim(),
      department: form.department.trim(),
      accountId: form.accountId,
      isPrimary: form.isPrimary,
      notes: form.notes.trim(),
      status: (form.status ? 'active' : 'inactive') as 'active' | 'inactive',
      tags: form.tags,
    };

    if (editing) {
      dispatch({
        type: 'UPDATE_CONTACT',
        payload: { ...editing, ...payload, updatedAt: now },
      });
      showToast('Contacto actualizado correctamente', 'success');
    } else {
      dispatch({
        type: 'ADD_CONTACT',
        payload: {
          id: crypto.randomUUID(),
          ...payload,
          createdAt: now,
          updatedAt: now,
        },
      });
      showToast('Contacto creado correctamente', 'success');
    }
    closeModal();
  };

  const updateField = (field: string, value: string | boolean) => {
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

  return (
    <Modal isOpen={isOpen} onClose={closeModal} title={editing ? 'Editar Contacto' : 'Nuevo Contacto'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Nombre"
            value={form.firstName}
            onChange={(e) => updateField('firstName', e.target.value)}
            onBlur={() => handleBlur('firstName')}
            error={touched.firstName ? errors.firstName : undefined}
            required
            placeholder="Ej: Roberto"
          />
          <Input
            label="Apellido"
            value={form.lastName}
            onChange={(e) => updateField('lastName', e.target.value)}
            onBlur={() => handleBlur('lastName')}
            error={touched.lastName ? errors.lastName : undefined}
            required
            placeholder="Ej: Mendoza"
          />
        </div>

        <Input
          label="Email"
          type="email"
          value={form.email}
          onChange={(e) => updateField('email', e.target.value)}
          onBlur={() => handleBlur('email')}
          error={touched.email ? errors.email : undefined}
          required
          placeholder="correo@empresa.cl"
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Teléfono"
            value={form.phone}
            onChange={(e) => updateField('phone', e.target.value)}
            placeholder="+56 2 2345 6789"
          />
          <Input
            label="Celular"
            value={form.mobile}
            onChange={(e) => updateField('mobile', e.target.value)}
            placeholder="+56 9 8765 4321"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Cargo"
            value={form.position}
            onChange={(e) => updateField('position', e.target.value)}
            placeholder="Ej: Gerente de Compras"
          />
          <Input
            label="Departamento"
            value={form.department}
            onChange={(e) => updateField('department', e.target.value)}
            placeholder="Ej: Compras"
          />
        </div>

        <Select
          label="Cuenta"
          value={form.accountId}
          onChange={(e) => updateField('accountId', e.target.value)}
          onBlur={() => handleBlur('accountId')}
          error={touched.accountId ? errors.accountId : undefined}
          required
          options={[{ value: '', label: 'Seleccionar cuenta' }, ...accountOptions]}
        />

        <Textarea
          label="Notas"
          value={form.notes}
          onChange={(e) => updateField('notes', e.target.value)}
          placeholder="Notas adicionales sobre el contacto..."
        />

        <TagInput tags={form.tags} onChange={(tags) => setForm((prev) => ({ ...prev, tags }))} />

        <div className="flex items-center justify-between">
          <Switch
            checked={form.isPrimary}
            onChange={(checked) => updateField('isPrimary', checked)}
            label="Contacto principal"
          />
          <Switch
            checked={form.status}
            onChange={(checked) => updateField('status', checked)}
            label="Activo"
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="ghost" type="button" onClick={closeModal}>
            Cancelar
          </Button>
          <Button type="submit">{editing ? 'Guardar Cambios' : 'Crear Contacto'}</Button>
        </div>
      </form>
    </Modal>
  );
};
