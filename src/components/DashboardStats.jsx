import React, { useMemo } from 'react';
import { 
  Vote, 
  MapPin, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  TrendingUp 
} from 'lucide-react';
import { getTrafficLightStatus } from '../utils/electionAnalytics';

export const DashboardStats = ({
  puestos = [],
  targetCandidate = ''
}) => {
  const stats = useMemo(() => {
    let totalVotesPuestos = 0;
    let targetCandidateVotes = 0;
    let greenCount = 0;
    let yellowCount = 0;
    let redCount = 0;

    puestos.forEach(p => {
      totalVotesPuestos += (p.votos_totales_puesto || 0);
      const traffic = getTrafficLightStatus(p.resultados, targetCandidate);
      targetCandidateVotes += traffic.targetVotes;

      if (traffic.rank === 1) greenCount++;
      else if (traffic.rank === 2 || traffic.rank === 3) yellowCount++;
      else redCount++;
    });

    const marketShare = totalVotesPuestos > 0 
      ? ((targetCandidateVotes / totalVotesPuestos) * 100).toFixed(1)
      : 0;

    return {
      totalPuestos: puestos.length,
      totalVotesPuestos,
      targetCandidateVotes,
      greenCount,
      yellowCount,
      redCount,
      marketShare
    };
  }, [puestos, targetCandidate]);

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
      
      {/* Votos Totales Candidato */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 shadow-lg backdrop-blur-md relative overflow-hidden">
        <div className="flex items-center justify-between text-slate-400 mb-1">
          <span className="text-[10px] font-bold uppercase tracking-wider">Votos {targetCandidate.split(' ')[0]}</span>
          <Vote className="w-4 h-4 text-cyan-400" />
        </div>
        <div className="text-xl font-extrabold text-white font-heading">
          {stats.targetCandidateVotes.toLocaleString()}
        </div>
        <div className="text-[10px] text-cyan-400 font-semibold mt-0.5">
          {stats.marketShare}% de la votación
        </div>
      </div>

      {/* Puestos Analizados */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 shadow-lg backdrop-blur-md">
        <div className="flex items-center justify-between text-slate-400 mb-1">
          <span className="text-[10px] font-bold uppercase tracking-wider">Puestos Totales</span>
          <MapPin className="w-4 h-4 text-blue-400" />
        </div>
        <div className="text-xl font-extrabold text-white font-heading">
          {stats.totalPuestos}
        </div>
        <div className="text-[10px] text-slate-400 font-medium mt-0.5">
          Puestos de votación
        </div>
      </div>

      {/* Puestos Ganados (Verdes) */}
      <div className="bg-slate-900/80 border border-emerald-900/50 rounded-xl p-3.5 shadow-lg backdrop-blur-md">
        <div className="flex items-center justify-between text-emerald-400 mb-1">
          <span className="text-[10px] font-bold uppercase tracking-wider">Puestos Ganados</span>
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
        </div>
        <div className="text-xl font-extrabold text-emerald-400 font-heading">
          {stats.greenCount}
        </div>
        <div className="text-[10px] text-emerald-500 font-medium mt-0.5">
          1º Lugar (Liderazgo)
        </div>
      </div>

      {/* Puestos en Podio (Amarillos) */}
      <div className="bg-slate-900/80 border border-amber-900/50 rounded-xl p-3.5 shadow-lg backdrop-blur-md">
        <div className="flex items-center justify-between text-amber-400 mb-1">
          <span className="text-[10px] font-bold uppercase tracking-wider">En Podio (2º-3º)</span>
          <AlertTriangle className="w-4 h-4 text-amber-400" />
        </div>
        <div className="text-xl font-extrabold text-amber-400 font-heading">
          {stats.yellowCount}
        </div>
        <div className="text-[10px] text-amber-500 font-medium mt-0.5">
          Zona disputada
        </div>
      </div>

      {/* Puestos Críticos (Rojos) */}
      <div className="bg-slate-900/80 border border-rose-900/50 rounded-xl p-3.5 shadow-lg backdrop-blur-md">
        <div className="flex items-center justify-between text-rose-400 mb-1">
          <span className="text-[10px] font-bold uppercase tracking-wider">Fuera Top 3</span>
          <XCircle className="w-4 h-4 text-rose-400" />
        </div>
        <div className="text-xl font-extrabold text-rose-400 font-heading">
          {stats.redCount}
        </div>
        <div className="text-[10px] text-rose-500 font-medium mt-0.5">
          Requiere refuerzo
        </div>
      </div>

      {/* Participación General */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 shadow-lg backdrop-blur-md">
        <div className="flex items-center justify-between text-slate-400 mb-1">
          <span className="text-[10px] font-bold uppercase tracking-wider">Votos Totales</span>
          <TrendingUp className="w-4 h-4 text-purple-400" />
        </div>
        <div className="text-xl font-extrabold text-white font-heading">
          {stats.totalVotesPuestos.toLocaleString()}
        </div>
        <div className="text-[10px] text-purple-400 font-semibold mt-0.5">
          Censo escrutado
        </div>
      </div>

    </div>
  );
};
