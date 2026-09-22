import { useState } from 'react';
import { Mail, MessageSquare, ArrowRight, ShieldCheck, Lock } from 'lucide-react';
import { getEffectiveHostname } from '@/config/branding';

interface LandingPageProps {
  adminPin: string;
  onAdminAccess: () => void;
}

export function LandingPage({ adminPin, onAdminAccess }: LandingPageProps) {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [showPinPrompt, setShowPinPrompt] = useState(false);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState(false);
  const hostname = getEffectiveHostname();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubmitted(true);
    }
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.trim() === adminPin) {
      onAdminAccess();
    } else {
      setPinError(true);
      setPin('');
    }
  };

  return (
    <div className="min-h-screen bg-[#181A20] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        {/* Logo PulpoCRM */}
        <img src="./pulpo.png" alt="PulpoCRM" className="w-20 h-20 mx-auto mb-4 drop-shadow-[0_8px_24px_rgba(139,92,246,0.35)]" />

        <h1 className="text-3xl font-bold text-[#F0F2F5] mb-2">
          Pulpo<span className="text-[#8B5CF6]">CRM</span>
        </h1>
        <p className="text-[#6B7280] mb-8">
          Gestión comercial simplificada para PYMEs
        </p>

        <div className="bg-[#1E2028] border border-[#2A2D3A] rounded-2xl p-8 mb-6">
          <div className="w-12 h-12 rounded-full bg-[#D4A824]/10 flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="w-6 h-6 text-[#D4A824]" />
          </div>
          <h2 className="text-xl font-semibold text-[#F0F2F5] mb-2">
            Espacio disponible
          </h2>
          <p className="text-sm text-[#6B7280] mb-6">
            El subdominio <span className="text-[#D4A824] font-mono">{hostname}</span> está reservado para un cliente de PulpoCRM.
          </p>
          <p className="text-sm text-[#6B7280]">
            Si eres el propietario, contacta a tu administrador para activar tu cuenta.
          </p>
        </div>

        <div className="bg-[#1E2028] border border-[#2A2D3A] rounded-2xl p-6">
          <h3 className="text-sm font-medium text-[#9CA3AF] mb-4 flex items-center justify-center gap-2">
            <Mail className="w-4 h-4" />
            ¿Te interesa este CRM para tu empresa?
          </h3>
          {submitted ? (
            <div className="text-sm text-[#22C55E]">
              Gracias, te contactaremos pronto.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@empresa.cl"
                className="flex-1 px-4 py-2.5 bg-[#181A20] border border-[#2A2D3A] rounded-lg text-sm text-[#F0F2F5] placeholder-[#4B5563] focus:outline-none focus:border-[#D4A824]/50"
                required
              />
              <button
                type="submit"
                className="px-4 py-2.5 bg-[#D4A824] hover:bg-[#E8C545] text-[#181A20] text-sm font-semibold rounded-lg transition-colors flex items-center gap-1.5"
              >
                Enviar
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>

        {/* Acceso administrador */}
        <div className="mt-8">
          {showPinPrompt ? (
            <form
              onSubmit={handlePinSubmit}
              className="inline-flex items-center gap-2 bg-[#1E2028] border border-[#2A2D3A] rounded-xl px-4 py-3"
            >
              <Lock className="w-4 h-4 text-[#6B7280]" />
              <input
                type="password"
                value={pin}
                onChange={(e) => { setPin(e.target.value); setPinError(false); }}
                placeholder="PIN administrador"
                autoFocus
                className="w-36 px-3 py-1.5 bg-[#181A20] border border-[#2A2D3A] rounded-lg text-sm text-[#F0F2F5] placeholder-[#4B5563] focus:outline-none focus:border-[#D4A824]/50"
              />
              <button
                type="submit"
                className="px-3 py-1.5 bg-[#D4A824] hover:bg-[#E8C545] text-[#181A20] text-xs font-semibold rounded-lg transition-colors"
              >
                Entrar
              </button>
              <button
                type="button"
                onClick={() => { setShowPinPrompt(false); setPin(''); setPinError(false); }}
                className="text-xs text-[#6B7280] hover:text-[#A0A8B8]"
              >
                Cancelar
              </button>
              {pinError && (
                <span className="text-xs text-[#EF4444]">PIN incorrecto</span>
              )}
            </form>
          ) : (
            <button
              onClick={() => setShowPinPrompt(true)}
              className="inline-flex items-center gap-1.5 text-xs text-[#4B5563] hover:text-[#9CA3AF] transition-colors"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Acceso administrador
            </button>
          )}
        </div>

        <p className="text-xs text-[#4B5563] mt-4 inline-flex items-center gap-1.5">
          Potenciado por <img src="./pulpo.png" alt="" className="w-4 h-4 inline" /> PulpoCRM
        </p>
      </div>
    </div>
  );
}
