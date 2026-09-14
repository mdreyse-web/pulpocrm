import { useState } from 'react';
import { ArrowLeft, Edit, Trash2, Building2, Users, MapPin, CalendarDays, DollarSign, Plus, X } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Switch } from '@/components/ui/Switch';
import { Account } from '@/types';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

export const ProjectDetail: React.FC = () => {
  const { state, dispatch, navigateTo, openModal, getProjectAccounts, removeAccountFromProject, assignAccountsToProject, showToast } = useApp();
  const [showAssignPanel, setShowAssignPanel] = useState(false);
  const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>([]);

  const project = state.selectedProjectId ? state.projects.find((p) => p.id === state.selectedProjectId) : undefined;

  if (!project) {
    return (
      <div className="text-center py-16">
        <p className="text-[#6B7280]">Proyecto no encontrado</p>
        <Button variant="secondary" onClick={() => navigateTo('projects')} className="mt-4">Volver a Proyectos</Button>
      </div>
    );
  }

  const accounts = getProjectAccounts(project.id);
  const totalContacts = accounts.reduce((sum, a) => sum + state.contacts.filter((c) => c.accountId === a.id).length, 0);
  const projectActivities = state.activities.filter((a) => accounts.some((acc) => acc.id === a.accountId));

  // Accounts NOT yet assigned to this project
  const availableAccounts = state.accounts.filter((a) => !a.projectIds.includes(project.id));

  const handleDelete = () => {
    if (window.confirm(`¿Eliminar el proyecto "${project.name}"? Las cuentas asociadas perderán esta vinculación.`)) {
      dispatch({ type: 'DELETE_PROJECT', payload: project.id });
      showToast('Proyecto eliminado', 'warning');
      navigateTo('projects');
    }
  };

  const handleStatusChange = (checked: boolean) => {
    dispatch({ type: 'UPDATE_PROJECT', payload: { ...project, status: checked ? 'active' : 'inactive', updatedAt: new Date().toISOString() } });
    showToast(`Proyecto ${checked ? 'activado' : 'desactivado'}`, 'success');
  };

  const handleAssignAccounts = () => {
    if (selectedAccountIds.length === 0) return;
    assignAccountsToProject(selectedAccountIds, project.id);
    showToast(`${selectedAccountIds.length} cuenta(s) asignada(s) al proyecto`, 'success');
    setSelectedAccountIds([]);
    setShowAssignPanel(false);
  };

  const handleRemoveAccount = (accountId: string, accountName: string) => {
    if (window.confirm(`¿Quitar "${accountName}" de este proyecto?`)) {
      removeAccountFromProject(accountId, project.id);
      showToast('Cuenta removida del proyecto', 'success');
    }
  };

  const toggleAccountSelection = (accountId: string) => {
    setSelectedAccountIds((prev) =>
      prev.includes(accountId) ? prev.filter((id) => id !== accountId) : [...prev, accountId]
    );
  };

  const formatDate = (d: string) => {
    try { return format(parseISO(d), 'dd MMM yyyy', { locale: es }); } catch { return d; }
  };

  return (
    <div className="animate-fade-in">
      <button onClick={() => navigateTo('projects')} className="flex items-center gap-1 text-sm text-[#A0A8B8] hover:text-[#D4A824] transition-colors mb-4">
        <ArrowLeft size={16} /> Proyectos
      </button>

      <div className="bg-[#22252D] border border-[#2E323A] rounded-xl p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-[#F0F2F5]">{project.name}</h1>
              <Badge variant={project.status === 'active' ? 'active' : project.status === 'completed' ? 'completed' : 'inactive'}>
                {project.status === 'active' ? 'Activo' : project.status === 'completed' ? 'Completado' : 'Inactivo'}
              </Badge>
            </div>
            <p className="text-sm text-[#A0A8B8]">{project.description}</p>
          </div>
          <div className="flex items-center gap-3">
            <Switch checked={project.status === 'active'} onChange={handleStatusChange} label="Activo" />
            <Button variant="secondary" size="sm" leftIcon={<Edit size={14} />} onClick={() => openModal('project-form', project.id)}>Editar</Button>
            <Button variant="danger" size="sm" leftIcon={<Trash2 size={14} />} onClick={handleDelete}>Eliminar</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-6 border-t border-[#25282F]">
          <div>
            <label className="text-xs text-[#6B7280] uppercase tracking-wider flex items-center gap-1"><MapPin size={12} /> Ubicación</label>
            <p className="text-sm text-[#F0F2F5] mt-1">{project.location || 'No especificada'}</p>
          </div>
          <div>
            <label className="text-xs text-[#6B7280] uppercase tracking-wider flex items-center gap-1"><CalendarDays size={12} /> Inicio</label>
            <p className="text-sm text-[#F0F2F5] mt-1">{formatDate(project.startDate)}</p>
          </div>
          {project.endDate && (
            <div>
              <label className="text-xs text-[#6B7280] uppercase tracking-wider flex items-center gap-1"><CalendarDays size={12} /> Término</label>
              <p className="text-sm text-[#F0F2F5] mt-1">{formatDate(project.endDate)}</p>
            </div>
          )}
          {project.budget && (
            <div>
              <label className="text-xs text-[#6B7280] uppercase tracking-wider flex items-center gap-1"><DollarSign size={12} /> Presupuesto</label>
              <p className="text-sm text-[#D4A824] mt-1 font-medium">${project.budget.toLocaleString('es-CL')}</p>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-[#22252D] border border-[#2E323A] rounded-xl p-5">
          <p className="text-2xl font-bold text-[#F0F2F5]">{accounts.length}</p>
          <p className="text-xs text-[#6B7280] mt-1">Cuentas asignadas</p>
        </div>
        <div className="bg-[#22252D] border border-[#2E323A] rounded-xl p-5">
          <p className="text-2xl font-bold text-[#F0F2F5]">{totalContacts}</p>
          <p className="text-xs text-[#6B7280] mt-1">Contactos totales</p>
        </div>
        <div className="bg-[#22252D] border border-[#2E323A] rounded-xl p-5">
          <p className="text-2xl font-bold text-[#F0F2F5]">{projectActivities.length}</p>
          <p className="text-xs text-[#6B7280] mt-1">Actividades</p>
        </div>
      </div>

      <div className="bg-[#22252D] border border-[#2E323A] rounded-xl p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-semibold text-[#F0F2F5]">Cuentas Asignadas</h3>
          <div className="flex gap-2">
            {availableAccounts.length > 0 && (
              <Button size="sm" variant="secondary" onClick={() => setShowAssignPanel(!showAssignPanel)} leftIcon={<Plus size={14} />}>
                {showAssignPanel ? 'Cancelar' : 'Asignar existentes'}
              </Button>
            )}
            <Button size="sm" onClick={() => { dispatch({ type: 'SELECT_PROJECT', payload: project.id }); openModal('account-form'); }} leftIcon={<Plus size={14} />}>
              Crear nueva
            </Button>
          </div>
        </div>

        {/* Assign existing accounts panel */}
        {showAssignPanel && availableAccounts.length > 0 && (
          <div className="mb-5 p-4 bg-[#1E2128] rounded-lg border border-[#D4A824]/30">
            <h4 className="text-sm font-semibold text-[#D4A824] mb-3">Selecciona cuentas para asignar a este proyecto</h4>
            <div className="max-h-[240px] overflow-y-auto space-y-1 mb-3">
              {availableAccounts.map((account) => (
                <label
                  key={account.id}
                  className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-colors ${
                    selectedAccountIds.includes(account.id) ? 'bg-[#D4A82415] border border-[#D4A824]/30' : 'hover:bg-[#2D3139] border border-transparent'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedAccountIds.includes(account.id)}
                    onChange={() => toggleAccountSelection(account.id)}
                    className="w-4 h-4 rounded accent-[#D4A824]"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-[#F0F2F5]">{account.companyName}</p>
                    <p className="text-xs text-[#6B7280]">{account.industry} • {account.city || 'Sin ciudad'}</p>
                  </div>
                  <Badge variant={account.status === 'active' ? 'active' : 'inactive'}>{account.status === 'active' ? 'Activa' : 'Inactiva'}</Badge>
                </label>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <Button size="sm" onClick={handleAssignAccounts} disabled={selectedAccountIds.length === 0}>
                Asignar {selectedAccountIds.length > 0 && `(${selectedAccountIds.length})`}
              </Button>
              <span className="text-xs text-[#6B7280]">{availableAccounts.length} cuenta(s) disponible(s)</span>
            </div>
          </div>
        )}

        {accounts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {accounts.map((account) => (
              <ProjectAccountCard
                key={account.id}
                account={account}
                projectId={project.id}
                onRemove={handleRemoveAccount}
                onNavigate={navigateTo}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-10">
            <Building2 size={36} className="mx-auto text-[#3A3F48] mb-3" />
            <p className="text-sm text-[#6B7280]">No hay cuentas asignadas a este proyecto</p>
          </div>
        )}
      </div>
    </div>
  );
};

function ProjectAccountCard({
  account,
  projectId,
  onRemove,
  onNavigate,
}: {
  account: Account;
  projectId: string;
  onRemove: (id: string, name: string) => void;
  onNavigate: (view: 'account-detail', id: string) => void;
}) {
  const { state } = useApp();
  const contactCount = state.contacts.filter((c) => c.accountId === account.id).length;

  return (
    <div className="border border-[#2E323A] rounded-lg p-4 hover:bg-[#2D3139] hover:border-[#3A3F48] transition-all relative group">
      <button
        onClick={() => onRemove(account.id, account.companyName)}
        className="absolute top-2 right-2 p-1 rounded text-[#6B7280] hover:text-[#EF4444] hover:bg-[#EF4444]/10 opacity-0 group-hover:opacity-100 transition-all"
        title="Quitar de este proyecto"
      >
        <X size={14} />
      </button>
      <div className="cursor-pointer pr-6" onClick={() => onNavigate('account-detail', account.id)}>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-semibold text-[#F0F2F5]">{account.companyName}</h4>
          <Badge variant={account.status === 'active' ? 'active' : 'inactive'}>{account.status === 'active' ? 'Activa' : 'Inactiva'}</Badge>
        </div>
        <p className="text-xs text-[#D4A824] mb-2">{account.industry}</p>
        <p className="text-xs text-[#A0A8B8] line-clamp-2 mb-3">{account.description || 'Sin descripción'}</p>
        <div className="flex items-center justify-between text-xs text-[#6B7280]">
          <span className="flex items-center gap-1"><Users size={10} /> {contactCount} contactos</span>
          <span className="text-[#D4A824]">Ver detalle →</span>
        </div>
      </div>
    </div>
  );
}
