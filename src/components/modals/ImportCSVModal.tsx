import { useState, useRef, useCallback } from 'react';
import Papa from 'papaparse';
import { useApp } from '@/context/AppContext';
import { getBranding } from '@/config/branding';
import { X, Upload, FileSpreadsheet, AlertCircle, CheckCircle, ChevronDown } from 'lucide-react';

type ImportEntity = 'accounts' | 'contacts' | 'opportunities';

interface ColumnMapping {
  csvColumn: string;
  field: string;
}

const ACCOUNT_FIELDS = [
  { key: 'companyName', label: 'Nombre Empresa', required: true },
  { key: 'industry', label: 'Industria', required: false },
  { key: 'description', label: 'Descripción', required: false },
  { key: 'website', label: 'Web', required: false },
  { key: 'address', label: 'Dirección', required: false },
  { key: 'city', label: 'Ciudad', required: false },
  { key: 'country', label: 'País', required: false },
];

const CONTACT_FIELDS = [
  { key: 'firstName', label: 'Nombre', required: true },
  { key: 'lastName', label: 'Apellido', required: false },
  { key: 'email', label: 'Email', required: false },
  { key: 'phone', label: 'Teléfono', required: false },
  { key: 'mobile', label: 'Celular', required: false },
  { key: 'position', label: 'Cargo', required: false },
  { key: 'department', label: 'Departamento', required: false },
  { key: 'companyName', label: 'Nombre Empresa (para vincular)', required: false },
];

const OPPORTUNITY_FIELDS = [
  { key: 'name', label: 'Nombre Oportunidad', required: true },
  { key: 'description', label: 'Descripción', required: false },
  { key: 'amount', label: 'Monto', required: false },
  { key: 'stage', label: 'Etapa', required: false },
  { key: 'expectedCloseDate', label: 'Fecha Cierre Est.', required: false },
  { key: 'companyName', label: 'Nombre Empresa (para vincular)', required: false },
];

const ENTITY_CONFIG: Record<ImportEntity, { label: string; fields: { key: string; label: string; required: boolean }[] }> = {
  accounts: { label: 'Cuentas (Empresas)', fields: ACCOUNT_FIELDS },
  contacts: { label: 'Contactos', fields: CONTACT_FIELDS },
  opportunities: { label: 'Oportunidades', fields: OPPORTUNITY_FIELDS },
};

export function ImportCSVModal() {
  const { state, dispatch, closeModal, showToast } = useApp();
  const branding = getBranding();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [entity, setEntity] = useState<ImportEntity>('accounts');
  const [file, setFile] = useState<File | null>(null);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvPreview, setCsvPreview] = useState<string[][]>([]);
  const [mappings, setMappings] = useState<Record<string, string>>({});
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setIsParsing(true);
    setErrors([]);

    Papa.parse(selectedFile, {
      preview: 6,
      complete: (results) => {
        if (results.data && results.data.length > 0) {
          const rows = results.data as string[][];
          setCsvHeaders(rows[0] || []);
          setCsvPreview(rows.slice(1, 6));
          // Auto-map columns with similar names
          const autoMappings: Record<string, string> = {};
          const fields = ENTITY_CONFIG[entity].fields;
          rows[0]?.forEach((header: string) => {
            const lowerHeader = header.toLowerCase().trim();
            fields.forEach((f) => {
              const lowerField = f.label.toLowerCase();
              const lowerKey = f.key.toLowerCase();
              if (
                lowerHeader.includes(lowerKey) ||
                lowerHeader.includes(lowerField) ||
                lowerKey.includes(lowerHeader)
              ) {
                autoMappings[header] = f.key;
              }
            });
          });
          setMappings(autoMappings);
        }
        setIsParsing(false);
      },
      error: () => {
        setErrors(['No se pudo leer el archivo CSV. Verifica el formato.']);
        setIsParsing(false);
      },
    });
  }, [entity]);

  const handleImport = useCallback(() => {
    if (!file) return;
    setIsImporting(true);
    setErrors([]);

    const fieldMap = Object.entries(mappings).reduce<Record<string, string>>((acc, [csvCol, field]) => {
      if (field) acc[field] = csvCol;
      return acc;
    }, {});

    // Validate required fields
    const requiredFields = ENTITY_CONFIG[entity].fields.filter((f) => f.required);
    const missingRequired = requiredFields.filter((f) => !fieldMap[f.key]);
    if (missingRequired.length > 0) {
      setErrors([`Faltan campos obligatorios: ${missingRequired.map((f) => f.label).join(', ')}`]);
      setIsImporting(false);
      return;
    }

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows = results.data as Record<string, string>[];
        const now = new Date().toISOString();
        const newErrors: string[] = [];
        let importedCount = 0;

        try {
          if (entity === 'accounts') {
            const newAccounts = rows
              .filter((row) => {
                const name = row[fieldMap.companyName]?.trim();
                if (!name) {
                  newErrors.push(`Fila omitida: sin nombre de empresa`);
                  return false;
                }
                return true;
              })
              .map((row) => ({
                id: crypto.randomUUID(),
                projectIds: [],
                companyName: row[fieldMap.companyName]?.trim() || '',
                industry: row[fieldMap.industry]?.trim() || '',
                description: row[fieldMap.description]?.trim() || '',
                status: 'active' as const,
                website: row[fieldMap.website]?.trim() || '',
                address: row[fieldMap.address]?.trim() || '',
                city: row[fieldMap.city]?.trim() || '',
                country: row[fieldMap.country]?.trim() || 'Chile',
                tags: [],
                createdAt: now,
                updatedAt: now,
              }));
            dispatch({ type: 'SET_ACCOUNTS', payload: [...state.accounts, ...newAccounts] });
            importedCount = newAccounts.length;
          } else if (entity === 'contacts') {
            const newContacts = rows
              .filter((row) => {
                const firstName = row[fieldMap.firstName]?.trim();
                if (!firstName) {
                  newErrors.push(`Fila omitida: sin nombre`);
                  return false;
                }
                return true;
              })
              .map((row) => {
                const companyName = row[fieldMap.companyName]?.trim();
                let accountId = '';
                if (companyName) {
                  const existing = state.accounts.find(
                    (a) => a.companyName.toLowerCase() === companyName.toLowerCase()
                  );
                  if (existing) accountId = existing.id;
                }
                return {
                  id: crypto.randomUUID(),
                  accountId: accountId || state.accounts[0]?.id || '',
                  firstName: row[fieldMap.firstName]?.trim() || '',
                  lastName: row[fieldMap.lastName]?.trim() || '',
                  email: row[fieldMap.email]?.trim() || '',
                  phone: row[fieldMap.phone]?.trim() || '',
                  mobile: row[fieldMap.mobile]?.trim() || '',
                  position: row[fieldMap.position]?.trim() || '',
                  department: row[fieldMap.department]?.trim() || '',
                  status: 'active' as const,
                  isPrimary: false,
                  notes: '',
                  tags: [],
                  createdAt: now,
                  updatedAt: now,
                };
              });
            dispatch({ type: 'SET_CONTACTS', payload: [...state.contacts, ...newContacts] });
            importedCount = newContacts.length;
          } else if (entity === 'opportunities') {
            const newOpps = rows
              .filter((row) => {
                const name = row[fieldMap.name]?.trim();
                if (!name) {
                  newErrors.push(`Fila omitida: sin nombre`);
                  return false;
                }
                return true;
              })
              .map((row) => {
                const companyName = row[fieldMap.companyName]?.trim();
                let accountId = state.accounts[0]?.id || '';
                if (companyName) {
                  const existing = state.accounts.find(
                    (a) => a.companyName.toLowerCase() === companyName.toLowerCase()
                  );
                  if (existing) accountId = existing.id;
                }
                const stage = row[fieldMap.stage]?.trim().toLowerCase() || 'lead';
                const validStage = ['lead', 'qualified', 'proposal', 'negotiation', 'on_hold', 'closed_won', 'closed_lost'].includes(stage)
                  ? stage
                  : 'lead';
                return {
                  id: crypto.randomUUID(),
                  accountId,
                  contactId: null,
                  projectId: null,
                  name: row[fieldMap.name]?.trim() || '',
                  description: row[fieldMap.description]?.trim() || '',
                  stage: validStage as any,
                  amount: row[fieldMap.amount] ? parseFloat(row[fieldMap.amount].replace(/[^\d.-]/g, '')) || null : null,
                  probability: 25,
                  expectedCloseDate: row[fieldMap.expectedCloseDate] || null,
                  actualCloseDate: null,
                  lossReason: '',
                  notes: '',
                  priority: 'medium' as const,
                  tags: [],
                  createdAt: now,
                  updatedAt: now,
                };
              });
            dispatch({ type: 'SET_OPPORTUNITIES', payload: [...state.opportunities, ...newOpps] });
            importedCount = newOpps.length;
          }

          setErrors(newErrors.slice(0, 5));
          showToast(`${importedCount} ${entity} importados correctamente`, 'success');
          if (newErrors.length === 0) {
            setTimeout(() => closeModal(), 1500);
          }
        } catch (err) {
          setErrors(['Error inesperado durante la importación']);
        }
        setIsImporting(false);
      },
      error: () => {
        setErrors(['Error al procesar el archivo']);
        setIsImporting(false);
      },
    });
  }, [file, mappings, entity, state, dispatch, closeModal, showToast]);

  const config = ENTITY_CONFIG[entity];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-3xl max-h-[90vh] bg-[#1E2028] border border-[#2A2D3A] rounded-2xl shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2A2D3A] flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#D4A824]/20 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5 text-[#D4A824]" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[#F0F2F5]">Importar desde Excel/CSV</h2>
              <p className="text-xs text-[#6B7280]">{branding.name}</p>
            </div>
          </div>
          <button onClick={closeModal} className="p-2 hover:bg-[#2A2D3A] rounded-lg transition-colors">
            <X className="w-5 h-5 text-[#6B7280]" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Entity selector */}
          <div>
            <label className="block text-sm font-medium text-[#9CA3AF] mb-2">¿Qué vas a importar?</label>
            <div className="flex gap-2">
              {(Object.keys(ENTITY_CONFIG) as ImportEntity[]).map((e) => (
                <button
                  key={e}
                  onClick={() => {
                    setEntity(e);
                    setFile(null);
                    setCsvHeaders([]);
                    setCsvPreview([]);
                    setMappings({});
                    setErrors([]);
                  }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    entity === e
                      ? 'bg-[#D4A824]/20 text-[#D4A824] border border-[#D4A824]/30'
                      : 'bg-[#181A20] text-[#6B7280] border border-[#2A2D3A] hover:border-[#3A3D4A]'
                  }`}
                >
                  {ENTITY_CONFIG[e].label}
                </button>
              ))}
            </div>
          </div>

          {/* File upload */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-[#2A2D3A] hover:border-[#D4A824]/40 rounded-xl p-6 text-center cursor-pointer transition-colors"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Upload className="w-8 h-8 text-[#4B5563] mx-auto mb-3" />
            <p className="text-sm text-[#9CA3AF]">
              {file ? file.name : 'Arrastra un archivo CSV o haz click para seleccionar'}
            </p>
            <p className="text-xs text-[#4B5563] mt-1">Soporta .csv, .xlsx, .xls</p>
          </div>

          {/* Column mapping */}
          {csvHeaders.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-[#F0F2F5]">Mapeo de columnas</h3>
              <p className="text-xs text-[#6B7280]">Selecciona qué columna de tu archivo corresponde a cada campo del CRM</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {config.fields.map((field) => (
                  <div key={field.key} className="flex items-center gap-3">
                    <label className="text-xs text-[#9CA3AF] w-32 flex-shrink-0">
                      {field.label}
                      {field.required && <span className="text-[#EF4444] ml-1">*</span>}
                    </label>
                    <div className="relative flex-1">
                      <select
                        value={mappings[Object.keys(mappings).find((k) => mappings[k] === field.key) || ''] || ''}
                        onChange={(e) => {
                          const selectedHeader = e.target.value;
                          setMappings((prev) => {
                            const next = { ...prev };
                            // Remove previous mapping for this field
                            Object.keys(next).forEach((k) => {
                              if (next[k] === field.key) delete next[k];
                            });
                            if (selectedHeader) next[selectedHeader] = field.key;
                            return next;
                          });
                        }}
                        className="w-full px-3 py-2 bg-[#181A20] border border-[#2A2D3A] rounded-lg text-sm text-[#F0F2F5] focus:outline-none focus:border-[#D4A824]/50 appearance-none"
                      >
                        <option value="">-- Sin mapear --</option>
                        {csvHeaders.map((h) => (
                          <option key={h} value={h}>{h}</option>
                        ))}
                      </select>
                      <ChevronDown className="w-4 h-4 text-[#4B5563] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
                ))}
              </div>

              {/* Preview */}
              <div className="mt-4">
                <h4 className="text-xs font-medium text-[#9CA3AF] mb-2">Vista previa (primeras filas)</h4>
                <div className="overflow-x-auto rounded-lg border border-[#2A2D3A]">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-[#181A20]">
                        {csvHeaders.map((h) => (
                          <th key={h} className="px-3 py-2 text-left text-[#6B7280] font-medium border-b border-[#2A2D3A] whitespace-nowrap">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {csvPreview.map((row, i) => (
                        <tr key={i} className="border-b border-[#2A2D3A]/50">
                          {row.map((cell, j) => (
                            <td key={j} className="px-3 py-2 text-[#9CA3AF] whitespace-nowrap max-w-[150px] truncate">
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Errors */}
          {errors.length > 0 && (
            <div className="bg-[#EF4444]/10 border border-[#EF4444]/30 rounded-lg p-3 space-y-1">
              {errors.map((err, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-[#EF4444]">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {err}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#2A2D3A] flex-shrink-0">
          <button
            onClick={closeModal}
            className="px-4 py-2 text-sm text-[#9CA3AF] hover:text-[#F0F2F5] transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleImport}
            disabled={!file || isParsing || isImporting}
            className="px-5 py-2 bg-[#D4A824] hover:bg-[#E8C545] disabled:opacity-40 disabled:cursor-not-allowed text-[#181A20] text-sm font-semibold rounded-lg transition-colors flex items-center gap-2"
          >
            {isImporting ? 'Importando...' : 'Importar'}
            {!isImporting && <CheckCircle className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
