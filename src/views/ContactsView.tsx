import React, { useState } from 'react';
import { Users, Mail, Phone, ArrowRight } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Header } from '@/components/Header';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Contact } from '@/types';

export const ContactsView: React.FC = () => {
  const { state, navigateTo, openModal, getAccount } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [accountFilter, setAccountFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');

  const filtered = state.contacts.filter((c) => {
    const fullName = `${c.firstName} ${c.lastName}`.toLowerCase();
    const matchSearch =
      !searchQuery ||
      fullName.includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.position?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchAccount = !accountFilter || c.accountId === accountFilter;
    const matchStatus = !statusFilter || c.status === statusFilter;
    return matchSearch && matchAccount && matchStatus;
  });

  return (
    <div className="animate-fade-in">
      <Header
        title="Contactos"
        subtitle={`${filtered.length} contacto${filtered.length !== 1 ? 's' : ''}`}
        onNew={() => openModal('contact-form')}
        newButtonLabel="Nuevo Contacto"
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        extraActions={
          <div className="flex items-center gap-2">
            <select
              value={accountFilter}
              onChange={(e) => setAccountFilter(e.target.value)}
              className="bg-[#2A2D35] border border-[#2E323A] rounded-lg px-3 py-2 text-sm text-[#F0F2F5] focus:outline-none focus:border-[#D4A824]"
            >
              <option value="">Todas las cuentas</option>
              {state.accounts.map((a) => (
                <option key={a.id} value={a.id}>{a.companyName}</option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-[#2A2D35] border border-[#2E323A] rounded-lg px-3 py-2 text-sm text-[#F0F2F5] focus:outline-none focus:border-[#D4A824]"
            >
              <option value="">Todos los estados</option>
              <option value="active">Activo</option>
              <option value="inactive">Inactivo</option>
            </select>
            <div className="flex bg-[#2A2D35] border border-[#2E323A] rounded-lg overflow-hidden">
              <button onClick={() => setViewMode('grid')} className={`px-3 py-2 text-sm ${viewMode === 'grid' ? 'bg-[#D4A824] text-[#0D0E12]' : 'text-[#A0A8B8]'}`}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></svg>
              </button>
              <button onClick={() => setViewMode('table')} className={`px-3 py-2 text-sm ${viewMode === 'table' ? 'bg-[#D4A824] text-[#0D0E12]' : 'text-[#A0A8B8]'}`}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3h18v18H3z" /><path d="M3 9h18" /><path d="M3 15h18" /><path d="M9 3v18" /></svg>
              </button>
            </div>
          </div>
        }
      />

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <Users size={48} className="mx-auto text-[#3A3F48] mb-4" />
          <p className="text-[#6B7280]">No se encontraron contactos</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((contact) => (
            <ContactCardGrid key={contact.id} contact={contact} />
          ))}
        </div>
      ) : (
        <div className="bg-[#22252D] border border-[#2E323A] rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#2E323A] bg-[#1E2128]">
                <th className="text-left text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider px-4 py-3">Nombre</th>
                <th className="text-left text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider px-4 py-3">Email</th>
                <th className="text-left text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider px-4 py-3">Teléfono</th>
                <th className="text-left text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider px-4 py-3">Cargo</th>
                <th className="text-left text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider px-4 py-3">Cuenta</th>
                <th className="text-left text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider px-4 py-3">Estado</th>
                <th className="text-left text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((contact) => {
                const account = getAccount(contact.accountId);
                return (
                  <tr
                    key={contact.id}
                    className="border-b border-[#25282F] hover:bg-[#2D3139] transition-colors cursor-pointer"
                    onClick={() => navigateTo('contact-detail', contact.id)}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={`${contact.firstName} ${contact.lastName}`} size="sm" />
                        <span className="text-sm font-medium text-[#F0F2F5]">{contact.firstName} {contact.lastName}</span>
                        {contact.isPrimary && <Badge variant="primary">Principal</Badge>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-[#A0A8B8]">{contact.email}</td>
                    <td className="px-4 py-3 text-sm text-[#A0A8B8]">{contact.phone || contact.mobile || '-'}</td>
                    <td className="px-4 py-3 text-sm text-[#A0A8B8]">{contact.position || '-'}</td>
                    <td className="px-4 py-3 text-sm text-[#D4A824]">{account?.companyName || '-'}</td>
                    <td className="px-4 py-3"><Badge variant={contact.status}>{contact.status === 'active' ? 'Activo' : 'Inactivo'}</Badge></td>
                    <td className="px-4 py-3">
                      <button onClick={(e) => { e.stopPropagation(); navigateTo('contact-detail', contact.id); }} className="text-[#D4A824] hover:text-[#E8C545] text-sm">Ver</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

function ContactCardGrid({ contact }: { contact: Contact }) {
  const { navigateTo, getAccount } = useApp();
  const account = getAccount(contact.accountId);
  return (
    <div
      className="bg-[#22252D] border border-[#2E323A] rounded-xl p-5 hover:border-[#3A3F48] transition-all cursor-pointer"
      onClick={() => navigateTo('contact-detail', contact.id)}
    >
      <div className="flex items-start gap-4">
        <Avatar name={`${contact.firstName} ${contact.lastName}`} size="lg" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-base font-semibold text-[#F0F2F5]">{contact.firstName} {contact.lastName}</h4>
          </div>
          <p className="text-sm text-[#A0A8B8] mb-2">{contact.position || 'Sin cargo'}</p>
          <div className="space-y-1">
            <p className="flex items-center gap-1.5 text-xs text-[#6B7280]"><Mail size={12} /> {contact.email}</p>
            {(contact.phone || contact.mobile) && (
              <p className="flex items-center gap-1.5 text-xs text-[#6B7280]"><Phone size={12} /> {contact.phone || contact.mobile}</p>
            )}
          </div>
          <div className="flex items-center justify-between mt-3">
            <span className="text-xs text-[#D4A824]">{account?.companyName}</span>
            <Badge variant={contact.status}>{contact.status === 'active' ? 'Activo' : 'Inactivo'}</Badge>
          </div>
        </div>
      </div>
    </div>
  );
}
