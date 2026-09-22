import { useState } from 'react';
import { Lock } from 'lucide-react';

interface AdminGateProps {
  adminPin: string;
  onUnlock: () => void;
}

/** Puerta de acceso al panel admin (admin.pulpocrm.cl): pide PIN y desbloquea. */
export function AdminGate({ adminPin, onUnlock }: AdminGateProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.trim() === adminPin) {
      onUnlock();
    } else {
      setError(true);
      setPin('');
    }
  };

  return (
    <div className="min-h-screen bg-[#181A20] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm text-center">
        <img src="./pulpo.png" alt="PulpoCRM" className="w-16 h-16 mx-auto mb-4 drop-shadow-[0_8px_24px_rgba(139,92,246,0.35)]" />
        <h1 className="text-2xl font-bold text-[#F0F2F5] mb-1">
          Pulpo<span className="text-[#8B5CF6]">CRM</span> Admin
        </h1>
        <p className="text-sm text-[#6B7280] mb-8">Administración de clientes</p>

        <form onSubmit={handleSubmit} className="bg-[#1E2028] border border-[#2A2D3A] rounded-2xl p-6">
          <div className="w-12 h-12 rounded-full bg-[#8B5CF6]/10 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-6 h-6 text-[#8B5CF6]" />
          </div>
          <label className="block text-xs font-medium text-[#9CA3AF] mb-2 text-left">PIN de administrador</label>
          <input
            type="password"
            value={pin}
            onChange={(e) => { setPin(e.target.value); setError(false); }}
            placeholder="••••"
            autoFocus
            className="w-full px-4 py-2.5 bg-[#181A20] border border-[#2A2D3A] rounded-lg text-sm text-[#F0F2F5] placeholder-[#4B5563] focus:outline-none focus:border-[#8B5CF6]/50 mb-2 text-center tracking-widest"
          />
          {error && <p className="text-xs text-[#EF4444] mb-2">PIN incorrecto</p>}
          <button
            type="submit"
            className="w-full mt-2 px-4 py-2.5 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white text-sm font-semibold rounded-lg transition-colors"
          >
            Entrar al panel
          </button>
        </form>

        <p className="text-xs text-[#4B5563] mt-6 inline-flex items-center gap-1.5">
          Potenciado por <img src="./pulpo.png" alt="" className="w-4 h-4 inline" /> PulpoCRM
        </p>
      </div>
    </div>
  );
}
