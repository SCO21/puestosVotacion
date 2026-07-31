import React, { useState, useRef, useEffect } from 'react';
import {
  Search, Upload, LogOut, MapPin, X, ChevronDown, Target,
  Landmark, Map as MapIcon, Users, BarChart3, Vote
} from 'lucide-react';
import { colorForCandidate } from '../utils/electionAnalytics';

const MODULES = [
  { id: 'consulta', label: 'Consulta rápida', icon: MapIcon },
  { id: 'campana', label: 'Organización de campaña', icon: Users },
  { id: 'debate', label: 'Resultados del debate', icon: Vote },
];

export const TopBar = ({
  debates = [], debate, setDebate,
  activeModule, setActiveModule,
  // controles del módulo 1
  compareCandidates = [], toggleCandidate, removeCandidate, maxCompare = 3, allCandidates = [],
  cargoFilter, setCargoFilter, allCargos = [],
  searchQuery, setSearchQuery, allPuestos = [], onSelectPuestoFromSearch,
  onOpenUploader, onLogout,
}) => {
  const [debOpen, setDebOpen] = useState(false);
  const [candOpen, setCandOpen] = useState(false);
  const [candQuery, setCandQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const debRef = useRef(null); const candRef = useRef(null); const searchRef = useRef(null);
  const candFull = compareCandidates.length >= maxCompare;
  const activeDebate = debates.find(d => d.id === debate) || debates[0] || { label: '—' };

  const candResults = React.useMemo(() => {
    const q = candQuery.trim().toLowerCase();
    return allCandidates.filter(c => !q || c.toLowerCase().includes(q)).slice(0, 60);
  }, [candQuery, allCandidates]);

  const searchResults = React.useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return allPuestos.filter(p =>
      p.nombre_puesto?.toLowerCase().includes(q) ||
      (p.direccion && p.direccion.toLowerCase().includes(q)) ||
      (p.puesto_id && p.puesto_id.toLowerCase().includes(q))
    ).slice(0, 8);
  }, [searchQuery, allPuestos]);

  useEffect(() => {
    const h = (e) => {
      if (debRef.current && !debRef.current.contains(e.target)) setDebOpen(false);
      if (candRef.current && !candRef.current.contains(e.target)) setCandOpen(false);
      if (searchRef.current && !searchRef.current.contains(e.target)) setIsSearchFocused(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50 gov-shadow">
      {/* Franja superior institucional */}
      <div className="bg-gradient-to-r from-blue-800 to-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-white/15 ring-1 ring-white/30 flex items-center justify-center shrink-0">
              <Landmark className="w-5 h-5 text-white" />
            </div>
            <div className="leading-tight min-w-0">
              <div className="font-extrabold tracking-tight font-heading text-[15px] truncate">PORTAL ELECTORAL</div>
              <div className="text-[11px] text-blue-100/90 truncate">Resultados y análisis por puesto de votación</div>
            </div>
          </div>

          {/* Selector de debate / elección */}
          <div ref={debRef} className="relative">
            <button
              onClick={() => setDebOpen(o => !o)}
              className="flex items-center gap-2 bg-white text-blue-800 font-bold text-sm rounded-full pl-4 pr-3 py-2 shadow-sm hover:shadow transition-all"
            >
              <span className="truncate max-w-[46vw] sm:max-w-none">{activeDebate.label}</span>
              <ChevronDown className="w-4 h-4" />
            </button>
            {debOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-white text-slate-800 border border-slate-200 rounded-xl shadow-xl overflow-hidden z-[120] animate-fadeIn">
                <div className="px-3 py-2 text-[10px] uppercase font-bold text-slate-400 border-b border-slate-100">Elección / Debate</div>
                {debates.map(d => (
                  <button key={d.id} onClick={() => { setDebate(d.id); setDebOpen(false); }}
                    className={`w-full text-left px-3 py-2.5 text-sm flex items-center justify-between hover:bg-slate-50 ${d.id === debate ? 'bg-blue-50' : ''}`}>
                    <span className="flex flex-col">
                      <span className={`font-semibold ${d.id === debate ? 'text-blue-700' : 'text-slate-700'}`}>{d.label}</span>
                      {d.sub && <span className="text-[11px] text-slate-400">{d.sub}</span>}
                    </span>
                    {!d.hasData && <span className="text-[9px] uppercase font-bold text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded">sin datos</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="hidden sm:flex items-center gap-2 shrink-0">
            <button onClick={onLogout} title="Cerrar sesión"
              className="p-2 hover:bg-white/15 rounded-lg transition-all"><LogOut className="w-4 h-4" /></button>
          </div>
        </div>
      </div>

      {/* Módulos */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex items-center gap-1 overflow-x-auto">
          {MODULES.map(m => {
            const Icon = m.icon; const active = activeModule === m.id;
            return (
              <button key={m.id} onClick={() => setActiveModule(m.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
                  active ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}>
                <Icon className="w-4 h-4" /> {m.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Controles del Módulo 1 */}
      {activeModule === 'consulta' && (
        <div className="border-t border-slate-100 bg-slate-50/70">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 grid grid-cols-1 md:grid-cols-12 gap-2.5 items-center">
            {/* Buscador */}
            <div ref={searchRef} className="md:col-span-5 relative">
              <div className="relative">
                <input value={searchQuery}
                  onFocus={() => setIsSearchFocused(true)}
                  onChange={(e) => { setSearchQuery(e.target.value); setIsSearchFocused(true); }}
                  onKeyDown={(e) => { if (e.key === 'Enter' && searchResults.length) { onSelectPuestoFromSearch(searchResults[0]); setSearchQuery(searchResults[0].nombre_puesto); setIsSearchFocused(false); } }}
                  placeholder="Buscar puesto (nombre, dirección o código)…"
                  className="w-full bg-white border border-slate-300 text-slate-800 text-sm rounded-lg pl-9 pr-8 py-2 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                {searchQuery && <button onClick={() => { setSearchQuery(''); setIsSearchFocused(false); }} className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-700"><X className="w-4 h-4" /></button>}
              </div>
              {isSearchFocused && searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden z-[100] max-h-72 overflow-y-auto animate-fadeIn">
                  {searchResults.map(p => (
                    <button key={p.puesto_id} onClick={() => { onSelectPuestoFromSearch(p); setSearchQuery(p.nombre_puesto); setIsSearchFocused(false); }}
                      className="w-full text-left px-3 py-2.5 hover:bg-slate-50 border-b border-slate-100 last:border-0 flex items-start gap-2.5">
                      <MapPin className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                      <div className="truncate">
                        <div className="text-sm font-semibold text-slate-800 truncate">{p.nombre_puesto}</div>
                        <div className="text-[11px] text-slate-500 truncate"><span className="text-blue-600 font-semibold">Zona {p.puesto_id?.split('-')[0]} · Puesto {p.puesto_id?.split('-')[1]}</span> — {p.direccion}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Comparador de candidatos */}
            <div ref={candRef} className="md:col-span-4 relative">
              <button onClick={() => setCandOpen(o => !o)}
                className="w-full min-h-[38px] bg-white border border-slate-300 rounded-lg px-2 py-1 flex items-center gap-1.5 flex-wrap focus:outline-none focus:border-blue-500">
                {compareCandidates.length === 0 && <span className="text-sm text-slate-400 px-1 flex items-center gap-1.5"><Target className="w-3.5 h-3.5 text-blue-500" /> Comparar candidatos…</span>}
                {compareCandidates.map((cand, i) => (
                  <span key={cand} className="flex items-center gap-1 text-[11px] font-bold text-white rounded-md pl-1.5 pr-1 py-0.5 max-w-[120px]" style={{ backgroundColor: colorForCandidate(cand, i) }}>
                    <span className="truncate">{cand.split(' ').slice(0, 2).join(' ')}</span>
                    <span role="button" onClick={(e) => { e.stopPropagation(); removeCandidate(cand); }} className="hover:opacity-70"><X className="w-3 h-3" /></span>
                  </span>
                ))}
                <ChevronDown className="w-4 h-4 text-slate-400 ml-auto" />
              </button>
              {candOpen && (
                <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden z-[120] animate-fadeIn">
                  <div className="p-2 border-b border-slate-100">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                      <input autoFocus value={candQuery} onChange={e => setCandQuery(e.target.value)} placeholder="Buscar candidato…"
                        className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-lg pl-8 pr-3 py-1.5 focus:outline-none focus:border-blue-500" />
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1 px-0.5">{compareCandidates.length}/{maxCompare} seleccionados {candFull && <span className="text-amber-600">— quita uno para agregar</span>}</div>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {candResults.length === 0 && <div className="px-3 py-3 text-xs text-slate-400">Sin resultados</div>}
                    {candResults.map(cand => {
                      const selIdx = compareCandidates.indexOf(cand); const selected = selIdx !== -1; const disabled = !selected && candFull;
                      return (
                        <button key={cand} disabled={disabled} onClick={() => toggleCandidate(cand)}
                          className={`w-full text-left px-3 py-2 text-xs flex items-center gap-2 border-b border-slate-50 last:border-0 ${selected ? 'bg-slate-50' : disabled ? 'opacity-40 cursor-not-allowed' : 'hover:bg-slate-50'}`}>
                          <span className="w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0" style={{ borderColor: selected ? colorForCandidate(cand, selIdx) : '#cbd5e1', backgroundColor: selected ? colorForCandidate(cand, selIdx) : 'transparent' }}>
                            {selected && <span className="w-1.5 h-1.5 bg-white rounded-sm" />}
                          </span>
                          <span className={`truncate ${selected ? 'text-slate-900 font-semibold' : 'text-slate-600'}`}>{cand}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Corporación */}
            <div className="md:col-span-3 relative">
              <select value={cargoFilter} onChange={(e) => setCargoFilter(e.target.value)}
                className="w-full bg-white border border-slate-300 text-slate-700 text-sm font-medium rounded-lg px-3 py-2 pr-8 appearance-none focus:outline-none focus:border-blue-500 cursor-pointer">
                <option value="TODOS">Corporaciones (todas)</option>
                {allCargos.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
