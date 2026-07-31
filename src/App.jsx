import React, { useState, useMemo, useEffect } from 'react';
import defaultResultados from './data/resultados_oficiales.json';
import defaultPlanillas from './data/planillas_campana.json';
import { extractUniqueCandidates } from './utils/electionAnalytics';

import { LoginGate } from './components/LoginGate';
import { TopBar } from './components/TopBar';
import { ColombiaMap } from './components/ColombiaMap';
import { StatsPanel } from './components/StatsPanel';
import { DetailModal } from './components/DetailModal';
import { ModuleCampaign } from './components/ModuleCampaign';
import { ModuleDebate } from './components/ModuleDebate';
import { Map as MapIcon, BarChart3, AlertTriangle } from 'lucide-react';

const DEBATES = [
  { id: 'terr2023', label: 'Territoriales 2023', sub: 'Concejo · Alcaldía · Asamblea', hasData: true },
  { id: 'congreso2026', label: 'Congreso 2026', sub: 'Cámara y Senado', hasData: false },
  { id: 'pres2026_v1', label: 'Presidencia 2026 · 1ª vuelta', hasData: false },
  { id: 'pres2026_v2', label: 'Presidencia 2026 · 2ª vuelta', hasData: false },
];
const MAX_COMPARE = 3;

export function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => sessionStorage.getItem('cartagena_electoral_auth') === 'true');

  const [resultadosPuestos] = useState(defaultResultados);
  const [planillasCampana] = useState(defaultPlanillas);

  const [debate, setDebate] = useState('terr2023');
  const [activeModule, setActiveModule] = useState('consulta');
  const [module1View, setModule1View] = useState('mapa');

  const activeDebate = DEBATES.find(d => d.id === debate) || DEBATES[0];

  // BD única de puestos; los resultados dependen del debate (por ahora solo Territoriales 2023 tiene datos)
  const debatePuestos = useMemo(() => (
    activeDebate.hasData ? resultadosPuestos : resultadosPuestos.map(p => ({ ...p, resultados: [], votos_totales_puesto: 0 }))
  ), [activeDebate, resultadosPuestos]);

  // Candidatos SCOPED al debate seleccionado (coherencia candidato ↔ debate)
  const allCandidates = useMemo(() => extractUniqueCandidates(debatePuestos), [debatePuestos]);
  const [compareCandidates, setCompareCandidates] = useState([]);
  const targetCandidate = compareCandidates[0] || '';

  const toggleCandidate = (cand) => setCompareCandidates(prev =>
    prev.includes(cand) ? prev.filter(c => c !== cand) : (prev.length >= MAX_COMPARE ? prev : [...prev, cand]));
  const removeCandidate = (cand) => setCompareCandidates(prev => prev.filter(c => c !== cand));

  // Al cambiar de debate, reinicia la selección con los más votados del debate (o vacío si no hay datos)
  useEffect(() => {
    const totals = new Map();
    debatePuestos.forEach(p => (p.resultados || []).forEach(r => {
      if (r.candidato_o_lista) totals.set(r.candidato_o_lista, (totals.get(r.candidato_o_lista) || 0) + (r.votos || 0));
    }));
    const top = [...totals.entries()].sort((a, b) => b[1] - a[1]).slice(0, MAX_COMPARE).map(e => e[0]);
    setCompareCandidates(top);
  }, [debate]); // eslint-disable-line react-hooks/exhaustive-deps

  const [cargoFilter, setCargoFilter] = useState('TODOS');
  const [searchQuery, setSearchQuery] = useState('');
  const [focusedPuesto, setFocusedPuesto] = useState(null);
  const [selectedPuestoForModal, setSelectedPuestoForModal] = useState(null);

  const allCargos = useMemo(() => {
    const set = new Set();
    resultadosPuestos.forEach(p => { if (p.cargo) set.add(p.cargo); });
    return Array.from(set);
  }, [resultadosPuestos]);

  const maxVotesGlobal = useMemo(() => Math.max(...debatePuestos.map(p => p.votos_totales_puesto || 0), 100), [debatePuestos]);

  const filteredPuestos = useMemo(() => debatePuestos.filter(p => {
    if (cargoFilter !== 'TODOS' && p.cargo !== cargoFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      if (!(p.nombre_puesto?.toLowerCase().includes(q) || p.direccion?.toLowerCase().includes(q))) return false;
    }
    return true;
  }), [debatePuestos, cargoFilter, searchQuery]);

  const handleSelectPuestoFromSearch = (p) => { setFocusedPuesto(p); setActiveModule('consulta'); setModule1View('mapa'); };
  const handleAuthenticated = () => { sessionStorage.setItem('cartagena_electoral_auth', 'true'); setIsAuthenticated(true); };
  const handleLogout = () => { sessionStorage.removeItem('cartagena_electoral_auth'); setIsAuthenticated(false); };

  if (!isAuthenticated) return <LoginGate onAuthenticated={handleAuthenticated} />;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex flex-col font-sans">
      <TopBar
        debates={DEBATES} debate={debate} setDebate={setDebate}
        activeModule={activeModule} setActiveModule={setActiveModule}
        compareCandidates={compareCandidates} toggleCandidate={toggleCandidate} removeCandidate={removeCandidate}
        maxCompare={MAX_COMPARE} allCandidates={allCandidates}
        cargoFilter={cargoFilter} setCargoFilter={setCargoFilter} allCargos={allCargos}
        searchQuery={searchQuery} setSearchQuery={setSearchQuery}
        allPuestos={debatePuestos} onSelectPuestoFromSearch={handleSelectPuestoFromSearch}
        onLogout={handleLogout}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeModule === 'consulta' && (
          <div className="space-y-4 animate-fadeIn">
            {!activeDebate.hasData && (
              <div className="flex items-center gap-2 text-sm bg-amber-50 border border-amber-200 text-amber-800 rounded-xl px-4 py-2.5">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                Este debate (<b>{activeDebate.label}</b>) aún no tiene datos cargados. Se muestra el mapa de puestos sin resultados.
              </div>
            )}

            <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1 w-max gov-shadow">
              {[{ id: 'mapa', label: 'Mapa', icon: MapIcon }, { id: 'estadisticas', label: 'Estadísticas', icon: BarChart3 }].map(v => {
                const Icon = v.icon; const active = module1View === v.id;
                return (
                  <button key={v.id} onClick={() => setModule1View(v.id)}
                    className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${active ? 'bg-blue-600 text-white shadow' : 'text-slate-500 hover:text-slate-800'}`}>
                    <Icon className="w-4 h-4" /> {v.label}
                  </button>
                );
              })}
            </div>

            {module1View === 'mapa' ? (
              <ColombiaMap
                puestos={filteredPuestos}
                compareCandidates={compareCandidates}
                targetCandidate={targetCandidate}
                planillas={planillasCampana}
                maxVotesGlobal={maxVotesGlobal}
                focusedPuesto={focusedPuesto}
                onSelectPuesto={(p) => setSelectedPuestoForModal(p)}
              />
            ) : (
              <StatsPanel puestos={debatePuestos} compareCandidates={compareCandidates} />
            )}
          </div>
        )}

        {activeModule === 'campana' && <ModuleCampaign puestos={debatePuestos} planillas={planillasCampana} />}
        {activeModule === 'debate' && <ModuleDebate debateLabel={activeDebate.label} />}
      </main>

      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-400">
        Portal Electoral — Inteligencia y análisis por puesto de votación
      </footer>

      <DetailModal
        puesto={selectedPuestoForModal}
        targetCandidate={targetCandidate}
        compareCandidates={compareCandidates}
        planillas={planillasCampana}
        onClose={() => setSelectedPuestoForModal(null)}
      />
    </div>
  );
}

export default App;
