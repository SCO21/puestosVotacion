/**
 * Módulo de Inteligencia Electoral y Análisis Estadístico
 * Cartagena Electoral SPA
 */

/**
 * Retorna la lista ordenada de candidatos en un puesto de votación.
 * @param {Array} resultados - Array de { candidato_o_lista, votos }
 * @returns {Array} Resultados ordenados de mayor a menor voto
 */
export const getSortedResults = (resultados = []) => {
  return [...resultados].sort((a, b) => (b.votos || 0) - (a.votos || 0));
};

/**
 * Determina el ganador local en un puesto de votación.
 * @param {Array} resultados 
 * @returns {Object} { candidato_o_lista, votos }
 */
export const getPuestoWinner = (resultados = []) => {
  const sorted = getSortedResults(resultados);
  if (sorted.length === 0 || sorted[0].votos === 0) {
    return { candidato_o_lista: 'Pendiente de escrutinio', votos: 0 };
  }
  return sorted[0];
};

/**
 * Calcula el ranking y el color del semáforo para el candidato objetivo en un puesto.
 * Verde (#22c55e): 1er Lugar (Ganador local)
 * Amarillo (#eab308): 2do o 3er Lugar
 * Rojo (#ef4444): Fuera del top 3 (4to o inferior)
 * Gris (#94a3b8): Puesto sin datos de votos registrados aún
 * 
 * @param {Array} resultados 
 * @param {string} targetCandidate 
 * @returns {Object} { rank, color, badgeBg, badgeText, statusLabel, targetVotes, pct }
 */
export const getTrafficLightStatus = (resultados = [], targetCandidate = '') => {
  const sorted = getSortedResults(resultados);
  const totalVotesInPuesto = sorted.reduce((acc, curr) => acc + (curr.votos || 0), 0);

  // Si el puesto solo tiene coordenadas pero no tiene votos aún
  if (totalVotesInPuesto === 0) {
    return {
      rank: 0,
      color: '#94a3b8', // Gris neutro
      badgeBg: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
      statusLabel: 'Puesto Registrado (Sin Votos)',
      targetVotes: 0,
      pct: 0
    };
  }

  if (!targetCandidate) {
    return { rank: 0, color: '#3b82f6', badgeBg: 'bg-blue-500/20 text-blue-300', statusLabel: 'Sin Selección', targetVotes: 0, pct: 0 };
  }

  const targetIndex = sorted.findIndex(
    item => item.candidato_o_lista?.trim().toUpperCase() === targetCandidate.trim().toUpperCase()
  );

  if (targetIndex === -1) {
    return {
      rank: 999,
      color: '#ef4444',
      badgeBg: 'bg-red-500/20 text-red-400 border-red-500/30',
      statusLabel: 'Fuera del Top 3',
      targetVotes: 0,
      pct: 0
    };
  }

  const rank = targetIndex + 1;
  const targetVotes = sorted[targetIndex].votos || 0;
  const pct = totalVotesInPuesto > 0 ? ((targetVotes / totalVotesInPuesto) * 100).toFixed(1) : 0;

  if (rank === 1) {
    return {
      rank: 1,
      color: '#22c55e', // Verde
      badgeBg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      statusLabel: '1º Lugar (Ganador)',
      targetVotes,
      pct
    };
  } else if (rank === 2 || rank === 3) {
    return {
      rank,
      color: '#eab308', // Amarillo
      badgeBg: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      statusLabel: `${rank}º Lugar (Top 3)`,
      targetVotes,
      pct
    };
  } else {
    return {
      rank,
      color: '#ef4444', // Rojo
      badgeBg: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
      statusLabel: `${rank}º Lugar (Fuera Top 3)`,
      targetVotes,
      pct
    };
  }
};

/**
 * Calcula el radio dinámico para los CircleMarkers de Leaflet.
 * @param {number} totalVotes - Votos totales del puesto
 * @param {number} maxVotes - Máximo de votos en todo el dataset
 * @returns {number} Radio entre 10 y 26px
 */
export const calculateMarkerRadius = (totalVotes = 0, maxVotes = 15000) => {
  const minRadius = 10;
  const maxRadius = 26;
  if (!totalVotes || totalVotes <= 0) return 11; // Radio estándar visible para puestos sin votos aún
  if (!maxVotes || maxVotes <= 0) return minRadius;
  const ratio = Math.min(totalVotes / maxVotes, 1);
  return Math.round(minRadius + ratio * (maxRadius - minRadius));
};

/**
 * Extrae la lista de todos los candidatos únicos del dataset.
 * @param {Array} puestos 
 * @returns {Array} Nombres de candidatos únicos
 */
export const extractUniqueCandidates = (puestos = []) => {
  const candidatesSet = new Set();
  puestos.forEach(p => {
    (p.resultados || []).forEach(r => {
      if (r.candidato_o_lista) {
        candidatesSet.add(r.candidato_o_lista);
      }
    });
  });
  return Array.from(candidatesSet);
};
