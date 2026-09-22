import { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { AppState, AppAction, Opportunity, Project, Account, Contact, Activity, ViewType, ModalType } from '@/types';
import { loadInitialData, saveData } from '@/data/seedData';
import { getTenantStorageKey, loadTenantConfig, getTenantConfig } from '@/config/tenantConfig';

const initialState = (tenantConfig: AppState['tenantConfig'] = null): AppState => ({
  activeView: 'dashboard',
  opportunities: [],
  projects: [],
  accounts: [],
  contacts: [],
  activities: [],
  selectedProjectId: null,
  selectedAccountId: null,
  selectedContactId: null,
  modalOpen: null,
  editingId: null,
  modalPreselectedAccountId: null,
  modalPreselectedContactId: null,
  modalPreselectedOpportunityId: null,
  modalPreselectedRelatedActivityId: null,
  toast: null,
  sidebarCollapsed: false,
  tenantConfig,
});

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_VIEW':
      return { ...state, activeView: action.payload };
    case 'SET_OPPORTUNITIES':
      return { ...state, opportunities: action.payload };
    case 'SET_PROJECTS':
      return { ...state, projects: action.payload };
    case 'SET_ACCOUNTS':
      return { ...state, accounts: action.payload };
    case 'SET_CONTACTS':
      return { ...state, contacts: action.payload };
    case 'SET_ACTIVITIES':
      return { ...state, activities: action.payload };
    case 'SET_TENANT_CONFIG':
      return { ...state, tenantConfig: action.payload };
    case 'ADD_OPPORTUNITY':
      return { ...state, opportunities: [...state.opportunities, action.payload] };
    case 'UPDATE_OPPORTUNITY':
      return { ...state, opportunities: state.opportunities.map((o) => (o.id === action.payload.id ? action.payload : o)) };
    case 'DELETE_OPPORTUNITY':
      return { ...state, opportunities: state.opportunities.filter((o) => o.id !== action.payload) };
    case 'ADD_PROJECT':
      return { ...state, projects: [...state.projects, action.payload] };
    case 'UPDATE_PROJECT':
      return { ...state, projects: state.projects.map((p) => (p.id === action.payload.id ? action.payload : p)) };
    case 'DELETE_PROJECT': {
      const projectId = action.payload;
      return {
        ...state,
        projects: state.projects.filter((p) => p.id !== projectId),
        accounts: state.accounts.map((a) => ({ ...a, projectIds: a.projectIds.filter((pid) => pid !== projectId) })),
        opportunities: state.opportunities.map((o) => o.projectId === projectId ? { ...o, projectId: null } : o),
        selectedProjectId: state.selectedProjectId === projectId ? null : state.selectedProjectId,
      };
    }
    case 'ADD_ACCOUNT':
      return { ...state, accounts: [...state.accounts, action.payload] };
    case 'UPDATE_ACCOUNT':
      return { ...state, accounts: state.accounts.map((a) => (a.id === action.payload.id ? action.payload : a)) };
    case 'DELETE_ACCOUNT': {
      const accountId = action.payload;
      return {
        ...state,
        accounts: state.accounts.filter((a) => a.id !== accountId),
        contacts: state.contacts.filter((c) => c.accountId !== accountId),
        activities: state.activities.filter((a) => a.accountId !== accountId),
        opportunities: state.opportunities.filter((o) => o.accountId !== accountId),
        selectedAccountId: state.selectedAccountId === accountId ? null : state.selectedAccountId,
      };
    }
    case 'ADD_CONTACT':
      return { ...state, contacts: [...state.contacts, action.payload] };
    case 'UPDATE_CONTACT':
      return { ...state, contacts: state.contacts.map((c) => (c.id === action.payload.id ? action.payload : c)) };
    case 'DELETE_CONTACT': {
      const contactId = action.payload;
      return {
        ...state,
        contacts: state.contacts.filter((c) => c.id !== contactId),
        activities: state.activities.map((a) => (a.contactId === contactId ? { ...a, contactId: null } : a)),
        selectedContactId: state.selectedContactId === contactId ? null : state.selectedContactId,
      };
    }
    case 'ADD_ACTIVITY':
      return { ...state, activities: [...state.activities, action.payload] };
    case 'UPDATE_ACTIVITY': {
      const updated = action.payload;
      let newActivities = state.activities.map((a) => (a.id === updated.id ? updated : a));
      // Auto-generate next recurring instance when completing
      if (updated.status === 'completed' && updated.isRecurring && updated.recurringInterval) {
        const nextDate = new Date(updated.scheduledDate);
        nextDate.setDate(nextDate.getDate() + updated.recurringInterval);
        const endDate = updated.recurringEndDate ? new Date(updated.recurringEndDate) : null;
        if (!endDate || nextDate <= endDate) {
          const nextActivity = {
            id: crypto.randomUUID(),
            accountId: updated.accountId,
            contactId: updated.contactId,
            opportunityId: updated.opportunityId,
            relatedActivityId: null,
            type: updated.type,
            title: updated.title,
            description: updated.description,
            status: 'pending' as const,
            scheduledDate: nextDate.toISOString(),
            completedDate: null,
            duration: updated.duration,
            outcome: '',
            reminderDate: null,
            isRecurring: updated.isRecurring,
            recurringInterval: updated.recurringInterval,
            recurringEndDate: updated.recurringEndDate,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          newActivities = [...newActivities, nextActivity];
        }
      }
      return { ...state, activities: newActivities };
    }
    case 'DELETE_ACTIVITY':
      return { ...state, activities: state.activities.filter((a) => a.id !== action.payload) };
    case 'SELECT_PROJECT':
      return { ...state, selectedProjectId: action.payload };
    case 'SELECT_ACCOUNT':
      return { ...state, selectedAccountId: action.payload };
    case 'SELECT_CONTACT':
      return { ...state, selectedContactId: action.payload };
    case 'OPEN_MODAL':
      return {
        ...state,
        modalOpen: action.payload.modal,
        editingId: action.payload.editingId ?? null,
        modalPreselectedAccountId: action.payload.preselectedAccountId ?? null,
        modalPreselectedContactId: action.payload.preselectedContactId ?? null,
        modalPreselectedOpportunityId: action.payload.preselectedOpportunityId ?? null,
        modalPreselectedRelatedActivityId: action.payload.preselectedRelatedActivityId ?? null,
      };
    case 'CLOSE_MODAL':
      return { ...state, modalOpen: null, editingId: null, modalPreselectedAccountId: null, modalPreselectedContactId: null, modalPreselectedOpportunityId: null, modalPreselectedRelatedActivityId: null };
    case 'SHOW_TOAST':
      return { ...state, toast: action.payload };
    case 'HIDE_TOAST':
      return { ...state, toast: null };
    case 'TOGGLE_SIDEBAR':
      return { ...state, sidebarCollapsed: !state.sidebarCollapsed };
    case 'IMPORT_DATA':
      return {
        ...state,
        opportunities: action.payload.opportunities,
        projects: action.payload.projects,
        accounts: action.payload.accounts,
        contacts: action.payload.contacts,
        activities: action.payload.activities,
      };
    case 'RESET_DATA':
      return { ...state, opportunities: [], projects: [], accounts: [], contacts: [], activities: [] };
    default:
      return state;
  }
}

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  navigateTo: (view: ViewType, id?: string) => void;
  showToast: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
  openModal: (modal: ModalType, editingId?: string | null, preselectedAccountId?: string | null, preselectedContactId?: string | null, preselectedOpportunityId?: string | null, preselectedRelatedActivityId?: string | null) => void;
  closeModal: () => void;
  getOpportunity: (id: string) => Opportunity | undefined;
  getProject: (id: string) => Project | undefined;
  getAccount: (id: string) => Account | undefined;
  getContact: (id: string) => Contact | undefined;
  getActivity: (id: string) => Activity | undefined;
  getAccountContacts: (accountId: string) => Contact[];
  getAccountActivities: (accountId: string) => Activity[];
  getContactActivities: (contactId: string) => Activity[];
  getProjectAccounts: (projectId: string) => Account[];
  getOpportunityActivities: (opportunityId: string) => Activity[];
  getRelatedActivities: (activityId: string) => Activity[];
  assignAccountsToProject: (accountIds: string[], projectId: string) => void;
  removeAccountFromProject: (accountId: string, projectId: string) => void;
  exportToJSON: () => void;
  exportToCSV: (type: 'opportunities' | 'projects' | 'accounts' | 'contacts' | 'activities') => void;
  importFromJSON: (data: { opportunities: Opportunity[]; projects: Project[]; accounts: Account[]; contacts: Contact[]; activities: Activity[] }) => void;
  resetAllData: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children, initialTenantConfig }: { children: React.ReactNode; initialTenantConfig?: AppState['tenantConfig'] }) {
  const [state, dispatch] = useReducer(appReducer, initialState(initialTenantConfig));

  useEffect(() => {
    // Only load data if tenantConfig was not pre-loaded
    if (!initialTenantConfig) {
      loadTenantConfig().then((tenantsFile) => {
        const tenant = getTenantConfig(tenantsFile);
        dispatch({ type: 'SET_TENANT_CONFIG', payload: tenant });

        const data = loadInitialData(tenant.useDemoData !== false);
        dispatch({ type: 'SET_OPPORTUNITIES', payload: data.opportunities });
        dispatch({ type: 'SET_PROJECTS', payload: data.projects });
        dispatch({ type: 'SET_ACCOUNTS', payload: data.accounts });
        dispatch({ type: 'SET_CONTACTS', payload: data.contacts });
        dispatch({ type: 'SET_ACTIVITIES', payload: data.activities });
      });
    } else {
      // Tenant config already set, just load data
      const data = loadInitialData(initialTenantConfig.useDemoData !== false);
      dispatch({ type: 'SET_OPPORTUNITIES', payload: data.opportunities });
      dispatch({ type: 'SET_PROJECTS', payload: data.projects });
      dispatch({ type: 'SET_ACCOUNTS', payload: data.accounts });
      dispatch({ type: 'SET_CONTACTS', payload: data.contacts });
      dispatch({ type: 'SET_ACTIVITIES', payload: data.activities });
    }
  }, []);

  useEffect(() => {
    if (state.opportunities.length > 0 || state.accounts.length > 0 || state.contacts.length > 0 || state.activities.length > 0 || state.projects.length > 0) {
      saveData(state.opportunities, state.projects, state.accounts, state.contacts, state.activities);
    }
  }, [state.opportunities, state.projects, state.accounts, state.contacts, state.activities]);

  const navigateTo = useCallback((view: ViewType, id?: string) => {
    dispatch({ type: 'SET_VIEW', payload: view });
    if (view === 'project-detail' && id) dispatch({ type: 'SELECT_PROJECT', payload: id });
    else if (view === 'account-detail' && id) dispatch({ type: 'SELECT_ACCOUNT', payload: id });
    else if (view === 'contact-detail' && id) dispatch({ type: 'SELECT_CONTACT', payload: id });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'warning' | 'info') => {
    dispatch({ type: 'SHOW_TOAST', payload: { message, type } });
    setTimeout(() => dispatch({ type: 'HIDE_TOAST' }), 4000);
  }, []);

  const openModal = useCallback((modal: ModalType, editingId?: string | null, preselectedAccountId?: string | null, preselectedContactId?: string | null, preselectedOpportunityId?: string | null, preselectedRelatedActivityId?: string | null) => {
    dispatch({ type: 'OPEN_MODAL', payload: { modal, editingId, preselectedAccountId, preselectedContactId, preselectedOpportunityId, preselectedRelatedActivityId } });
  }, []);

  const closeModal = useCallback(() => { dispatch({ type: 'CLOSE_MODAL' }); }, []);
  const getOpportunity = useCallback((id: string) => state.opportunities.find((o) => o.id === id), [state.opportunities]);
  const getProject = useCallback((id: string) => state.projects.find((p) => p.id === id), [state.projects]);
  const getAccount = useCallback((id: string) => state.accounts.find((a) => a.id === id), [state.accounts]);
  const getContact = useCallback((id: string) => state.contacts.find((c) => c.id === id), [state.contacts]);
  const getActivity = useCallback((id: string) => state.activities.find((a) => a.id === id), [state.activities]);
  const getAccountContacts = useCallback((accountId: string) => state.contacts.filter((c) => c.accountId === accountId), [state.contacts]);
  const getAccountActivities = useCallback((accountId: string) => state.activities.filter((a) => a.accountId === accountId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()), [state.activities]);
  const getContactActivities = useCallback((contactId: string) => state.activities.filter((a) => a.contactId === contactId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()), [state.activities]);
  const getProjectAccounts = useCallback((projectId: string) => state.accounts.filter((a) => a.projectIds.includes(projectId)), [state.accounts]);
  const getOpportunityActivities = useCallback((opportunityId: string) => state.activities.filter((a) => a.opportunityId === opportunityId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()), [state.activities]);
  const getRelatedActivities = useCallback((activityId: string) => state.activities.filter((a) => a.relatedActivityId === activityId || a.id === activityId).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()), [state.activities]);

  const assignAccountsToProject = useCallback((accountIds: string[], projectId: string) => {
    const now = new Date().toISOString();
    dispatch({ type: 'SET_ACCOUNTS', payload: state.accounts.map((a) => accountIds.includes(a.id) && !a.projectIds.includes(projectId) ? { ...a, projectIds: [...a.projectIds, projectId], updatedAt: now } : a) });
  }, [state.accounts]);

  const removeAccountFromProject = useCallback((accountId: string, projectId: string) => {
    const account = state.accounts.find((a) => a.id === accountId);
    if (!account) return;
    dispatch({ type: 'UPDATE_ACCOUNT', payload: { ...account, projectIds: account.projectIds.filter((pid) => pid !== projectId), updatedAt: new Date().toISOString() } });
  }, [state.accounts]);

  const exportSlug = useCallback(() => {
    return (state.tenantConfig?.name || 'crm').toLowerCase().replace(/\s+/g, '-');
  }, [state.tenantConfig]);

  const exportToJSON = useCallback(() => {
    const data = { opportunities: state.opportunities, projects: state.projects, accounts: state.accounts, contacts: state.contacts, activities: state.activities };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${exportSlug()}-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    try { localStorage.setItem(getTenantStorageKey('last_backup_at'), new Date().toISOString()); } catch { /* ignore */ }
    showToast('Datos exportados a JSON correctamente', 'success');
  }, [state, showToast, exportSlug]);

  const exportToCSV = useCallback((type: 'opportunities' | 'projects' | 'accounts' | 'contacts' | 'activities') => {
    let csv = '';
    let filename = '';
    if (type === 'opportunities') {
      filename = `${exportSlug()}-oportunidades.csv`;
      csv = 'ID,AccountID,ContactID,ProjectID,Nombre,Descripcion,Etapa,Monto,Probabilidad,Fecha Cierre Est,Fecha Cierre Real,Razon Perdida,Prioridad,Notas,Creado,Actualizado\n' +
        state.opportunities.map((o) => `${o.id},${o.accountId},${o.contactId ?? ''},${o.projectId ?? ''},"${o.name}","${o.description}",${o.stage},${o.amount ?? ''},${o.probability},${o.expectedCloseDate ?? ''},${o.actualCloseDate ?? ''},"${o.lossReason}",${o.priority},"${o.notes}",${o.createdAt},${o.updatedAt}`).join('\n');
    } else if (type === 'projects') {
      filename = `${exportSlug()}-proyectos.csv`;
      csv = 'ID,Nombre,Descripcion,Estado,Ubicacion,Fecha Inicio,Fecha Termino,Presupuesto,Creado,Actualizado\n' +
        state.projects.map((p) => `${p.id},"${p.name}","${p.description}",${p.status},"${p.location}",${p.startDate},${p.endDate ?? ''},${p.budget ?? ''},${p.createdAt},${p.updatedAt}`).join('\n');
    } else if (type === 'accounts') {
      filename = `${exportSlug()}-cuentas.csv`;
      csv = 'ID,ProjectIDs,Nombre Empresa,RUT,Industria,Descripcion,Estado,Web,Direccion,Ciudad,Pais,Linea Credito,Meta Venta,Periodo Meta,Creado,Actualizado\n' +
        state.accounts.map((a) => `${a.id},"${a.projectIds.join(',')}","${a.companyName}","${a.rut ?? ''}","${a.industry}","${a.description}",${a.status},"${a.website}","${a.address}","${a.city}","${a.country}",${a.creditLimit ?? ''},${a.salesGoalAmount ?? ''},${a.salesGoalPeriod ?? ''},${a.createdAt},${a.updatedAt}`).join('\n');
    } else if (type === 'contacts') {
      filename = `${exportSlug()}-contactos.csv`;
      csv = 'ID,AccountID,Nombre,Apellido,Email,Telefono,Celular,Cargo,Departamento,Estado,Principal,Notas,Creado,Actualizado\n' +
        state.contacts.map((c) => `${c.id},${c.accountId},"${c.firstName}","${c.lastName}","${c.email}","${c.phone}","${c.mobile}","${c.position}","${c.department}",${c.status},${c.isPrimary},"${c.notes}",${c.createdAt},${c.updatedAt}`).join('\n');
    } else {
      filename = `${exportSlug()}-actividades.csv`;
      csv = 'ID,AccountID,ContactID,Tipo,Titulo,Descripcion,Estado,Fecha Programada,Fecha Completada,Duracion,Resultado,Recurrente,Intervalo,Creado,Actualizado\n' +
        state.activities.map((a) => `${a.id},${a.accountId},${a.contactId ?? ''},${a.type},"${a.title}","${a.description}",${a.status},${a.scheduledDate},${a.completedDate ?? ''},${a.duration ?? ''},"${a.outcome}",${a.isRecurring ? 'Sí' : 'No'},${a.recurringInterval ?? ''},${a.createdAt},${a.updatedAt}`).join('\n');
    }
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    showToast('CSV descargado correctamente', 'success');
  }, [state, showToast, exportSlug]);

  const importFromJSON = useCallback((data: { opportunities: Opportunity[]; projects: Project[]; accounts: Account[]; contacts: Contact[]; activities: Activity[] }) => {
    dispatch({ type: 'IMPORT_DATA', payload: data });
    showToast('Datos importados correctamente', 'success');
  }, [showToast]);

  const resetAllData = useCallback(() => {
    dispatch({ type: 'RESET_DATA' });
    localStorage.removeItem(getTenantStorageKey('crm_data'));
    showToast('Todos los datos han sido eliminados', 'warning');
  }, [showToast]);

  return (
    <AppContext.Provider value={{
      state, dispatch, navigateTo, showToast, openModal, closeModal,
      getOpportunity, getProject, getAccount, getContact, getActivity,
      getAccountContacts, getAccountActivities, getContactActivities, getProjectAccounts,
      getOpportunityActivities, getRelatedActivities,
      assignAccountsToProject, removeAccountFromProject,
      exportToJSON, exportToCSV, importFromJSON, resetAllData,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}
