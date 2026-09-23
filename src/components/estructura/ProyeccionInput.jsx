import React, { useEffect, useState } from 'react';
import { useEstructura } from '../../hooks/useEstructura';

// Campo de votos proyectados por puesto. Guarda al salir del campo o con Enter.
export const ProyeccionInput = ({ puestoId, dark = false, className = '' }) => {
  const { proyecciones, setProyeccion } = useEstructura();
  const stored = proyecciones[puestoId];
  const [val, setVal] = useState(stored ?? '');
  useEffect(() => { setVal(stored ?? ''); }, [stored]);

  const commit = () => { if (String(val) !== String(stored ?? '')) setProyeccion(puestoId, val); };

  return (
    <input
      type="number" min="0" inputMode="numeric" placeholder="Escribe los votos…"
      value={val}
      onChange={e => setVal(e.target.value)}
      onBlur={commit}
      onKeyDown={e => { if (e.key === 'Enter') { commit(); e.currentTarget.blur(); } }}
      className={`w-full text-sm font-bold rounded-lg px-2.5 py-1.5 text-right focus:outline-none ${dark
        ? 'bg-slate-900 border border-slate-700 text-emerald-300 placeholder:text-slate-600 placeholder:font-normal focus:border-emerald-500'
        : 'bg-white border border-slate-200 text-emerald-700 placeholder:text-slate-300 placeholder:font-normal focus:border-emerald-500'} ${className}`}
    />
  );
};
