/**
 * Branding configuration for multi-tenant CRM
 * Detects subdomain and applies appropriate branding
 */

export interface TenantBranding {
  name: string;
  tagline: string;
  logoText: string;
  primaryColor: string;
  primaryColorLight: string;
  domain: string;
}

// Default PulpoCRM branding (for reselling)
const DEFAULT_BRANDING: TenantBranding = {
  name: 'PulpoCRM',
  tagline: 'Gestión Comercial para PYMEs',
  logoText: 'PulpoCRM',
  primaryColor: '#D4A824',
  primaryColorLight: '#E8C545',
  domain: 'pulpocrm.cl',
};

// INGEFIX branding (your current CRM)
const INGEFIX_BRANDING: TenantBranding = {
  name: 'INGEFIX CRM',
  tagline: 'Sistema de Gestión',
  logoText: 'INGEFIX',
  primaryColor: '#D4A824',
  primaryColorLight: '#E8C545',
  domain: 'ingefix.cl',
};

/**
 * Detect tenant from subdomain
 * Examples:
 *   - cliente1.crm-pyme.cl -> tenant: 'cliente1'
 *   - ingefix.cl -> tenant: 'ingefix'
 *   - localhost -> tenant: 'default'
 */
export function getTenantFromHostname(hostname: string): string {
  // Handle localhost and IP addresses
  if (hostname === 'localhost' || /^\d+\.\d+\.\d+\.\d+/.test(hostname)) {
    return 'default';
  }

  // Extract subdomain
  const parts = hostname.split('.');

  // If it's the product domain
  if (parts.length >= 2) {
    const domain = parts.slice(-2).join('.');
    if (domain === 'pulpocrm.cl' || domain === 'crm-pyme.cl' || domain === 'localhost:5173') {
      // Return the subdomain as tenant, or 'default' if no subdomain
      return parts.length > 2 ? parts[0] : 'default';
    }
    if (domain === 'ingefix.cl') {
      return 'ingefix';
    }
  }

  return 'default';
}

/**
 * Effective hostname for tenant resolution.
 * Supports a `?tenant=` URL override to preview any client without DNS:
 *   ?tenant=constructora-andes  ->  constructora-andes.pulpocrm.cl
 *   ?tenant=cliente.midominio.cl (full hostname also works)
 */
export function getEffectiveHostname(): string {
  try {
    const param = new URLSearchParams(window.location.search).get('tenant');
    if (param) {
      const clean = param.trim().toLowerCase().replace(/[^a-z0-9.-]/g, '');
      if (clean) return clean.includes('.') ? clean : `${clean}.pulpocrm.cl`;
    }
  } catch {
    // ignore malformed URLs
  }
  return window.location.hostname;
}

/**
 * Build-time brand flag.
 * - Default build (no env var): PulpoCRM — the sellable product. The preview
 *   pipeline rebuilds without env vars, so the default must be the product.
 *   INGEFIX (personal) deployments are still safe: ingefix.cl hostnames always
 *   resolve to the INGEFIX tenant and skip the landing, in either build.
 * - INGEFIX-only build (optional):  VITE_BRAND=ingefix npm run build
 */
const BUILD_BRAND: string = (import.meta as any).env?.VITE_BRAND || 'crm-pyme';

export function isCrmPymeBuild(): boolean {
  return BUILD_BRAND === 'crm-pyme';
}

/**
 * Get branding for current tenant.
 * - Hostnames under ingefix.cl always show INGEFIX (either build).
 * - Otherwise: INGEFIX build shows INGEFIX, CRM-PyME build shows CRM-PyME.
 */
export function getBranding(): TenantBranding {
  const hostname = getEffectiveHostname();
  const tenant = getTenantFromHostname(hostname);

  if (tenant === 'ingefix') {
    return INGEFIX_BRANDING;
  }

  return isCrmPymeBuild() ? DEFAULT_BRANDING : INGEFIX_BRANDING;
}

/**
 * Get tenant-specific data key for localStorage isolation.
 * - INGEFIX build: always uses the legacy 'ingefix_*' keys, so existing
 *   users keep their data exactly as before.
 * - CRM-PyME build: prefixes keys with the subdomain tenant
 *   (cliente1.crm-pyme.cl -> 'cliente1_crm_data'), so each client
 *   gets an isolated namespace even on a shared browser profile.
 */
export function getTenantStorageKey(baseKey: string): string {
  if (!isCrmPymeBuild()) {
    return `ingefix_${baseKey}`;
  }
  const tenant = getTenantFromHostname(getEffectiveHostname());
  return `${tenant}_${baseKey}`;
}

/**
 * Initialize tenant-specific storage namespace
 * Call this before accessing localStorage to ensure proper isolation
 */
export function initTenantStorage(): void {
  // This function ensures that when we save/load data,
  // we use tenant-specific keys
}

// --- Onboarding helpers ---

export interface OnboardingConfig {
  companyName: string;
  userName: string;
  useDemoData: boolean;
  completedAt: string;
}

const ONBOARDING_KEY = 'onboarding_config';

export function getOnboardingKey(): string {
  return getTenantStorageKey(ONBOARDING_KEY);
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
