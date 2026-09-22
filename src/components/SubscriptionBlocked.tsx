import { Lock, Mail, CalendarX, AlertTriangle } from 'lucide-react';

interface SubscriptionBlockedProps {
  reason: 'suspended' | 'expired';
  tenantName: string;
  expiryDate?: string | null;
  contactEmail?: string;
}

export function SubscriptionBlocked({ reason, tenantName, expiryDate, contactEmail }: SubscriptionBlockedProps) {
  const isExpired = reason === 'expired';

  return (
    <div className="min-h-screen bg-[#181A20] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        {/* Icon */}
        <div className="w-20 h-20 rounded-2xl bg-[#EF4444]/10 border border-[#EF4444]/20 flex items-center justify-center mx-auto mb-6">
          {isExpired ? (
            <CalendarX className="w-10 h-10 text-[#EF4444]" />
          ) : (
            <Lock className="w-10 h-10 text-[#EF4444]" />
          )}
        </div>

        <h1 className="text-2xl font-bold text-[#F0F2F5] mb-2">
          {isExpired ? 'Suscripción vencida' : 'Acceso suspendido'}
        </h1>
        <p className="text-[#6B7280] mb-6">
          {isExpired
            ? `La suscripción de ${tenantName} ha vencido el ${expiryDate ? new Date(expiryDate).toLocaleDateString('es-CL') : 'fecha desconocida'}.`
            : `El acceso de ${tenantName} ha sido suspendido temporalmente.`}
        </p>

        <div className="bg-[#1E2028] border border-[#2A2D3A] rounded-2xl p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="w-5 h-5 text-[#F59E0B]" />
            <span className="text-sm font-medium text-[#F0F2F5]">¿Qué está pasando?</span>
          </div>
          <p className="text-sm text-[#6B7280] text-left leading-relaxed">
            Este CRM funciona bajo una suscripción mensual gestionada por su administrador.
            Si está viendo este mensaje, es posible que:
          </p>
          <ul className="text-sm text-[#6B7280] text-left mt-3 space-y-1.5">
            <li className="flex items-start gap-2">
              <span className="text-[#EF4444] mt-0.5">•</span>
              La mensualidad no ha sido pagada
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#EF4444] mt-0.5">•</span>
              La suscripción ha vencido y no se ha renovado
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#EF4444] mt-0.5">•</span>
              El acceso fue suspendido por el administrador
            </li>
          </ul>
        </div>

        {contactEmail && (
          <a
            href={`mailto:${contactEmail}?subject=Suscripción CRM - ${tenantName}`}
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#D4A824] hover:bg-[#E8C545] text-[#181A20] text-sm font-semibold rounded-xl transition-colors"
          >
            <Mail className="w-4 h-4" />
            Contactar a su administrador
          </a>
        )}

        <p className="text-xs text-[#4B5563] mt-8">
          Los datos de su empresa están seguros y se restaurarán al reactivar la suscripción.
        </p>
      </div>
    </div>
  );
}
