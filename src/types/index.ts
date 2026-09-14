export type AccountStatus = 'active' | 'inactive';
export type ContactStatus = 'active' | 'inactive';
export type ActivityType = 'call' | 'email' | 'meeting' | 'visit' | 'note';
export type ActivityStatus = 'pending' | 'completed' | 'cancelled';
export type ProjectStatus = 'active' | 'inactive' | 'completed';

export type PipelineStage =
  | 'lead'
  | 'qualified'
  | 'proposal'
  | 'negotiation'
  | 'closed_won'
  | 'closed_lost'
  | 'on_hold';

export type ViewType =
  | 'dashboard'
  | 'pipeline'
  | 'projects'
  | 'accounts'
  | 'contacts'
  | 'activities'
  | 'campaigns'
  | 'settings'
  | 'project-detail'
  | 'account-detail'
  | 'contact-detail'
  | 'tenant-admin';

export type ModalType =
  | 'opportunity-form'
  | 'project-form'
  | 'account-form'
  | 'contact-form'
  | 'activity-form'
  | 'export-sheets'
  | 'import-json'
  | 'import-csv'
  | null;

export interface Project {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  location: string;
  startDate: string;
  endDate: string | null;
  budget: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface Account {
  id: string;
  projectIds: string[];
  companyName: string;
  industry: string;
  description: string;
  status: AccountStatus;
  website: string;
  address: string;
  city: string;
  country: string;
  tags: string[];
  /** RUT de la empresa (ej: 76.543.210-K) */
  rut?: string;
  /** Línea de crédito autorizada (CLP) */
  creditLimit?: number | null;
  /** Meta de venta para esta cuenta (CLP) */
  salesGoalAmount?: number | null;
  /** Período de la meta: mensual, trimestral o anual */
  salesGoalPeriod?: 'monthly' | 'quarterly' | 'annual' | '';
  createdAt: string;
  updatedAt: string;
}

export interface Contact {
  id: string;
  accountId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  mobile: string;
  position: string;
  department: string;
  status: ContactStatus;
  isPrimary: boolean;
  tags: string[];
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface Activity {
  id: string;
  accountId: string;
  contactId: string | null;
  opportunityId: string | null;
  relatedActivityId: string | null;
  type: ActivityType;
  title: string;
  description: string;
  status: ActivityStatus;
  scheduledDate: string;
  completedDate: string | null;
  duration: number | null;
  outcome: string;
  reminderDate: string | null;
  isRecurring: boolean;
  recurringInterval: number | null;
  recurringEndDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Opportunity {
  id: string;
  accountId: string;
  contactId: string | null;
  projectId: string | null;
  name: string;
  description: string;
  stage: PipelineStage;
  amount: number | null;
  probability: number;
  expectedCloseDate: string | null;
  actualCloseDate: string | null;
  lossReason: string;
  notes: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface TenantConfig {
  hostname: string;
  name: string;
  tagline: string;
  logoText: string;
  logoBase64?: string;
  primaryColor: string;
  primaryColorLight: string;
  visibleModules: ViewType[];
  onboardingComplete?: boolean;
  useDemoData?: boolean;
  customCss?: string;
  contactEmail?: string;
  /** Whether this tenant's subscription is active. If false, show suspended screen. */
  isActive?: boolean;
  /** ISO date string. If set and past due, tenant is suspended. */
  expiresAt?: string | null;
  /** Monthly price for reference (not enforced by code) */
  monthlyPrice?: number;
}

export interface TenantsConfigFile {
  version: number;
  tenants: TenantConfig[];
  default: TenantConfig;
  /** PIN para entrar a la vista de administración desde la landing page */
  adminPin?: string;
}

export interface AppState {
  activeView: ViewType;
  opportunities: Opportunity[];
  projects: Project[];
  accounts: Account[];
  contacts: Contact[];
  activities: Activity[];
  selectedProjectId: string | null;
  selectedAccountId: string | null;
  selectedContactId: string | null;
  modalOpen: ModalType;
  editingId: string | null;
  modalPreselectedAccountId: string | null;
  modalPreselectedContactId: string | null;
  modalPreselectedOpportunityId: string | null;
  modalPreselectedRelatedActivityId: string | null;
  toast: { message: string; type: 'success' | 'error' | 'warning' | 'info' } | null;
  sidebarCollapsed: boolean;
  tenantConfig: TenantConfig | null;
}

export type AppAction =
  | { type: 'SET_VIEW'; payload: ViewType }
  | { type: 'SET_OPPORTUNITIES'; payload: Opportunity[] }
  | { type: 'SET_PROJECTS'; payload: Project[] }
  | { type: 'SET_ACCOUNTS'; payload: Account[] }
  | { type: 'SET_CONTACTS'; payload: Contact[] }
  | { type: 'SET_ACTIVITIES'; payload: Activity[] }
  | { type: 'SET_TENANT_CONFIG'; payload: TenantConfig }
  | { type: 'ADD_OPPORTUNITY'; payload: Opportunity }
  | { type: 'UPDATE_OPPORTUNITY'; payload: Opportunity }
  | { type: 'DELETE_OPPORTUNITY'; payload: string }
  | { type: 'ADD_PROJECT'; payload: Project }
  | { type: 'UPDATE_PROJECT'; payload: Project }
  | { type: 'DELETE_PROJECT'; payload: string }
  | { type: 'ADD_ACCOUNT'; payload: Account }
  | { type: 'UPDATE_ACCOUNT'; payload: Account }
  | { type: 'DELETE_ACCOUNT'; payload: string }
  | { type: 'ADD_CONTACT'; payload: Contact }
  | { type: 'UPDATE_CONTACT'; payload: Contact }
  | { type: 'DELETE_CONTACT'; payload: string }
  | { type: 'ADD_ACTIVITY'; payload: Activity }
  | { type: 'UPDATE_ACTIVITY'; payload: Activity }
  | { type: 'DELETE_ACTIVITY'; payload: string }
  | { type: 'SELECT_PROJECT'; payload: string | null }
  | { type: 'SELECT_ACCOUNT'; payload: string | null }
  | { type: 'SELECT_CONTACT'; payload: string | null }
  | { type: 'OPEN_MODAL'; payload: { modal: ModalType; editingId?: string | null; preselectedAccountId?: string | null; preselectedContactId?: string | null; preselectedOpportunityId?: string | null; preselectedRelatedActivityId?: string | null } }
  | { type: 'CLOSE_MODAL' }
  | { type: 'SHOW_TOAST'; payload: { message: string; type: 'success' | 'error' | 'warning' | 'info' } }
  | { type: 'HIDE_TOAST' }
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'IMPORT_DATA'; payload: { opportunities: Opportunity[]; projects: Project[]; accounts: Account[]; contacts: Contact[]; activities: Activity[] } }
  | { type: 'RESET_DATA' };

// --- Stage Config ---
export const PIPELINE_STAGES: { key: PipelineStage; label: string; color: string; bgColor: string; order: number }[] = [
  { key: 'lead', label: 'Prospecto', color: 'text-[#6B7280]', bgColor: 'bg-[#6B728015]', order: 0 },
  { key: 'qualified', label: 'Calificado', color: 'text-[#3B82F6]', bgColor: 'bg-[#3B82F615]', order: 1 },
  { key: 'proposal', label: 'Propuesta', color: 'text-[#8B5CF6]', bgColor: 'bg-[#8B5CF615]', order: 2 },
  { key: 'negotiation', label: 'Negociación', color: 'text-[#D4A824]', bgColor: 'bg-[#D4A82415]', order: 3 },
  { key: 'on_hold', label: 'Pausado', color: 'text-[#F59E0B]', bgColor: 'bg-[#F59E0B15]', order: 4 },
  { key: 'closed_won', label: 'Ganado', color: 'text-[#22C55E]', bgColor: 'bg-[#22C55E15]', order: 5 },
  { key: 'closed_lost', label: 'Perdido', color: 'text-[#EF4444]', bgColor: 'bg-[#EF4444]/10', order: 6 },
];

export const STAGE_PROBABILITY: Record<PipelineStage, number> = {
  lead: 10,
  qualified: 25,
  proposal: 50,
  negotiation: 75,
  on_hold: 30,
  closed_won: 100,
  closed_lost: 0,
};
