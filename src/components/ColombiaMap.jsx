import React, { useMemo, useState, useEffect } from 'react';
import depGeo from '../data/colombia-departamentos.geo.json';
import bolivarMuni from '../data/bolivar-municipios.geo.json';
import { MapView } from './MapView';
import { ChevronRight, ArrowLeft, MapPinned, Info } from 'lucide-react';

const norm = (s) => (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().trim();
const departamentoDe = (p) => p.departamento || 'Bolívar';
const municipioDe = (p) => p.municipio || 'Cartagena de Indias';

// Municipios disponibles por departamento (se irán agregando)
const MUNI_BY_DEPT = { 'BOLIVAR': bolivarMuni };

// ---------- Choropleth SVG reutilizable ----------
const W = 680, H = 820, PAD = 16;
const Choropleth = ({ features, statusOf, onPick, maxW = 520 }) => {
  const [hover, setHover] = useState(null);
  const paths = useMemo(() => {
    let minLon = 180, maxLon = -180, minLat = 90, maxLat = -90;
    features.forEach(f => {
      const gt = f.geometry; if (!gt) return;
      const polys = gt.type === 'Polygon' ? [gt.coordinates] : gt.coordinates;
      polys.forEach(poly => poly.forEach(ring => ring.forEach(([lo, la]) => {
        if (lo < minLon) minLon = lo; if (lo > maxLon) maxLon = lo;
        if (la < minLat) minLat = la; if (la > maxLat) maxLat = la;
      })));
    });
    const lonR = (maxLon - minLon) || 1, latR = (maxLat - minLat) || 1;
    const scale = Math.min((W - 2 * PAD) / lonR, (H - 2 * PAD) / latR);
    const offX = PAD + ((W - 2 * PAD) - lonR * scale) / 2;
    const offY = PAD + ((H - 2 * PAD) - latR * scale) / 2;
    const pr = (lo, la) => [offX + (lo - minLon) * scale, offY + (maxLat - la) * scale];
    const build = (gt) => {
      const polys = gt.type === 'Polygon' ? [gt.coordinates] : gt.coordinates;
      return polys.map(poly => poly.map(ring => 'M' + ring.map(([lo, la]) => { const [x, y] = pr(lo, la); return `${x.toFixed(1)} ${y.toFixed(1)}`; }).join('L') + 'Z').join(' ')).join(' ');
    };
    return features.filter(f => f.properties && (f.properties.name)).map(f => ({ name: f.properties.name, d: build(f.geometry) }));
  }, [features]);

  return (
    <div className="relative w-full flex justify-center" onMouseLeave={() => setHover(null)}>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" style={{ maxWidth: maxW, maxHeight: '66vh' }}>
        {paths.map(p => {
          const st = statusOf(p.name); // {data, count, pick}
          const isHover = hover && hover.name === p.name;
          const fill = st.data ? (isHover ? '#1d4ed8' : '#2563eb') : (isHover ? '#cbd5e1' : '#e9edf3');
          return (
            <path key={p.name} d={p.d} fill={fill} stroke="#ffffff" strokeWidth={0.7}
              style={{ cursor: st.pick ? 'pointer' : 'default', transition: 'fill .12s' }}
              onMouseMove={(e) => { const r = e.currentTarget.ownerSVGElement.getBoundingClientRect(); setHover({ name: p.name, ...st, x: e.clientX - r.left, y: e.clientY - r.top }); }}
              onClick={() => { if (st.pick) onPick(p.name); }} />
          );
        })}
      </svg>
      {hover && (
        <div className="absolute pointer-events-none z-20 bg-slate-900 text-white text-xs rounded-lg px-2.5 py-1.5 shadow-lg" style={{ left: Math.min(hover.x + 12, maxW - 90), top: hover.y + 12 }}>
          <div className="font-bold capitalize">{(hover.name || '').toLowerCase()}</div>
          <div className="text-[10px] text-slate-300">{hover.count > 0 ? `${hover.count} puestos${hover.data ? ' · clic para entrar' : ' (sin resultados)'}` : 'Sin datos'}</div>
        </div>
      )}
    </div>
  );
};

const Frame = ({ title, children, legend = true }) => (
  <div className="bg-white border border-slate-200 rounded-2xl gov-shadow p-4">
    <div className="flex items-center justify-between mb-2">
      <div className="flex items-center gap-2"><MapPinned className="w-5 h-5 text-blue-600" /><h3 className="font-bold text-slate-800">{title}</h3></div>
      {legend && (
        <div className="hidden sm:flex items-center gap-4 text-[11px] text-slate-500">
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm inline-block bg-blue-600" /> Con datos</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm inline-block bg-slate-200" /> Sin datos</span>
        </div>
      )}
    </div>
    {children}
    <div className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-400 justify-center">
      <Info className="w-3.5 h-3.5" /> Solo se colorean las zonas con datos cargados.
    </div>
  </div>
);

// ---------- Componente principal ----------
export const ColombiaMap = ({
  puestos = [], compareCandidates = [], targetCandidate = '', planillas = [],
  maxVotesGlobal = 15000, focusedPuesto = null, onSelectPuesto,
}) => {
  const [dept, setDept] = useState(null);
  const [muni, setMuni] = useState(null);

  const byDept = useMemo(() => {
    const m = {}; puestos.forEach(p => { const d = norm(departamentoDe(p)); (m[d] = m[d] || []).push(p); }); return m;
  }, [puestos]);
  const byMuni = useMemo(() => {
    const m = {}; puestos.forEach(p => { const k = norm(municipioDe(p)); (m[k] = m[k] || []).push(p); }); return m;
  }, [puestos]);

  useEffect(() => {
    if (focusedPuesto) { setDept(departamentoDe(focusedPuesto)); setMuni(municipioDe(focusedPuesto)); }
  }, [focusedPuesto]);

  const Breadcrumb = () => (
    <div className="flex items-center gap-2 text-sm flex-wrap">
      <button onClick={() => { setDept(null); setMuni(null); }} className="flex items-center gap-1.5 text-blue-700 font-semibold hover:text-blue-900 bg-white border border-slate-200 rounded-lg px-3 py-1.5 gov-shadow"><ArrowLeft className="w-4 h-4" /> Colombia</button>
      {dept && <><ChevronRight className="w-4 h-4 text-slate-400" /><button onClick={() => setMuni(null)} className={`font-semibold ${muni ? 'text-blue-700 hover:text-blue-900' : 'text-slate-800'}`}>{dept}</button></>}
      {muni && <><ChevronRight className="w-4 h-4 text-slate-400" /><span className="font-semibold text-slate-800 capitalize">{muni.toLowerCase()}</span></>}
    </div>
  );

  // Nivel 3: puestos (mapa oscuro)
  if (muni) {
    const list = (byMuni[norm(muni)] || []);
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between"><Breadcrumb /><span className="text-xs text-slate-400">{list.length} puestos</span></div>
        <MapView puestos={list} compareCandidates={compareCandidates} targetCandidate={targetCandidate} planillas={planillas} maxVotesGlobal={maxVotesGlobal} focusedPuesto={focusedPuesto} onSelectPuesto={onSelectPuesto} />
      </div>
    );
  }

  // Nivel 2: municipios del departamento
  if (dept) {
    const muniGeo = MUNI_BY_DEPT[norm(dept)];
    if (muniGeo) {
      return (
        <div className="space-y-3">
          <Breadcrumb />
          <Frame title={`${dept} — selecciona un municipio`}>
            <Choropleth features={muniGeo.features}
              statusOf={(name) => { const l = byMuni[norm(name)] || []; return { data: l.some(x => (x.resultados || []).length > 0), count: l.length, pick: l.length > 0 }; }}
              onPick={(name) => setMuni(name)} maxW={560} />
          </Frame>
        </div>
      );
    }
    // sin geojson de municipios: ir directo a puestos del departamento
    const list = byDept[norm(dept)] || [];
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between"><Breadcrumb /><span className="text-xs text-slate-400">{list.length} puestos</span></div>
        <MapView puestos={list} compareCandidates={compareCandidates} targetCandidate={targetCandidate} planillas={planillas} maxVotesGlobal={maxVotesGlobal} focusedPuesto={focusedPuesto} onSelectPuesto={onSelectPuesto} />
      </div>
    );
  }

  // Nivel 1: nacional
  return (
    <Frame title="Colombia — selecciona un departamento">
      <Choropleth features={depGeo.features}
        statusOf={(name) => { const l = byDept[norm(name)] || []; return { data: l.some(x => (x.resultados || []).length > 0), count: l.length, pick: l.length > 0 }; }}
        onPick={(name) => setDept(name)} maxW={520} />
    </Frame>
  );
};
