import React, { useState } from 'react';
import { Lock } from 'lucide-react';

interface AccessCodeGateProps {
  onAuthorized: () => void;
}

export function AccessCodeGate({ onAuthorized }: AccessCodeGateProps) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Simulate an instant/fluid verification delay for native look and feel
    setTimeout(() => {
      const trimmedCode = code.trim();
      
      if (trimmedCode === '1606') {
        localStorage.setItem('isAuthorized', 'true');
        localStorage.setItem('isAdmin', 'true');
        onAuthorized();
      } else if (trimmedCode === '1234' || trimmedCode === '2026') {
        localStorage.setItem('isAuthorized', 'true');
        localStorage.setItem('isAdmin', 'false');
        onAuthorized();
      } else {
        setError('Code incorrect');
      }
      setLoading(false);
    }, 450);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950 p-6">
      <div className="w-full max-w-sm bg-neutral-900 border border-white/10 p-8 rounded-3xl text-center">
        <div className="mx-auto w-16 h-16 bg-brand-500/20 rounded-full flex items-center justify-center mb-6">
          <Lock size={32} className="text-white" />
        </div>
        <h2 className="text-xl font-black text-white uppercase tracking-tight mb-2">Accès Sécurisé</h2>
        <p className="text-neutral-400 text-xs mb-6">Veuillez entrer le code d'accès fourni par l'administrateur.</p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            maxLength={4}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ''))}
            className="w-full bg-neutral-950 border border-white/10 rounded-xl p-4 text-center text-2xl font-mono text-white tracking-[0.5em] focus:outline-none focus:border-brand-500"
            placeholder="0000"
            required
          />
          {error && <p className="text-red-500 text-xs font-bold">{error}</p>}
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-white text-black font-black uppercase tracking-widest text-[11px] py-4 rounded-xl hover:bg-neutral-200 transition-all"
          >
            {loading ? 'Vérification...' : 'Valider'}
          </button>
        </form>
      </div>
    </div>
  );
}
