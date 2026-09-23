import React, { useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { Building2, UserCog, Users, Vote, Target, Download, Search, Eye, Info } from 'lucide-react';
import { useEstructura, ESTADOS, ESTADO_ORDEN, SIN_PUESTO, fmtN } from '../../hooks/useEstructura';

const Kpi = ({ icon: Icon, label, value, sub, color = '#0f172a' }) => (
  <div className="bg-white border border-slate-200 rounded-2xl p-4 gov-shadow">
    <div className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1"><Icon className="w-3.5 h-3.5" /> {label}</div>
    <div className="text-2xl font-extrabold mt-0.5" style={{ color }}>{value}</div>
    {sub && <div className="text-[11px] text-slate-400">{sub}</div>}
  </div>
);

const Card = ({ title, right, children }) => (
  <div className="bg-white border border-slate-200 rounded-2xl gov-shadow overflow-hidden">
    <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between gap-2 flex-wrap">
      <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">{title}</h3>{right}
    </div>
    {children}
  </div>
);

const locCorta = (l) => l.split('·')[0].trim();

export const StructureStats = ({ puestoIds, onEdit }) => {
  const { resumen } = useEstructura();
  const [q, setQ] = useState('');
  const [rolF, setRolF] = useState('todos');

  const rows = useMemo(() => (puestoIds || Object.keys(resumen)).map(id => resumen[id]).filter(Boolean), [puestoIds, resumen]);

  const k = useMemo(() => {
    const coord = new Set(), lid = new Set();
    let ins = 0, proy = 0, conProy = 0;
    const est = Object.fromEntries(ESTADO_ORDEN.map(e => [e, 0]));
    rows.forEach(r => {
      ins += r.inscritos || 0;
      if (r.proyectado != null) { proy += r.proyectado; conProy++; }
      r.coordinadores.forEach(c => coord.add(c.nombre));
      r.lideres.forEach(l => lid.add(l.nombre));
      est[r.estado]++;
    });
    return { ins, proy, conProy, coord: coord.size, lid: lid.size, est };
  }, [rows]);

  const porLocalidad = useMemo(() => {
    const m = {};
    rows.forEach(r => {
      const x = m[r.localidad] ||= { localidad: r.localidad, corta: locCorta(r.localidad), puestos: 0, inscritos: 0, conCoord: 0, conLid: 0, coord: new Set(), lid: new Set(), proyectado: 0 };
      x.puestos++; x.inscritos += r.inscritos || 0; x.proyectado += r.proyectado || 0;
      if (r.coordinadores.length) x.conCoord++;
      if (r.lideres.length) x.conLid++;
      r.coordinadores.forEach(c => x.coord.add(c.nombre));
      r.lideres.forEach(l => x.lid.add(l.nombre));
    });
    return Object.values(m).map(x => ({ ...x, nCoord: x.coord.size, nLid: x.lid.size })).sort((a, b) => a.localidad.localeCompare(b.localidad));
  }, [rows]);

  // Personas: una fila por nombre, con los puestos donde aparece en el Excel
  const personas = useMemo(() => {
    const m = new Map();
    rows.forEach(r => {
      [...r.coordinadores.map(p => ({ ...p, rol: 'Coordinador' })), ...r.lideres.map(p => ({ ...p, rol: 'Líder' }))].forEach(p => {
        const x = m.get(p.nombre) || { nombre: p.nombre, roles: new Set(), referentes: new Set(), puestos: [] };
        x.roles.add(p.rol); if (p.referente) x.referentes.add(p.referente);
        x.puestos.push({ id: r.puesto_id, nombre: r.nombre, rol: p.rol });
        m.set(p.nombre, x);
      });
    });
    return [...m.values()].map(x => ({ ...x, roles: [...x.roles].join(' / '), referentes: [...x.referentes].join(', ') }))
      .sort((a, b) => b.puestos.length - a.puestos.length || a.nombre.localeCompare(b.nombre));
  }, [rows]);

  const referentes = useMemo(() => {
    const m = {};
    personas.forEach(p => p.referentes && p.referentes.split(', ').forEach(r => { (m[r] ||= []).push(p.nombre); }));
    return Object.entries(m).sort((a, b) => b[1].length - a[1].length);
  }, [personas]);

  const personasFilt = personas.filter(p =>
    (rolF === 'todos' || p.roles.includes(rolF)) &&
    (!q.trim() || p.nombre.toLowerCase().includes(q.toLowerCase()) || p.referentes.toLowerCase().includes(q.toLowerCase())));

  const exportar = () => {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows.map(r => ({
      Codigo: r.puesto_id, Puesto: r.nombre, Localidad: r.localidad, Direccion: r.direccion, Inscritos: r.inscritos,
      Coordinadores: r.coordinadores.map(c => c.nombre).join(', '),
      Lideres: r.lideres.map(l => l.nombre + (l.referente ? ` (${l.referente})` : '')).join(', '),
      'Votos proyectados': r.proyectado ?? '',
    }))), 'Puestos');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(personas.map(p => ({
      Nombre: p.nombre, Rol: p.roles, 'Referido por': p.referentes, 'Nº puestos': p.puestos.length,
      Puestos: p.puestos.map(x => `${x.id} ${x.nombre}`).join(' | '),
    }))), 'Personas');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(porLocalidad.map(x => ({
      Localidad: x.localidad, Puestos: x.puestos, Inscritos: x.inscritos, 'Puestos con coordinador': x.conCoord,
      'Puestos con líderes': x.conLid, Coordinadores: x.nCoord, Lideres: x.nLid, 'Votos proyectados': x.proyectado,
    }))), 'Localidades');
    XLSX.writeFile(wb, `estructura_cartagena_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <div className="space-y-4 animate-fadeIn">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="text-xs text-slate-500 flex items-center gap-1.5"><Info className="w-3.5 h-3.5" /> Datos del Excel <i>PUESTOS X BARRIO.xlsx</i>. Los votos proyectados son los que tú registras.</div>
        <button onClick={exportar} className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg px-3 py-2"><Download className="w-4 h-4" /> Exportar a Excel</button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <Kpi icon={Building2} label="Puestos" value={fmtN(rows.length)} />
        <Kpi icon={Vote} label="Total inscritos" value={fmtN(k.ins)} />
        <Kpi icon={UserCog} label="Coordinadores" value={fmtN(k.coord)} sub="personas distintas" color="#b45309" />
        <Kpi icon={Users} label="Líderes" value={fmtN(k.lid)} sub="personas distintas" color="#1d4ed8" />
        <Kpi icon={Target} label="Votos proyectados" value={fmtN(k.proy)} sub={`${k.conProy} puestos con proyección`} color="#047857" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card title="Asignación de puestos (según Excel)">
          <div className="p-4 space-y-2.5">
            {ESTADO_ORDEN.map(id => {
              const n = k.est[id]; const pct = rows.length ? (n / rows.length) * 100 : 0;
              return (
                <div key={id}>
                  <div className="flex justify-between text-xs mb-0.5"><span className="flex items-center gap-1.5 text-slate-600"><span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: ESTADOS[id].color }} />{ESTADOS[id].label}</span><b className="text-slate-800">{n}</b></div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden"><div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: ESTADOS[id].color }} /></div>
                </div>
              );
            })}
          </div>
        </Card>
        <Card title="Inscritos y votos proyectados por localidad">
          <div className="h-60 p-2 lg:col-span-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={porLocalidad}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="corta" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={v => v >= 1000 ? `${Math.round(v / 1000)}k` : v} />
                <Tooltip formatter={(v) => fmtN(v)} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="inscritos" name="Inscritos" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="proyectado" name="Votos proyectados" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card title={`Referidos por (${referentes.length})`}>
          <div className="p-3 space-y-2 max-h-60 overflow-y-auto">
            {referentes.length === 0 && <div className="text-xs text-slate-400">Sin referentes en el Excel.</div>}
            {referentes.map(([ref, ns]) => (
              <div key={ref} className="text-xs">
                <div className="flex justify-between"><b className="text-violet-700">{ref}</b><span className="text-slate-500">{ns.length} persona{ns.length > 1 ? 's' : ''}</span></div>
                <div className="text-slate-500">{ns.join(', ')}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card title="Resumen por localidad">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-100 text-slate-500 uppercase text-[10px]"><tr>
              <th className="py-2 px-3 text-left">Localidad</th><th className="px-3 text-right">Puestos</th><th className="px-3 text-right">Inscritos</th>
              <th className="px-3 text-right">Puestos con coordinador</th><th className="px-3 text-right">Puestos con líderes</th>
              <th className="px-3 text-right">Coordinadores</th><th className="px-3 text-right">Líderes</th><th className="px-3 text-right">Votos proyectados</th>
            </tr></thead>
            <tbody className="divide-y divide-slate-100">
              {porLocalidad.map(x => (
                <tr key={x.localidad}>
                  <td className="py-2 px-3 font-semibold text-slate-700">{x.localidad}</td><td className="px-3 text-right">{x.puestos}</td><td className="px-3 text-right">{fmtN(x.inscritos)}</td>
                  <td className="px-3 text-right">{x.conCoord}</td><td className="px-3 text-right">{x.conLid}</td>
                  <td className="px-3 text-right">{x.nCoord}</td><td className="px-3 text-right">{x.nLid}</td><td className="px-3 text-right font-bold text-emerald-700">{fmtN(x.proyectado)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-50 font-bold text-slate-800"><tr>
              <td className="py-2 px-3">Total Cartagena</td><td className="px-3 text-right">{rows.length}</td><td className="px-3 text-right">{fmtN(k.ins)}</td>
              <td className="px-3 text-right">{porLocalidad.reduce((a, x) => a + x.conCoord, 0)}</td><td className="px-3 text-right">{porLocalidad.reduce((a, x) => a + x.conLid, 0)}</td>
              <td className="px-3 text-right">{k.coord}</td><td className="px-3 text-right">{k.lid}</td><td className="px-3 text-right text-emerald-700">{fmtN(k.proy)}</td>
            </tr></tfoot>
          </table>
        </div>
      </Card>

      <Card title={`Personas (${personasFilt.length})`} right={
        <div className="flex items-center gap-2">
          <select value={rolF} onChange={e => setRolF(e.target.value)} className="text-xs border border-slate-200 rounded-lg px-2 py-1.5">
            <option value="todos">Todos</option><option value="Coordinador">Coordinadores</option><option value="Líder">Líderes</option>
          </select>
          <div className="relative"><Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" /><input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar persona o referente…" className="text-xs border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 w-52 focus:outline-none focus:border-blue-500" /></div>
        </div>}>
        <div className="max-h-[50vh] overflow-y-auto">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-slate-100 text-slate-500 uppercase text-[10px]"><tr>
              <th className="py-2 px-3 text-left">Nombre</th><th className="px-3 text-left">Rol</th><th className="px-3 text-left">Referido por</th><th className="px-3 text-left">Puestos asignados</th>
            </tr></thead>
            <tbody className="divide-y divide-slate-100">
              {personasFilt.map(p => (
                <tr key={p.nombre} className="align-top">
                  <td className="py-1.5 px-3 font-semibold text-slate-800">{p.nombre}</td>
                  <td className="py-1.5 px-3 text-slate-600">{p.roles}</td>
                  <td className="py-1.5 px-3 text-violet-700">{p.referentes || '—'}</td>
                  <td className="py-1.5 px-3">
                    <div className="flex flex-wrap gap-1">
                      {p.puestos.map((x, i) => (
                        <button key={i} onClick={() => onEdit(x.id)} className="text-[10px] bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-600 rounded px-1.5 py-0.5" title={x.rol}>
                          {x.id} · {x.nombre}
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {SIN_PUESTO.length > 0 && (
        <Card title="Registrados en el Excel sin puesto">
          <div className="p-4 text-xs text-slate-600 space-y-1">
            {SIN_PUESTO.map((p, i) => <div key={i}><b>{p.nombre}</b> · {p.rol} · hoja {p.hoja} (fila sin nombre de puesto)</div>)}
          </div>
        </Card>
      )}

      <Card title="Puestos con votos proyectados">
        <div className="max-h-72 overflow-y-auto">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-slate-100 text-slate-500 uppercase text-[10px]"><tr>
              <th className="py-2 px-3 text-left">Puesto</th><th className="px-3 text-right">Inscritos</th><th className="px-3 text-right">Votos proyectados</th><th />
            </tr></thead>
            <tbody className="divide-y divide-slate-100">
              {rows.filter(r => r.proyectado != null).sort((a, b) => b.proyectado - a.proyectado).map(r => (
                <tr key={r.puesto_id}>
                  <td className="py-1.5 px-3 text-slate-700"><span className="font-mono text-slate-400 mr-1">{r.puesto_id}</span>{r.nombre}</td>
                  <td className="px-3 text-right">{fmtN(r.inscritos)}</td>
                  <td className="px-3 text-right font-bold text-emerald-700">{fmtN(r.proyectado)}</td>
                  <td className="px-3 text-right"><button onClick={() => onEdit(r.puesto_id)} className="p-1 text-slate-400 hover:text-blue-600"><Eye className="w-4 h-4" /></button></td>
                </tr>
              ))}
              {k.conProy === 0 && <tr><td colSpan={4} className="py-6 text-center text-slate-400">Aún no registras votos proyectados. Hazlo desde el mapa (clic en un puesto) o en “Gestión”.</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
