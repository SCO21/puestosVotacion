import React, { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, Tooltip, useMap } from 'react-leaflet';
import { CARTO_DARK_URL, CARTO_ATTRIBUTION } from '../../utils/basemap';
import { MapPin, UserCog, Users, Target } from 'lucide-react';
import { useEstructura, ESTADOS, ESTADO_ORDEN, fmtN } from '../../hooks/useEstructura';
import { ProyeccionInput } from './ProyeccionInput';

const FlyTo = ({ focused }) => {
  const map = useMap();
  useEffect(() => { if (focused?.lat && focused?.lng) map.flyTo([focused.lat, focused.lng], 16, { duration: 1.4 }); }, [focused, map]);
  return null;
};

const mix = (a, b, t) => {
  const pa = [1, 3, 5].map(i => parseInt(a.slice(i, i + 2), 16)), pb = [1, 3, 5].map(i => parseInt(b.slice(i, i + 2), 16));
  return '#' + pa.map((v, i) => Math.round(v + (pb[i] - v) * Math.max(0, Math.min(1, t))).toString(16).padStart(2, '0')).join('');
};

export const COLOR_BY = [
  { id: 'estado', label: 'Asignación (según Excel)' },
  { id: 'inscritos', label: 'Inscritos' },
  { id: 'proyectado', label: 'Votos proyectados' },
];

const Persona = ({ p }) => (
  <div className="text-xs bg-slate-950/50 rounded px-2 py-1 text-white">
    {p.nombre}
    {p.referente && <span className="ml-1 text-[10px] text-violet-300">(ref. {p.referente})</span>}
  </div>
);

export const StructureMapView = ({ puestos = [], colorBy = 'estado', focusedPuesto }) => {
  const { resumen } = useEstructura();
  const maxInscritos = useMemo(() => Math.max(1, ...puestos.map(p => resumen[p.puesto_id]?.inscritos || 0)), [puestos, resumen]);
  const maxProy = useMemo(() => Math.max(1, ...puestos.map(p => resumen[p.puesto_id]?.proyectado || 0)), [puestos, resumen]);

  const colorOf = (r) => {
    if (colorBy === 'estado') return ESTADOS[r.estado].color;
    if (colorBy === 'inscritos') return mix('#312e81', '#e879f9', Math.sqrt((r.inscritos || 0) / maxInscritos));
    return r.proyectado > 0 ? mix('#1e3a8a', '#34d399', r.proyectado / maxProy) : '#475569';
  };

  return (
    <div className="w-full h-[560px] lg:h-[660px] rounded-2xl overflow-hidden border border-slate-200 gov-shadow relative bg-slate-950">
      <div className="absolute bottom-4 left-4 z-[1000] bg-slate-900/90 border border-slate-800 rounded-xl p-3 backdrop-blur-md text-xs shadow-xl space-y-1.5 max-w-[250px]">
        <div className="font-bold text-white text-[11px] uppercase tracking-wider border-b border-slate-800 pb-1">
          {COLOR_BY.find(c => c.id === colorBy)?.label}
        </div>
        {colorBy === 'estado' ? ESTADO_ORDEN.map(id => (
          <div key={id} className="flex items-center gap-2 text-[11px]">
            <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: ESTADOS[id].color }} />
            <span className="text-slate-300">{ESTADOS[id].label}</span>
          </div>
        )) : (
          <div className="text-[11px] text-slate-300 space-y-1">
            <div className="h-2 w-44 rounded-full" style={{ background: colorBy === 'inscritos' ? 'linear-gradient(90deg,#312e81,#e879f9)' : 'linear-gradient(90deg,#1e3a8a,#34d399)' }} />
            <div className="flex justify-between w-44 text-[10px] text-slate-400"><span>menos</span><span>más</span></div>
            {colorBy === 'proyectado' && <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full" style={{ backgroundColor: '#475569' }} /> Sin proyección registrada</div>}
          </div>
        )}
        <div className="pt-1 text-[10px] text-slate-500 border-t border-slate-800">* Tamaño del punto = inscritos</div>
      </div>

      <MapContainer center={[10.3997, -75.5144]} zoom={12} scrollWheelZoom className="w-full h-full z-10">
        <FlyTo focused={focusedPuesto} />
        <TileLayer attribution={CARTO_ATTRIBUTION} url={CARTO_DARK_URL} maxZoom={19} />
        {puestos.map(p => {
          const r = resumen[p.puesto_id]; if (!r || !p.lat || !p.lng) return null;
          const col = colorOf(r);
          const radius = 7 + Math.round(15 * Math.sqrt((r.inscritos || 0) / maxInscritos));
          const isF = focusedPuesto && focusedPuesto.puesto_id === p.puesto_id;
          const [zona, pto] = p.puesto_id.split('-');
          return (
            <CircleMarker key={p.puesto_id} center={[p.lat, p.lng]} radius={isF ? radius + 5 : radius}
              pathOptions={{ color: isF ? '#38bdf8' : col, fillColor: col, fillOpacity: 0.8, weight: isF ? 4 : 1.5 }}>
              <Tooltip direction="top" offset={[0, -radius]} opacity={0.95} sticky>
                <div className="text-xs font-semibold text-slate-100">
                  {r.nombre}
                  <div className="text-[10px] text-cyan-300 font-normal">Zona {zona} · Puesto {pto} · {fmtN(r.inscritos)} inscritos</div>
                  <div className="text-[10px] text-slate-300 font-normal">{r.coordinadores.length} coord. · {r.lideres.length} líderes</div>
                </div>
              </Tooltip>
              <Popup minWidth={300} maxWidth={320} autoPanPaddingTopLeft={[20, 60]} autoPanPaddingBottomRight={[20, 20]}>
                <div className="bg-slate-900 text-slate-100 p-4 pr-8 space-y-3 font-sans">
                  <div>
                    <h3 className="font-bold text-sm text-white leading-snug break-words">{r.nombre}</h3>
                    <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-bold text-cyan-300 bg-cyan-500/15 border border-cyan-500/30 rounded px-1.5 py-0.5">Zona {zona} · Puesto {pto}</span>
                      <span className="text-[10px] text-slate-400">{r.localidad}</span>
                    </div>
                    {r.direccion && <p className="text-[11px] text-slate-400 flex items-start gap-1 mt-1"><MapPin className="w-3 h-3 mt-0.5 text-cyan-400 shrink-0" /> <span className="break-words">{r.direccion}</span></p>}
                  </div>

                  <div className="bg-slate-950/70 border border-slate-800 rounded-lg px-3 py-2 flex items-center justify-between">
                    <span className="text-[10px] uppercase tracking-wider text-slate-400">Total inscritos</span>
                    <span className="text-base font-extrabold text-white">{fmtN(r.inscritos)}</span>
                  </div>

                  <div>
                    <div className="text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1"><UserCog className="w-3.5 h-3.5 text-amber-400" /> Coordinador{r.coordinadores.length > 1 ? 'es' : ''}</div>
                    {r.coordinadores.length === 0
                      ? <div className="text-[11px] text-slate-500">No registrado en el Excel</div>
                      : <div className="space-y-1">{r.coordinadores.map((c, i) => <Persona key={i} p={c} />)}</div>}
                  </div>

                  <div>
                    <div className="text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1"><Users className="w-3.5 h-3.5 text-cyan-400" /> Líderes ({r.lideres.length})</div>
                    {r.lideres.length === 0
                      ? <div className="text-[11px] text-slate-500">No registrados en el Excel</div>
                      : <div className="space-y-1 max-h-36 overflow-y-auto pr-1">{r.lideres.map((l, i) => <Persona key={i} p={l} />)}</div>}
                  </div>

                  <div className="bg-slate-950/70 border border-slate-800 rounded-lg px-3 py-2">
                    <div className="text-[11px] text-slate-400 flex items-center gap-1 mb-1"><Target className="w-3.5 h-3.5 text-emerald-400" /> Votos proyectados <span className="text-[9px] text-slate-500">(se guarda en tu navegador)</span></div>
                    <ProyeccionInput puestoId={p.puesto_id} dark />
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
};
