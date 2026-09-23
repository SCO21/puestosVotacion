// Modelo de confiabilidad (demo) compartido por Campaña y Estructura.
export const VARS = [
  { id: 'cumplimiento', label: 'Cumplimiento histórico', type: 'pct', peso: 0.30, help: '% de votos entregados vs. prometidos en elecciones previas' },
  { id: 'reuniones', label: 'Asistencia a reuniones', type: 'pct', peso: 0.20, help: '% de reuniones/capacitaciones a las que asistió' },
  { id: 'verificado', label: 'Identidad verificada', type: 'bool', peso: 0.15, help: 'Cédula y datos verificados' },
  { id: 'entregaListado', label: 'Entregó listado de votantes', type: 'bool', peso: 0.10, help: 'Entregó su base de votantes comprometidos' },
  { id: 'experiencia', label: 'Experiencia (0–5)', type: 'exp', peso: 0.10, help: 'Nº de campañas previas (0 a 5)' },
  { id: 'referido', label: 'Referido de confianza', type: 'bool', peso: 0.15, help: 'Avalado por alguien de confianza del equipo' },
];

export const DEFAULT_PESOS = Object.fromEntries(VARS.map(v => [v.id, v.peso]));
export const DEFAULT_VARS = { cumplimiento: 70, reuniones: 60, verificado: false, entregaListado: false, experiencia: 1, referido: false };

/** Score 0–100, o null si la persona aún no ha sido evaluada. */
export const scoreDe = (persona, pesos = DEFAULT_PESOS) => {
  const v = persona && persona.vars;
  if (!v) return null;
  const norm = {
    cumplimiento: Math.max(0, Math.min(100, Number(v.cumplimiento) || 0)),
    reuniones: Math.max(0, Math.min(100, Number(v.reuniones) || 0)),
    verificado: v.verificado ? 100 : 0,
    entregaListado: v.entregaListado ? 100 : 0,
    experiencia: Math.max(0, Math.min(5, Number(v.experiencia) || 0)) / 5 * 100,
    referido: v.referido ? 100 : 0,
  };
  return Math.round(VARS.reduce((s, vr) => s + norm[vr.id] * (pesos[vr.id] ?? vr.peso), 0));
};

/** Factor multiplicador de castigo: sin evaluar => 1 (no castiga). */
export const factorDe = (persona, pesos) => {
  const s = scoreDe(persona, pesos);
  return s == null ? 1 : s / 100;
};

export const scoreColor = (s) => s == null ? '#94a3b8' : s >= 75 ? '#16a34a' : s >= 50 ? '#f59e0b' : '#ef4444';
