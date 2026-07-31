import React, { useState, useMemo } from 'react';
import { X, MapPin, Vote, Users, Search, Crown } from 'lucide-react';
import { getSortedResults, colorForCandidate } from '../utils/electionAnalytics';

export const DetailModal = ({
  puesto, targetCandidate = '', compareCandidates = [], planillas = [], onClose,
}) => {
  const [q, setQ] = useState('');
  // Hooks SIEMPRE antes de cualquier return (regla de hooks)
  const resultados = puesto?.resultados || [];
  const sorted = useMemo(() => getSortedResults(resultados), [resultados]);
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return term ? sorted.filter(r => r.candidato_o_lista?.toLowerCase().includes(term)) : sorted;
  }, [q, sorted]);

  if (!puesto) return null;

  const total = resultados.reduce((a, r) => a + (r.votos || 0), 0);
  const leaderInfo = planillas.find(p => p.puesto_asignado_id === puesto.puesto_id);
  const selSet = compareCandidates.map(c => c.trim().toUpperCase());
  const isSel = (name) => selSet.includes((name || '').trim().toUpperCase());
  const selectedRows = compareCandidates
    .map(c => sorted.find(r => r.candidato_o_lista?.trim().toUpperCase() === c.trim().toUpperCase()) || { candidato_o_lista: c, votos: 0 })
    .sort((a, b) => b.votos - a.votos);
  const selectedTotal = selectedRows.reduce((a, r) => a + (r.votos || 0), 0);

  return (
    <div className="fixed inset-0 z-[2000] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white border border-slate-200 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-fadeIn" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="p-5 bg-slate-50 border-b border-slate-200 flex items-start justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 rounded px-2 py-0.5">
                Zona {puesto.puesto_id?.split('-')[0]} · Puesto {puesto.puesto_id?.split('-')[1]}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">{puesto.puesto_id}</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 font-heading truncate">{puesto.nombre_puesto}</h2>
            <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
              <MapPin className="w-3.5 h-3.5 text-blue-500 shrink-0" /> {puesto.direccion}
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-900 p-1 rounded-lg hover:bg-slate-100 transition-all shrink-0"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-5 overflow-y-auto space-y-5">

          {/* Resumen de candidatos seleccionados */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <div className="text-[10px] font-bold uppercase text-slate-400">Votos seleccionados</div>
              <div className="text-lg font-extrabold text-slate-900">{selectedTotal.toLocaleString()}</div>
              <div className="text-[10px] text-slate-400">de {total.toLocaleString()} en el puesto</div>
            </div>
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 sm:col-span-1">
              <div className="text-[10px] font-bold uppercase text-slate-400 mb-1">Comparación</div>
              <div className="space-y-1">
                {selectedRows.length === 0 && <div className="text-xs text-slate-400">Sin selección</div>}
                {selectedRows.map((r, i) => {
                  const pctc = total > 0 ? ((r.votos / total) * 100).toFixed(1) : '0.0';
                  return (
                    <div key={r.candidato_o_lista} className="flex items-center gap-1.5 text-xs">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: colorForCandidate(r.candidato_o_lista, i) }} />
                      <span className="truncate text-slate-600 flex-1">{r.candidato_o_lista.split(' ').slice(0, 2).join(' ')}</span>
                      <span className="font-bold text-slate-900">{(r.votos || 0).toLocaleString()}</span>
                      <span className="text-[10px] text-slate-400">({pctc}%)</span>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <div className="text-[10px] font-bold uppercase text-slate-400">Líder asignado</div>
              <div className="text-sm font-bold text-slate-900 truncate">{leaderInfo ? leaderInfo.nombre_lider : 'Sin líder asignado'}</div>
              {leaderInfo && <div className="text-[10px] text-blue-500">{leaderInfo.num_activistas} activistas</div>}
            </div>
          </div>

          {/* Escrutinio completo — scroll para muchos candidatos */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Vote className="w-4 h-4 text-blue-500" /> Escrutinio completo ({resultados.length})
              </h3>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filtrar candidato…"
                  className="bg-white border border-slate-300 text-slate-800 text-xs rounded-lg pl-8 pr-3 py-1.5 focus:outline-none focus:border-blue-500 w-44" />
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="max-h-[42vh] overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="sticky top-0 z-10">
                    <tr className="bg-slate-100 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                      <th className="py-2 px-3 w-8">#</th>
                      <th className="py-2 px-3">Candidato / Lista</th>
                      <th className="py-2 px-3 text-right">Votos</th>
                      <th className="py-2 px-3 text-right">%</th>
                      <th className="py-2 px-3 w-1/4">Proporción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filtered.map((item) => {
                      const rank = sorted.indexOf(item) + 1;
                      const p = total > 0 ? ((item.votos / total) * 100).toFixed(1) : 0;
                      const sel = isSel(item.candidato_o_lista);
                      const col = sel ? colorForCandidate(item.candidato_o_lista) : (rank === 1 ? '#f59e0b' : '#cbd5e1');
                      return (
                        <tr key={item.candidato_o_lista} className={sel ? 'bg-blue-50/70' : ''}>
                          <td className="py-2 px-3 text-slate-400">{rank}</td>
                          <td className="py-2 px-3">
                            <span className={`${sel ? 'font-bold' : 'font-medium'} text-slate-700 flex items-center gap-1.5`}>
                              {sel && <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: colorForCandidate(item.candidato_o_lista) }} />}
                              {item.candidato_o_lista}
                              {rank === 1 && <span className="ml-1 text-[9px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-bold inline-flex items-center gap-0.5"><Crown className="w-2.5 h-2.5" />1º</span>}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-right font-extrabold text-slate-900">{(item.votos || 0).toLocaleString()}</td>
                          <td className="py-2 px-3 text-right text-slate-400">{p}%</td>
                          <td className="py-2 px-3">
                            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                              <div className="h-full rounded-full" style={{ width: `${p}%`, backgroundColor: col }} />
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {filtered.length === 0 && (
                      <tr><td colSpan={5} className="py-6 text-center text-slate-400">Sin candidatos que coincidan.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button onClick={onClose} className="py-2 px-5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-all">Cerrar</button>
        </div>
      </div>
    </div>
  );
};
