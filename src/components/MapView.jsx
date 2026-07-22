import React, { useMemo, useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, Tooltip, useMap } from 'react-leaflet';
import {
  getComparison,
  getSortedResults,
  getPuestoWinner,
  calculateMarkerRadius,
  CANDIDATE_COLORS,
  NO_DATA_COLOR
} from '../utils/electionAnalytics';
import { Trophy, MapPin, Users, Award, ChevronRight, Crown, Target } from 'lucide-react';

// Controller to auto-fly & center map when a user searches or selects a puesto
const MapController = ({ focusedPuesto }) => {
  const map = useMap();

  useEffect(() => {
    if (focusedPuesto && focusedPuesto.lat && focusedPuesto.lng) {
      map.flyTo([focusedPuesto.lat, focusedPuesto.lng], 16, {
        animate: true,
        duration: 1.5
      });
    }
  }, [focusedPuesto, map]);

  return null;
};

export const MapView = ({
  puestos = [],
  compareCandidates = [],
  targetCandidate = '',
  planillas = [],
  maxVotesGlobal = 15000,
  focusedPuesto = null,
  onSelectPuesto
}) => {
  // Center of Cartagena de Indias
  const cartagenaCenter = [10.3997, -75.5144];
  const compareAll = compareCandidates.length === 0;
  const GENERAL_COLOR = '#0ea5e9';

  // Map leaders to puesto_id for quick lookup inside popup
  const leadersMap = useMemo(() => {
    const map = new Map();
    planillas.forEach(item => {
      map.set(item.puesto_asignado_id, item);
    });
    return map;
  }, [planillas]);

  return (
    <div className="w-full h-[550px] lg:h-[650px] rounded-2xl overflow-hidden border border-slate-800 shadow-2xl relative">
      
      {/* Legend Badge Overlay */}
      <div className="absolute bottom-4 left-4 z-[1000] bg-slate-900/90 border border-slate-800 rounded-xl p-3 backdrop-blur-md text-xs shadow-xl space-y-2 pointer-events-auto max-w-[240px]">
        <div className="font-bold text-white text-[11px] uppercase tracking-wider border-b border-slate-800 pb-1">
          {compareAll ? 'Vista general (todos)' : 'Líder por puesto'}
        </div>
        <div className="flex flex-col gap-1.5 text-[11px]">
          {compareAll && (
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full inline-block shrink-0" style={{ backgroundColor: GENERAL_COLOR }} />
              <span className="text-slate-300 font-medium">Puesto con datos — ver top en el popup</span>
            </div>
          )}
          {compareCandidates.map((cand, i) => (
            <div key={cand} className="flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-full inline-block shrink-0 shadow-sm"
                style={{ backgroundColor: CANDIDATE_COLORS[i], boxShadow: `0 0 6px ${CANDIDATE_COLORS[i]}80` }}
              />
              <span className="text-slate-300 font-medium truncate">{cand}</span>
            </div>
          ))}
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full inline-block shrink-0" style={{ backgroundColor: NO_DATA_COLOR }} />
            <span className="text-slate-400 font-medium">Sin datos / ninguno</span>
          </div>
        </div>
        <div className="pt-1 text-[10px] text-slate-500 border-t border-slate-800">
          * Color = candidato con más votos en el puesto<br />* Tamaño del círculo = votos totales del puesto
        </div>
      </div>

      <MapContainer
        center={cartagenaCenter}
        zoom={12}
        scrollWheelZoom={true}
        className="w-full h-full z-10"
      >
        <MapController focusedPuesto={focusedPuesto} />

        {/* CartoDB Dark Matter TileLayer */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          maxZoom={19}
        />

        {/* CircleMarkers for each polling post */}
        {puestos.map((puesto) => {
          const cmp = getComparison(puesto.resultados, compareCandidates);
          const radius = calculateMarkerRadius(puesto.votos_totales_puesto, maxVotesGlobal);
          const winner = getPuestoWinner(puesto.resultados);
          const sortedTop3 = getSortedResults(puesto.resultados).slice(0, 3);
          const leaderInfo = leadersMap.get(puesto.puesto_id);
          const isFocused = focusedPuesto && focusedPuesto.puesto_id === puesto.puesto_id;
          const hasLeader = !!cmp.leader;
          const hasData = (puesto.votos_totales_puesto || 0) > 0;
          // Sin candidatos seleccionados => vista general (color único por votos totales)
          const markerColor = compareAll ? (hasData ? GENERAL_COLOR : NO_DATA_COLOR) : cmp.color;
          const markerOpacity = compareAll ? (hasData ? 0.75 : 0.35) : (hasLeader ? 0.8 : 0.45);

          return (
            <CircleMarker
              key={puesto.puesto_id}
              center={[puesto.lat, puesto.lng]}
              radius={isFocused ? radius + 6 : radius}
              pathOptions={{
                color: isFocused ? '#38bdf8' : markerColor,
                fillColor: markerColor,
                fillOpacity: isFocused ? 0.95 : markerOpacity,
                weight: isFocused ? 4 : (compareAll ? 1.2 : (hasLeader ? 2 : 1)),
              }}
            >
              {/* Tooltip on Hover */}
              <Tooltip direction="top" offset={[0, -radius]} opacity={0.9} sticky>
                <div className="text-xs font-semibold text-slate-100">
                  {puesto.nombre_puesto}
                  <div className="text-[10px] font-normal" style={{ color: compareAll ? GENERAL_COLOR : cmp.color }}>
                    {compareAll
                      ? (hasData ? `${puesto.votos_totales_puesto.toLocaleString()} votos · gana ${winner.candidato_o_lista}` : 'Sin datos E-24')
                      : (hasLeader
                          ? `Líder: ${cmp.leader.name} (${cmp.leader.votos.toLocaleString()} · ${cmp.leader.pct}%)`
                          : (hasData ? 'Ninguno de los seleccionados' : 'Sin datos E-24'))}
                  </div>
                </div>
              </Tooltip>

              {/* Didactic Popup on Click */}
              <Popup>
                <div className="w-72 bg-slate-900 text-slate-100 p-4 rounded-xl border border-slate-800 space-y-3 font-sans">
                  
                  {/* Header */}
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-sm text-white font-heading leading-snug">
                        {puesto.nombre_puesto}
                      </h3>
                      {hasLeader ? (
                        <span
                          className="text-[10px] font-bold px-2 py-0.5 rounded border shrink-0 flex items-center gap-1"
                          style={{ color: cmp.color, borderColor: cmp.color, backgroundColor: cmp.color + '22' }}
                        >
                          <Crown className="w-3 h-3" /> Líder
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded border shrink-0 bg-slate-500/20 text-slate-300 border-slate-500/30">
                          {puesto.votos_totales_puesto > 0 ? 'Ninguno' : 'Sin datos'}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-1">
                      <MapPin className="w-3 h-3 text-cyan-400 shrink-0" />
                      {puesto.direccion}
                    </p>
                  </div>

                  {/* Local Winner Box */}
                  <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800/80 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] uppercase font-semibold text-slate-400 flex items-center gap-1">
                        <Trophy className="w-3 h-3 text-amber-400" /> Ganador Local
                      </div>
                      <div className="text-xs font-bold text-emerald-400">
                        {winner.candidato_o_lista}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-extrabold text-white">
                        {winner.votos.toLocaleString()}
                      </div>
                      <div className="text-[10px] text-slate-400">votos</div>
                    </div>
                  </div>

                  {/* Comparación de candidatos seleccionados */}
                  {cmp.rows.length > 0 && (
                    <div>
                      <div className="text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                        <Target className="w-3 h-3 text-cyan-400" />
                        Comparación ({cmp.rows.length})
                      </div>
                      <div className="space-y-1.5">
                        {[...cmp.rows].sort((a, b) => b.votos - a.votos).map((row) => {
                          const isLeader = hasLeader && row.index === cmp.leaderIndex && row.votos > 0;
                          return (
                            <div
                              key={row.name}
                              className="p-1.5 rounded-lg text-xs flex items-center justify-between"
                              style={{ backgroundColor: row.color + (isLeader ? '2e' : '18'), border: `1px solid ${row.color}${isLeader ? 'aa' : '44'}` }}
                            >
                              <div className="flex items-center gap-2 truncate pr-2">
                                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: row.color }} />
                                <span className="truncate font-medium text-slate-100">{row.name}</span>
                                {isLeader && <Crown className="w-3 h-3 shrink-0" style={{ color: row.color }} />}
                              </div>
                              <div className="text-right shrink-0 text-[11px]">
                                <span className="font-semibold text-white">{row.votos.toLocaleString()}</span>
                                <span className="text-[10px] text-slate-400 ml-1">({row.pct}%)</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Top 3 Candidate Ranking */}
                  {sortedTop3.length > 0 && (
                    <div>
                      <div className="text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                        <Award className="w-3 h-3 text-cyan-400" />
                        Top Candidatos
                      </div>
                      <div className="space-y-1.5">
                        {sortedTop3.map((item, idx) => {
                          const pct = puesto.votos_totales_puesto > 0 
                            ? ((item.votos / puesto.votos_totales_puesto) * 100).toFixed(1)
                            : 0;
                          const isTarget = item.candidato_o_lista?.trim().toUpperCase() === targetCandidate.trim().toUpperCase();

                          return (
                            <div 
                              key={idx}
                              className={`p-1.5 rounded-lg text-xs flex items-center justify-between ${
                                isTarget ? 'bg-cyan-950/60 border border-cyan-700/50' : 'bg-slate-950/40'
                              }`}
                            >
                              <div className="flex items-center gap-2 truncate pr-2">
                                <span className="w-4 h-4 rounded-full bg-slate-800 text-slate-300 text-[10px] font-bold flex items-center justify-center shrink-0">
                                  {idx + 1}
                                </span>
                                <span className={`truncate font-medium ${isTarget ? 'text-cyan-300 font-bold' : 'text-slate-200'}`}>
                                  {item.candidato_o_lista}
                                </span>
                              </div>
                              <div className="text-right shrink-0 text-[11px]">
                                <span className="font-semibold text-white">{item.votos.toLocaleString()}</span>
                                <span className="text-[10px] text-slate-400 ml-1">({pct}%)</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Assigned Campaign Leader Info */}
                  {leaderInfo && (
                    <div className="pt-2 border-t border-slate-800/80 text-[11px] flex items-center justify-between text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-blue-400" />
                        <span>Líder: <strong className="text-white">{leaderInfo.nombre_lider}</strong></span>
                      </div>
                      <span className="bg-blue-950 text-blue-300 px-2 py-0.5 rounded text-[10px] border border-blue-800/50">
                        {leaderInfo.num_activistas} activistas
                      </span>
                    </div>
                  )}

                  {/* Full Detail Action */}
                  <button
                    onClick={() => onSelectPuesto(puesto)}
                    className="w-full py-1.5 px-3 bg-slate-800 hover:bg-cyan-600 text-white text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1"
                  >
                    Ver Detalle Completo
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>

                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
};
