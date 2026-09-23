import React, { createContext, useContext, useMemo, useCallback, useState, useEffect } from 'react';
import seed from '../data/estructura_seed.json';

// Estructura tal cual viene del Excel "PUESTOS X BARRIO.xlsx" (solo lectura).
// Inscritos = columna "total" de la hoja DIVIPOL.
export const PUESTOS_BASE = seed.puestos;
export const SIN_PUESTO = seed.sin_puesto || [];
export const LOCALIDADES = [...new Set(seed.puestos.map(p => p.localidad))].sort();

// Clasificación descriptiva (solo dice qué hay asignado en el Excel, no evalúa).
export const ESTADOS = {
  sin_asignar:      { id: 'sin_asignar',      label: 'Sin asignar',            color: '#94a3b8', desc: 'El Excel no tiene coordinador ni líderes' },
  solo_coordinador: { id: 'solo_coordinador', label: 'Solo coordinador',       color: '#f59e0b', desc: 'El Excel tiene coordinador, sin líderes' },
  solo_lideres:     { id: 'solo_lideres',     label: 'Solo líderes',           color: '#38bdf8', desc: 'El Excel tiene líderes, sin coordinador' },
  completo:         { id: 'completo',         label: 'Coordinador y líderes',  color: '#22c55e', desc: 'El Excel tiene coordinador y líderes' },
};
export const ESTADO_ORDEN = ['completo', 'solo_coordinador', 'solo_lideres', 'sin_asignar'];

// ---------- Votos proyectados: guardados por usuario (localStorage + cookie de respaldo) ----------
const PROY_KEY = 'proyecciones_v1';
const COOKIE_DAYS = 365;

const readCookie = (name) => {
  const m = document.cookie.split('; ').find(c => c.startsWith(name + '='));
  return m ? decodeURIComponent(m.slice(name.length + 1)) : null;
};
const writeCookie = (name, value) => {
  const exp = new Date(Date.now() + COOKIE_DAYS * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${exp}; path=/; SameSite=Lax`;
};
const loadProy = () => {
  try {
    const ls = window.localStorage.getItem(PROY_KEY);
    if (ls) return JSON.parse(ls);
  } catch { /* noop */ }
  try {
    const ck = readCookie(PROY_KEY);
    if (ck) return JSON.parse(ck);
  } catch { /* noop */ }
  return {};
};
const saveProy = (obj) => {
  const s = JSON.stringify(obj);
  try { window.localStorage.setItem(PROY_KEY, s); } catch { /* noop */ }
  try { writeCookie(PROY_KEY, s); } catch { /* noop */ }
};

const Ctx = createContext(null);

export function EstructuraProvider({ children }) {
  const [proyecciones, setProyecciones] = useState(loadProy);
  useEffect(() => { saveProy(proyecciones); }, [proyecciones]);

  const setProyeccion = useCallback((pid, v) => setProyecciones(prev => {
    const n = v === '' || v === null || v === undefined ? null : Math.max(0, Math.round(Number(v)));
    const next = { ...prev };
    if (n === null || isNaN(n)) delete next[pid]; else next[pid] = n;
    return next;
  }), []);
  const clearProyecciones = useCallback(() => setProyecciones({}), []);

  // Lista plana de asignaciones (una fila por persona-puesto)
  const personas = useMemo(() => {
    const out = [];
    PUESTOS_BASE.forEach(p => {
      p.coordinadores.forEach((c, i) => out.push({ id: `${p.puesto_id}-c${i}`, puestoId: p.puesto_id, rol: 'coordinador', nombre: c.nombre, referente: c.referente || '' }));
      p.lideres.forEach((l, i) => out.push({ id: `${p.puesto_id}-l${i}`, puestoId: p.puesto_id, rol: 'lider', nombre: l.nombre, referente: l.referente || '' }));
    });
    return out;
  }, []);

  const resumen = useMemo(() => {
    const out = {};
    PUESTOS_BASE.forEach(b => {
      const coordinadores = b.coordinadores.map(c => ({ ...c, referente: c.referente || '' }));
      const lideres = b.lideres.map(l => ({ ...l, referente: l.referente || '' }));
      const proyectado = proyecciones[b.puesto_id] ?? null;
      const estado = coordinadores.length && lideres.length ? 'completo'
        : coordinadores.length ? 'solo_coordinador'
        : lideres.length ? 'solo_lideres' : 'sin_asignar';
      out[b.puesto_id] = { ...b, coordinadores, lideres, personas: [...coordinadores, ...lideres], proyectado, estado };
    });
    return out;
  }, [proyecciones]);

  const totalProyectado = useMemo(() => Object.values(proyecciones).reduce((a, b) => a + (Number(b) || 0), 0), [proyecciones]);

  const value = { resumen, personas, proyecciones, setProyeccion, clearProyecciones, totalProyectado };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useEstructura = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error('useEstructura debe usarse dentro de <EstructuraProvider>');
  return c;
};

export const fmtN = (n) => (n == null ? '—' : Math.round(n).toLocaleString('es-CO'));
