import React, { useMemo, useState } from 'react';
import { Eye, ArrowUpDown, Table2, Eraser } from 'lucide-react';
import { useEstructura, fmtN } from '../../hooks/useEstructura';
import { ProyeccionInput } from './ProyeccionInput';

const COLS = [
  { id: 'puesto_id', label: 'Código' },
  { id: 'nombre', label: 'Puesto' },
  { id: 'localidad', label: 'Localidad' },
  { id: 'inscritos', label: 'Inscritos', num: true },
  { id: 'coord', label: 'Coordinador(es)' },
  { id: 'lid', label: 'Líderes (referido por)' },
  { id: 'proyectado', label: 'Votos proyectados', num: true },
];

const nombres = (arr) => arr.map(p => p.nombre + (p.referente ? ` (${p.referente})` : '')).join(', ');

export const StructureTable = ({ puestoIds, onEdit }) => {
  const { resumen, clearProyecciones, totalProyectado } = useEstructura();
  const [sort, setSort] = useState({ id: 'puesto_id', dir: 1 });

  const rows = useMemo(() => {
    const list = (puestoIds || Object.keys(resumen)).map(id => resumen[id]).filter(Boolean).map(r => ({
      ...r, coord: nombres(r.coordinadores), lid: nombres(r.lideres),
    }));
    const key = (r) => (sort.id === 'proyectado' ? (r.proyectado ?? -1) : r[sort.id]);
    return list.sort((a, b) => { const x = key(a), y = key(b); return (typeof x === 'number' ? x - y : String(x).localeCompare(String(y))) * sort.dir; });
  }, [puestoIds, resumen, sort]);

  const tot = rows.reduce((a, r) => ({ ins: a.ins + (r.inscritos || 0), proy: a.proy + (r.proyectado || 0) }), { ins: 0, proy: 0 });

  const doClear = () => {
    if (window.confirm('¿Borrar todos los votos proyectados que registraste en este navegador?')) clearProyecciones();
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl gov-shadow overflow-hidden animate-fadeIn">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 gap-2 flex-wrap">
        <div>
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2"><Table2 className="w-4 h-4 text-blue-600" /> Puestos y estructura ({rows.length})</h3>
          <div className="text-[11px] text-slate-400">Coordinadores y líderes según el Excel · escribe los votos proyectados en la última columna (Cartagena: <b className="text-emerald-700">{fmtN(totalProyectado)}</b>)</div>
        </div>
        <button onClick={doClear} className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 border border-slate-200 rounded-lg px-3 py-1.5 hover:bg-slate-50">
          <Eraser className="w-3.5 h-3.5" /> Borrar proyecciones
        </button>
      </div>
      <div className="max-h-[66vh] overflow-auto">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-slate-100 text-slate-500 uppercase text-[10px] z-10">
            <tr>
              {COLS.map(c => (
                <th key={c.id} className={`py-2 px-2 ${c.num ? 'text-right' : 'text-left'} cursor-pointer select-none whitespace-nowrap`}
                  onClick={() => setSort(s => ({ id: c.id, dir: s.id === c.id ? -s.dir : (c.num ? -1 : 1) }))}>
                  <span className="inline-flex items-center gap-1">{c.label}<ArrowUpDown className={`w-3 h-3 ${sort.id === c.id ? 'text-blue-600' : 'text-slate-300'}`} /></span>
                </th>
              ))}
              <th />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map(r => (
              <tr key={r.puesto_id} className="hover:bg-slate-50 align-top">
                <td className="py-1.5 px-2 font-mono text-slate-400">{r.puesto_id}</td>
                <td className="py-1.5 px-2 text-slate-700 font-medium max-w-[220px]">{r.nombre}</td>
                <td className="py-1.5 px-2 text-slate-500 whitespace-nowrap">{r.localidad.split('·')[0]}</td>
                <td className="py-1.5 px-2 text-right text-slate-700 font-semibold">{fmtN(r.inscritos)}</td>
                <td className="py-1.5 px-2 text-slate-600 max-w-[200px]">{r.coord || <span className="text-slate-300">—</span>}</td>
                <td className="py-1.5 px-2 text-slate-600 max-w-[280px]">{r.lid || <span className="text-slate-300">—</span>}</td>
                <td className="py-1 px-2 w-32"><ProyeccionInput puestoId={r.puesto_id} className="text-xs py-1" /></td>
                <td className="py-1 px-2 text-right"><button onClick={() => onEdit(r.puesto_id)} className="p-1.5 text-slate-400 hover:text-blue-600" title="Ver ficha"><Eye className="w-4 h-4" /></button></td>
              </tr>
            ))}
          </tbody>
          <tfoot className="sticky bottom-0 bg-slate-100 font-bold text-slate-700">
            <tr>
              <td className="py-2 px-2" colSpan={3}>Total ({rows.length} puestos)</td>
              <td className="py-2 px-2 text-right">{fmtN(tot.ins)}</td>
              <td colSpan={2} />
              <td className="py-2 px-2 text-right text-emerald-700">{fmtN(tot.proy)}</td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};
