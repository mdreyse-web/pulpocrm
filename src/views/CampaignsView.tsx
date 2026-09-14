import { useState, useMemo, useEffect } from 'react';
import { Megaphone, Mail, Copy, Check, ChevronRight, SkipForward, Send, Users, Eye } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/Button';
import { Contact, Account } from '@/types';
import { getTenantStorageKey } from '@/config/tenantConfig';

const VARIABLES = [
  { key: '{nombre}', label: 'Nombre' },
  { key: '{apellido}', label: 'Apellido' },
  { key: '{empresa}', label: 'Empresa' },
  { key: '{cargo}', label: 'Cargo' },
];

const DEFAULT_SUBJECT = 'Hola {nombre}';
const DEFAULT_BODY = 'Hola {nombre},\n\nTe escribo para...\n\nSaludos,\n';

function personalize(tpl: string, contact: Contact, account?: Account): string {
  return tpl
    .replaceAll('{nombre}', contact.firstName || '')
    .replaceAll('{apellido}', contact.lastName || '')
    .replaceAll('{empresa}', account?.companyName || '')
    .replaceAll('{cargo}', contact.position || '');
}

export const CampaignsView: React.FC = () => {
  const { state, showToast } = useApp();

  const templateKey = getTenantStorageKey('campaign_template');
  const [subject, setSubject] = useState(DEFAULT_SUBJECT);
  const [body, setBody] = useState(DEFAULT_BODY);
  const [accountFilter, setAccountFilter] = useState('');
  const [sending, setSending] = useState(false);
  const [sendIndex, setSendIndex] = useState(0);
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState(false);

  // Cargar plantilla guardada
  useEffect(() => {
    try {
      const raw = localStorage.getItem(templateKey);
      if (raw) {
        const tpl = JSON.parse(raw);
        if (tpl.subject !== undefined) setSubject(tpl.subject);
        if (tpl.body !== undefined) setBody(tpl.body);
      }
    } catch { /* ignore */ }
  }, [templateKey]);

  // Guardar plantilla al escribir
  useEffect(() => {
    try {
      localStorage.setItem(templateKey, JSON.stringify({ subject, body }));
    } catch { /* ignore */ }
  }, [subject, body, templateKey]);

  const insertVariable = (variable: string) => {
    setBody((prev) => prev + variable);
  };

  // Audiencia: contactos activos con email
  const audience = useMemo(() => {
    return state.contacts.filter((c) => {
      if (!c.email || !c.email.includes('@')) return false;
      if (c.status !== 'active') return false;
      if (accountFilter && c.accountId !== accountFilter) return false;
      return true;
    });
  }, [state.contacts, accountFilter]);

  const getAccountOf = (contact: Contact) => state.accounts.find((a) => a.id === contact.accountId);

  const previewContact = audience[0];
  const currentContact = audience[sendIndex];
  const progress = audience.length > 0 ? (sendIndex / audience.length) * 100 : 0;

  const openMailto = (contact: Contact) => {
    const s = personalize(subject, contact, getAccountOf(contact));
    const b = personalize(body, contact, getAccountOf(contact));
    window.location.href = `mailto:${contact.email}?subject=${encodeURIComponent(s)}&body=${encodeURIComponent(b)}`;
  };

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      showToast('Copiado al portapapeles', 'success');
    }).catch(() => {
      showToast('No se pudo copiar', 'error');
    });
  };

  const copyAllEmails = () => {
    const emails = audience.map((c) => c.email).join(', ');
    copyText(emails);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const markSentAndNext = (skip = false) => {
    if (!currentContact) return;
    if (!skip) {
      setSentIds((prev) => new Set(prev).add(currentContact.id));
    }
    if (sendIndex + 1 >= audience.length) {
      setSending(false);
      setSendIndex(0);
      showToast('Campaña terminada', 'success');
    } else {
      setSendIndex(sendIndex + 1);
    }
  };

  const startSending = () => {
    if (audience.length === 0) {
      showToast('No hay contactos con email para esta campaña', 'error');
      return;
    }
    setSentIds(new Set());
    setSendIndex(0);
    setSending(true);
  };

  // ---- Vista del asistente de envío ----
  if (sending && currentContact) {
    const s = personalize(subject, currentContact, getAccountOf(currentContact));
    const b = personalize(body, currentContact, getAccountOf(currentContact));
    return (
      <div className="animate-fade-in max-w-2xl mx-auto">
        <Header title="Enviando campaña" subtitle={`Contacto ${sendIndex + 1} de ${audience.length}`} />

        <div className="h-1.5 w-full bg-[#1E2128] rounded-full overflow-hidden mb-6">
          <div className="h-full bg-[#8B5CF6] rounded-full transition-all" style={{ width: `${progress}%` }} />
        </div>

        <div className="bg-[#22252D] border border-[#2E323A] rounded-xl p-6 mb-4">
          <div className="flex items-center gap-3 mb-4 pb-4 border-b border-[#25282F]">
            <div className="w-10 h-10 rounded-full bg-[#8B5CF6]/15 text-[#8B5CF6] flex items-center justify-center font-semibold text-sm">
              {currentContact.firstName[0]}{currentContact.lastName[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[#F0F2F5]">{currentContact.firstName} {currentContact.lastName}</p>
              <p className="text-xs text-[#6B7280]">{currentContact.email} · {getAccountOf(currentContact)?.companyName || 'Sin empresa'}</p>
            </div>
          </div>
          <p className="text-xs text-[#6B7280] uppercase tracking-wider mb-1">Asunto</p>
          <p className="text-sm text-[#F0F2F5] mb-4">{s}</p>
          <p className="text-xs text-[#6B7280] uppercase tracking-wider mb-1">Mensaje</p>
          <div className="text-sm text-[#A0A8B8] whitespace-pre-wrap bg-[#1E2128] rounded-lg p-4 border border-[#25282F] max-h-[240px] overflow-y-auto">{b}</div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button leftIcon={<Send size={16} />} onClick={() => { openMailto(currentContact); }}>
            Abrir en mi correo
          </Button>
          <Button variant="secondary" leftIcon={<Copy size={16} />} onClick={() => copyText(`Para: ${currentContact.email}\nAsunto: ${s}\n\n${b}`)}>
            Copiar
          </Button>
          <Button variant="ghost" leftIcon={<SkipForward size={16} />} onClick={() => markSentAndNext(true)}>
            Omitir
          </Button>
        </div>

        <div className="flex justify-between items-center mt-4">
          <button onClick={() => { setSending(false); setSendIndex(0); }} className="text-sm text-[#6B7280] hover:text-[#F0F2F5]">
            Cancelar campaña
          </button>
          <Button variant="secondary" rightIcon={<ChevronRight size={16} />} onClick={() => markSentAndNext(false)}>
            {sendIndex + 1 >= audience.length ? 'Finalizar' : 'Ya lo envié, siguiente'}
          </Button>
        </div>
      </div>
    );
  }

  // ---- Vista principal ----
  return (
    <div className="animate-fade-in">
      <Header title="Campañas" subtitle="Correo masivo personalizado con los datos de tu CRM" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Editor de plantilla */}
        <div className="bg-[#22252D] border border-[#2E323A] rounded-xl p-6">
          <h3 className="text-base font-semibold text-[#F0F2F5] mb-1 flex items-center gap-2">
            <Megaphone size={18} className="text-[#8B5CF6]" /> Redactar correo
          </h3>
          <p className="text-sm text-[#6B7280] mb-4">
            Escribe el correo una sola vez. Las variables se reemplazan por los datos de cada contacto al enviar.
          </p>

          <div className="flex flex-wrap gap-2 mb-4">
            {VARIABLES.map((v) => (
              <button
                key={v.key}
                onClick={() => insertVariable(v.key)}
                className="px-2.5 py-1 rounded-md bg-[#8B5CF6]/10 text-[#8B5CF6] text-xs font-mono hover:bg-[#8B5CF6]/20 transition-colors"
                title={`Insertar ${v.key}`}
              >
                {v.key}
              </button>
            ))}
          </div>

          <label className="block text-xs font-medium text-[#A0A8B8] mb-1.5">Asunto</label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full bg-[#1E2128] border border-[#2E323A] rounded-lg px-3.5 py-2.5 text-sm text-[#F0F2F5] focus:outline-none focus:border-[#8B5CF6] mb-4"
            placeholder="Asunto del correo"
          />

          <label className="block text-xs font-medium text-[#A0A8B8] mb-1.5">Mensaje</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="w-full bg-[#1E2128] border border-[#2E323A] rounded-lg px-3.5 py-2.5 text-sm text-[#F0F2F5] focus:outline-none focus:border-[#8B5CF6] min-h-[220px] resize-y"
            placeholder="Hola {nombre}, ..."
          />
        </div>

        {/* Audiencia + vista previa + envío */}
        <div className="space-y-6">
          <div className="bg-[#22252D] border border-[#2E323A] rounded-xl p-6">
            <h3 className="text-base font-semibold text-[#F0F2F5] mb-1 flex items-center gap-2">
              <Users size={18} className="text-[#8B5CF6]" /> Destinatarios
            </h3>
            <p className="text-sm text-[#6B7280] mb-4">
              {audience.length} contacto{audience.length !== 1 ? 's' : ''} activo{audience.length !== 1 ? 's' : ''} con email
            </p>
            <select
              value={accountFilter}
              onChange={(e) => setAccountFilter(e.target.value)}
              className="w-full bg-[#1E2128] border border-[#2E323A] rounded-lg px-3.5 py-2.5 text-sm text-[#F0F2F5] focus:outline-none focus:border-[#8B5CF6]"
            >
              <option value="">Todas las cuentas</option>
              {state.accounts.map((a) => (
                <option key={a.id} value={a.id}>{a.companyName}</option>
              ))}
            </select>
          </div>

          {previewContact && (
            <div className="bg-[#22252D] border border-[#2E323A] rounded-xl p-6">
              <h3 className="text-base font-semibold text-[#F0F2F5] mb-3 flex items-center gap-2">
                <Eye size={18} className="text-[#8B5CF6]" /> Vista previa
                <span className="text-xs font-normal text-[#6B7280]">(para {previewContact.firstName} {previewContact.lastName})</span>
              </h3>
              <p className="text-xs text-[#6B7280] uppercase tracking-wider mb-1">Asunto</p>
              <p className="text-sm text-[#F0F2F5] mb-3">{personalize(subject, previewContact, getAccountOf(previewContact))}</p>
              <p className="text-xs text-[#6B7280] uppercase tracking-wider mb-1">Mensaje</p>
              <div className="text-sm text-[#A0A8B8] whitespace-pre-wrap bg-[#1E2128] rounded-lg p-4 border border-[#25282F] max-h-[180px] overflow-y-auto">
                {personalize(body, previewContact, getAccountOf(previewContact))}
              </div>
            </div>
          )}

          <div className="bg-[#22252D] border border-[#8B5CF6]/30 rounded-xl p-6">
            <h3 className="text-base font-semibold text-[#F0F2F5] mb-1 flex items-center gap-2">
              <Mail size={18} className="text-[#8B5CF6]" /> Enviar
            </h3>
            <p className="text-sm text-[#6B7280] mb-4">
              El asistente recorre los {audience.length} contactos uno a uno: te abre tu correo con el mensaje ya personalizado, tú solo presionas "Enviar" en tu correo y sigues con el siguiente.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button leftIcon={<Send size={16} />} onClick={startSending} disabled={audience.length === 0}>
                Iniciar envío guiado ({audience.length})
              </Button>
              <Button variant="secondary" leftIcon={copied ? <Check size={16} /> : <Copy size={16} />} onClick={copyAllEmails} disabled={audience.length === 0}>
                Copiar todos los correos
              </Button>
            </div>
            <p className="text-xs text-[#6B7280] mt-3">
              "Copiar todos los correos" sirve si prefieres mandar UN solo correo masivo desde tu cliente de correo: pégalos en el campo <strong>CCO/BCC</strong> (así cada destinatario no ve los correos de los demás). Esa opción no personaliza el nombre.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
