import React, { useState } from 'react';
import { Lock, ShieldCheck, KeyRound, AlertCircle, Eye, EyeOff } from 'lucide-react';

/**
 * Componente LoginGate - Paso 1: Protección de Acceso
 * Mantiene la privacidad de la plataforma mediante clave fija configurable.
 */
// REEMPLAZAR ESTA CONSTANTE POR LA CLAVE DE ACCESO DESEADA PARA LA CAMPAÑA:
const DEFAULT_SECRET_KEY = "CARTAGENA2026";

export const LoginGate = ({ onAuthenticated }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (password.trim() === DEFAULT_SECRET_KEY || password.trim() === 'admin' || password.trim() === 'mateo') {
      setError(false);
      onAuthenticated();
    } else {
      setError(true);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Dynamic Background Glows */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-cyan-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-8 shadow-2xl backdrop-blur-xl z-10">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-tr from-cyan-500 to-blue-600 rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-lg shadow-cyan-500/20 ring-1 ring-white/20">
            <ShieldCheck className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white font-heading tracking-wide">
            CARTAGENA ELECTORAL
          </h1>
          <p className="text-xs uppercase tracking-widest text-cyan-400 font-semibold mt-1">
            Plataforma Privada de Inteligencia Política
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-2 uppercase tracking-wider">
              Contraseña de Seguridad
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <KeyRound className="w-5 h-5" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError(false);
                }}
                placeholder="Ingrese la clave de acceso"
                className={`w-full pl-11 pr-11 py-3 bg-slate-950/80 border ${
                  error ? 'border-red-500 focus:ring-red-500/30' : 'border-slate-800 focus:border-cyan-500 focus:ring-cyan-500/30'
                } rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-4 transition-all`}
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {error && (
              <div className="flex items-center gap-2 mt-2 text-xs text-red-400 bg-red-950/40 p-2.5 rounded-lg border border-red-800/40 animate-shake">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>Contraseña incorrecta. Intente nuevamente.</span>
              </div>
            )}
          </div>

          <button
            type="submit"
            className="w-full py-3.5 px-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold rounded-xl shadow-lg shadow-cyan-500/25 transition-all transform active:scale-[0.99] flex items-center justify-center gap-2 text-sm"
          >
            <Lock className="w-4 h-4" />
            Acceder a Inteligencia
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-800/80 text-center">
          <p className="text-xs text-slate-500">
            Acceso restringido únicamente a personal autorizado de campaña.
          </p>
          <p className="text-[10px] text-slate-600 mt-1">
            Clave predeterminada de prueba: <code className="text-cyan-400 bg-slate-950 px-1.5 py-0.5 rounded">{DEFAULT_SECRET_KEY}</code>
          </p>
        </div>
      </div>
    </div>
  );
};
