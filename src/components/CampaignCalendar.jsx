import React, { useState, useMemo } from 'react';
import { useLocalStorage, uid } from '../hooks/useLocalStorage';
import {
  ChevronLeft, ChevronRight, Plus, X, Trash2, CalendarDays, Search, Filter, Clock, MapPin, User, StickyNote, CheckCircle2, Copy
} from 'lucide-react';

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const DIAS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const TIPOS = [
  { id: 'reunion', label: 'Reunión con líderes', color: '#2563eb' },
  { id: 'capacitacion', label: 'Capacitación', color: '#16a34a' },
  { id: 'testigos', label: 'Testigos', color: '#9333ea' },
  { id: 'evento', label: 'Evento / acto', color: '#f59e0b' },
  { id: 'otro', label: 'Otro', color: '#64748b' },
];
const ESTADOS = [
  { id: 'pendiente', label: 'Pendiente', color: '#f59e0b' },
  { id: 'confirmada', label: 'Confirmada', color: '#2563eb' },
  { id: 'realizada', label: 'Realizada', color: '#16a34a' },
  { id: 'cancelada', label: 'Cancelada', color: '#94a3b8' },
];
const tipoColor = (id) => (TIPOS.find(t => t.id === id) || TIPOS[4]).color;
const estadoInfo = (id) => ESTADOS.find(e => e.id === id) || ESTADOS[0];
const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const parse = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const fmtLong = (d) => `${DIAS[(d.getDay() + 6) % 7]} ${d.getDate()} de ${MESES[d.getMonth()]} ${d.getFullYear()}`;

export const CampaignCalendar = ({ lideres = [] }) => {
  const [cursor, setCursor] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const [view, setView] = useState('mes'); // mes | semana | dia | agenda
  const [events, setEvents] = useLocalStorage('campaign_agenda_events', []);
  const [editing, setEditing] = useState(null);
  const [filterTipo, setFilterTipo] = useState('todos');
  const [query, setQuery] = useState('');
  const [dragId, setDragId] = useState(null);

  const today = new Date(); const todayIso = iso(today);
  const lidNames = lideres.map(l => l.nombre_lider || l.nombre).filter(Boolean);

  const visible = useMemo(() => events.filter(e =>
    (filterTipo === 'todos' || e.tipo === filterTipo) &&
    (!query.trim() || (e.title || '').toLowerCase().includes(query.toLowerCase()) || (e.lugar || '').toLowerCase().includes(query.toLowerCase()) || (e.lider || '').toLowerCase().includes(query.toLowerCase()))
  ), [events, filterTipo, query]);

  const byDay = useMemo(() => {
    const m = {}; visible.forEach(e => (m[e.date] = m[e.date] || []).push(e));
    Object.values(m).forEach(a => a.sort((x, y) => (x.time || '').localeCompare(y.time || ''))); return m;
  }, [visible]);

  const openNew = (date) => setEditing({ date: iso(date), time: '09:00', fin: '10:00', title: '', tipo: 'reunion', lider: '', lugar: '', notas: '', estado: 'pendiente' });
  const openEdit = (e) => setEditing({ ...e });
  const save = () => {
    if (!editing.title.trim()) return;
    setEvents(prev => editing.id ? prev.map(e => e.id === editing.id ? editing : e) : [...prev, { ...editing, id: uid() }]);
    setEditing(null);
  };
  const remove = (id) => { setEvents(prev => prev.filter(e => e.id !== id)); setEditing(null); };
  const duplicate = (e) => setEvents(prev => [...prev, { ...e, id: uid(), title: e.title + ' (copia)' }]);
  const moveTo = (id, date) => setEvents(prev => prev.map(e => e.id === id ? { ...e, date } : e));
  const setEstado = (id, estado) => setEvents(prev => prev.map(e => e.id === id ? { ...e, estado } : e));

  const title = view === 'dia' ? fmtLong(cursor)
    : view === 'semana' ? `Semana del ${weekStart(cursor).getDate()} de ${MESES[weekStart(cursor).getMonth()]}`
    : `${MESES[cursor.getMonth()]} ${cursor.getFullYear()}`;

  const step = (dir) => {
    if (view === 'dia') setCursor(c => new Date(c.getFullYear(), c.getMonth(), c.getDate() + dir));
    else if (view === 'semana') setCursor(c => new Date(c.getFullYear(), c.getMonth(), c.getDate() + dir * 7));
    else setCursor(c => new Date(c.getFullYear(), c.getMonth() + dir, 1));
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl gov-shadow overflow-hidden">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2 px-4 py-3 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center"><CalendarDays className="w-5 h-5" /></div>
          <h3 className="text-lg font-bold text-slate-800 font-heading capitalize">{title}</h3>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* filtro tipo */}
          <div className="relative">
            <Filter className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-2" />
            <select value={filterTipo} onChange={e => setFilterTipo(e.target.value)} className="text-xs border border-slate-200 rounded-lg pl-7 pr-2 py-1.5 focus:outline-none focus:border-blue-500">
              <option value="todos">Todos los tipos</option>
              {TIPOS.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
            </select>
          </div>
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-2" />
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar…" className="text-xs border border-slate-200 rounded-lg pl-7 pr-2 py-1.5 w-32 focus:outline-none focus:border-blue-500" />
          </div>
          {/* vistas */}
          <div className="flex items-center bg-slate-100 rounded-lg p-0.5">
            {[['mes', 'Mes'], ['semana', 'Semana'], ['dia', 'Día'], ['agenda', 'Agenda']].map(([id, lb]) => (
              <button key={id} onClick={() => setView(id)} className={`text-xs font-semibold px-2.5 py-1 rounded-md ${view === id ? 'bg-white shadow text-blue-700' : 'text-slate-500'}`}>{lb}</button>
            ))}
          </div>
          <button onClick={() => setCursor(new Date())} className="text-xs font-semibold text-slate-600 border border-slate-200 rounded-lg px-3 py-1.5 hover:bg-slate-50">Hoy</button>
          <button onClick={() => step(-1)} className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50"><ChevronLeft className="w-4 h-4 text-slate-600" /></button>
          <button onClick={() => step(1)} className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50"><ChevronRight className="w-4 h-4 text-slate-600" /></button>
          <button onClick={() => openNew(view === 'mes' ? today : cursor)} className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg px-3 py-1.5"><Plus className="w-3.5 h-3.5" /> Evento</button>
        </div>
      </div>

      {view === 'mes' && <MonthView cursor={cursor} byDay={byDay} todayIso={todayIso} onDay={(d) => { setCursor(d); setView('dia'); }} onNew={openNew} onEdit={openEdit} dragId={dragId} setDragId={setDragId} moveTo={moveTo} />}
      {view === 'semana' && <WeekView cursor={cursor} byDay={byDay} todayIso={todayIso} onNew={openNew} onEdit={openEdit} dragId={dragId} setDragId={setDragId} moveTo={moveTo} />}
      {view === 'dia' && <DayView cursor={cursor} events={byDay[iso(cursor)] || []} onNew={openNew} onEdit={openEdit} onEstado={setEstado} onDup={duplicate} />}
      {view === 'agenda' && <AgendaView byDay={byDay} onEdit={openEdit} onEstado={setEstado} />}

      {/* Leyenda */}
      <div className="flex flex-wrap gap-3 px-4 py-2.5 border-t border-slate-100 bg-slate-50/50">
        {TIPOS.map(t => <span key={t.id} className="flex items-center gap-1.5 text-[11px] text-slate-500"><span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: t.color }} /> {t.label}</span>)}
        <span className="ml-auto text-[11px] text-slate-400">Arrastra un evento para reprogramarlo · clic en el número del día para abrirlo</span>
      </div>

      {editing && <EventModal editing={editing} setEditing={setEditing} save={save} remove={remove} lidNames={lidNames} />}
    </div>
  );
};

// ---- Vistas ----
function weekStart(d) { const off = (d.getDay() + 6) % 7; return new Date(d.getFullYear(), d.getMonth(), d.getDate() - off); }

const EventChip = ({ e, onEdit, setDragId }) => (
  <div draggable onDragStart={(ev) => { setDragId(e.id); ev.dataTransfer.effectAllowed = 'move'; }} onDragEnd={() => setDragId(null)}
    onClick={(ev) => { ev.stopPropagation(); onEdit(e); }}
    className={`text-[10px] font-medium text-white rounded px-1.5 py-0.5 truncate cursor-pointer flex items-center gap-1 ${e.estado === 'cancelada' ? 'line-through opacity-60' : ''}`}
    style={{ backgroundColor: tipoColor(e.tipo) }}>
    {e.time && <span className="opacity-80">{e.time}</span>} {e.title}
  </div>
);

const MonthView = ({ cursor, byDay, todayIso, onDay, onNew, onEdit, dragId, setDragId, moveTo }) => {
  const year = cursor.getFullYear(), month = cursor.getMonth();
  const start = weekStart(new Date(year, month, 1));
  const grid = Array.from({ length: 42 }, (_, i) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + i));
  return (
    <>
      <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/60">{DIAS.map(d => <div key={d} className="py-2 text-center text-[11px] font-bold uppercase text-slate-400">{d}</div>)}</div>
      <div className="grid grid-cols-7">
        {grid.map((d, i) => {
          const dIso = iso(d);
          return (
            <div key={i} onDragOver={(ev) => ev.preventDefault()} onDrop={() => { if (dragId) moveTo(dragId, dIso); setDragId(null); }}
              className={`min-h-[104px] border-b border-r border-slate-100 p-1.5 transition-colors group ${d.getMonth() === month ? 'bg-white hover:bg-blue-50/40' : 'bg-slate-50/40'} ${i % 7 === 6 ? 'border-r-0' : ''}`}
              onClick={() => onNew(d)}>
              <div className="flex items-center justify-between">
                <button onClick={(ev) => { ev.stopPropagation(); onDay(d); }} className={`text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full hover:ring-2 hover:ring-blue-300 ${dIso === todayIso ? 'bg-blue-600 text-white' : d.getMonth() === month ? 'text-slate-600' : 'text-slate-300'}`}>{d.getDate()}</button>
                <Plus className="w-3.5 h-3.5 text-slate-300 opacity-0 group-hover:opacity-100" />
              </div>
              <div className="mt-1 space-y-1">
                {(byDay[dIso] || []).slice(0, 3).map(e => <EventChip key={e.id} e={e} onEdit={onEdit} setDragId={setDragId} />)}
                {(byDay[dIso] || []).length > 3 && <button onClick={(ev) => { ev.stopPropagation(); onDay(d); }} className="text-[10px] text-blue-600 pl-1 hover:underline">+{(byDay[dIso] || []).length - 3} más</button>}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
};

const WeekView = ({ cursor, byDay, todayIso, onNew, onEdit, dragId, setDragId, moveTo }) => {
  const start = weekStart(cursor);
  const days = Array.from({ length: 7 }, (_, i) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + i));
  return (
    <div className="grid grid-cols-7 min-h-[420px]">
      {days.map((d, i) => {
        const dIso = iso(d);
        return (
          <div key={i} onDragOver={ev => ev.preventDefault()} onDrop={() => { if (dragId) moveTo(dragId, dIso); setDragId(null); }}
            className={`border-r border-slate-100 last:border-r-0 p-2 ${dIso === todayIso ? 'bg-blue-50/40' : ''}`} onClick={() => onNew(d)}>
            <div className="text-center mb-2">
              <div className="text-[10px] uppercase text-slate-400 font-bold">{DIAS[i]}</div>
              <div className={`text-sm font-bold ${dIso === todayIso ? 'text-blue-700' : 'text-slate-700'}`}>{d.getDate()}</div>
            </div>
            <div className="space-y-1">{(byDay[dIso] || []).map(e => <EventChip key={e.id} e={e} onEdit={onEdit} setDragId={setDragId} />)}</div>
          </div>
        );
      })}
    </div>
  );
};

const DayView = ({ cursor, events, onNew, onEdit, onEstado, onDup }) => (
  <div className="p-4">
    <div className="flex items-center justify-between mb-3">
      <span className="text-sm text-slate-500">{events.length} eventos</span>
      <button onClick={() => onNew(cursor)} className="text-xs font-semibold text-blue-700 flex items-center gap-1 hover:underline"><Plus className="w-3.5 h-3.5" /> Agregar en este día</button>
    </div>
    {events.length === 0 && <div className="text-center text-slate-400 text-sm py-10">No hay eventos este día. Haz clic en “Agregar”.</div>}
    <div className="space-y-2">
      {events.map(e => {
        const est = estadoInfo(e.estado);
        return (
          <div key={e.id} className="flex items-stretch gap-3 border border-slate-200 rounded-xl p-3 hover:bg-slate-50">
            <div className="w-1.5 rounded-full" style={{ backgroundColor: tipoColor(e.tipo) }} />
            <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onEdit(e)}>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-800 truncate">{e.title}</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ color: est.color, backgroundColor: est.color + '20' }}>{est.label}</span>
              </div>
              <div className="text-xs text-slate-500 flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                {e.time && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{e.time}{e.fin ? `–${e.fin}` : ''}</span>}
                {e.lugar && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{e.lugar}</span>}
                {e.lider && <span className="flex items-center gap-1"><User className="w-3 h-3" />{e.lider}</span>}
                {e.notas && <span className="flex items-center gap-1"><StickyNote className="w-3 h-3" />{e.notas}</span>}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <select value={e.estado} onChange={ev => onEstado(e.id, ev.target.value)} className="text-[11px] border border-slate-200 rounded-md px-1.5 py-1 focus:outline-none">
                {ESTADOS.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
              <button onClick={() => onDup(e)} title="Duplicar" className="p-1.5 text-slate-400 hover:text-blue-600"><Copy className="w-4 h-4" /></button>
            </div>
          </div>
        );
      })}
    </div>
  </div>
);

const AgendaView = ({ byDay, onEdit, onEstado }) => {
  const dates = Object.keys(byDay).filter(d => byDay[d].length).sort();
  const upcoming = dates.filter(d => d >= iso(new Date()));
  const show = (upcoming.length ? upcoming : dates);
  return (
    <div className="p-4 max-h-[560px] overflow-y-auto">
      {show.length === 0 && <div className="text-center text-slate-400 text-sm py-10">Sin eventos programados.</div>}
      {show.map(d => (
        <div key={d} className="mb-4">
          <div className="text-xs font-bold text-slate-500 uppercase mb-1.5">{fmtLong(parse(d))}</div>
          <div className="space-y-1.5">
            {byDay[d].map(e => {
              const est = estadoInfo(e.estado);
              return (
                <div key={e.id} onClick={() => onEdit(e)} className="flex items-center gap-3 border border-slate-200 rounded-lg p-2.5 hover:bg-slate-50 cursor-pointer">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: tipoColor(e.tipo) }} />
                  <span className="text-xs text-slate-500 w-16 shrink-0">{e.time || '—'}</span>
                  <span className="text-sm font-medium text-slate-800 truncate flex-1">{e.title}</span>
                  {e.lider && <span className="text-xs text-slate-400 truncate hidden sm:block">{e.lider}</span>}
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0" style={{ color: est.color, backgroundColor: est.color + '20' }}>{est.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

const EventModal = ({ editing, setEditing, save, remove, lidNames }) => (
  <div className="fixed inset-0 z-[2100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setEditing(null)}>
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fadeIn" onClick={e => e.stopPropagation()}>
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
        <h4 className="font-bold text-slate-800">{editing.id ? 'Editar evento' : 'Nuevo evento'}</h4>
        <button onClick={() => setEditing(null)} className="text-slate-400 hover:text-slate-700"><X className="w-5 h-5" /></button>
      </div>
      <div className="p-5 space-y-3 max-h-[70vh] overflow-y-auto">
        <input autoFocus value={editing.title} onChange={e => setEditing({ ...editing, title: e.target.value })} placeholder="Título del evento" className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500" />
        <div className="grid grid-cols-3 gap-3">
          <label className="text-xs text-slate-500">Fecha<input type="date" value={editing.date} onChange={e => setEditing({ ...editing, date: e.target.value })} className="mt-1 w-full text-sm border border-slate-300 rounded-lg px-2 py-2 focus:outline-none focus:border-blue-500" /></label>
          <label className="text-xs text-slate-500">Inicio<input type="time" value={editing.time} onChange={e => setEditing({ ...editing, time: e.target.value })} className="mt-1 w-full text-sm border border-slate-300 rounded-lg px-2 py-2 focus:outline-none focus:border-blue-500" /></label>
          <label className="text-xs text-slate-500">Fin<input type="time" value={editing.fin} onChange={e => setEditing({ ...editing, fin: e.target.value })} className="mt-1 w-full text-sm border border-slate-300 rounded-lg px-2 py-2 focus:outline-none focus:border-blue-500" /></label>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <label className="text-xs text-slate-500">Tipo<select value={editing.tipo} onChange={e => setEditing({ ...editing, tipo: e.target.value })} className="mt-1 w-full text-sm border border-slate-300 rounded-lg px-2 py-2 focus:outline-none focus:border-blue-500">{TIPOS.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}</select></label>
          <label className="text-xs text-slate-500">Estado<select value={editing.estado} onChange={e => setEditing({ ...editing, estado: e.target.value })} className="mt-1 w-full text-sm border border-slate-300 rounded-lg px-2 py-2 focus:outline-none focus:border-blue-500">{ESTADOS.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}</select></label>
        </div>
        <label className="text-xs text-slate-500 block">Líder<select value={editing.lider} onChange={e => setEditing({ ...editing, lider: e.target.value })} className="mt-1 w-full text-sm border border-slate-300 rounded-lg px-2 py-2 focus:outline-none focus:border-blue-500"><option value="">—</option>{lidNames.map(n => <option key={n} value={n}>{n}</option>)}</select></label>
        <label className="text-xs text-slate-500 block">Lugar<input value={editing.lugar} onChange={e => setEditing({ ...editing, lugar: e.target.value })} placeholder="Lugar / puesto" className="mt-1 w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500" /></label>
        <label className="text-xs text-slate-500 block">Notas<textarea value={editing.notas} onChange={e => setEditing({ ...editing, notas: e.target.value })} rows={2} placeholder="Notas / objetivo" className="mt-1 w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500" /></label>
      </div>
      <div className="flex items-center justify-between px-5 py-3 bg-slate-50 border-t border-slate-100">
        {editing.id ? <button onClick={() => remove(editing.id)} className="flex items-center gap-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700"><Trash2 className="w-4 h-4" /> Eliminar</button> : <span />}
        <div className="flex gap-2">
          <button onClick={() => setEditing(null)} className="text-xs font-semibold text-slate-600 px-3 py-2 rounded-lg hover:bg-slate-100">Cancelar</button>
          <button onClick={save} className="text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4" /> Guardar</button>
        </div>
      </div>
    </div>
  </div>
);
