import React, { useState, useMemo, useEffect, useRef } from 'react';
import defaultResultados from './data/resultados_oficiales.json';
import defaultPlanillas from './data/planillas_campana.json';
import { extractUniqueCandidates } from './utils/electionAnalytics';

import { LoginGate } from './components/LoginGate';
import { Navbar } from './components/Navbar';
import { MapView } from './components/MapView';
import { DashboardStats } from './components/DashboardStats';
import { CandidateRanking } from './components/CandidateRanking';
import { CampaignAudit } from './components/CampaignAudit';
import { DataUploader } from './components/DataUploader';
import { DetailModal } from './components/DetailModal';

export function App() {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return sessionStorage.getItem('cartagena_electoral_auth') === 'true';
  });

  // Core Datasets State
  const [resultadosPuestos, setResultadosPuestos] = useState(defaultResultados);
  const [planillasCampana, setPlanillasCampana] = useState(defaultPlanillas);

  // Dynamic Candidate & Filter Selection
  const allCandidates = useMemo(() => extractUniqueCandidates(resultadosPuestos), [resultadosPuestos]);

  // Comparación de hasta 3 candidatos
  const MAX_COMPARE = 3;
  const [compareCandidates, setCompareCandidates] = useState([]);

  // El "candidato principal" es el primero seleccionado (compatibilidad con paneles existentes)
  const targetCandidate = compareCandidates[0] || '';

  const toggleCandidate = (cand) => {
    setCompareCandidates(prev => {
      if (prev.includes(cand)) return prev.filter(c => c !== cand);
      if (prev.length >= MAX_COMPARE) return prev; // límite de 3
      return [...prev, cand];
    });
  };
  const removeCandidate = (cand) => setCompareCandidates(prev => prev.filter(c => c !== cand));

  // Seleccionar 3 candidatos por defecto (los más votados) SOLO una vez al cargar.
  // Si el usuario borra todos, la selección queda vacía = "comparar todos" (vista general).
  const didInitCandidates = useRef(false);
  useEffect(() => {
    if (!didInitCandidates.current && allCandidates.length > 0) {
      didInitCandidates.current = true;
      const totals = new Map();
      resultadosPuestos.forEach(p => (p.resultados || []).forEach(r => {
        if (r.candidato_o_lista) {
          totals.set(r.candidato_o_lista, (totals.get(r.candidato_o_lista) || 0) + (r.votos || 0));
        }
      }));
      const top = [...totals.entries()].sort((a, b) => b[1] - a[1]).slice(0, MAX_COMPARE).map(e => e[0]);
      setCompareCandidates(top.length ? top : allCandidates.slice(0, MAX_COMPARE));
    }
  }, [allCandidates, resultadosPuestos]);

  // Filters State & Interactive Map Locator
  const [cargoFilter, setCargoFilter] = useState('TODOS');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('map'); // 'map' | 'audit'
  const [focusedPuesto, setFocusedPuesto] = useState(null); // Post selected from search bar to fly/center map

  // Modals State
  const [selectedPuestoForModal, setSelectedPuestoForModal] = useState(null);
  const [isUploaderOpen, setIsUploaderOpen] = useState(false);

  // Extract unique cargos for dropdown filter
  const allCargos = useMemo(() => {
    const set = new Set();
    resultadosPuestos.forEach(p => {
      if (p.cargo) set.add(p.cargo);
    });
    return Array.from(set);
  }, [resultadosPuestos]);

  // Compute maximum total votes across all posts for radius normalization
  const maxVotesGlobal = useMemo(() => {
    return Math.max(...resultadosPuestos.map(p => p.votos_totales_puesto || 0), 10000);
  }, [resultadosPuestos]);

  // Filtered dataset using useMemo
  const filteredPuestos = useMemo(() => {
    return resultadosPuestos.filter(p => {
      // Cargo filter
      if (cargoFilter !== 'TODOS' && p.cargo !== cargoFilter) {
        return false;
      }
      // Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = p.nombre_puesto?.toLowerCase().includes(query);
        const matchesAddress = p.direccion?.toLowerCase().includes(query);
        if (!matchesName && !matchesAddress) return false;
      }
      return true;
    });
  }, [resultadosPuestos, cargoFilter, searchQuery]);

  const handleSelectPuestoFromSearch = (puesto) => {
    setFocusedPuesto(puesto);
    setActiveTab('map');
  };

  const handleAuthenticated = () => {
    sessionStorage.setItem('cartagena_electoral_auth', 'true');
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('cartagena_electoral_auth');
    setIsAuthenticated(false);
  };

  const handleResetDefaultData = () => {
    setResultadosPuestos(defaultResultados);
    setPlanillasCampana(defaultPlanillas);
  };

  // If not authenticated, render password protection gate
  if (!isAuthenticated) {
    return <LoginGate onAuthenticated={handleAuthenticated} />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      
      {/* Top Bar Navigation with Interactive Search Locator */}
      <Navbar
        compareCandidates={compareCandidates}
        toggleCandidate={toggleCandidate}
        removeCandidate={removeCandidate}
        maxCompare={MAX_COMPARE}
        allCandidates={allCandidates}
        cargoFilter={cargoFilter}
        setCargoFilter={setCargoFilter}
        allCargos={allCargos}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        allPuestos={resultadosPuestos}
        onSelectPuestoFromSearch={handleSelectPuestoFromSearch}
        onOpenUploader={() => setIsUploaderOpen(true)}
        onLogout={handleLogout}
      />

      {/* Main View Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {activeTab === 'map' ? (
          <div className="space-y-6 animate-fadeIn">
            {/* KPI Cards Header */}
            <DashboardStats
              puestos={filteredPuestos}
              targetCandidate={targetCandidate}
            />

            {/* Core Interactive Leaflet Map with Smooth Fly-To Locator */}
            <MapView
              puestos={filteredPuestos}
              compareCandidates={compareCandidates}
              targetCandidate={targetCandidate}
              planillas={planillasCampana}
              maxVotesGlobal={maxVotesGlobal}
              focusedPuesto={focusedPuesto}
              onSelectPuesto={(puesto) => setSelectedPuestoForModal(puesto)}
            />

            {/* Visual Recharts Charts */}
            <CandidateRanking
              puestos={filteredPuestos}
              targetCandidate={targetCandidate}
            />
          </div>
        ) : (
          <div className="animate-fadeIn">
            {/* Campaign Activistas Audit View */}
            <CampaignAudit
              puestos={resultadosPuestos}
              planillas={planillasCampana}
              targetCandidate={targetCandidate}
            />
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 py-4 text-center text-xs text-slate-500">
        <p>Cartagena Electoral SPA &copy; 2026 — Inteligencia Política y Cartográfica Privada</p>
      </footer>

      {/* Modals */}
      <DetailModal
        puesto={selectedPuestoForModal}
        targetCandidate={targetCandidate}
        planillas={planillasCampana}
        onClose={() => setSelectedPuestoForModal(null)}
      />

      <DataUploader
        isOpen={isUploaderOpen}
        onClose={() => setIsUploaderOpen(false)}
        onUpdateResults={(newData) => {
          setResultadosPuestos(newData);
          setIsUploaderOpen(false);
        }}
        onUpdatePlanillas={(newData) => {
          setPlanillasCampana(newData);
          setIsUploaderOpen(false);
        }}
        onResetDefaultData={handleResetDefaultData}
      />

    </div>
  );
}

export default App;
