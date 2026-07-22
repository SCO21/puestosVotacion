import React, { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LabelList
} from 'recharts';
import {
  Trophy, Crown, Target, MapPin, Swords, Layers, TrendingUp, Award, Flame, PieChart
} from 'lucide-react';
import { colorForCandidate, NO_DATA_COLOR } from '../utils/electionAnalytics';

const pct = (n, d) => (d > 0 ? ((n / d) * 100).toFixed(1) : '0.0');
const zonaOf = (id) => (id || '').split('-')[0];

export const StatsPanel = ({ puestos = [] }) => {
  const S = useMemo(() => {
    const withData = puestos.filter(p => (p.resultados || []).length > 0);

    // lista de candidatos presentes
    const names = [];
    withData.forEach(p => p.resultados.forEach(r => {
      if (r.candidato_o_lista && !names.includes(r.candidato_o_lista)) names.push(r.candidato_o_lista);
    }));

    const votesOf = (p, name) => {
      const r = (p.resultados || []).find(x => x.candidato_o_lista === name);
      return r ? (r.votos || 0) : 0;
    };
    const winnerOf = (p) => {
      const s = [...(p.resultados || [])].sort((a, b) => (b.votos || 0) - (a.votos || 0));
      if (!s.length || (s[0].votos || 0) === 0) return null;
      return s[0];
    };

    const grandTotal = withData.reduce((a, p) => a + p.resultados.reduce((s, r) => s + (r.votos || 0), 0), 0);

    // resumen por candidato
    const perCand = names.map(name => {
      let total = 0, first = 0, second = 0, third = 0, best = null;
      withData.forEach(p => {
        const v = votesOf(p, name);
        total += v;
        const ranks = [...p.resultados].sort((a, b) => (b.votos || 0) - (a.votos || 0));
        const idx = ranks.findIndex(r => r.candidato_o_lista === name);
        if (v > 0) {
          if (idx === 0) first++; else if (idx === 1) second++; else if (idx === 2) third++;
        }
        if (!best || v > best.votos) best = { votos: v, puesto: p };
      });
      return {
        name, total, first, second, third, best,
        avg: withData.length ? Math.round(total / withData.length) : 0,
        share: pct(total, grandTotal),
        color: colorForCandidate(name, names.indexOf(name))
      };
    }).sort((a, b) => b.total - a.total);

    // ganador por zona
    const zonas = {};
    withData.forEach(p => {
      const z = zonaOf(p.puesto_id);
      if (!zonas[z]) zonas[z] = { zona: z, cand: {}, puestos: 0, total: 0 };
      zonas[z].puestos++;
      names.forEach(n => { zonas[z].cand[n] = (zonas[z].cand[n] || 0) + votesOf(p, n); });
      zonas[z].total += p.resultados.reduce((s, r) => s + (r.votos || 0), 0);
    });
    const zonaRows = Object.values(zonas).map(z => {
      const rank = names.map(n => ({ n, v: z.cand[n] || 0 })).sort((a, b) => b.v - a.v);
      return { ...z, winner: rank[0].v > 0 ? rank[0].n : null, rank };
    }).sort((a, b) => a.zona.localeCompare(b.zona));

    // zonas ganadas por candidato
    const zonasWon = {};
    zonaRows.forEach(z => { if (z.winner) zonasWon[z.winner] = (zonasWon[z.winner] || 0) + 1; });

    // por localidad / comuna
    const locs = {};
    withData.forEach(p => {
      const key = (p.comuna || 'Sin localidad').toString().trim();
      if (!locs[key]) locs[key] = { loc: key, cand: {}, puestos: 0 };
      locs[key].puestos++;
      names.forEach(n => { locs[key].cand[n] = (locs[key].cand[n] || 0) + votesOf(p, n); });
    });
    const locRows = Object.values(locs).map(l => {
      const rank = names.map(n => ({ n, v: l.cand[n] || 0 })).sort((a, b) => b.v - a.v);
      const tot = rank.reduce((s, x) => s + x.v, 0);
      return { ...l, winner: rank[0].v > 0 ? rank[0].n : null, rank, tot };
    }).sort((a, b) => b.tot - a.tot);

    // ranking de puestos por votación (de los seleccionados)
    const rankingPuestos = [...withData].map(p => ({
      p, total: p.resultados.reduce((s, r) => s + (r.votos || 0), 0), winner: winnerOf(p)
    })).sort((a, b) => b.total - a.total);

    // puestos más reñidos (margen 1º-2º más pequeño, con votos)
    const competidos = withData.map(p => {
      const s = [...p.resultados].sort((a, b) => (b.votos || 0) - (a.votos || 0));
      if (s.length < 2 || (s[0].votos || 0) === 0) return null;
      return { p, margen: (s[0].votos || 0) - (s[1].votos || 0), first: s[0], second: s[1], total: s.reduce((x, r) => x + (r.votos || 0), 0) };
    }).filter(Boolean).sort((a, b) => a.margen - b.margen || b.total - a.total);

    // fortalezas por candidato (top 5 puestos)
    const fortalezas = names.map(name => ({
      name, color: colorForCandidate(name, names.indexOf(name)),
      top: [...withData].map(p => ({ p, v: votesOf(p, name) })).filter(x => x.v > 0).sort((a, b) => b.v - a.v).slice(0, 5)
    }));

    return {
      names, withData, sinData: puestos.length - withData.length, totalPuestos: puestos.length,
      grandTotal, perCand, zonaRows, zonasWon, locRows, rankingPuestos, competidos, fortalezas
    };
  }, [puestos]);

  if (!S.withData.length) {
    return <div className="text-slate-400 text-sm p-8 text-center">No hay datos de votación para analizar.</div>;
  }

  const Card = ({ children, className = '' }) => (
    <div className={`bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-lg ${className}`}>{children}</div>
  );
  const SectionTitle = ({ icon: Icon, children, hint }) => (
    <div className="flex items-center justify-between mb-3">
      <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
        <Icon className="w-4 h-4 text-cyan-400" /> {children}
      </h3>
      {hint && <span className="text-[10px] text-slate-500">{hint}</span>}
    </div>
  );

  const chartData = S.perCand.map(c => ({ name: c.name.split(' ').slice(0, 2).join(' '), total: c.total, color: c.color }));

  return (
    <div className="space-y-6 animate-fadeIn">

      {/* Tarjetas resumen por candidato */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {S.perCand.map((c, i) => (
          <Card key={c.name} className="relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1" style={{ backgroundColor: c.color }} />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                <span className="font-bold text-white truncate">{c.name}</span>
              </div>
              {i === 0 && <Crown className="w-4 h-4 text-amber-400 shrink-0" title="Más votos" />}
            </div>
            <div className="mt-3 flex items-end justify-between">
              <div>
                <div className="text-2xl font-extrabold text-white font-heading">{c.total.toLocaleString()}</div>
                <div className="text-[11px] text-slate-400">votos · {c.share}% del total</div>
              </div>
              <div className="text-right">
                <div className="text-lg font-extrabold" style={{ color: c.color }}>{c.first}</div>
                <div className="text-[10px] text-slate-400">puestos ganados</div>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              <div className="bg-slate-950/60 rounded-lg py-1.5">
                <div className="text-sm font-bold text-slate-200">{c.avg}</div>
                <div className="text-[9px] text-slate-500 uppercase">Promedio</div>
              </div>
              <div className="bg-slate-950/60 rounded-lg py-1.5">
                <div className="text-sm font-bold text-slate-200">{c.second}/{c.third}</div>
                <div className="text-[9px] text-slate-500 uppercase">2º / 3º</div>
              </div>
              <div className="bg-slate-950/60 rounded-lg py-1.5">
                <div className="text-sm font-bold text-slate-200">{S.zonasWon[c.name] || 0}</div>
                <div className="text-[9px] text-slate-500 uppercase">Zonas</div>
              </div>
            </div>
            {c.best && c.best.votos > 0 && (
              <div className="mt-3 text-[11px] text-slate-400 flex items-center gap-1">
                <Flame className="w-3 h-3 text-orange-400 shrink-0" />
                Mejor puesto: <span className="text-slate-200 font-semibold truncate">{c.best.puesto.nombre_puesto}</span>
                <span className="ml-auto font-bold" style={{ color: c.color }}>{c.best.votos}</span>
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Gráfico total por candidato + KPIs cobertura */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <SectionTitle icon={TrendingUp}>Votos totales por candidato</SectionTitle>
          <ResponsiveContainer width="100%" height={210}>
            <BarChart data={chartData} margin={{ top: 16, right: 16, left: 0, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={{ stroke: '#334155' }} tickLine={false} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip cursor={{ fill: '#1e293b55' }} contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 12, color: '#fff' }} formatter={(v) => [v.toLocaleString() + ' votos', 'Total']} />
              <Bar dataKey="total" radius={[8, 8, 0, 0]}>
                {chartData.map((d, i) => <Cell key={i} fill={d.color} />)}
                <LabelList dataKey="total" position="top" fill="#e2e8f0" fontSize={12} formatter={(v) => v.toLocaleString()} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card>
          <SectionTitle icon={PieChart}>Cobertura</SectionTitle>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-950/60 rounded-xl p-3">
              <div className="text-2xl font-extrabold text-white">{S.withData.length}</div>
              <div className="text-[11px] text-slate-400">puestos con datos</div>
            </div>
            <div className="bg-slate-950/60 rounded-xl p-3">
              <div className="text-2xl font-extrabold text-slate-400">{S.sinData}</div>
              <div className="text-[11px] text-slate-400">sin datos</div>
            </div>
            <div className="bg-slate-950/60 rounded-xl p-3">
              <div className="text-2xl font-extrabold text-white">{S.grandTotal.toLocaleString()}</div>
              <div className="text-[11px] text-slate-400">votos (3 candidatos)</div>
            </div>
            <div className="bg-slate-950/60 rounded-xl p-3">
              <div className="text-2xl font-extrabold text-white">{S.zonaRows.length}</div>
              <div className="text-[11px] text-slate-400">zonas con datos</div>
            </div>
          </div>
          <div className="mt-3 h-2 w-full rounded-full overflow-hidden bg-slate-800 flex">
            {S.perCand.map(c => (
              <div key={c.name} style={{ width: `${c.share}%`, backgroundColor: c.color }} title={`${c.name}: ${c.share}%`} />
            ))}
          </div>
          <div className="mt-1.5 text-[10px] text-slate-500">Reparto de votos entre los candidatos</div>
        </Card>
      </div>

      {/* Ganador por zona  +  Puestos más reñidos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <SectionTitle icon={Layers} hint={`${S.zonaRows.length} zonas`}>Ganador por zona</SectionTitle>
          <div className="max-h-80 overflow-y-auto -mx-1">
            <table className="w-full text-xs">
              <thead className="text-slate-500 uppercase text-[10px] sticky top-0 bg-slate-900">
                <tr><th className="text-left py-1.5 px-2">Zona</th><th className="text-left px-2">Ganador</th>
                  {S.names.map(n => <th key={n} className="text-right px-2">{n.split(' ')[1] || n.split(' ')[0]}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {S.zonaRows.map(z => (
                  <tr key={z.zona} className="hover:bg-slate-800/40">
                    <td className="py-1.5 px-2 font-mono text-slate-300">Zona {z.zona}</td>
                    <td className="px-2">
                      {z.winner
                        ? <span className="font-bold" style={{ color: colorForCandidate(z.winner) }}>{z.winner.split(' ')[0]} {z.winner.split(' ')[1] || ''}</span>
                        : <span className="text-slate-600">—</span>}
                    </td>
                    {S.names.map(n => (
                      <td key={n} className={`text-right px-2 ${z.winner === n ? 'font-bold text-white' : 'text-slate-400'}`}>
                        {(z.cand[n] || 0).toLocaleString()}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card>
          <SectionTitle icon={Swords} hint="menor margen 1º-2º">Puestos más reñidos</SectionTitle>
          <div className="max-h-80 overflow-y-auto space-y-2">
            {S.competidos.slice(0, 12).map(({ p, margen, first, second }, i) => (
              <div key={p.puesto_id} className="flex items-center gap-2 bg-slate-950/50 rounded-lg p-2">
                <span className="text-[10px] text-slate-500 w-5 shrink-0">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold text-slate-200 truncate">{p.nombre_puesto}</div>
                  <div className="text-[10px] text-slate-500">Zona {zonaOf(p.puesto_id)} · {p.puesto_id}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-[10px]">
                    <span style={{ color: colorForCandidate(first.candidato_o_lista) }} className="font-bold">{first.candidato_o_lista.split(' ')[0]}</span>
                    <span className="text-slate-500"> vs </span>
                    <span style={{ color: colorForCandidate(second.candidato_o_lista) }} className="font-bold">{second.candidato_o_lista.split(' ')[0]}</span>
                  </div>
                  <div className="text-[11px] font-extrabold text-white">margen {margen}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Fortalezas por candidato */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {S.fortalezas.map(f => (
          <Card key={f.name}>
            <SectionTitle icon={Award}>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: f.color }} />{f.name.split(' ').slice(0, 2).join(' ')}</span>
            </SectionTitle>
            <div className="space-y-1.5">
              {f.top.length === 0 && <div className="text-[11px] text-slate-500">Sin votos registrados.</div>}
              {f.top.map((x, i) => (
                <div key={x.p.puesto_id} className="flex items-center gap-2 text-xs">
                  <span className="w-4 h-4 rounded bg-slate-800 text-slate-300 text-[10px] font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                  <span className="truncate text-slate-300 flex-1">{x.p.nombre_puesto}</span>
                  <span className="font-bold shrink-0" style={{ color: f.color }}>{x.v}</span>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>

      {/* Ranking de puestos por votación total */}
      <Card>
        <SectionTitle icon={Trophy} hint={`${S.rankingPuestos.length} puestos`}>Ranking de puestos por votación (3 candidatos)</SectionTitle>
        <div className="max-h-96 overflow-y-auto -mx-1">
          <table className="w-full text-xs">
            <thead className="text-slate-500 uppercase text-[10px] sticky top-0 bg-slate-900">
              <tr>
                <th className="text-left py-1.5 px-2">#</th>
                <th className="text-left px-2">Puesto</th>
                <th className="text-left px-2">Zona</th>
                <th className="text-left px-2">Ganador local</th>
                <th className="text-right px-2">Total 3</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {S.rankingPuestos.slice(0, 40).map((r, i) => (
                <tr key={r.p.puesto_id} className="hover:bg-slate-800/40">
                  <td className="py-1.5 px-2 text-slate-500">{i + 1}</td>
                  <td className="px-2 text-slate-200 truncate max-w-[220px]">{r.p.nombre_puesto}</td>
                  <td className="px-2 font-mono text-slate-400">{r.p.puesto_id}</td>
                  <td className="px-2 font-semibold" style={{ color: r.winner ? colorForCandidate(r.winner.candidato_o_lista) : NO_DATA_COLOR }}>
                    {r.winner ? r.winner.candidato_o_lista.split(' ').slice(0, 2).join(' ') : '—'}
                  </td>
                  <td className="px-2 text-right font-bold text-white">{r.total.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Por localidad */}
      <Card>
        <SectionTitle icon={MapPin} hint={`${S.locRows.length} localidades`}>Votación por localidad / comuna</SectionTitle>
        <div className="max-h-80 overflow-y-auto -mx-1">
          <table className="w-full text-xs">
            <thead className="text-slate-500 uppercase text-[10px] sticky top-0 bg-slate-900">
              <tr>
                <th className="text-left py-1.5 px-2">Localidad</th>
                <th className="text-center px-2">Puestos</th>
                <th className="text-left px-2">Ganador</th>
                {S.names.map(n => <th key={n} className="text-right px-2">{n.split(' ')[1] || n.split(' ')[0]}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {S.locRows.map(l => (
                <tr key={l.loc} className="hover:bg-slate-800/40">
                  <td className="py-1.5 px-2 text-slate-300 truncate max-w-[220px]">{l.loc}</td>
                  <td className="px-2 text-center text-slate-400">{l.puestos}</td>
                  <td className="px-2 font-semibold" style={{ color: l.winner ? colorForCandidate(l.winner) : NO_DATA_COLOR }}>
                    {l.winner ? l.winner.split(' ').slice(0, 2).join(' ') : '—'}
                  </td>
                  {S.names.map(n => (
                    <td key={n} className={`text-right px-2 ${l.winner === n ? 'font-bold text-white' : 'text-slate-400'}`}>{(l.cand[n] || 0).toLocaleString()}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

    </div>
  );
};
