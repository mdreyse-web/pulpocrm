import { ArrowRight } from 'lucide-react';
import type { TenantConfig } from '@/types';

interface TenantWelcomeProps {
  tenant: TenantConfig;
  onEnter: () => void;
}

/**
 * Pantalla de bienvenida por cliente: "Hola..." + logo propio + botón Ingresar.
 * Se muestra una vez por sesión (sessionStorage) antes de entrar al CRM.
 */
export function TenantWelcome({ tenant, onEnter }: TenantWelcomeProps) {
  const primary = tenant.primaryColor || '#D4A824';
  const primaryLight = tenant.primaryColorLight || '#E8C545';

  return (
    <div className="min-h-screen bg-[#181A20] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        {/* Logo del cliente */}
        <div
          className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${primary}, ${primaryLight})`,
            boxShadow: `0 10px 15px -3px ${primary}33`,
          }}
        >
          {tenant.logoBase64 ? (
            <img src={tenant.logoBase64} alt={tenant.name} className="w-full h-full object-contain" />
          ) : (
            <span className="text-2xl font-bold text-[#181A20]">
              {(tenant.logoText || tenant.name || 'C').slice(0, 2).toUpperCase()}
            </span>
          )}
        </div>

        <h1 className="text-3xl font-bold text-[#F0F2F5] mb-2">
          Hola, bienvenido a {tenant.name}
        </h1>
        <p className="text-[#6B7280] mb-10">
          {tenant.tagline || 'Tu espacio de gestión comercial está listo.'}
        </p>

        <button
          onClick={onEnter}
          className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-[#181A20] font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
          style={{
            background: `linear-gradient(135deg, ${primary}, ${primaryLight})`,
            boxShadow: `0 10px 20px -5px ${primary}44`,
          }}
        >
          Ingresar
          <ArrowRight className="w-5 h-5" />
        </button>

        <p className="text-xs text-[#4B5563] mt-12 inline-flex items-center gap-1.5">
          Potenciado por <img src="./pulpo.png" alt="PulpoCRM" className="w-4 h-4 inline" /> PulpoCRM
        </p>
      </div>
    </div>
  );
}
