import React, { useState, useMemo } from 'react';
import { useLocalStorage, uid } from '../hooks/useLocalStorage';
import { CampaignCalendar } from './CampaignCalendar';
import {
  CalendarDays, Users, Eye, ShieldCheck, Target, Plus, Pencil, Trash2, X, Search,
  TrendingDown, CheckCircle2, Phone, MapPin
} from 'lucide-react';

const SUBS = [
  { id: 'agenda', label: 'Agenda', icon: CalendarDays },
  { id: 'puestos', label: 'Puestos', icon: Target },
  { id: 'lideres', label: 'Líderes', icon: Users },
  { id: 'testigos', label: 'Testigos', icon: Eye },
  { id: 'confiab', label: 'Confiabilidad', icon: ShieldCheck },
];

// Variables de confiabilidad (demo) y pesos por defecto
const VARS = [
  { id: 'cumplimiento', label: 'Cumplimiento histórico', type: 'pct', peso: 0.30, help: '% de votos entregados vs. prometidos en elecciones previas' },
  { id: 'reuniones', label: 'Asistencia a reuniones', type: 'pct', peso: 0.20, help: '% de reuniones/capacitaciones a las que asistió' },
  { id: 'verificado', label: 'Identidad verificada', type: 'bool', peso: 0.15, help: 'Cédula y datos verificados' },
  { id: 'entregaListado', label: 'Entregó listado de votantes', type: 'bool', peso: 0.10, help: 'Entregó su base de votantes comprometidos' },
  { id: 'experiencia', label: 'Experiencia (0–5)', type: 'exp', peso: 0.10, help: 'Nº de campañas previas (0 a 5)' },
  { id: 'referido', label: 'Referido de confianza', type: 'bool', peso: 0.15, help: 'Avalado por alguien de confianza del equipo' },
];
const scoreDe = (l, pesos) => {
  const v = l.vars || {};
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
const scoreColor = (s) => s >= 75 ? '#16a34a' : s >= 50 ? '#f59e0b' : '#ef4444';

export const ModuleCampaign = ({ puestos = [], planillas = [] }) => {
  const [sub, setSub] = useState('agenda');
  const [lideres, setLideres] = useLocalStorage('campaign_lideres', () =>
    planillas.map(p => ({
      id: uid(), nombre: p.nombre_lider, cedula: '', telefono: '', puestoId: p.puesto_asignado_id,
      activistas: p.num_activistas || 0, votosEsperados: (p.num_activistas || 0) * 3,
      vars: { cumplimiento: 70, reuniones: 60, verificado: false, entregaListado: false, experiencia: 1, referido: false },
    }))
  );
  const [testigos, setTestigos] = useLocalStorage('campaign_testigos', []);
  const [pesos, setPesos] = useLocalStorage('campaign_pesos', Object.fromEntries(VARS.map(v => [v.id, v.peso])));

  const puestoLabel = (id) => { const p = puestos.find(x => x.puesto_id === id); return p ? `${p.nombre_puesto} (${id})` : (id || '—'); };

  return (
    <div className="space-y-4 animate-fadeIn">
      <div className="bg-white border border-slate-200 rounded-2xl p-5 gov-shadow flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center"><Users className="w-6 h-6" /></div>
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 font-heading">Organización de campaña</h2>
          <p className="text-sm text-slate-500">Agenda, líderes, testigos y confiabilidad. Todo se guarda en tu navegador.</p>
        </div>
      </div>

      <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1 w-max gov-shadow overflow-x-auto">
        {SUBS.map(s => { const Icon = s.icon; const active = sub === s.id; return (
          <button key={s.id} onClick={() => setSub(s.id)} className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${active ? 'bg-blue-600 text-white shadow' : 'text-slate-500 hover:text-slate-800'}`}>
            <Icon className="w-4 h-4" /> {s.label}
          </button>
        ); })}
      </div>

      {sub === 'agenda' && <CampaignCalendar lideres={lideres} />}
      {sub === 'lideres' && <LideresCRUD lideres={lideres} setLideres={setLideres} puestos={puestos} pesos={pesos} puestoLabel={puestoLabel} />}
      {sub === 'testigos' && <TestigosCRUD testigos={testigos} setTestigos={setTestigos} puestos={puestos} puestoLabel={puestoLabel} />}
      {sub === 'puestos' && <PuestosOverview puestos={puestos} lideres={lideres} testigos={testigos} pesos={pesos} />}
      {sub === 'confiab' && <ConfiabilidadView lideres={lideres} pesos={pesos} setPesos={setPesos} puestoLabel={puestoLabel} />}
    </div>
  );
};

// ---------------- Líderes CRUD ----------------
const emptyLider = () => ({ nombre: '', cedula: '', telefono: '', puestoId: '', activistas: 0, votosEsperados: 0, vars: { cumplimiento: 70, reuniones: 60, verificado: false, entregaListado: false, experiencia: 1, referido: false } });

const LideresCRUD = ({ lideres, setLideres, puestos, pesos, puestoLabel }) => {
  const [edit, setEdit] = useState(null);
  const [q, setQ] = useState('');
  const rows = lideres.filter(l => !q.trim() || (l.nombre || '').toLowerCase().includes(q.toLowerCase()));
  const save = () => { if (!edit.nombre.trim()) return; setLideres(prev => edit.id ? prev.map(l => l.id === edit.id ? edit : l) : [...prev, { ...edit, id: uid() }]); setEdit(null); };
  const del = (id) => setLideres(prev => prev.filter(l => l.id !== id));

  return (
    <Panel title={`Líderes (${lideres.length})`} onAdd={() => setEdit(emptyLider())} q={q} setQ={setQ}>
      <table className="w-full text-left text-xs">
        <thead className="sticky top-0 bg-slate-100 text-slate-500 uppercase tracking-wider font-semibold">
          <tr><th className="py-2 px-3">Líder</th><th className="py-2 px-3">Puesto</th><th className="py-2 px-3 text-center">Activistas</th><th className="py-2 px-3 text-right">Votos esperados</th><th className="py-2 px-3 text-center">Confiabilidad</th><th className="py-2 px-3"></th></tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map(l => { const s = scoreDe(l, pesos); return (
            <tr key={l.id} className="hover:bg-slate-50">
              <td className="py-1.5 px-3"><div className="font-semibold text-slate-800">{l.nombre}</div><div className="text-[11px] text-slate-400 flex gap-2">{l.cedula && <span>CC {l.cedula}</span>}{l.telefono && <span className="flex items-center gap-0.5"><Phone className="w-3 h-3" />{l.telefono}</span>}</div></td>
              <td className="py-1.5 px-3 text-slate-500 truncate max-w-[200px]">{puestoLabel(l.puestoId)}</td>
              <td className="py-1.5 px-3 text-center text-slate-600">{l.activistas}</td>
              <td className="py-1.5 px-3 text-right font-semibold text-slate-800">{(Number(l.votosEsperados) || 0).toLocaleString()}</td>
              <td className="py-1.5 px-3 text-center"><span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ color: scoreColor(s), backgroundColor: scoreColor(s) + '20' }}>{s}%</span></td>
              <td className="py-1.5 px-3 text-right whitespace-nowrap">
                <button onClick={() => setEdit({ ...l })} className="p-1.5 text-slate-400 hover:text-blue-600"><Pencil className="w-4 h-4" /></button>
                <button onClick={() => del(l.id)} className="p-1.5 text-slate-400 hover:text-rose-600"><Trash2 className="w-4 h-4" /></button>
              </td>
            </tr>
          ); })}
          {rows.length === 0 && <tr><td colSpan={6} className="py-8 text-center text-slate-400">Sin líderes. Agrega el primero.</td></tr>}
        </tbody>
      </table>
      {edit && (
        <Modal title={edit.id ? 'Editar líder' : 'Nuevo líder'} onClose={() => setEdit(null)} onSave={save} onDelete={edit.id ? () => { del(edit.id); setEdit(null); } : null}>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Nombre"><input value={edit.nombre} onChange={e => setEdit({ ...edit, nombre: e.target.value })} className="inp" /></Field>
            <Field label="Cédula"><input value={edit.cedula} onChange={e => setEdit({ ...edit, cedula: e.target.value })} className="inp" /></Field>
            <Field label="Teléfono"><input value={edit.telefono} onChange={e => setEdit({ ...edit, telefono: e.target.value })} className="inp" /></Field>
            <Field label="Puesto"><select value={edit.puestoId} onChange={e => setEdit({ ...edit, puestoId: e.target.value })} className="inp"><option value="">—</option>{puestos.map(p => <option key={p.puesto_id} value={p.puesto_id}>{p.nombre_puesto} ({p.puesto_id})</option>)}</select></Field>
            <Field label="Activistas"><input type="number" min="0" value={edit.activistas} onChange={e => setEdit({ ...edit, activistas: e.target.value })} className="inp" /></Field>
            <Field label="Votos esperados"><input type="number" min="0" value={edit.votosEsperados} onChange={e => setEdit({ ...edit, votosEsperados: e.target.value })} className="inp" /></Field>
          </div>
          <div className="mt-2 pt-3 border-t border-slate-100">
            <div className="text-xs font-bold text-slate-600 uppercase mb-2">Variables de confiabilidad</div>
            <div className="grid grid-cols-2 gap-3">
              {VARS.map(vr => (
                <Field key={vr.id} label={vr.label} help={vr.help}>
                  {vr.type === 'pct' && <input type="number" min="0" max="100" value={edit.vars[vr.id]} onChange={e => setEdit({ ...edit, vars: { ...edit.vars, [vr.id]: e.target.value } })} className="inp" />}
                  {vr.type === 'exp' && <input type="number" min="0" max="5" value={edit.vars[vr.id]} onChange={e => setEdit({ ...edit, vars: { ...edit.vars, [vr.id]: e.target.value } })} className="inp" />}
                  {vr.type === 'bool' && <label className="flex items-center gap-2 text-sm text-slate-600 mt-1"><input type="checkbox" checked={!!edit.vars[vr.id]} onChange={e => setEdit({ ...edit, vars: { ...edit.vars, [vr.id]: e.target.checked } })} /> Sí</label>}
                </Field>
              ))}
            </div>
            <div className="mt-2 text-xs text-slate-500">Confiabilidad estimada: <b style={{ color: scoreColor(scoreDe(edit, pesos)) }}>{scoreDe(edit, pesos)}%</b></div>
          </div>
        </Modal>
      )}
    </Panel>
  );
};

// ---------------- Testigos CRUD ----------------
const emptyTestigo = () => ({ nombre: '', cedula: '', telefono: '', puestoId: '', mesa: '', estado: 'asignado' });
const T_ESTADOS = [['asignado', 'Asignado', '#f59e0b'], ['confirmado', 'Confirmado', '#2563eb'], ['presente', 'Presente en puesto', '#16a34a'], ['ausente', 'Ausente', '#ef4444']];

const TestigosCRUD = ({ testigos, setTestigos, puestos, puestoLabel }) => {
  const [edit, setEdit] = useState(null);
  const [q, setQ] = useState('');
  const rows = testigos.filter(t => !q.trim() || (t.nombre || '').toLowerCase().includes(q.toLowerCase()));
  const save = () => { if (!edit.nombre.trim()) return; setTestigos(prev => edit.id ? prev.map(t => t.id === edit.id ? edit : t) : [...prev, { ...edit, id: uid() }]); setEdit(null); };
  const del = (id) => setTestigos(prev => prev.filter(t => t.id !== id));
  const setEstado = (id, estado) => setTestigos(prev => prev.map(t => t.id === id ? { ...t, estado } : t));
  const cov = new Set(testigos.map(t => t.puestoId).filter(Boolean));

  return (
    <Panel title={`Testigos (${testigos.length})`} onAdd={() => setEdit(emptyTestigo())} q={q} setQ={setQ}
      subtitle={`${cov.size} puestos con testigo · ${puestos.length - cov.size} sin cubrir`}>
      <table className="w-full text-left text-xs">
        <thead className="sticky top-0 bg-slate-100 text-slate-500 uppercase tracking-wider font-semibold">
          <tr><th className="py-2 px-3">Testigo</th><th className="py-2 px-3">Puesto</th><th className="py-2 px-3 text-center">Mesa</th><th className="py-2 px-3">Estado</th><th className="py-2 px-3"></th></tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map(t => { const est = T_ESTADOS.find(e => e[0] === t.estado) || T_ESTADOS[0]; return (
            <tr key={t.id} className="hover:bg-slate-50">
              <td className="py-1.5 px-3"><div className="font-semibold text-slate-800">{t.nombre}</div><div className="text-[11px] text-slate-400 flex gap-2">{t.cedula && <span>CC {t.cedula}</span>}{t.telefono && <span>{t.telefono}</span>}</div></td>
              <td className="py-1.5 px-3 text-slate-500 truncate max-w-[200px]">{puestoLabel(t.puestoId)}</td>
              <td className="py-1.5 px-3 text-center text-slate-600">{t.mesa || '—'}</td>
              <td className="py-1.5 px-3"><select value={t.estado} onChange={e => setEstado(t.id, e.target.value)} className="text-[11px] font-bold rounded px-1.5 py-0.5 border" style={{ color: est[2], borderColor: est[2] + '55' }}>{T_ESTADOS.map(([id, lb]) => <option key={id} value={id}>{lb}</option>)}</select></td>
              <td className="py-1.5 px-3 text-right whitespace-nowrap">
                <button onClick={() => setEdit({ ...t })} className="p-1.5 text-slate-400 hover:text-blue-600"><Pencil className="w-4 h-4" /></button>
                <button onClick={() => del(t.id)} className="p-1.5 text-slate-400 hover:text-rose-600"><Trash2 className="w-4 h-4" /></button>
              </td>
            </tr>
          ); })}
          {rows.length === 0 && <tr><td colSpan={5} className="py-8 text-center text-slate-400">Sin testigos. Agrega el primero.</td></tr>}
        </tbody>
      </table>
      {edit && (
        <Modal title={edit.id ? 'Editar testigo' : 'Nuevo testigo'} onClose={() => setEdit(null)} onSave={save} onDelete={edit.id ? () => { del(edit.id); setEdit(null); } : null}>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Nombre"><input value={edit.nombre} onChange={e => setEdit({ ...edit, nombre: e.target.value })} className="inp" /></Field>
            <Field label="Cédula"><input value={edit.cedula} onChange={e => setEdit({ ...edit, cedula: e.target.value })} className="inp" /></Field>
            <Field label="Teléfono"><input value={edit.telefono} onChange={e => setEdit({ ...edit, telefono: e.target.value })} className="inp" /></Field>
            <Field label="Mesa"><input value={edit.mesa} onChange={e => setEdit({ ...edit, mesa: e.target.value })} className="inp" placeholder="Ej: 0001" /></Field>
            <Field label="Puesto"><select value={edit.puestoId} onChange={e => setEdit({ ...edit, puestoId: e.target.value })} className="inp"><option value="">—</option>{puestos.map(p => <option key={p.puesto_id} value={p.puesto_id}>{p.nombre_puesto} ({p.puesto_id})</option>)}</select></Field>
            <Field label="Estado"><select value={edit.estado} onChange={e => setEdit({ ...edit, estado: e.target.value })} className="inp">{T_ESTADOS.map(([id, lb]) => <option key={id} value={id}>{lb}</option>)}</select></Field>
          </div>
        </Modal>
      )}
    </Panel>
  );
};

// ---------------- Puestos overview ----------------
const PuestosOverview = ({ puestos, lideres, testigos, pesos }) => {
  const data = useMemo(() => puestos.map(p => {
    const ls = lideres.filter(l => l.puestoId === p.puesto_id);
    const ts = testigos.filter(t => t.puestoId === p.puesto_id);
    const meta = ls.reduce((s, l) => s + (Number(l.votosEsperados) || 0), 0);
    const proy = ls.reduce((s, l) => s + (Number(l.votosEsperados) || 0) * scoreDe(l, pesos) / 100, 0);
    return { p, nLid: ls.length, nTes: ts.length, meta, proy: Math.round(proy), historico: p.votos_totales_puesto || 0 };
  }).filter(x => x.nLid || x.nTes).sort((a, b) => b.meta - a.meta), [puestos, lideres, testigos, pesos]);

  const tot = data.reduce((a, x) => ({ meta: a.meta + x.meta, proy: a.proy + x.proy }), { meta: 0, proy: 0 });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi label="Puestos con equipo" value={data.length} />
        <Kpi label="Meta total" value={tot.meta.toLocaleString()} />
        <Kpi label="Proyección (con castigo)" value={tot.proy.toLocaleString()} accent="#2563eb" />
        <Kpi label="Castigo total" value={(tot.meta - tot.proy).toLocaleString()} accent="#ef4444" />
      </div>
      <div className="bg-white border border-slate-200 rounded-2xl gov-shadow overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 text-sm font-bold text-slate-700 uppercase tracking-wider">Cobertura por puesto</div>
        <div className="max-h-[58vh] overflow-y-auto">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 bg-slate-100 text-slate-500 uppercase font-semibold"><tr><th className="py-2 px-3">Puesto</th><th className="py-2 px-3 text-center">Líderes</th><th className="py-2 px-3 text-center">Testigos</th><th className="py-2 px-3 text-right">Meta</th><th className="py-2 px-3 text-right">Proyección</th><th className="py-2 px-3 text-right">Histórico</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {data.map(x => (
                <tr key={x.p.puesto_id} className="hover:bg-slate-50">
                  <td className="py-1.5 px-3"><div className="text-slate-700 truncate max-w-[220px]">{x.p.nombre_puesto}</div><div className="text-[10px] font-mono text-slate-400">{x.p.puesto_id}</div></td>
                  <td className="py-1.5 px-3 text-center text-slate-600">{x.nLid}</td>
                  <td className="py-1.5 px-3 text-center"><span className={x.nTes ? 'text-emerald-600 font-semibold' : 'text-rose-500'}>{x.nTes || 'sin testigo'}</span></td>
                  <td className="py-1.5 px-3 text-right font-semibold text-slate-800">{x.meta.toLocaleString()}</td>
                  <td className="py-1.5 px-3 text-right font-semibold text-blue-600">{x.proy.toLocaleString()}</td>
                  <td className="py-1.5 px-3 text-right text-slate-400">{x.historico.toLocaleString()}</td>
                </tr>
              ))}
              {data.length === 0 && <tr><td colSpan={6} className="py-8 text-center text-slate-400">Aún no hay líderes ni testigos asignados a puestos.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ---------------- Confiabilidad ----------------
const ConfiabilidadView = ({ lideres, pesos, setPesos, puestoLabel }) => {
  const rows = useMemo(() => lideres.map(l => {
    const s = scoreDe(l, pesos); const esperado = Number(l.votosEsperados) || 0;
    const proy = Math.round(esperado * s / 100);
    return { l, s, esperado, proy, castigo: esperado - proy };
  }).sort((a, b) => a.s - b.s), [lideres, pesos]);
  const tot = rows.reduce((a, r) => ({ esp: a.esp + r.esperado, proy: a.proy + r.proy }), { esp: 0, proy: 0 });
  const sumaPesos = Object.values(pesos).reduce((a, b) => a + Number(b), 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi label="Líderes" value={rows.length} />
        <Kpi label="Votos esperados" value={tot.esp.toLocaleString()} />
        <Kpi label="Proyección ajustada" value={tot.proy.toLocaleString()} accent="#2563eb" />
        <Kpi label="Castigo total" value={(tot.esp - tot.proy).toLocaleString()} accent="#ef4444" icon={TrendingDown} />
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl gov-shadow p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Pesos del modelo (demo)</h3>
          <span className={`text-xs ${Math.abs(sumaPesos - 1) < 0.001 ? 'text-slate-400' : 'text-amber-600 font-semibold'}`}>Suma: {(sumaPesos * 100).toFixed(0)}%</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {VARS.map(vr => (
            <div key={vr.id}>
              <div className="flex items-center justify-between text-xs mb-1"><span className="text-slate-600">{vr.label}</span><span className="font-bold text-slate-800">{Math.round((pesos[vr.id] ?? vr.peso) * 100)}%</span></div>
              <input type="range" min="0" max="60" value={Math.round((pesos[vr.id] ?? vr.peso) * 100)} onChange={e => setPesos({ ...pesos, [vr.id]: Number(e.target.value) / 100 })} className="w-full accent-blue-600" />
            </div>
          ))}
        </div>
        <p className="text-[11px] text-slate-400 mt-2">Fórmula: proyección = votos esperados × (confiabilidad/100). El “castigo” es la diferencia. Modelo de demostración con variables ejemplo.</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl gov-shadow overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 text-sm font-bold text-slate-700 uppercase tracking-wider">Castigo por líder</div>
        <div className="max-h-[52vh] overflow-y-auto">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 bg-slate-100 text-slate-500 uppercase font-semibold"><tr><th className="py-2 px-3">Líder</th><th className="py-2 px-3">Puesto</th><th className="py-2 px-3 text-center">Confiabilidad</th><th className="py-2 px-3 text-right">Esperados</th><th className="py-2 px-3 text-right">Proyección</th><th className="py-2 px-3 text-right">Castigo</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map(r => (
                <tr key={r.l.id} className="hover:bg-slate-50">
                  <td className="py-1.5 px-3 font-semibold text-slate-800">{r.l.nombre}</td>
                  <td className="py-1.5 px-3 text-slate-500 truncate max-w-[180px]">{puestoLabel(r.l.puestoId)}</td>
                  <td className="py-1.5 px-3 text-center">
                    <div className="inline-flex items-center gap-1.5">
                      <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden"><div className="h-full rounded-full" style={{ width: `${r.s}%`, backgroundColor: scoreColor(r.s) }} /></div>
                      <span className="font-bold" style={{ color: scoreColor(r.s) }}>{r.s}%</span>
                    </div>
                  </td>
                  <td className="py-1.5 px-3 text-right text-slate-600">{r.esperado.toLocaleString()}</td>
                  <td className="py-1.5 px-3 text-right font-semibold text-blue-600">{r.proy.toLocaleString()}</td>
                  <td className="py-1.5 px-3 text-right font-semibold text-rose-500">−{r.castigo.toLocaleString()}</td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan={6} className="py-8 text-center text-slate-400">Agrega líderes para ver el cálculo.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ---------------- UI helpers ----------------
const Panel = ({ title, subtitle, onAdd, q, setQ, children }) => (
  <div className="bg-white border border-slate-200 rounded-2xl gov-shadow overflow-hidden">
    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 gap-2">
      <div><h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">{title}</h3>{subtitle && <div className="text-[11px] text-slate-400">{subtitle}</div>}</div>
      <div className="flex items-center gap-2">
        <div className="relative"><Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" /><input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar…" className="text-xs border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 w-40 focus:outline-none focus:border-blue-500" /></div>
        <button onClick={onAdd} className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg px-3 py-1.5"><Plus className="w-3.5 h-3.5" /> Agregar</button>
      </div>
    </div>
    <div className="max-h-[62vh] overflow-y-auto">{children}</div>
  </div>
);

const Field = ({ label, help, children }) => (
  <label className="text-xs text-slate-500 block">
    {label}{help && <span className="block text-[10px] text-slate-400 font-normal">{help}</span>}
    <div className="mt-1">{children}</div>
  </label>
);

const Kpi = ({ label, value, accent = '#0f172a', icon: Icon }) => (
  <div className="bg-white border border-slate-200 rounded-2xl p-4 gov-shadow">
    <div className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1">{Icon && <Icon className="w-3.5 h-3.5" />}{label}</div>
    <div className="text-2xl font-extrabold mt-0.5" style={{ color: accent }}>{value}</div>
  </div>
);

const Modal = ({ title, onClose, onSave, onDelete, children }) => (
  <div className="fixed inset-0 z-[2100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-fadeIn" onClick={e => e.stopPropagation()}>
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100"><h4 className="font-bold text-slate-800">{title}</h4><button onClick={onClose} className="text-slate-400 hover:text-slate-700"><X className="w-5 h-5" /></button></div>
      <div className="p-5 space-y-3 max-h-[72vh] overflow-y-auto">{children}</div>
      <div className="flex items-center justify-between px-5 py-3 bg-slate-50 border-t border-slate-100">
        {onDelete ? <button onClick={onDelete} className="flex items-center gap-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700"><Trash2 className="w-4 h-4" /> Eliminar</button> : <span />}
        <div className="flex gap-2"><button onClick={onClose} className="text-xs font-semibold text-slate-600 px-3 py-2 rounded-lg hover:bg-slate-100">Cancelar</button><button onClick={onSave} className="text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4" /> Guardar</button></div>
      </div>
    </div>
  </div>
);
