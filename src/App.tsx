import { useState, useEffect } from 'react';
import { AppProvider, useApp } from '@/context/AppContext';
import { Sidebar } from '@/components/Sidebar';
import { Toast } from '@/components/ui/Toast';
import { ProjectFormModal } from '@/components/modals/ProjectFormModal';
import { AccountFormModal } from '@/components/modals/AccountFormModal';
import { ContactFormModal } from '@/components/modals/ContactFormModal';
import { ActivityFormModal } from '@/components/modals/ActivityFormModal';
import { OpportunityFormModal } from '@/components/modals/OpportunityFormModal';
import { ImportCSVModal } from '@/components/modals/ImportCSVModal';
import { DashboardView } from '@/views/DashboardView';
import { PipelineView } from '@/views/PipelineView';
import { ProjectsView } from '@/views/ProjectsView';
import { ProjectDetail } from '@/views/ProjectDetail';
import { AccountsView } from '@/views/AccountsView';
import { AccountDetail } from '@/views/AccountDetail';
import { ContactsView } from '@/views/ContactsView';
import { ContactDetail } from '@/views/ContactDetail';
import { ActivitiesView } from '@/views/ActivitiesView';
import { CampaignsView } from '@/views/CampaignsView';
import { SettingsView } from '@/views/SettingsView';
import { TenantAdminView } from '@/views/TenantAdminView';
import { GlobalSearch } from '@/components/GlobalSearch';
import { LandingPage } from '@/components/LandingPage';
import { TenantWelcome } from '@/components/TenantWelcome';
import { SubscriptionBlocked } from '@/components/SubscriptionBlocked';
import { loadTenantConfig, hasDedicatedTenant, isCrmPymeBuild, isIngefixDomain, isAdminDomain, getTenantConfig, checkTenantSubscription, getAdminPin, getEffectiveHostname, type TenantsConfigFile } from '@/config/tenantConfig';
import { AdminGate } from '@/components/AdminGate';
import './index.css';

function AppContent() {
  const { state } = useApp();
  const renderView = () => {
    switch (state.activeView) {
      case 'dashboard': return <DashboardView />;
      case 'pipeline': return <PipelineView />;
      case 'projects': return <ProjectsView />;
      case 'project-detail': return <ProjectDetail />;
      case 'accounts': return <AccountsView />;
      case 'account-detail': return <AccountDetail />;
      case 'contacts': return <ContactsView />;
      case 'contact-detail': return <ContactDetail />;
      case 'activities': return <ActivitiesView />;
      case 'campaigns': return <CampaignsView />;
      case 'settings': return <SettingsView />;
      case 'tenant-admin': return <TenantAdminView />;
      default: return <DashboardView />;
    }
  };
  return (
    <div className="min-h-screen bg-[#181A20]">
      <Sidebar />
      <div className="md:ml-[280px] min-h-screen">
        <main className="p-5 sm:p-7 lg:p-10 max-w-[1440px] mx-auto">
          {renderView()}
        </main>
      </div>
      <OpportunityFormModal />
      <ProjectFormModal />
      <AccountFormModal />
      <ContactFormModal />
      <ActivityFormModal />
      <Toast />
      {state.modalOpen === 'import-csv' && <ImportCSVModal />}
      <GlobalSearch />
    </div>
  );
}

function App() {
  const [tenantsFile, setTenantsFile] = useState<TenantsConfigFile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAdmin, setShowAdmin] = useState(false);
  const [welcomed, setWelcomed] = useState(() => {
    try {
      return sessionStorage.getItem(`pulpocrm_welcome_${getEffectiveHostname()}`) === '1';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    loadTenantConfig().then((config) => {
      setTenantsFile(config);
      setLoading(false);
    });
  }, []);

  const handleEnter = () => {
    try {
      sessionStorage.setItem(`pulpocrm_welcome_${getEffectiveHostname()}`, '1');
    } catch {
      // sessionStorage unavailable
    }
    setWelcomed(true);
  };

  // Título de la pestaña según build/tenant
  useEffect(() => {
    if (!tenantsFile) return;
    if (!isCrmPymeBuild()) {
      document.title = 'INGEFIX CRM';
      return;
    }
    const hasTenant = hasDedicatedTenant(tenantsFile);
    document.title = hasTenant ? getTenantConfig(tenantsFile).name : 'PulpoCRM';
  }, [tenantsFile]);

  // Línea corporativa morada solo en el build producto (PulpoCRM)
  useEffect(() => {
    document.body.classList.toggle('pulpocrm-brand', isCrmPymeBuild());
    return () => document.body.classList.remove('pulpocrm-brand');
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#181A20] flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-[#D4A824] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-[#6B7280]">Cargando...</p>
        </div>
      </div>
    );
  }

  // INGEFIX build: always show the CRM, no landing page
  if (!isCrmPymeBuild()) {
    return (
      <AppProvider>
        <AppContent />
      </AppProvider>
    );
  }

  // PulpoCRM build: subdominio admin.* → puerta con PIN directo al panel
  if (isAdminDomain() && !showAdmin) {
    return (
      <AdminGate
        adminPin={getAdminPin(tenantsFile)}
        onUnlock={() => setShowAdmin(true)}
      />
    );
  }

  // PulpoCRM build: admin panel (acceso desde admin.* o desde la landing con PIN)
  if (showAdmin) {
    return (
      <AppProvider initialTenantConfig={tenantsFile?.default ?? null}>
        <div className="min-h-screen bg-[#181A20]">
          <div className="max-w-[1100px] mx-auto p-5 sm:p-7">
            <button
              onClick={() => setShowAdmin(false)}
              className="mb-6 text-sm text-[#6B7280] hover:text-[#F0F2F5] transition-colors"
            >
              ← Volver a la portada
            </button>
            <TenantAdminView />
          </div>
          <Toast />
        </div>
      </AppProvider>
    );
  }

  // PulpoCRM build: check if this hostname has a dedicated tenant
  const hasTenant = tenantsFile ? hasDedicatedTenant(tenantsFile) : false;

  // If no dedicated tenant, show generic landing page (not the CRM)
  if (!hasTenant) {
    return (
      <LandingPage
        adminPin={getAdminPin(tenantsFile)}
        onAdminAccess={() => setShowAdmin(true)}
      />
    );
  }

  // This hostname HAS a tenant config — check if subscription is active
  const tenant = tenantsFile ? getTenantConfig(tenantsFile) : null;
  const subscription = tenant ? checkTenantSubscription(tenant) : { active: true };

  if (!subscription.active && tenant) {
    return (
      <SubscriptionBlocked
        reason={subscription.reason!}
        tenantName={tenant.name}
        expiryDate={tenant.expiresAt}
        contactEmail={tenant.contactEmail}
      />
    );
  }

  // Pantalla de bienvenida del cliente ("Hola..." + Ingresar), una vez por sesión.
  // INGEFIX (uso personal) entra directo, sin bienvenida.
  if (!welcomed && tenant && !isIngefixDomain()) {
    return <TenantWelcome tenant={tenant} onEnter={handleEnter} />;
  }

  return (
    <AppProvider initialTenantConfig={tenant}>
      <AppContent />
    </AppProvider>
  );
}

export default App;
