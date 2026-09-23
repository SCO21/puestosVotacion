import React from 'react';
import { X, MapPin, UserCog, Users, Target } from 'lucide-react';
import { useEstructura, fmtN } from '../../hooks/useEstructura';
import { ProyeccionInput } from './ProyeccionInput';

// Ficha del puesto: solo información del Excel + votos proyectados (del usuario).
export const PuestoEstructuraModal = ({ puestoId, onClose }) => {
  const { resumen } = useEstructura();
  const r = resumen[puestoId];
  if (!r) return null;
  const [zona, pto] = r.puesto_id.split('-');

  const Lista = ({ items, vacio }) => items.length === 0
    ? <div className="text-xs text-slate-400">{vacio}</div>
    : <div className="space-y-1">{items.map((p, i) => (
        <div key={i} className="text-sm bg-slate-50 border border-slate-100 rounded-lg px-3 py-1.5 text-slate-800">
          {p.nombre}{p.referente && <span className="ml-1.5 text-[11px] text-violet-600">(ref. {p.referente})</span>}
        </div>))}</div>;

  return (
    <div className="fixed inset-0 z-[2100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fadeIn flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
        <div className="p-5 bg-slate-50 border-b border-slate-200 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 rounded px-2 py-0.5">Zona {zona} · Puesto {pto}</span>
            <h2 className="text-lg font-bold text-slate-900 mt-1 break-words">{r.nombre}</h2>
            <div className="text-xs text-slate-500">{r.localidad}</div>
            {r.direccion && <p className="text-xs text-slate-500 flex items-start gap-1 mt-1"><MapPin className="w-3.5 h-3.5 mt-0.5 text-blue-500 shrink-0" />{r.direccion}</p>}
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-900 p-1 rounded-lg hover:bg-slate-100 shrink-0"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 space-y-4 overflow-y-auto">
          <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
            <span className="text-xs font-bold uppercase text-slate-500">Total inscritos</span>
            <span className="text-xl font-extrabold text-slate-900">{fmtN(r.inscritos)}</span>
          </div>
          <div>
            <div className="text-xs font-bold text-slate-600 uppercase mb-1.5 flex items-center gap-1"><UserCog className="w-4 h-4 text-amber-500" /> Coordinador{r.coordinadores.length > 1 ? 'es' : ''}</div>
            <Lista items={r.coordinadores} vacio="No registrado en el Excel" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-600 uppercase mb-1.5 flex items-center gap-1"><Users className="w-4 h-4 text-blue-500" /> Líderes ({r.lideres.length})</div>
            <Lista items={r.lideres} vacio="No registrados en el Excel" />
          </div>
          <div className="border border-emerald-200 bg-emerald-50/50 rounded-xl p-3">
            <div className="text-xs font-bold text-emerald-800 uppercase mb-1.5 flex items-center gap-1"><Target className="w-4 h-4" /> Votos proyectados</div>
            <ProyeccionInput puestoId={r.puesto_id} />
            <div className="text-[10px] text-slate-400 mt-1">Dato tuyo, se guarda en este navegador (no viene del Excel).</div>
          </div>
        </div>
      </div>
    </div>
  );
};
