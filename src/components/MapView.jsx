import React, { useMemo, useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, Tooltip, useMap } from 'react-leaflet';
import { CARTO_DARK_URL, CARTO_ATTRIBUTION } from '../utils/basemap';
import {
  getComparison, getSortedResults, getPuestoWinner, calculateMarkerRadius,
  colorForCandidate, NO_DATA_COLOR
} from '../utils/electionAnalytics';
import { Trophy, MapPin, Users, ChevronRight, Crown, Target } from 'lucide-react';

const MapController = ({ focusedPuesto }) => {
  const map = useMap();
  useEffect(() => {
    if (focusedPuesto && focusedPuesto.lat && focusedPuesto.lng) {
      map.flyTo([focusedPuesto.lat, focusedPuesto.lng], 16, { animate: true, duration: 1.5 });
    }
  }, [focusedPuesto, map]);
  return null;
};

export const MapView = ({
  puestos = [], compareCandidates = [], targetCandidate = '', planillas = [],
  maxVotesGlobal = 15000, focusedPuesto = null, onSelectPuesto,
}) => {
  const cartagenaCenter = [10.3997, -75.5144];
  const compareAll = compareCandidates.length === 0;
  const GENERAL_COLOR = '#38bdf8';

  const leadersMap = useMemo(() => {
    const m = new Map();
    planillas.forEach(i => m.set(i.puesto_asignado_id, i));
    return m;
  }, [planillas]);

  return (
    <div className="w-full h-[560px] lg:h-[660px] rounded-2xl overflow-hidden border border-slate-200 gov-shadow relative bg-slate-950">
      {/* Leyenda */}
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
              <span className="w-3 h-3 rounded-full inline-block shrink-0" style={{ backgroundColor: colorForCandidate(cand, i) }} />
              <span className="text-slate-300 font-medium truncate">{cand}</span>
            </div>
          ))}
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full inline-block shrink-0" style={{ backgroundColor: NO_DATA_COLOR }} />
            <span className="text-slate-400 font-medium">Sin datos / ninguno</span>
          </div>
        </div>
        <div className="pt-1 text-[10px] text-slate-500 border-t border-slate-800">
          * Color = candidato con más votos en el puesto<br />* Tamaño = votos totales del puesto
        </div>
      </div>

      <MapContainer center={cartagenaCenter} zoom={12} scrollWheelZoom={true} className="w-full h-full z-10">
        <MapController focusedPuesto={focusedPuesto} />
        <TileLayer
          attribution={CARTO_ATTRIBUTION}
          url={CARTO_DARK_URL}
          maxZoom={19}
        />

        {puestos.map((puesto) => {
          const cmp = getComparison(puesto.resultados, compareCandidates);
          const radius = calculateMarkerRadius(puesto.votos_totales_puesto, maxVotesGlobal);
          const winner = getPuestoWinner(puesto.resultados);
          const leaderInfo = leadersMap.get(puesto.puesto_id);
          const isFocused = focusedPuesto && focusedPuesto.puesto_id === puesto.puesto_id;
          const hasLeader = !!cmp.leader;
          const hasData = (puesto.votos_totales_puesto || 0) > 0;
          const markerColor = compareAll ? (hasData ? GENERAL_COLOR : NO_DATA_COLOR) : cmp.color;
          const markerOpacity = compareAll ? (hasData ? 0.75 : 0.3) : (hasLeader ? 0.85 : 0.4);

          return (
            <CircleMarker key={puesto.puesto_id} center={[puesto.lat, puesto.lng]} radius={isFocused ? radius + 6 : radius}
              pathOptions={{
                color: isFocused ? '#38bdf8' : markerColor,
                fillColor: markerColor,
                fillOpacity: isFocused ? 0.95 : markerOpacity,
                weight: isFocused ? 4 : (compareAll ? 1 : (hasLeader ? 2 : 1)),
              }}>
              <Tooltip direction="top" offset={[0, -radius]} opacity={0.95} sticky>
                <div className="text-xs font-semibold text-slate-100">
                  {puesto.nombre_puesto}
                  <div className="text-[10px] text-cyan-300 font-normal">
                    Zona {puesto.puesto_id?.split('-')[0]} · Puesto {puesto.puesto_id?.split('-')[1]} ({puesto.puesto_id})
                  </div>
                  <div className="text-[10px] font-normal" style={{ color: compareAll ? GENERAL_COLOR : cmp.color }}>
                    {compareAll
                      ? (hasData ? `${puesto.votos_totales_puesto.toLocaleString()} votos · gana ${winner.candidato_o_lista}` : 'Sin datos')
                      : (hasLeader ? `Líder: ${cmp.leader.name} (${cmp.leader.votos.toLocaleString()} · ${cmp.leader.pct}%)` : (hasData ? 'Ninguno de los seleccionados' : 'Sin datos'))}
                  </div>
                </div>
              </Tooltip>

              <Popup>
                <div className="w-72 bg-slate-900 text-slate-100 p-4 space-y-3 font-sans">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-sm text-white font-heading leading-snug">{puesto.nombre_puesto}</h3>
                      {hasLeader ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded border shrink-0 flex items-center gap-1" style={{ color: cmp.color, borderColor: cmp.color, backgroundColor: cmp.color + '22' }}>
                          <Crown className="w-3 h-3" /> Líder
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded border shrink-0 bg-slate-800 text-slate-300 border-slate-700">
                          {hasData ? 'Ninguno' : 'Sin datos'}
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex items-center gap-1.5">
                      <span className="text-[10px] font-bold text-cyan-300 bg-cyan-500/15 border border-cyan-500/30 rounded px-1.5 py-0.5">
                        Zona {puesto.puesto_id?.split('-')[0]} · Puesto {puesto.puesto_id?.split('-')[1]}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">{puesto.puesto_id}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-1">
                      <MapPin className="w-3 h-3 text-cyan-400 shrink-0" /> {puesto.direccion}
                    </p>
                  </div>

                  <div className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] uppercase font-semibold text-slate-400 flex items-center gap-1">
                        <Trophy className="w-3 h-3 text-amber-400" /> Ganador Local
                      </div>
                      <div className="text-xs font-bold text-emerald-400">{winner.candidato_o_lista}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-extrabold text-white">{winner.votos.toLocaleString()}</div>
                      <div className="text-[10px] text-slate-400">votos</div>
                    </div>
                  </div>

                  {cmp.rows.length > 0 && (
                    <div>
                      <div className="text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                        <Target className="w-3 h-3 text-cyan-400" /> Comparación ({cmp.rows.length})
                      </div>
                      <div className="space-y-1.5">
                        {[...cmp.rows].sort((a, b) => b.votos - a.votos).map((row) => {
                          const isLeader = hasLeader && row.index === cmp.leaderIndex && row.votos > 0;
                          return (
                            <div key={row.name} className="p-1.5 rounded-lg text-xs flex items-center justify-between" style={{ backgroundColor: row.color + (isLeader ? '2e' : '18'), border: `1px solid ${row.color}${isLeader ? 'aa' : '44'}` }}>
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

                  {leaderInfo && (
                    <div className="pt-2 border-t border-slate-800 text-[11px] flex items-center justify-between text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-blue-400" />
                        <span>Líder: <strong className="text-white">{leaderInfo.nombre_lider}</strong></span>
                      </div>
                      <span className="bg-blue-950 text-blue-300 px-2 py-0.5 rounded text-[10px] border border-blue-800/50">{leaderInfo.num_activistas} activistas</span>
                    </div>
                  )}

                  <button onClick={() => onSelectPuesto(puesto)}
                    className="w-full py-1.5 px-3 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1">
                    Ver Detalle Completo <ChevronRight className="w-3.5 h-3.5" />
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
