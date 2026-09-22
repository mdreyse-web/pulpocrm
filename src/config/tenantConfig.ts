import { ViewType, TenantConfig, TenantsConfigFile } from '@/types';
import { isCrmPymeBuild, getEffectiveHostname } from './branding';

export type { TenantConfig, TenantsConfigFile };
export { isCrmPymeBuild, getEffectiveHostname };

export const DEFAULT_TENANT: TenantConfig = {
  hostname: 'default',
  name: 'PulpoCRM',
  tagline: 'Gestión Comercial para PYMEs',
  logoText: 'PulpoCRM',
  primaryColor: '#D4A824',
  primaryColorLight: '#E8C545',
  visibleModules: ['dashboard', 'pipeline', 'projects', 'accounts', 'contacts', 'activities', 'campaigns', 'settings'],
  useDemoData: true,
  isActive: true,
  expiresAt: null,
};

export const INGEFIX_TENANT: TenantConfig = {
  hostname: 'ingefix.cl',
  name: 'INGEFIX CRM',
  tagline: 'Sistema de Gestión',
  logoText: 'INGEFIX',
  primaryColor: '#D4A824',
  primaryColorLight: '#E8C545',
  visibleModules: ['dashboard', 'pipeline', 'projects', 'accounts', 'contacts', 'activities', 'campaigns', 'settings'],
  useDemoData: true,
  isActive: true,
  expiresAt: null,
};

export const ALL_MODULES: ViewType[] = [
  'dashboard', 'pipeline', 'projects', 'accounts', 'contacts', 'activities', 'campaigns', 'settings',
];

export const MODULE_LABELS: Record<ViewType, string> = {
  dashboard: 'Dashboard',
  pipeline: 'Pipeline',
  projects: 'Proyectos',
  accounts: 'Cuentas',
  contacts: 'Contactos',
  activities: 'Actividades',
  campaigns: 'Campañas',
  settings: 'Configuración',
  'project-detail': 'Proyecto',
  'account-detail': 'Cuenta',
  'contact-detail': 'Contacto',
  'tenant-admin': 'Admin',
};

let cachedTenants: TenantsConfigFile | null = null;
let tenantsPromise: Promise<TenantsConfigFile> | null = null;

export async function loadTenantConfig(): Promise<TenantsConfigFile> {
  if (cachedTenants) return cachedTenants;
  if (tenantsPromise) return tenantsPromise;

  tenantsPromise = fetch('/tenants.json')
    .then(async (res) => {
      if (res.ok) {
        const data = await res.json();
        cachedTenants = {
          version: data.version ?? 1,
          tenants: data.tenants ?? [],
          default: data.default ?? DEFAULT_TENANT,
        };
        return cachedTenants;
      }
      throw new Error('tenants.json not found');
    })
    .catch(() => {
      cachedTenants = { version: 1, tenants: [], default: DEFAULT_TENANT };
      return cachedTenants;
    });

  return tenantsPromise;
}

export function getTenantConfig(tenantsFile: TenantsConfigFile): TenantConfig {
  const hostname = getEffectiveHostname();
  if (hostname.endsWith('ingefix.cl')) return INGEFIX_TENANT;
  const match = tenantsFile.tenants.find((t) => t.hostname === hostname);
  return match ?? tenantsFile.default ?? DEFAULT_TENANT;
}

export function hasDedicatedTenant(tenantsFile: TenantsConfigFile): boolean {
  const hostname = getEffectiveHostname();
  if (hostname.endsWith('ingefix.cl')) return true;
  return tenantsFile.tenants.some((t) => t.hostname === hostname);
}

export function isIngefixDomain(): boolean {
  return getEffectiveHostname().endsWith('ingefix.cl');
}

/** Dominio de administración: admin.pulpocrm.cl (o cualquier admin.*) */
export function isAdminDomain(): boolean {
  return getEffectiveHostname().startsWith('admin.');
}

export function checkTenantSubscription(tenant: TenantConfig): { active: boolean; reason?: 'suspended' | 'expired' } {
  if (tenant.hostname === 'ingefix.cl') return { active: true };
  if (tenant.isActive === false) return { active: false, reason: 'suspended' };
  if (tenant.expiresAt) {
    const expiry = new Date(tenant.expiresAt);
    const now = new Date();
    const expiryDate = new Date(expiry.getFullYear(), expiry.getMonth(), expiry.getDate());
    const nowDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    if (nowDate > expiryDate) return { active: false, reason: 'expired' };
  }
  return { active: true };
}

export function getTenantStorageKey(baseKey: string): string {
  if (isIngefixDomain()) return `ingefix_${baseKey}`;
  const hostname = getEffectiveHostname();
  const key = hostname.replace(/[^a-zA-Z0-9]/g, '_');
  return `${key}_${baseKey}`;
}

export function getTenantFromHostname(hostname: string): string {
  if (hostname === 'localhost' || /^\d+\.\d+\.\d+\.\d+/.test(hostname)) return 'default';
  const parts = hostname.split('.');
  if (parts.length >= 2) {
    const domain = parts.slice(-2).join('.');
    if (domain === 'pulpocrm.cl' || domain === 'crm-pyme.cl' || domain === 'localhost:5173') return parts.length > 2 ? parts[0] : 'default';
    if (domain === 'ingefix.cl') return 'ingefix';
  }
  return 'default';
}

// --- Admin access (landing page) ---

export const DEFAULT_ADMIN_PIN = '2026';

export function getAdminPin(tenantsFile: TenantsConfigFile | null): string {
  return tenantsFile?.adminPin || DEFAULT_ADMIN_PIN;
}

export function checkAdminPin(pin: string, tenantsFile: TenantsConfigFile | null): boolean {
  return pin.trim() === getAdminPin(tenantsFile);
}

// --- Onboarding helpers ---

export interface OnboardingConfig {
  companyName: string;
  userName: string;
  useDemoData: boolean;
  completedAt: string;
}

export function getOnboardingKey(): string {
  return getTenantStorageKey('onboarding_config');
}

export function getOnboardingConfig(): OnboardingConfig | null {
  try {
    const raw = localStorage.getItem(getOnboardingKey());
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setOnboardingConfig(config: OnboardingConfig): void {
  localStorage.setItem(getOnboardingKey(), JSON.stringify(config));
}

export function isOnboardingComplete(): boolean {
  return getOnboardingConfig() !== null;
}

export function clearOnboardingConfig(): void {
  localStorage.removeItem(getOnboardingKey());
}
