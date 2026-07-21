import React, { useMemo, useState } from 'react';
import { 
  Users, 
  TrendingUp, 
  Search, 
  Award, 
  AlertCircle, 
  CheckCircle2, 
  BarChart2, 
  Building2 
} from 'lucide-react';
import { getTrafficLightStatus } from '../utils/electionAnalytics';

export const CampaignAudit = ({
  puestos = [],
  planillas = [],
  targetCandidate = ''
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Cruce de datos entre planillas_campana.json y resultados_oficiales.json
  const auditData = useMemo(() => {
    const puestosMap = new Map();
    puestos.forEach(p => puestosMap.set(p.puesto_id, p));

    return planillas.map(item => {
      const puesto = puestosMap.get(item.puesto_asignado_id);
      let targetVotes = 0;
      let totalPuestoVotes = 0;
      let puestoNombre = 'Puesto No Encontrado';
      let traffic = { rank: 999, color: '#ef4444' };

      if (puesto) {
        puestoNombre = puesto.nombre_puesto;
        totalPuestoVotes = puesto.votos_totales_puesto;
        traffic = getTrafficLightStatus(puesto.resultados, targetCandidate);
        targetVotes = traffic.targetVotes;
      }

      // Indice de conversión: cuántos votos generó cada activista registrado
      const conversionRatio = item.num_activistas > 0 
        ? (targetVotes / item.num_activistas).toFixed(1)
        : 0;

      // Evaluación del rendimiento del líder
      let statusLabel = 'Deficiente';
      let badgeClass = 'bg-rose-500/20 text-rose-400 border-rose-500/30';

      if (traffic.rank === 1 && parseFloat(conversionRatio) >= 12) {
        statusLabel = 'Excelente (Líder Top)';
        badgeClass = 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      } else if (traffic.rank <= 3 && parseFloat(conversionRatio) >= 8) {
        statusLabel = 'Aceptable (Podio)';
        badgeClass = 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      }

      return {
        ...item,
        puestoNombre,
        targetVotes,
        totalPuestoVotes,
        traffic,
        conversionRatio,
        statusLabel,
        badgeClass
      };
    });
  }, [puestos, planillas, targetCandidate]);

  const filteredAudit = useMemo(() => {
    if (!searchTerm.trim()) return auditData;
    const term = searchTerm.toLowerCase();
    return auditData.filter(
      item => item.nombre_lider.toLowerCase().includes(term) || item.puestoNombre.toLowerCase().includes(term)
    );
  }, [auditData, searchTerm]);

  // Resumen global de auditoría
  const totals = useMemo(() => {
    const totalActivistas = auditData.reduce((acc, curr) => acc + curr.num_activistas, 0);
    const totalVotosObtenidos = auditData.reduce((acc, curr) => acc + curr.targetVotes, 0);
    const avgRatio = totalActivistas > 0 ? (totalVotosObtenidos / totalActivistas).toFixed(1) : 0;
    return { totalActivistas, totalVotosObtenidos, avgRatio };
  }, [auditData]);

  return (
    <div className="space-y-6">
      
      {/* Dynamic Header */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white font-heading flex items-center gap-2">
              <Users className="w-6 h-6 text-cyan-400" />
              Auditoría de Campaña y Rendimiento de Líderes
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Cruce entre planillas de activistas registradas y votos reales escrutados para <strong className="text-cyan-300">{targetCandidate}</strong>
            </p>
          </div>

          <div className="relative w-full md:w-64">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar líder o puesto..."
              className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl pl-9 pr-3 py-2.5 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
          </div>
        </div>

        {/* Global Audit Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-800/80">
          <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 flex items-center gap-3">
            <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">Total Activistas Planillados</div>
              <div className="text-xl font-extrabold text-white">{totals.totalActivistas.toLocaleString()}</div>
            </div>
          </div>

          <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 flex items-center gap-3">
            <div className="p-3 bg-cyan-500/10 text-cyan-400 rounded-xl">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">Votos Logrados en Puestos Asignados</div>
              <div className="text-xl font-extrabold text-cyan-400">{totals.totalVotosObtenidos.toLocaleString()}</div>
            </div>
          </div>

          <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 flex items-center gap-3">
            <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">Promedio de Conversión (Voto/Activista)</div>
              <div className="text-xl font-extrabold text-emerald-400">{totals.avgRatio}x</div>
            </div>
          </div>
        </div>
      </div>

      {/* Audit Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl backdrop-blur-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-950/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                <th className="py-3.5 px-4">Líder Político</th>
                <th className="py-3.5 px-4">Puesto Asignado</th>
                <th className="py-3.5 px-4 text-center">Activistas</th>
                <th className="py-3.5 px-4 text-right">Votos Real {targetCandidate.split(' ')[0]}</th>
                <th className="py-3.5 px-4 text-center">Efectividad (Ratio)</th>
                <th className="py-3.5 px-4 text-center">Lugar del Puesto</th>
                <th className="py-3.5 px-4 text-center">Estado Auditoría</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredAudit.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    No se encontraron registros de auditoría que coincidan con la búsqueda.
                  </td>
                </tr>
              ) : (
                filteredAudit.map((item) => (
                  <tr key={item.lider_id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-white">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center font-bold text-[11px] border border-slate-700">
                          {item.nombre_lider.charAt(0)}
                        </div>
                        <div>
                          <div>{item.nombre_lider}</div>
                          <div className="text-[10px] text-slate-500 font-normal">{item.lider_id}</div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <span className="font-medium">{item.puestoNombre}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span className="px-2.5 py-1 bg-slate-950 rounded-lg text-slate-200 font-bold border border-slate-800">
                        {item.num_activistas}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right font-extrabold text-cyan-400 text-sm">
                      {item.targetVotes.toLocaleString()}
                    </td>

                    <td className="py-3.5 px-4 text-center font-bold text-emerald-400">
                      {item.conversionRatio}x
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border inline-flex items-center gap-1 ${item.traffic.badgeBg}`}>
                        {item.traffic.statusLabel}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${item.badgeClass}`}>
                        {item.statusLabel}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
