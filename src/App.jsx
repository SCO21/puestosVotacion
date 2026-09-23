import React, { useState, useMemo, useEffect } from 'react';
import defaultResultados from './data/resultados_oficiales.json';
import { extractUniqueCandidates } from './utils/electionAnalytics';
import { useLocalStorage } from './hooks/useLocalStorage';
import { EstructuraProvider, useEstructura, LOCALIDADES, ESTADOS, ESTADO_ORDEN } from './hooks/useEstructura';

import { LoginGate } from './components/LoginGate';
import { TopBar } from './components/TopBar';
import { ColombiaMap } from './components/ColombiaMap';
import { StatsPanel } from './components/StatsPanel';
import { DetailModal } from './components/DetailModal';
import { ModuleCampaign } from './components/ModuleCampaign';
import { ModuleDebate } from './components/ModuleDebate';
import { StructureMapView, COLOR_BY } from './components/estructura/StructureMapView';
import { StructureStats } from './components/estructura/StructureStats';
import { StructureTable } from './components/estructura/StructureTable';
import { PuestoEstructuraModal } from './components/estructura/PuestoEstructuraModal';
import { Map as MapIcon, BarChart3, AlertTriangle, Table2, Network } from 'lucide-react';

const DEBATES = [
  { id: 'terr2023', label: 'Territoriales 2023', sub: 'Concejo · Alcaldía · Asamblea', hasData: true },
  { id: 'congreso2026', label: 'Congreso 2026', sub: 'Cámara y Senado', hasData: false },
  { id: 'pres2026_v1', label: 'Presidencia 2026 · 1ª vuelta', hasData: false },
  { id: 'pres2026_v2', label: 'Presidencia 2026 · 2ª vuelta', hasData: false },
];
const MAX_COMPARE = 3;

export function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => sessionStorage.getItem('cartagena_electoral_auth') === 'true');
  const handleAuthenticated = () => { sessionStorage.setItem('cartagena_electoral_auth', 'true'); setIsAuthenticated(true); };
  const handleLogout = () => { sessionStorage.removeItem('cartagena_electoral_auth'); setIsAuthenticated(false); };
  if (!isAuthenticated) return <LoginGate onAuthenticated={handleAuthenticated} />;
  return <EstructuraProvider><Portal onLogout={handleLogout} /></EstructuraProvider>;
}

function Portal({ onLogout }) {
  const { resumen } = useEstructura();
  const [resultadosPuestos] = useState(defaultResultados);

  const [debate, setDebate] = useState('terr2023');
  const [activeModule, setActiveModule] = useState('consulta');
  const [module1View, setModule1View] = useState('mapa');
  const [modo, setModo] = useLocalStorage('portal_modo', 'resultados');       // 'resultados' | 'estructura'
  const [colorByRaw, setColorBy] = useLocalStorage('estructura_colorby', 'estado');
  const colorBy = COLOR_BY.some(c => c.id === colorByRaw) ? colorByRaw : 'estado';
  const [locFilter, setLocFilter] = useState('TODAS');
  const [estadoFilter, setEstadoFilter] = useState('TODOS');
  const [editPuesto, setEditPuesto] = useState(null);
  const esEstructura = modo === 'estructura';

  useEffect(() => { if (!esEstructura && module1View === 'gestion') setModule1View('mapa'); }, [esEstructura, module1View]);

  const activeDebate = DEBATES.find(d => d.id === debate) || DEBATES[0];

  // BD única de puestos; los resultados dependen del debate (por ahora solo Territoriales 2023 tiene datos)
  const debatePuestos = useMemo(() => (
    activeDebate.hasData ? resultadosPuestos : resultadosPuestos.map(p => ({ ...p, resultados: [], votos_totales_puesto: 0 }))
  ), [activeDebate, resultadosPuestos]);

  // Candidatos SCOPED al debate seleccionado
  const allCandidates = useMemo(() => extractUniqueCandidates(debatePuestos), [debatePuestos]);
  const [compareCandidates, setCompareCandidates] = useState([]);
  const targetCandidate = compareCandidates[0] || '';
  const toggleCandidate = (cand) => setCompareCandidates(prev =>
    prev.includes(cand) ? prev.filter(c => c !== cand) : (prev.length >= MAX_COMPARE ? prev : [...prev, cand]));
  const removeCandidate = (cand) => setCompareCandidates(prev => prev.filter(c => c !== cand));
  useEffect(() => {
    const totals = new Map();
    debatePuestos.forEach(p => (p.resultados || []).forEach(r => {
      if (r.candidato_o_lista) totals.set(r.candidato_o_lista, (totals.get(r.candidato_o_lista) || 0) + (r.votos || 0));
    }));
    setCompareCandidates([...totals.entries()].sort((a, b) => b[1] - a[1]).slice(0, MAX_COMPARE).map(e => e[0]));
  }, [debate]); // eslint-disable-line react-hooks/exhaustive-deps

  const [cargoFilter, setCargoFilter] = useState('TODOS');
  const [searchQuery, setSearchQuery] = useState('');
  const [focusedPuesto, setFocusedPuesto] = useState(null);
  const [selectedPuestoForModal, setSelectedPuestoForModal] = useState(null);

  const allCargos = useMemo(() => [...new Set(resultadosPuestos.map(p => p.cargo).filter(Boolean))], [resultadosPuestos]);
  const maxVotesGlobal = useMemo(() => Math.max(...debatePuestos.map(p => p.votos_totales_puesto || 0), 100), [debatePuestos]);

  const matchSearch = (p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return p.nombre_puesto?.toLowerCase().includes(q) || p.direccion?.toLowerCase().includes(q) || p.puesto_id?.includes(q);
  };

  // Modo resultados
  const filteredPuestos = useMemo(() => debatePuestos.filter(p =>
    (cargoFilter === 'TODOS' || p.cargo === cargoFilter) && matchSearch(p)
  ), [debatePuestos, cargoFilter, searchQuery]); // eslint-disable-line react-hooks/exhaustive-deps

  // Modo estructura (independiente de candidatos y debate)
  const structPuestos = useMemo(() => resultadosPuestos.filter(p => {
    const r = resumen[p.puesto_id]; if (!r) return false;
    if (locFilter !== 'TODAS' && r.localidad !== locFilter) return false;
    if (estadoFilter !== 'TODOS' && r.estado !== estadoFilter) return false;
    return matchSearch(p);
  }), [resultadosPuestos, resumen, locFilter, estadoFilter, searchQuery]); // eslint-disable-line react-hooks/exhaustive-deps
  const structIds = useMemo(() => structPuestos.map(p => p.puesto_id), [structPuestos]);

  const handleSelectPuestoFromSearch = (p) => { setFocusedPuesto(p); setActiveModule('consulta'); setModule1View('mapa'); };

  const views = [
    { id: 'mapa', label: 'Mapa', icon: MapIcon },
    { id: 'estadisticas', label: 'Estadísticas', icon: BarChart3 },
    ...(esEstructura ? [{ id: 'gestion', label: 'Gestión', icon: Table2 }] : []),
  ];

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex flex-col font-sans">
      <TopBar
        debates={DEBATES} debate={debate} setDebate={setDebate}
        activeModule={activeModule} setActiveModule={setActiveModule}
        compareCandidates={compareCandidates} toggleCandidate={toggleCandidate} removeCandidate={removeCandidate}
        maxCompare={MAX_COMPARE} allCandidates={allCandidates}
        cargoFilter={cargoFilter} setCargoFilter={setCargoFilter} allCargos={allCargos}
        searchQuery={searchQuery} setSearchQuery={setSearchQuery}
        allPuestos={esEstructura ? resultadosPuestos : debatePuestos} onSelectPuestoFromSearch={handleSelectPuestoFromSearch}
        onLogout={onLogout}
        modo={modo} setModo={setModo} colorBy={colorBy} setColorBy={setColorBy} colorByOptions={COLOR_BY}
        locFilter={locFilter} setLocFilter={setLocFilter} localidades={LOCALIDADES}
        estadoFilter={estadoFilter} setEstadoFilter={setEstadoFilter} estados={ESTADO_ORDEN.map(id => ESTADOS[id])}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeModule === 'consulta' && (
          <div className="space-y-4 animate-fadeIn">
            {esEstructura ? (
              <div className="flex items-center gap-2 text-sm bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl px-4 py-2.5">
                <Network className="w-4 h-4 shrink-0" />
                <span><b>Evaluación de estructura:</b> inscritos, coordinadores y líderes por puesto según <i>PUESTOS X BARRIO.xlsx</i>. Haz clic en un puesto para registrar sus votos proyectados (se guardan en tu navegador).</span>
              </div>
            ) : !activeDebate.hasData && (
              <div className="flex items-center gap-2 text-sm bg-amber-50 border border-amber-200 text-amber-800 rounded-xl px-4 py-2.5">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                Este debate (<b>{activeDebate.label}</b>) aún no tiene datos cargados. Se muestra el mapa de puestos sin resultados.
              </div>
            )}

            <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1 w-max gov-shadow">
              {views.map(v => {
                const Icon = v.icon; const active = module1View === v.id;
                return (
                  <button key={v.id} onClick={() => setModule1View(v.id)}
                    className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${active ? (esEstructura ? 'bg-emerald-600' : 'bg-blue-600') + ' text-white shadow' : 'text-slate-500 hover:text-slate-800'}`}>
                    <Icon className="w-4 h-4" /> {v.label}
                  </button>
                );
              })}
            </div>

            {esEstructura ? (
              <>
                {module1View === 'mapa' && (
                  <ColombiaMap
                    puestos={structPuestos}
                    focusedPuesto={focusedPuesto}
                    hasDataFn={(p) => (resumen[p.puesto_id]?.personas.length || 0) > 0}
                    renderLeaf={(list) => <StructureMapView puestos={list} colorBy={colorBy} focusedPuesto={focusedPuesto} />}
                  />
                )}
                {module1View === 'estadisticas' && <StructureStats puestoIds={structIds} onEdit={setEditPuesto} />}
                {module1View === 'gestion' && <StructureTable puestoIds={structIds} onEdit={setEditPuesto} />}
              </>
            ) : (
              module1View === 'mapa' ? (
                <ColombiaMap
                  puestos={filteredPuestos}
                  compareCandidates={compareCandidates}
                  targetCandidate={targetCandidate}
                  maxVotesGlobal={maxVotesGlobal}
                  focusedPuesto={focusedPuesto}
                  onSelectPuesto={(p) => setSelectedPuestoForModal(p)}
                />
              ) : (
                <StatsPanel puestos={debatePuestos} compareCandidates={compareCandidates} />
              )
            )}
          </div>
        )}

        {activeModule === 'campana' && <ModuleCampaign puestos={resultadosPuestos} onEditPuesto={setEditPuesto} />}
        {activeModule === 'debate' && <ModuleDebate debateLabel={activeDebate.label} />}
      </main>

      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-400">
        Portal Electoral — Inteligencia y análisis por puesto de votación
      </footer>

      <DetailModal
        puesto={selectedPuestoForModal}
        targetCandidate={targetCandidate}
        compareCandidates={compareCandidates}
        onClose={() => setSelectedPuestoForModal(null)}
      />
      {editPuesto && <PuestoEstructuraModal puestoId={editPuesto} onClose={() => setEditPuesto(null)} />}
    </div>
  );
}

export default App;
