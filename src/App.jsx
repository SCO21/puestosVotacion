import React, { useState, useMemo, useEffect } from 'react';
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
  const [targetCandidate, setTargetCandidate] = useState('');

  // Set default target candidate once candidates are loaded
  useEffect(() => {
    if (allCandidates.length > 0 && !targetCandidate) {
      const defaultCand = allCandidates.find(c => c.toUpperCase().includes('MATEO')) || allCandidates[0];
      setTargetCandidate(defaultCand);
    }
  }, [allCandidates, targetCandidate]);

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
        targetCandidate={targetCandidate}
        setTargetCandidate={setTargetCandidate}
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
