import React from 'react';
import { 
  X, 
  MapPin, 
  Vote, 
  Users, 
  Trophy, 
  Award, 
  Building2, 
  ExternalLink 
} from 'lucide-react';
import { getSortedResults, getTrafficLightStatus } from '../utils/electionAnalytics';

export const DetailModal = ({
  puesto,
  targetCandidate = '',
  planillas = [],
  onClose
}) => {
  if (!puesto) return null;

  const sortedResults = getSortedResults(puesto.resultados);
  const traffic = getTrafficLightStatus(puesto.resultados, targetCandidate);
  const leaderInfo = planillas.find(p => p.puesto_asignado_id === puesto.puesto_id);

  return (
    <div className="fixed inset-0 z-[2000] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-fadeIn">
        
        {/* Header */}
        <div className="p-6 bg-slate-950/80 border-b border-slate-800 flex items-start justify-between relative">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded border ${traffic.badgeBg}`}>
                {traffic.statusLabel}
              </span>
              <span className="text-[10px] text-slate-400 font-mono bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                {puesto.puesto_id}
              </span>
            </div>
            <h2 className="text-xl font-bold text-white font-heading">
              {puesto.nombre_puesto}
            </h2>
            <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
              <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              {puesto.direccion} | Lat: {puesto.lat}, Lng: {puesto.lng}
            </p>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* Top Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
              <div className="text-[10px] font-bold uppercase text-slate-400">Votos Totales Puesto</div>
              <div className="text-lg font-extrabold text-white">{puesto.votos_totales_puesto.toLocaleString()}</div>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
              <div className="text-[10px] font-bold uppercase text-slate-400">Votos {targetCandidate.split(' ')[0]}</div>
              <div className="text-lg font-extrabold text-cyan-400">
                {traffic.targetVotes.toLocaleString()} ({traffic.pct}%)
              </div>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
              <div className="text-[10px] font-bold uppercase text-slate-400">Líder Asignado</div>
              <div className="text-sm font-bold text-white truncate">
                {leaderInfo ? leaderInfo.nombre_lider : 'Sin Líder Asignado'}
              </div>
              {leaderInfo && (
                <div className="text-[10px] text-blue-400">{leaderInfo.num_activistas} activistas</div>
              )}
            </div>
          </div>

          {/* Detailed Voting Table */}
          <div>
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Vote className="w-4 h-4 text-cyan-400" />
              Escrutinio Completo de Candidatos
            </h3>

            <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-900/90 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-3">Candidato / Lista</th>
                    <th className="py-2.5 px-3 text-right">Votos</th>
                    <th className="py-2.5 px-3 text-right">% Votación</th>
                    <th className="py-2.5 px-3 w-1/3">Proporción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {sortedResults.map((item, idx) => {
                    const pct = puesto.votos_totales_puesto > 0 
                      ? ((item.votos / puesto.votos_totales_puesto) * 100).toFixed(1)
                      : 0;
                    const isTarget = item.candidato_o_lista?.trim().toUpperCase() === targetCandidate.trim().toUpperCase();

                    return (
                      <tr key={idx} className={isTarget ? 'bg-cyan-950/40 font-semibold' : ''}>
                        <td className="py-2.5 px-3 text-slate-400">{idx + 1}</td>
                        <td className={`py-2.5 px-3 ${isTarget ? 'text-cyan-300 font-bold' : 'text-slate-200'}`}>
                          {item.candidato_o_lista}
                          {idx === 0 && (
                            <span className="ml-2 text-[9px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-bold">
                              GANADOR
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right font-extrabold text-white">
                          {item.votos.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 text-right text-slate-400">
                          {pct}%
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
                            <div 
                              className={`h-full ${isTarget ? 'bg-cyan-400' : idx === 0 ? 'bg-amber-400' : 'bg-slate-600'}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="py-2 px-5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl transition-all"
          >
            Cerrar Detalle
          </button>
        </div>

      </div>
    </div>
  );
};
