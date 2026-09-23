import React, { useState, useMemo } from 'react';
import { useLocalStorage, uid } from '../hooks/useLocalStorage';
import { useEstructura, fmtN } from '../hooks/useEstructura';
import { CampaignCalendar } from './CampaignCalendar';
import { ProyeccionInput } from './estructura/ProyeccionInput';
import {
  CalendarDays, Users, Eye, Target, Plus, Pencil, Trash2, X, Search, CheckCircle2, Network, Vote
} from 'lucide-react';

const SUBS = [
  { id: 'agenda', label: 'Agenda', icon: CalendarDays },
  { id: 'puestos', label: 'Puestos', icon: Target },
  { id: 'lideres', label: 'Coordinadores y líderes', icon: Users },
  { id: 'testigos', label: 'Testigos', icon: Eye },
];

export const ModuleCampaign = ({ puestos = [], onEditPuesto }) => {
  const [sub, setSub] = useState('agenda');
  const est = useEstructura();
  const [testigos, setTestigos] = useLocalStorage('campaign_testigos', []);
  const puestoLabel = (id) => { const r = est.resumen[id]; return r ? `${r.nombre} (${id})` : (id || '—'); };
  const nombresUnicos = useMemo(() => [...new Set(est.personas.map(p => p.nombre).filter(Boolean))].sort().map(n => ({ nombre: n })), [est.personas]);

  return (
    <div className="space-y-4 animate-fadeIn">
      <div className="bg-white border border-slate-200 rounded-2xl p-5 gov-shadow flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center"><Users className="w-6 h-6" /></div>
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 font-heading">Organización de campaña</h2>
          <p className="text-sm text-slate-500 flex items-center gap-1.5"><Network className="w-3.5 h-3.5 text-emerald-600" /> Coordinadores y líderes según el Excel. Testigos, agenda y votos proyectados se guardan en tu navegador.</p>
        </div>
      </div>

      <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1 w-max max-w-full gov-shadow overflow-x-auto">
        {SUBS.map(s => { const Icon = s.icon; const active = sub === s.id; return (
          <button key={s.id} onClick={() => setSub(s.id)} className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${active ? 'bg-blue-600 text-white shadow' : 'text-slate-500 hover:text-slate-800'}`}>
            <Icon className="w-4 h-4" /> {s.label}
          </button>
        ); })}
      </div>

      {sub === 'agenda' && <CampaignCalendar lideres={nombresUnicos} />}
      {sub === 'lideres' && <PersonasList est={est} puestoLabel={puestoLabel} onEditPuesto={onEditPuesto} />}
      {sub === 'testigos' && <TestigosCRUD testigos={testigos} setTestigos={setTestigos} puestos={puestos} puestoLabel={puestoLabel} />}
      {sub === 'puestos' && <PuestosOverview est={est} testigos={testigos} onEditPuesto={onEditPuesto} />}
    </div>
  );
};

// ---------------- Coordinadores y líderes (solo lectura, desde el Excel) ----------------
const PersonasList = ({ est, puestoLabel, onEditPuesto }) => {
  const [q, setQ] = useState('');
  const [rolF, setRolF] = useState('todos');
  const rows = est.personas.filter(p =>
    (rolF === 'todos' || p.rol === rolF) &&
    (!q.trim() || p.nombre.toLowerCase().includes(q.toLowerCase()) || p.referente.toLowerCase().includes(q.toLowerCase()) || puestoLabel(p.puestoId).toLowerCase().includes(q.toLowerCase()))
  );
  return (
    <div className="bg-white border border-slate-200 rounded-2xl gov-shadow overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 gap-2 flex-wrap">
        <div><h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Coordinadores y líderes ({rows.length})</h3><div className="text-[11px] text-slate-400">Fuente: PUESTOS X BARRIO.xlsx (solo lectura)</div></div>
        <div className="flex items-center gap-2">
          <select value={rolF} onChange={e => setRolF(e.target.value)} className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none">
            <option value="todos">Todos</option><option value="coordinador">Coordinadores</option><option value="lider">Líderes</option>
          </select>
          <div className="relative"><Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" /><input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar…" className="text-xs border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 w-44 focus:outline-none focus:border-blue-500" /></div>
        </div>
      </div>
      <div className="max-h-[62vh] overflow-y-auto">
        <table className="w-full text-left text-xs">
          <thead className="sticky top-0 bg-slate-100 text-slate-500 uppercase tracking-wider font-semibold">
            <tr><th className="py-2 px-3">Nombre</th><th className="py-2 px-3">Rol</th><th className="py-2 px-3">Referido por</th><th className="py-2 px-3">Puesto</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map(p => (
              <tr key={p.id} className="hover:bg-slate-50">
                <td className="py-1.5 px-3 font-semibold text-slate-800">{p.nombre}</td>
                <td className="py-1.5 px-3"><span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${p.rol === 'coordinador' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>{p.rol === 'coordinador' ? 'Coordinador' : 'Líder'}</span></td>
                <td className="py-1.5 px-3 text-violet-700">{p.referente || '—'}</td>
                <td className="py-1.5 px-3"><button onClick={() => onEditPuesto && onEditPuesto(p.puestoId)} className="text-slate-600 hover:text-blue-700 text-left">{puestoLabel(p.puestoId)}</button></td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={4} className="py-8 text-center text-slate-400">Sin resultados.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
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
          {rows.map(t => { const e = T_ESTADOS.find(x => x[0] === t.estado) || T_ESTADOS[0]; return (
            <tr key={t.id} className="hover:bg-slate-50">
              <td className="py-1.5 px-3"><div className="font-semibold text-slate-800">{t.nombre}</div><div className="text-[11px] text-slate-400 flex gap-2">{t.cedula && <span>CC {t.cedula}</span>}{t.telefono && <span>{t.telefono}</span>}</div></td>
              <td className="py-1.5 px-3 text-slate-500 truncate max-w-[200px]">{puestoLabel(t.puestoId)}</td>
              <td className="py-1.5 px-3 text-center text-slate-600">{t.mesa || '—'}</td>
              <td className="py-1.5 px-3"><select value={t.estado} onChange={ev => setEstado(t.id, ev.target.value)} className="text-[11px] font-bold rounded px-1.5 py-0.5 border" style={{ color: e[2], borderColor: e[2] + '55' }}>{T_ESTADOS.map(([id, lb]) => <option key={id} value={id}>{lb}</option>)}</select></td>
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

// ---------------- Puestos (equipo por puesto) ----------------
const PuestosOverview = ({ est, testigos, onEditPuesto }) => {
  const [soloEquipo, setSoloEquipo] = useState(false);
  const data = useMemo(() => Object.values(est.resumen).map(r => ({
    r, nTes: testigos.filter(t => t.puestoId === r.puesto_id).length,
  })).filter(x => !soloEquipo || x.r.personas.length || x.nTes).sort((a, b) => a.r.puesto_id.localeCompare(b.r.puesto_id)), [est.resumen, testigos, soloEquipo]);
  const totIns = Object.values(est.resumen).reduce((a, r) => a + (r.inscritos || 0), 0);
  const conTes = new Set(testigos.map(t => t.puestoId).filter(Boolean)).size;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi label="Total inscritos (Cartagena)" value={fmtN(totIns)} icon={Vote} />
        <Kpi label="Votos proyectados (Cartagena)" value={fmtN(est.totalProyectado)} accent="#047857" icon={Target} />
        <Kpi label="Coordinadores y líderes" value={fmtN(new Set(est.personas.map(p => p.nombre)).size)} accent="#1d4ed8" icon={Users} />
        <Kpi label="Puestos con testigo" value={`${conTes}/${Object.keys(est.resumen).length}`} icon={Eye} />
      </div>
      <div className="bg-white border border-slate-200 rounded-2xl gov-shadow overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
          <span className="text-sm font-bold text-slate-700 uppercase tracking-wider">Equipo por puesto</span>
          <label className="text-xs text-slate-600 flex items-center gap-2"><input type="checkbox" checked={soloEquipo} onChange={e => setSoloEquipo(e.target.checked)} /> Solo puestos con personas asignadas</label>
        </div>
        <div className="max-h-[58vh] overflow-y-auto">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 bg-slate-100 text-slate-500 uppercase font-semibold"><tr><th className="py-2 px-3">Puesto</th><th className="py-2 px-3">Coordinador(es)</th><th className="py-2 px-3 text-center">Líderes</th><th className="py-2 px-3 text-center">Testigos</th><th className="py-2 px-3 text-right">Inscritos</th><th className="py-2 px-3 text-right">Votos proyectados</th><th /></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {data.map(({ r, nTes }) => (
                <tr key={r.puesto_id} className="hover:bg-slate-50">
                  <td className="py-1.5 px-3"><div className="text-slate-700 max-w-[220px]">{r.nombre}</div><div className="text-[10px] font-mono text-slate-400">{r.puesto_id}</div></td>
                  <td className="py-1.5 px-3 text-slate-600">{r.coordinadores.map(c => c.nombre).join(', ') || '—'}</td>
                  <td className="py-1.5 px-3 text-center">{r.lideres.length}</td>
                  <td className="py-1.5 px-3 text-center">{nTes}</td>
                  <td className="py-1.5 px-3 text-right text-slate-600">{fmtN(r.inscritos)}</td>
                  <td className="py-1 px-3 w-32"><ProyeccionInput puestoId={r.puesto_id} className="text-xs py-1" /></td>
                  <td className="py-1.5 px-3 text-right">{onEditPuesto && <button onClick={() => onEditPuesto(r.puesto_id)} className="p-1.5 text-slate-400 hover:text-blue-600"><Eye className="w-4 h-4" /></button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ---------------- UI helpers ----------------
const Panel = ({ title, subtitle, onAdd, q, setQ, extra, children }) => (
  <div className="bg-white border border-slate-200 rounded-2xl gov-shadow overflow-hidden">
    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 gap-2 flex-wrap">
      <div><h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">{title}</h3>{subtitle && <div className="text-[11px] text-slate-400">{subtitle}</div>}</div>
      <div className="flex items-center gap-2">
        {extra}
        <div className="relative"><Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" /><input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar…" className="text-xs border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 w-44 focus:outline-none focus:border-blue-500" /></div>
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
