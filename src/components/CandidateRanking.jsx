import React, { useMemo } from 'react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip as RechartsTooltip, 
  PieChart, 
  Pie, 
  Cell, 
  Legend 
} from 'recharts';
import { getTrafficLightStatus } from '../utils/electionAnalytics';
import { BarChart3, PieChart as PieChartIcon } from 'lucide-react';

const COLORS = ['#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#64748b'];

export const CandidateRanking = ({
  puestos = [],
  targetCandidate = ''
}) => {
  
  // Data for Top 6 Puestos for Target Candidate
  const topPuestosData = useMemo(() => {
    return puestos
      .map(p => {
        const traffic = getTrafficLightStatus(p.resultados, targetCandidate);
        return {
          name: p.nombre_puesto.length > 18 ? p.nombre_puesto.substring(0, 16) + '...' : p.nombre_puesto,
          fullPuesto: p.nombre_puesto,
          votosTarget: traffic.targetVotes,
          votosTotales: p.votos_totales_puesto,
          color: traffic.color,
          rank: traffic.rank
        };
      })
      .sort((a, b) => b.votosTarget - a.votosTarget)
      .slice(0, 6);
  }, [puestos, targetCandidate]);

  // Data for Overall Vote Distribution Pie Chart
  const globalCandidateData = useMemo(() => {
    const map = new Map();
    puestos.forEach(p => {
      (p.resultados || []).forEach(r => {
        const cand = r.candidato_o_lista || 'OTRO';
        map.set(cand, (map.get(cand) || 0) + (r.votos || 0));
      });
    });

    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [puestos]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      
      {/* Bar Chart: Top Puestos */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl backdrop-blur-md">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold text-white font-heading flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-cyan-400" />
              Top Puestos de {targetCandidate}
            </h3>
            <p className="text-xs text-slate-400">Puestos de votación con mayor caudal electoral</p>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topPuestosData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
              <XAxis 
                dataKey="name" 
                stroke="#64748b" 
                fontSize={10} 
                tickLine={false} 
                interval={0}
                angle={-15}
                textAnchor="end"
              />
              <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
              <RechartsTooltip 
                contentStyle={{ 
                  backgroundColor: '#0f172a', 
                  borderColor: '#334155', 
                  borderRadius: '0.75rem', 
                  color: '#f8fafc',
                  fontSize: '12px' 
                }}
                formatter={(value) => [`${value.toLocaleString()} votos`, `Votos ${targetCandidate}`]}
                labelFormatter={(label, items) => items[0]?.payload?.fullPuesto || label}
              />
              <Bar dataKey="votosTarget" radius={[6, 6, 0, 0]}>
                {topPuestosData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Pie Chart: Global Vote Distribution */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl backdrop-blur-md">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold text-white font-heading flex items-center gap-2">
              <PieChartIcon className="w-5 h-5 text-blue-400" />
              Distribución de Votos en Cartagena
            </h3>
            <p className="text-xs text-slate-400">Participación comparativa entre candidatos principales</p>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={globalCandidateData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={4}
                dataKey="value"
              >
                {globalCandidateData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.name === targetCandidate ? '#06b6d4' : COLORS[(index + 1) % COLORS.length]} 
                  />
                ))}
              </Pie>
              <RechartsTooltip 
                contentStyle={{ 
                  backgroundColor: '#0f172a', 
                  borderColor: '#334155', 
                  borderRadius: '0.75rem', 
                  color: '#f8fafc',
                  fontSize: '12px' 
                }}
                formatter={(value) => [`${value.toLocaleString()} votos`, 'Votos Totales']}
              />
              <Legend 
                verticalAlign="bottom" 
                height={36} 
                iconType="circle"
                wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
};
