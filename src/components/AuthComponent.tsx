import React, { useState } from 'react';
import { signInWithPopup, GoogleAuthProvider, OAuthProvider } from 'firebase/auth';
import { auth } from '../lib/firebase';

interface AuthComponentProps {
  onLogin?: () => void;
}

export function AuthComponent({ onLogin }: AuthComponentProps) {
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const handleProviderLogin = async (providerName: 'google' | 'apple') => {
    setLoading(true);
    setAuthError(null);
    try {
      let provider;
      if (providerName === 'google') {
        provider = new GoogleAuthProvider();
      } else {
        provider = new OAuthProvider('apple.com');
      }
      await signInWithPopup(auth, provider);
      if (onLogin) onLogin();
    } catch (error: any) {
      console.error(error);
      if (error.code !== 'auth/popup-closed-by-user') {
        setAuthError('Une erreur est survenue lors de la connexion.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-3 w-full">
      {authError && (
        <p className="text-red-500 text-[10px] font-bold uppercase tracking-widest text-center">{authError}</p>
      )}
      <button 
        type="button"
        onClick={() => handleProviderLogin('google')} 
        disabled={loading}
        className="w-full bg-white text-black text-[11px] font-black uppercase tracking-widest py-4 rounded-xl flex items-center justify-center gap-3 hover:bg-neutral-200 transition-all duration-300 disabled:opacity-50"
      >
        {loading ? 'Connexion...' : 'Connexion avec Google'}
      </button>
      <button 
        type="button"
        onClick={() => handleProviderLogin('apple')} 
        disabled={loading}
        className="w-full bg-black text-white border border-white/20 text-[11px] font-black uppercase tracking-widest py-4 rounded-xl flex items-center justify-center gap-3 hover:bg-neutral-800 transition-all duration-300 disabled:opacity-50"
      >
        {loading ? 'Connexion...' : 'Connexion avec Apple'}
      </button>
    </div>
  );
}
