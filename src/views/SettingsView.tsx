import { useState, useRef, useEffect } from 'react';
import { Database, Upload, FileJson, FileSpreadsheet, Trash2, AlertTriangle, Cloud, Share2, Smartphone, CheckCircle2, GitMerge } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useApp } from '@/context/AppContext';
import { getTenantStorageKey } from '@/config/tenantConfig';

type SettingsTab = 'data' | 'sheets';
type ImportMode = 'replace' | 'merge';

interface MergeStat { label: string; added: number; updated: number }

// Fusiona por ID: agrega lo que no existe y gana el registro con updatedAt más reciente.
function mergeById<T extends { id: string; updatedAt?: string }>(current: T[], incoming: T[]) {
  const map = new Map<string, T>(current.map((i) => [i.id, i]));
  let added = 0;
  let updated = 0;
  for (const item of incoming) {
    const existing = map.get(item.id);
    if (!existing) {
      map.set(item.id, item);
      added++;
    } else if ((item.updatedAt || '') > (existing.updatedAt || '')) {
      map.set(item.id, item);
      updated++;
    }
  }
  return { items: Array.from(map.values()), added, updated };
}

export const SettingsView: React.FC = () => {
  const { state, exportToJSON, exportToCSV, importFromJSON, resetAllData, showToast, openModal } = useApp();
  const [activeTab, setActiveTab] = useState<SettingsTab>('data');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [importPreview, setImportPreview] = useState<{
    opportunities: number;
    projects: number;
    accounts: number;
    contacts: number;
    activities: number;
  } | null>(null);
  const [pendingImport, setPendingImport] = useState<string | null>(null);
  const [importMode, setImportMode] = useState<ImportMode>('replace');
  const [mergeStats, setMergeStats] = useState<MergeStat[] | null>(null);
  const [lastBackupAt, setLastBackupAt] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      setLastBackupAt(localStorage.getItem(getTenantStorageKey('last_backup_at')));
    } catch { /* ignore */ }
  }, []);

  const daysSinceBackup = lastBackupAt
    ? Math.floor((Date.now() - new Date(lastBackupAt).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  const buildBackupFile = (): File => {
    const data = {
      opportunities: state.opportunities,
      projects: state.projects,
      accounts: state.accounts,
      contacts: state.contacts,
      activities: state.activities,
    };
    const slug = (state.tenantConfig?.name || 'crm').toLowerCase().replace(/\s+/g, '-');
    const name = `${slug}-backup-${new Date().toISOString().split('T')[0]}.json`;
    return new File([JSON.stringify(data, null, 2)], name, { type: 'application/json' });
  };

  const markBackupDone = () => {
    const now = new Date().toISOString();
    try { localStorage.setItem(getTenantStorageKey('last_backup_at'), now); } catch { /* ignore */ }
    setLastBackupAt(now);
  };

  // Compartir respaldo: en móvil abre el menú nativo (Drive, Dropbox, WhatsApp, correo...);
  // en PC/Mac siempre descarga el archivo (el menú de compartir de escritorio falla en silencio).
  const handleShareBackup = async () => {
    const file = buildBackupFile();
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    const nav = navigator as Navigator & { canShare?: (d: { files: File[] }) => boolean; share?: (d: { files: File[]; title: string }) => Promise<void> };
    if (isMobile && nav.canShare && nav.canShare({ files: [file] }) && nav.share) {
      try {
        await nav.share({ files: [file], title: 'Respaldo CRM' });
        markBackupDone();
        showToast('Respaldo compartido', 'success');
      } catch {
        // usuario canceló el menú de compartir
      }
    } else {
      // Fallback escritorio: usar Blob (no File) y revocar la URL con delay,
      // si no Safari cancela la descarga silenciosamente
      const blob = new Blob([await file.text()], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      markBackupDone();
      showToast('Respaldo descargado. Súbelo a tu Drive o Dropbox.', 'success');
    }
  };

  // Migra respaldos de versiones antiguas al formato actual
  const migrateImported = (data: any) => ({
    opportunities: (data.opportunities || []).map((o: any) => ({
      projectId: o.projectId ?? null,
      lossReason: o.lossReason || '',
      notes: o.notes || '',
      priority: o.priority || 'medium',
      expectedCloseDate: o.expectedCloseDate ?? null,
      actualCloseDate: o.actualCloseDate ?? null,
      ...o,
    })),
    projects: (data.projects || []).map((p: any) => ({
      status: p.status || 'active',
      location: p.location || '',
      startDate: p.startDate || new Date().toISOString(),
      endDate: p.endDate || null,
      budget: p.budget || null,
      ...p,
    })),
    accounts: (data.accounts || []).map((a: any) => {
      if (a.projectIds !== undefined) return a;
      if (a.projectId) return { ...a, projectIds: [a.projectId] };
      return { ...a, projectIds: [] };
    }),
    contacts: data.contacts || [],
    activities: data.activities || [],
  });

  const openFilePicker = (mode: ImportMode) => {
    setImportMode(mode);
    if (fileInputRef.current) fileInputRef.current.value = '';
    fileInputRef.current?.click();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        if (importMode === 'merge') {
          // Vista previa de fusión: cuántos se agregan / actualizan por colección
          const mig = migrateImported(data);
          setMergeStats([
            { label: 'oportunidades', ...((({ items, ...r }) => r)(mergeById(state.opportunities, mig.opportunities))) },
            { label: 'proyectos', ...((({ items, ...r }) => r)(mergeById(state.projects, mig.projects))) },
            { label: 'cuentas', ...((({ items, ...r }) => r)(mergeById(state.accounts, mig.accounts))) },
            { label: 'contactos', ...((({ items, ...r }) => r)(mergeById(state.contacts, mig.contacts))) },
            { label: 'actividades', ...((({ items, ...r }) => r)(mergeById(state.activities, mig.activities))) },
          ]);
          setImportPreview(null);
        } else {
          setImportPreview({
            opportunities: (data.opportunities || []).length,
            projects: (data.projects || []).length,
            accounts: (data.accounts || []).length,
            contacts: (data.contacts || []).length,
            activities: (data.activities || []).length,
          });
          setMergeStats(null);
        }
        setPendingImport(ev.target?.result as string);
      } catch {
        showToast('El archivo no es un JSON válido', 'error');
      }
    };
    reader.readAsText(file);
  };

  const confirmImport = () => {
    if (!pendingImport) return;
    try {
      const mig = migrateImported(JSON.parse(pendingImport));
      if (importMode === 'merge') {
        const merged = {
          opportunities: mergeById(state.opportunities, mig.opportunities).items,
          projects: mergeById(state.projects, mig.projects).items,
          accounts: mergeById(state.accounts, mig.accounts).items,
          contacts: mergeById(state.contacts, mig.contacts).items,
          activities: mergeById(state.activities, mig.activities).items,
        };
        importFromJSON(merged);
        showToast('Respaldo fusionado: se sumaron los registros nuevos sin duplicar', 'success');
      } else {
        importFromJSON(mig);
      }
      setImportPreview(null);
      setMergeStats(null);
      setPendingImport(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch {
      showToast('Error al importar datos', 'error');
    }
  };

  const tabs = [
    { key: 'data' as SettingsTab, label: 'Datos', icon: Database },
    { key: 'sheets' as SettingsTab, label: 'Google Sheets', icon: FileSpreadsheet },
  ];

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-[#F0F2F5]">Configuración</h2>
        <p className="text-sm text-[#6B7280] mt-1">Gestiona tus datos y sincronización</p>
      </div>
      <div className="flex gap-1 border-b border-[#25282F] mb-6">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === tab.key ? 'text-[#D4A824] border-[#D4A824]' : 'text-[#A0A8B8] border-transparent hover:text-[#F0F2F5]'}`}>
              <Icon size={16} /> {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'data' && (
        <div className="space-y-6 max-w-2xl">
          <div className="bg-[#22252D] border border-[#2E323A] rounded-xl p-6">
            <h3 className="text-base font-semibold text-[#F0F2F5] mb-1">Exportar Datos</h3>
            <p className="text-sm text-[#6B7280] mb-5">Descarga tus datos en diferentes formatos para respaldo o análisis.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Button variant="secondary" leftIcon={<FileJson size={16} />} onClick={exportToJSON}>Exportar a JSON (Backup)</Button>
              <Button variant="secondary" leftIcon={<FileSpreadsheet size={16} />} onClick={() => exportToCSV('opportunities')}>Exportar Pipeline CSV</Button>
              <Button variant="secondary" leftIcon={<FileSpreadsheet size={16} />} onClick={() => exportToCSV('projects')}>Exportar Proyectos CSV</Button>
              <Button variant="secondary" leftIcon={<FileSpreadsheet size={16} />} onClick={() => exportToCSV('accounts')}>Exportar Cuentas CSV</Button>
              <Button variant="secondary" leftIcon={<FileSpreadsheet size={16} />} onClick={() => exportToCSV('contacts')}>Exportar Contactos CSV</Button>
              <Button variant="secondary" leftIcon={<FileSpreadsheet size={16} />} onClick={() => exportToCSV('activities')}>Exportar Actividades CSV</Button>
            </div>
          </div>

          <div className="bg-[#22252D] border border-[#2E323A] rounded-xl p-6">
            <h3 className="text-base font-semibold text-[#F0F2F5] mb-1">Importar Datos</h3>
            <p className="text-sm text-[#6B7280] mb-5">Carga un respaldo JSON. <strong>Reemplazar</strong> pisa tus datos con el archivo; <strong>Fusionar</strong> suma lo nuevo sin duplicar (ideal para unir el respaldo del celular con el del PC).</p>
            <input ref={fileInputRef} type="file" accept=".json" onChange={handleFileSelect} className="hidden" />
            <div className="flex flex-wrap gap-3">
              <Button variant="secondary" leftIcon={<GitMerge size={16} />} onClick={() => openFilePicker('merge')}>Fusionar respaldo (sumar sin borrar)</Button>
              <Button variant="secondary" leftIcon={<Upload size={16} />} onClick={() => openFilePicker('replace')}>Reemplazar con archivo JSON</Button>
              <Button variant="secondary" leftIcon={<FileSpreadsheet size={16} />} onClick={() => openModal('import-csv')}>Importar desde Excel/CSV</Button>
            </div>

            {importPreview && (
              <div className="mt-4 p-4 bg-[#1E2128] rounded-lg border border-[#2E323A]">
                <p className="text-sm text-[#A0A8B8] mb-3">Se <strong className="text-[#F59E0B]">reemplazarán</strong> todos tus datos con:</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                  {importPreview.opportunities > 0 && <span className="text-sm text-[#F0F2F5]"><strong>{importPreview.opportunities}</strong> oportunidades</span>}
                  <span className="text-sm text-[#F0F2F5]"><strong>{importPreview.projects}</strong> proyectos</span>
                  <span className="text-sm text-[#F0F2F5]"><strong>{importPreview.accounts}</strong> cuentas</span>
                  <span className="text-sm text-[#F0F2F5]"><strong>{importPreview.contacts}</strong> contactos</span>
                  <span className="text-sm text-[#F0F2F5]"><strong>{importPreview.activities}</strong> actividades</span>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={confirmImport}>Confirmar Reemplazo</Button>
                  <Button size="sm" variant="ghost" onClick={() => { setImportPreview(null); setPendingImport(null); }}>Cancelar</Button>
                </div>
              </div>
            )}

            {mergeStats && (
              <div className="mt-4 p-4 bg-[#1E2128] rounded-lg border border-[#8B5CF6]/30">
                <p className="text-sm text-[#A0A8B8] mb-3">Resultado de la <strong className="text-[#8B5CF6]">fusión</strong>:</p>
                <div className="space-y-1.5 mb-4">
                  {mergeStats.filter((s) => s.added > 0 || s.updated > 0).length === 0 && (
                    <p className="text-sm text-[#6B7280]">Nada nuevo: el archivo no tiene registros que te falten.</p>
                  )}
                  {mergeStats.filter((s) => s.added > 0 || s.updated > 0).map((s) => (
                    <p key={s.label} className="text-sm text-[#F0F2F5]">
                      {s.added > 0 && <><strong className="text-[#22C55E]">+{s.added}</strong> {s.label} nuevos/as</>}
                      {s.added > 0 && s.updated > 0 && ' · '}
                      {s.updated > 0 && <span className="text-[#A0A8B8]">{s.updated} {s.label} actualizados/as</span>}
                    </p>
                  ))}
                </div>
                <p className="text-xs text-[#6B7280] mb-4 flex items-start gap-1.5">
                  <AlertTriangle size={13} className="text-[#F59E0B] flex-shrink-0 mt-0.5" />
                  La fusión no duplica registros y gana siempre la versión más reciente. Ojo: lo que hayas <strong>eliminado</strong> en este dispositivo pero exista en el archivo, volverá a aparecer.
                </p>
                <div className="flex gap-2">
                  <Button size="sm" onClick={confirmImport}>Confirmar Fusión</Button>
                  <Button size="sm" variant="ghost" onClick={() => { setMergeStats(null); setPendingImport(null); }}>Cancelar</Button>
                </div>
              </div>
            )}
          </div>

          <div className="bg-[#22252D] border border-[#2E323A] rounded-xl p-6">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-lg bg-[#3B82F6]/10 flex items-center justify-center"><Cloud size={20} className="text-[#3B82F6]" /></div>
              <div>
                <h3 className="text-base font-semibold text-[#F0F2F5]">Respaldo en tu nube y multidispositivo</h3>
                <p className="text-sm text-[#6B7280]">Guarda tu respaldo en tu propio Google Drive o Dropbox y úsalo en otro dispositivo.</p>
              </div>
            </div>

            <div className="mt-4 mb-5">
              {lastBackupAt ? (
                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium ${daysSinceBackup !== null && daysSinceBackup > 7 ? 'bg-[#F59E0B]/10 text-[#F59E0B]' : 'bg-[#22C55E]/10 text-[#22C55E]'}`}>
                  {daysSinceBackup !== null && daysSinceBackup > 7 ? <AlertTriangle size={13} /> : <CheckCircle2 size={13} />}
                  Último respaldo: {new Date(lastBackupAt).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' })}
                  {daysSinceBackup !== null && daysSinceBackup > 7 && ` (hace ${daysSinceBackup} días — respalda pronto)`}
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#F59E0B]/10 text-[#F59E0B]">
                  <AlertTriangle size={13} /> Aún no has hecho ningún respaldo
                </div>
              )}
            </div>

            <Button variant="secondary" leftIcon={<Share2 size={16} />} onClick={handleShareBackup}>
              Compartir / Guardar respaldo en mi nube
            </Button>

            <div className="mt-5 p-4 bg-[#1E2128] rounded-lg border border-[#2E323A]">
              <h4 className="text-sm font-semibold text-[#F0F2F5] mb-3 flex items-center gap-2"><Smartphone size={15} className="text-[#3B82F6]" /> Para pasar del PC al celular (o viceversa):</h4>
              <ol className="space-y-2.5 text-sm text-[#A0A8B8]">
                <li className="flex items-start gap-2"><span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#D4A824]/15 text-[#D4A824] flex items-center justify-center text-xs font-semibold">1</span><span>En el dispositivo <strong>origen</strong>: presiona el botón de arriba. En el celular se abre el menú para enviarlo directo a <strong>Google Drive, Dropbox, WhatsApp o correo</strong>. En el PC se descarga el archivo: súbelo a tu Drive/Dropbox.</span></li>
                <li className="flex items-start gap-2"><span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#D4A824]/15 text-[#D4A824] flex items-center justify-center text-xs font-semibold">2</span><span>En el dispositivo <strong>destino</strong>: descarga ese archivo desde tu nube.</span></li>
                <li className="flex items-start gap-2"><span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#D4A824]/15 text-[#D4A824] flex items-center justify-center text-xs font-semibold">3</span><span>Aquí mismo, en <strong>"Importar Datos"</strong> (abajo), selecciona el archivo y confirma. Listo: tu CRM queda idéntico.</span></li>
              </ol>
              <p className="text-xs text-[#6B7280] mt-3">Tip: hazlo cada vez que termines una jornada si trabajas en dos dispositivos — el último respaldo siempre "gana".</p>
            </div>
          </div>

          <div className="bg-[#22252D] border border-[#EF4444]/30 rounded-xl p-6">
            <h3 className="text-base font-semibold text-[#EF4444] mb-1 flex items-center gap-2"><AlertTriangle size={18} /> Zona de Peligro</h3>
            <p className="text-sm text-[#6B7280] mb-5">Estas acciones son irreversibles.</p>
            {!showDeleteConfirm ? (
              <Button variant="danger" leftIcon={<Trash2 size={16} />} onClick={() => setShowDeleteConfirm(true)}>Borrar Todos los Datos</Button>
            ) : (
              <div className="p-4 bg-[#EF4444]/10 rounded-lg border border-[#EF4444]/30">
                <p className="text-sm text-[#EF4444] mb-3">¿Eliminar permanentemente todos los datos?</p>
                <div className="flex gap-2">
                  <Button size="sm" variant="danger" onClick={() => { resetAllData(); setShowDeleteConfirm(false); }}>Sí, borrar todo</Button>
                  <Button size="sm" variant="ghost" onClick={() => setShowDeleteConfirm(false)}>Cancelar</Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'sheets' && (
        <div className="max-w-2xl">
          <div className="bg-[#22252D] border border-[#2E323A] rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-[#22C55E15] flex items-center justify-center"><FileSpreadsheet size={20} className="text-[#22C55E]" /></div>
              <div>
                <h3 className="text-base font-semibold text-[#F0F2F5]">Sincronización con Google Sheets</h3>
                <p className="text-sm text-[#6B7280]">Exporta tus datos a CSV y luego impórtalos a Google Sheets</p>
              </div>
            </div>
            <div className="space-y-4 mt-6">
              <div className="p-4 bg-[#1E2128] rounded-lg border border-[#2E323A]">
                <h4 className="text-sm font-semibold text-[#F0F2F5] mb-3">Instrucciones:</h4>
                <ol className="space-y-3 text-sm text-[#A0A8B8]">
                  <li className="flex items-start gap-2"><span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#D4A82415] text-[#D4A824] flex items-center justify-center text-xs font-semibold">1</span><span>Exporta a CSV desde la pestaña "Datos".</span></li>
                  <li className="flex items-start gap-2"><span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#D4A82415] text-[#D4A824] flex items-center justify-center text-xs font-semibold">2</span><span>Abre Google Sheets y ve a <strong>Archivo &gt; Importar</strong>.</span></li>
                  <li className="flex items-start gap-2"><span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#D4A82415] text-[#D4A824] flex items-center justify-center text-xs font-semibold">3</span><span>Usa separador de coma y codificación UTF-8.</span></li>
                </ol>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button variant="secondary" leftIcon={<FileSpreadsheet size={16} />} onClick={() => exportToCSV('opportunities')}>Pipeline CSV</Button>
                <Button variant="secondary" leftIcon={<FileSpreadsheet size={16} />} onClick={() => exportToCSV('projects')}>Proyectos CSV</Button>
                <Button variant="secondary" leftIcon={<FileSpreadsheet size={16} />} onClick={() => exportToCSV('accounts')}>Cuentas CSV</Button>
                <Button variant="secondary" leftIcon={<FileSpreadsheet size={16} />} onClick={() => exportToCSV('contacts')}>Contactos CSV</Button>
                <Button variant="secondary" leftIcon={<FileSpreadsheet size={16} />} onClick={() => exportToCSV('activities')}>Actividades CSV</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
