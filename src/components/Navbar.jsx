import React, { useState, useRef, useEffect } from 'react';
import { 
  Target, 
  Search, 
  Upload, 
  Map, 
  Users, 
  LogOut, 
  Filter,
  MapPin,
  X,
  ChevronDown,
  Sparkles
} from 'lucide-react';

export const Navbar = ({
  targetCandidate,
  setTargetCandidate,
  allCandidates = [],
  cargoFilter,
  setCargoFilter,
  allCargos = [],
  searchQuery,
  setSearchQuery,
  activeTab,
  setActiveTab,
  allPuestos = [],
  onSelectPuestoFromSearch,
  onOpenUploader,
  onLogout
}) => {
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchContainerRef = useRef(null);

  // Compute search suggestions
  const searchResults = React.useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    return allPuestos.filter(p => 
      p.nombre_puesto.toLowerCase().includes(query) ||
      (p.direccion && p.direccion.toLowerCase().includes(query)) ||
      (p.puesto_id && p.puesto_id.toLowerCase().includes(query))
    ).slice(0, 8);
  }, [searchQuery, allPuestos]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectPuesto = (puesto) => {
    setSearchQuery(puesto.nombre_puesto);
    onSelectPuestoFromSearch(puesto);
    setIsSearchFocused(false);
  };

  return (
    <header className="bg-slate-900/95 border-b border-slate-800 sticky top-0 z-50 backdrop-blur-xl shadow-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 space-y-3">
        
        {/* UPPER ROW: Logo, Brand & Main Action Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          
          {/* Logo & Brand Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-tr from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/20 ring-1 ring-white/10 shrink-0">
              <Target className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-extrabold text-white font-heading tracking-tight">
                  CARTAGENA ELECTORAL
                </h1>
                <span className="bg-cyan-500/20 text-cyan-400 text-[10px] font-bold uppercase px-2 py-0.5 rounded border border-cyan-500/30">
                  SPA
                </span>
              </div>
              <p className="text-xs text-slate-400">Inteligencia y Ubicaciones Cartográficas de Cartagena</p>
            </div>
          </div>

          {/* Right Header Navigation & Actions */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            
            {/* Tab View Switcher */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setActiveTab('map')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'map'
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/20'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Map className="w-3.5 h-3.5" />
                Mapa & Ubicaciones
              </button>

              <button
                onClick={() => setActiveTab('audit')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'audit'
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/20'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                Auditoría Campaña
              </button>
            </div>

            {/* Upload Button */}
            <button
              onClick={onOpenUploader}
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-950/80 hover:bg-emerald-900/80 text-emerald-400 border border-emerald-800/80 text-xs font-bold rounded-xl transition-all shadow-sm shrink-0"
              title="Cargar Excel, PDF o JSON"
            >
              <Upload className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Cargar Excel / PDF / JSON</span>
            </button>

            {/* Logout Button */}
            <button
              onClick={onLogout}
              className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-950/40 rounded-xl border border-slate-800 transition-all shrink-0"
              title="Cerrar Sesión"
            >
              <LogOut className="w-4 h-4" />
            </button>

          </div>

        </div>

        {/* LOWER ROW: Dedicated Spacious Search Bar & Controls Strip */}
        <div className="bg-slate-950/90 border border-slate-800/80 p-2.5 rounded-2xl shadow-inner grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          
          {/* SEARCH BAR (Dominant Control - Spans 6/12 columns on desktop) */}
          <div ref={searchContainerRef} className="md:col-span-6 relative">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onFocus={() => setIsSearchFocused(true)}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsSearchFocused(true);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && searchResults.length > 0) {
                    handleSelectPuesto(searchResults[0]);
                  }
                }}
                placeholder="🔍 Buscar y ubicar puesto en el mapa (ej: Bocagrande, Pie de la Popa, Pozón...)"
                className="w-full bg-slate-900 border border-slate-700/80 text-white text-xs font-medium rounded-xl pl-9 pr-9 py-2.5 placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/30 transition-all shadow-sm"
              />
              <Search className="w-4 h-4 text-cyan-400 absolute left-3 top-3 pointer-events-none" />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setIsSearchFocused(false);
                  }}
                  className="absolute right-3 top-3 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Autocomplete Search Dropdown */}
            {isSearchFocused && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-[100] max-h-72 overflow-y-auto font-sans animate-fadeIn">
                <div className="px-3.5 py-2 bg-slate-950 text-[10px] uppercase font-bold text-cyan-400 border-b border-slate-800 flex items-center justify-between">
                  <span>Puestos Encontrados en Cartagena</span>
                  <span className="text-slate-400 font-normal">{searchResults.length} resultados</span>
                </div>
                {searchResults.map((puesto) => (
                  <button
                    key={puesto.puesto_id}
                    onClick={() => handleSelectPuesto(puesto)}
                    className="w-full text-left px-3.5 py-2.5 hover:bg-slate-800/80 transition-colors border-b border-slate-800/40 last:border-0 flex items-start gap-2.5 group"
                  >
                    <MapPin className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                    <div className="truncate flex-1">
                      <div className="text-xs font-bold text-white group-hover:text-cyan-300 truncate">
                        {puesto.nombre_puesto}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate">
                        {puesto.direccion}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* CANDIDATO OBJETIVO SELECTOR (Spans 3/12 columns on desktop) */}
          <div className="md:col-span-3 relative">
            <div className="relative flex items-center">
              <select
                value={targetCandidate}
                onChange={(e) => setTargetCandidate(e.target.value)}
                className="w-full bg-slate-900 border border-cyan-500/50 text-cyan-300 font-bold text-xs rounded-xl px-3 py-2.5 pr-8 appearance-none focus:outline-none focus:ring-2 focus:ring-cyan-500/40 cursor-pointer shadow-sm truncate"
              >
                {allCandidates.map((cand) => (
                  <option key={cand} value={cand} className="bg-slate-900 text-slate-100">
                    Candidato: {cand}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-2.5 pointer-events-none text-cyan-400">
                <ChevronDown className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* CARGO FILTER (Spans 3/12 columns on desktop) */}
          <div className="md:col-span-3 relative">
            <div className="relative flex items-center">
              <select
                value={cargoFilter}
                onChange={(e) => setCargoFilter(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700/80 text-slate-200 text-xs font-semibold rounded-xl px-3 py-2.5 pr-8 appearance-none focus:outline-none focus:border-slate-500 cursor-pointer shadow-sm truncate"
              >
                <option value="TODOS">Todos los Cargos</option>
                {allCargos.map((cargo) => (
                  <option key={cargo} value={cargo} className="bg-slate-900 text-slate-100">
                    {cargo}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-2.5 pointer-events-none text-slate-400">
                <Filter className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>

        </div>

      </div>
    </header>
  );
};
