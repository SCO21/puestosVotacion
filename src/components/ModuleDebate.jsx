import React from 'react';
import { Vote, UploadCloud, LineChart, ListChecks } from 'lucide-react';

export const ModuleDebate = ({ debateLabel = 'debate actual' }) => (
  <div className="space-y-6 animate-fadeIn">
    <div className="bg-white border border-slate-200 rounded-2xl p-6 gov-shadow">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center"><Vote className="w-6 h-6" /></div>
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 font-heading">Resultados del debate actual</h2>
          <p className="text-sm text-slate-500">Consolidación en vivo de <span className="font-semibold text-slate-700">{debateLabel}</span> a medida que llegan los reportes.</p>
        </div>
      </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {[
        { icon: UploadCloud, t: 'Carga de reportes', d: 'Ingreso de actas / reportes por puesto conforme avanza el escrutinio.' },
        { icon: LineChart, t: 'Consolidado en vivo', d: 'Tendencia y avance por candidato y por zona a medida que se consolidan puestos.' },
        { icon: ListChecks, t: 'Comparación con proyección', d: 'Resultado real vs. votos esperados (Módulo de campaña) por puesto.' },
      ].map(({ icon: Icon, t, d }) => (
        <div key={t} className="bg-white border border-slate-200 rounded-2xl p-5 gov-shadow">
          <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center"><Icon className="w-5 h-5" /></div>
          <h3 className="font-bold text-slate-800 mt-3">{t}</h3>
          <p className="text-sm text-slate-500 mt-1.5">{d}</p>
        </div>
      ))}
    </div>

    <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-10 text-center">
      <p className="text-slate-500 text-sm">No hay un debate en curso cargado todavía. Cuando inicie un nuevo debate, aquí se consolidarán los resultados en tiempo real.</p>
    </div>
  </div>
);
