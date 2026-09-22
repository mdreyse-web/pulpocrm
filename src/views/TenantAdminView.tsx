import { useState, useRef, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import {
  loadTenantConfig,
  checkTenantSubscription,
  type TenantConfig,
  type TenantsConfigFile,
  DEFAULT_TENANT,
  ALL_MODULES,
  MODULE_LABELS,
} from '@/config/tenantConfig';
import {
  Plus,
  Trash2,
  Download,
  Upload,
  Palette,
  LayoutGrid,
  Globe,
  Building2,
  Tag,
  ImageIcon,
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  Lock,
  Calendar,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

const DEFAULT_NEW_TENANT: TenantConfig = {
  hostname: '',
  name: '',
  tagline: 'Gestión Comercial',
  logoText: '',
  primaryColor: '#D4A824',
  primaryColorLight: '#E8C545',
  visibleModules: ['dashboard', 'pipeline', 'projects', 'accounts', 'contacts', 'activities', 'campaigns', 'settings'],
  useDemoData: false,
  isActive: true,
  expiresAt: null,
  monthlyPrice: 15000,
};

function getSubscriptionStatus(tenant: TenantConfig): {
  label: string;
  color: string;
  bgColor: string;
  icon: React.ElementType;
  daysLeft: number | null;
} {
  const check = checkTenantSubscription(tenant);
  if (!check.active) {
    if (check.reason === 'suspended') {
      return { label: 'Suspendido', color: 'text-[#EF4444]', bgColor: 'bg-[#EF4444]/10', icon: XCircle, daysLeft: null };
    }
    return { label: 'Vencido', color: 'text-[#EF4444]', bgColor: 'bg-[#EF4444]/10', icon: AlertCircle, daysLeft: null };
  }

  if (tenant.expiresAt) {
    const expiry = new Date(tenant.expiresAt);
    const now = new Date();
    const diff = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diff <= 7) {
      return { label: `Vence en ${diff}d`, color: 'text-[#F59E0B]', bgColor: 'bg-[#F59E0B]/10', icon: Calendar, daysLeft: diff };
    }
    return { label: 'Activo', color: 'text-[#22C55E]', bgColor: 'bg-[#22C55E]/10', icon: CheckCircle2, daysLeft: diff };
  }

  return { label: 'Activo', color: 'text-[#22C55E]', bgColor: 'bg-[#22C55E]/10', icon: CheckCircle2, daysLeft: null };
}

export function TenantAdminView() {
  const { showToast } = useApp();
  const [tenantsFile, setTenantsFile] = useState<TenantsConfigFile | null>(null);
  const [editing, setEditing] = useState<TenantConfig | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadTenantConfig().then(setTenantsFile);
  }, []);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editing) return;
    if (file.size > 500 * 1024) {
      showToast('El logo debe ser menor a 500KB', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setLogoPreview(base64);
      setEditing({ ...editing, logoBase64: base64 });
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    if (!editing || !tenantsFile) return;
    if (!editing.hostname.trim() || !editing.name.trim()) {
      showToast('Hostname y nombre son obligatorios', 'error');
      return;
    }
    const isNew = !tenantsFile.tenants.find((t) => t.hostname === editing.hostname);
    let nextTenants: TenantConfig[];
    if (isNew) {
      nextTenants = [...tenantsFile.tenants, editing];
    } else {
      nextTenants = tenantsFile.tenants.map((t) =>
        t.hostname === editing.hostname ? editing : t
      );
    }
    const updated: TenantsConfigFile = { ...tenantsFile, tenants: nextTenants };
    setTenantsFile(updated);
    setEditing(null);
    setLogoPreview(null);
    showToast(isNew ? 'Cliente creado' : 'Cliente actualizado', 'success');
  };

  const handleDelete = (hostname: string) => {
    if (!tenantsFile) return;
    if (!window.confirm(`¿Eliminar el cliente "${hostname}"?`)) return;
    const updated: TenantsConfigFile = { ...tenantsFile, tenants: tenantsFile.tenants.filter((t) => t.hostname !== hostname) };
    setTenantsFile(updated);
    showToast('Cliente eliminado', 'warning');
  };

  const handleDownload = () => {
    if (!tenantsFile) return;
    const blob = new Blob([JSON.stringify(tenantsFile, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tenants.json';
    a.click();
    URL.revokeObjectURL(url);
    showToast('Archivo tenants.json descargado', 'success');
  };

  const handleCopyJson = () => {
    if (!tenantsFile) return;
    navigator.clipboard.writeText(JSON.stringify(tenantsFile, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    showToast('JSON copiado al portapapeles', 'success');
  };

  const startNew = () => {
    // Set default expiry to 30 days from now
    const nextMonth = new Date();
    nextMonth.setDate(nextMonth.getDate() + 30);
    setEditing({ ...DEFAULT_NEW_TENANT, expiresAt: nextMonth.toISOString().split('T')[0] });
    setLogoPreview(null);
    setExpandedId(null);
  };

  const startEdit = (t: TenantConfig) => {
    setEditing({ ...t });
    setLogoPreview(t.logoBase64 || null);
    setExpandedId(null);
  };

  const toggleModule = (module: string) => {
    if (!editing) return;
    const has = editing.visibleModules.includes(module as any);
    setEditing({
      ...editing,
      visibleModules: has
        ? editing.visibleModules.filter((m) => m !== module)
        : [...editing.visibleModules, module as any],
    });
  };

  if (!tenantsFile) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-[#D4A824] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#F0F2F5]">Administrador de Clientes</h1>
          <p className="text-sm text-[#6B7280]">
            Configura y controla el acceso de cada empresa
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleCopyJson} className="px-4 py-2 bg-[#2A2D35] hover:bg-[#3A3D45] text-[#F0F2F5] text-sm font-medium rounded-lg transition-colors flex items-center gap-2">
            {copied ? <Check className="w-4 h-4 text-[#22C55E]" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copiado' : 'Copiar JSON'}
          </button>
          <button onClick={handleDownload} className="px-4 py-2 bg-[#D4A824] hover:bg-[#E8C545] text-[#181A20] text-sm font-semibold rounded-lg transition-colors flex items-center gap-2">
            <Download className="w-4 h-4" />
            Descargar tenants.json
          </button>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        <div className="bg-[#1E2028] border border-[#2A2D3A] rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-[#F0F2F5]">{tenantsFile.tenants.length}</p>
          <p className="text-xs text-[#6B7280]">Clientes totales</p>
        </div>
        <div className="bg-[#1E2028] border border-[#2A2D3A] rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-[#22C55E]">
            {tenantsFile.tenants.filter((t) => checkTenantSubscription(t).active).length}
          </p>
          <p className="text-xs text-[#6B7280]">Activos</p>
        </div>
        <div className="bg-[#1E2028] border border-[#2A2D3A] rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-[#F59E0B]">
            {tenantsFile.tenants.filter((t) => {
              const s = getSubscriptionStatus(t);
              return s.daysLeft !== null && s.daysLeft <= 7 && s.daysLeft > 0;
            }).length}
          </p>
          <p className="text-xs text-[#6B7280]">Por vencer (&le;7d)</p>
        </div>
        <div className="bg-[#1E2028] border border-[#2A2D3A] rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-[#EF4444]">
            {tenantsFile.tenants.filter((t) => !checkTenantSubscription(t).active).length}
          </p>
          <p className="text-xs text-[#6B7280]">Suspendidos/Vencidos</p>
        </div>
      </div>

      {/* Tenant list */}
      <div className="space-y-3 mb-8">
        {tenantsFile.tenants.map((tenant) => {
          const status = getSubscriptionStatus(tenant);
          const StatusIcon = status.icon;
          return (
            <div key={tenant.hostname} className="bg-[#1E2028] border border-[#2A2D3A] rounded-xl overflow-hidden">
              <div
                className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-[#22252D] transition-colors"
                onClick={() => setExpandedId(expandedId === tenant.hostname ? null : tenant.hostname)}
              >
                <div className="flex items-center gap-4">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold"
                    style={{ backgroundColor: tenant.primaryColor + '20', color: tenant.primaryColor }}
                  >
                    {tenant.logoBase64 ? (
                      <img src={tenant.logoBase64} alt={tenant.name} className="w-8 h-8 object-contain" />
                    ) : (
                      tenant.logoText.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-[#F0F2F5]">{tenant.name}</p>
                      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${status.bgColor} ${status.color}`}>
                        <StatusIcon className="w-3 h-3" />
                        {status.label}
                      </span>
                    </div>
                    <p className="text-xs text-[#6B7280] font-mono">{tenant.hostname}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); startEdit(tenant); }}
                    className="px-3 py-1.5 text-xs bg-[#2A2D35] hover:bg-[#3A3D45] text-[#D4A824] rounded-lg transition-colors"
                  >
                    Editar
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(tenant.hostname); }}
                    className="p-1.5 text-[#6B7280] hover:text-[#EF4444] hover:bg-[#EF4444]/10 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  {expandedId === tenant.hostname ? <ChevronUp className="w-4 h-4 text-[#6B7280]" /> : <ChevronDown className="w-4 h-4 text-[#6B7280]" />}
                </div>
              </div>

              {expandedId === tenant.hostname && (
                <div className="px-5 pb-4 border-t border-[#2A2D3A] pt-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><span className="text-[#6B7280]">Tagline:</span> <span className="text-[#F0F2F5]">{tenant.tagline}</span></div>
                    <div>
                      <span className="text-[#6B7280]">Color:</span>{' '}
                      <span className="inline-block w-3 h-3 rounded-full align-middle ml-1" style={{ backgroundColor: tenant.primaryColor }} />
                      <span className="text-[#F0F2F5] font-mono ml-1">{tenant.primaryColor}</span>
                    </div>
                    <div><span className="text-[#6B7280]">Logo texto:</span> <span className="text-[#F0F2F5]">{tenant.logoText}</span></div>
                    <div><span className="text-[#6B7280]">Datos demo:</span> <span className="text-[#F0F2F5]">{tenant.useDemoData ? 'Sí' : 'No'}</span></div>
                    <div><span className="text-[#6B7280]">Activo:</span> <span className={tenant.isActive !== false ? 'text-[#22C55E]' : 'text-[#EF4444]'}>{tenant.isActive !== false ? 'Sí' : 'No'}</span></div>
                    <div><span className="text-[#6B7280]">Vence:</span> <span className="text-[#F0F2F5]">{tenant.expiresAt ? new Date(tenant.expiresAt).toLocaleDateString('es-CL') : 'Sin fecha'}</span></div>
                    <div><span className="text-[#6B7280]">Precio mensual:</span> <span className="text-[#F0F2F5]">${tenant.monthlyPrice?.toLocaleString('es-CL') || '-'}</span></div>
                    <div className="col-span-2"><span className="text-[#6B7280]">Módulos:</span> <span className="text-[#F0F2F5]">{tenant.visibleModules.map((m) => MODULE_LABELS[m]).join(', ')}</span></div>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {tenantsFile.tenants.length === 0 && (
          <div className="text-center py-12 bg-[#1E2028] border border-[#2A2D3A] rounded-xl">
            <Building2 className="w-10 h-10 text-[#3A3F48] mx-auto mb-3" />
            <p className="text-[#6B7280] text-sm">No hay clientes configurados aún</p>
            <p className="text-[#4B5563] text-xs mt-1">Agrega tu primer cliente para empezar a vender</p>
          </div>
        )}
      </div>

      {/* Add new / Edit form */}
      {editing ? (
        <div className="bg-[#1E2028] border border-[#2A2D3A] rounded-xl p-6">
          <h2 className="text-lg font-semibold text-[#F0F2F5] mb-5">
            {tenantsFile.tenants.find((t) => t.hostname === editing.hostname) ? 'Editar Cliente' : 'Nuevo Cliente'}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-[#9CA3AF] mb-1.5 flex items-center gap-1.5">
                <Globe className="w-4 h-4" />
                Hostname (URL completa)
              </label>
              <input
                type="text"
                value={editing.hostname}
                onChange={(e) => setEditing({ ...editing, hostname: e.target.value })}
                placeholder="ej: constructora-andes.pulpocrm.cl"
                className="w-full px-4 py-2.5 bg-[#181A20] border border-[#2A2D3A] rounded-lg text-sm text-[#F0F2F5] placeholder-[#4B5563] focus:outline-none focus:border-[#D4A824]/50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#9CA3AF] mb-1.5 flex items-center gap-1.5">
                <Building2 className="w-4 h-4" />
                Nombre de la empresa
              </label>
              <input
                type="text"
                value={editing.name}
                onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                placeholder="Ej: Constructora Los Andes"
                className="w-full px-4 py-2.5 bg-[#181A20] border border-[#2A2D3A] rounded-lg text-sm text-[#F0F2F5] placeholder-[#4B5563] focus:outline-none focus:border-[#D4A824]/50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#9CA3AF] mb-1.5 flex items-center gap-1.5">
                <Tag className="w-4 h-4" />
                Tagline
              </label>
              <input
                type="text"
                value={editing.tagline}
                onChange={(e) => setEditing({ ...editing, tagline: e.target.value })}
                placeholder="Ej: CRM de Ventas"
                className="w-full px-4 py-2.5 bg-[#181A20] border border-[#2A2D3A] rounded-lg text-sm text-[#F0F2F5] placeholder-[#4B5563] focus:outline-none focus:border-[#D4A824]/50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#9CA3AF] mb-1.5">
                Texto del logo (si no hay imagen)
              </label>
              <input
                type="text"
                value={editing.logoText}
                onChange={(e) => setEditing({ ...editing, logoText: e.target.value })}
                placeholder="Ej: Los Andes"
                className="w-full px-4 py-2.5 bg-[#181A20] border border-[#2A2D3A] rounded-lg text-sm text-[#F0F2F5] placeholder-[#4B5563] focus:outline-none focus:border-[#D4A824]/50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#9CA3AF] mb-1.5 flex items-center gap-1.5">
                <Palette className="w-4 h-4" />
                Color primario
              </label>
              <div className="flex items-center gap-3">
                <input type="color" value={editing.primaryColor} onChange={(e) => setEditing({ ...editing, primaryColor: e.target.value })} className="w-12 h-10 rounded-lg border border-[#2A2D3A] bg-transparent cursor-pointer" />
                <input type="text" value={editing.primaryColor} onChange={(e) => setEditing({ ...editing, primaryColor: e.target.value })} className="flex-1 px-4 py-2.5 bg-[#181A20] border border-[#2A2D3A] rounded-lg text-sm text-[#F0F2F5] font-mono focus:outline-none focus:border-[#D4A824]/50" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#9CA3AF] mb-1.5">
                Color claro (hover)
              </label>
              <div className="flex items-center gap-3">
                <input type="color" value={editing.primaryColorLight} onChange={(e) => setEditing({ ...editing, primaryColorLight: e.target.value })} className="w-12 h-10 rounded-lg border border-[#2A2D3A] bg-transparent cursor-pointer" />
                <input type="text" value={editing.primaryColorLight} onChange={(e) => setEditing({ ...editing, primaryColorLight: e.target.value })} className="flex-1 px-4 py-2.5 bg-[#181A20] border border-[#2A2D3A] rounded-lg text-sm text-[#F0F2F5] font-mono focus:outline-none focus:border-[#D4A824]/50" />
              </div>
            </div>

            {/* Subscription controls */}
            <div className="md:col-span-2 p-4 rounded-xl border border-[#2A2D3A] bg-[#181A20]/50">
              <h3 className="text-sm font-medium text-[#F0F2F5] mb-4 flex items-center gap-2">
                <Lock className="w-4 h-4 text-[#D4A824]" />
                Control de Suscripción
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-[#9CA3AF] mb-1.5">Estado de acceso</label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editing.isActive !== false}
                      onChange={(e) => setEditing({ ...editing, isActive: e.target.checked })}
                      className="w-4 h-4 rounded border-[#2A2D3A] bg-[#181A20] text-[#D4A824] accent-[#D4A824]"
                    />
                    <span className="text-sm text-[#F0F2F5]">
                      {editing.isActive !== false ? 'Acceso habilitado' : 'Acceso suspendido'}
                    </span>
                  </label>
                </div>
                <div>
                  <label className="block text-xs text-[#9CA3AF] mb-1.5 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Fecha de vencimiento
                  </label>
                  <input
                    type="date"
                    value={editing.expiresAt || ''}
                    onChange={(e) => setEditing({ ...editing, expiresAt: e.target.value || null })}
                    className="w-full px-3 py-2 bg-[#181A20] border border-[#2A2D3A] rounded-lg text-sm text-[#F0F2F5] focus:outline-none focus:border-[#D4A824]/50"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#9CA3AF] mb-1.5 flex items-center gap-1">
                    <DollarSign className="w-3 h-3" />
                    Precio mensual (referencia)
                  </label>
                  <input
                    type="number"
                    value={editing.monthlyPrice || ''}
                    onChange={(e) => setEditing({ ...editing, monthlyPrice: parseInt(e.target.value) || 0 })}
                    placeholder="Ej: 15000"
                    className="w-full px-3 py-2 bg-[#181A20] border border-[#2A2D3A] rounded-lg text-sm text-[#F0F2F5] focus:outline-none focus:border-[#D4A824]/50"
                  />
                </div>
              </div>
              {editing.isActive === false && (
                <p className="mt-3 text-xs text-[#EF4444] flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Este cliente verá una pantalla de "Acceso suspendido" al entrar a su URL.
                </p>
              )}
            </div>

            {/* Logo upload */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-[#9CA3AF] mb-1.5 flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4" />
                Logo (máx 500KB, se convierte a base64)
              </label>
              <div className="flex items-center gap-4">
                <button onClick={() => fileInputRef.current?.click()} className="px-4 py-2.5 bg-[#2A2D35] hover:bg-[#3A3D45] text-[#F0F2F5] text-sm rounded-lg transition-colors flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  Subir logo
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                {logoPreview && (
                  <div className="flex items-center gap-3">
                    <img src={logoPreview} alt="Preview" className="h-10 w-auto object-contain bg-[#181A20] rounded-lg p-1 border border-[#2A2D3A]" />
                    <button onClick={() => { setLogoPreview(null); setEditing({ ...editing, logoBase64: undefined }); }} className="text-xs text-[#EF4444] hover:underline">Quitar</button>
                  </div>
                )}
              </div>
            </div>

            {/* Modules */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-[#9CA3AF] mb-2 flex items-center gap-1.5">
                <LayoutGrid className="w-4 h-4" />
                Módulos visibles en el menú
              </label>
              <div className="flex flex-wrap gap-2">
                {ALL_MODULES.map((mod) => (
                  <button
                    key={mod}
                    onClick={() => toggleModule(mod)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      editing.visibleModules.includes(mod)
                        ? 'bg-[#D4A824]/20 text-[#D4A824] border border-[#D4A824]/30'
                        : 'bg-[#181A20] text-[#6B7280] border border-[#2A2D3A]'
                    }`}
                  >
                    {MODULE_LABELS[mod]}
                  </button>
                ))}
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editing.useDemoData}
                  onChange={(e) => setEditing({ ...editing, useDemoData: e.target.checked })}
                  className="w-4 h-4 rounded border-[#2A2D3A] bg-[#181A20] text-[#D4A824] accent-[#D4A824]"
                />
                <span className="text-sm text-[#F0F2F5]">Cargar datos de ejemplo al entrar por primera vez</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-[#2A2D3A]">
            <button onClick={() => { setEditing(null); setLogoPreview(null); }} className="px-5 py-2 text-sm text-[#9CA3AF] hover:text-[#F0F2F5] transition-colors">Cancelar</button>
            <button onClick={handleSave} className="px-5 py-2 bg-[#D4A824] hover:bg-[#E8C545] text-[#181A20] text-sm font-semibold rounded-lg transition-colors">Guardar Cliente</button>
          </div>
        </div>
      ) : (
        <button onClick={startNew} className="w-full py-4 border-2 border-dashed border-[#2A2D3A] hover:border-[#D4A824]/40 rounded-xl text-[#6B7280] hover:text-[#D4A824] transition-colors flex items-center justify-center gap-2">
          <Plus className="w-5 h-5" />
          Agregar nuevo cliente
        </button>
      )}

      {/* JSON Preview */}
      <div className="mt-8">
        <h3 className="text-sm font-medium text-[#9CA3AF] mb-2">Vista previa de tenants.json</h3>
        <pre className="bg-[#0D0E12] border border-[#2A2D3A] rounded-xl p-4 text-xs text-[#9CA3AF] overflow-x-auto max-h-64 overflow-y-auto">
          {JSON.stringify(tenantsFile, null, 2)}
        </pre>
      </div>
    </div>
  );
}
