import React, { useState } from 'react';
import { 
  Upload, 
  FileSpreadsheet, 
  FileText, 
  FileCode, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw 
} from 'lucide-react';
import { parseExcelResults } from '../utils/excelParser';
import { parsePdfResults } from '../utils/pdfParser';

export const DataUploader = ({
  isOpen,
  onClose,
  onUpdateResults,
  onUpdatePlanillas,
  onResetDefaultData
}) => {
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      if (file.name.endsWith('.pdf')) {
        const pdfData = await parsePdfResults(file);
        setSuccessMsg(`Documento PDF procesado correctamente! (${pdfData.numPages} páginas analizadas, ${pdfData.extractedVotes.length} candidatos/listas detectados).`);
      } else if (file.name.endsWith('.json')) {
        const text = await file.text();
        const parsed = JSON.parse(text);
        
        if (Array.isArray(parsed) && parsed[0]?.puesto_id) {
          onUpdateResults(parsed);
          setSuccessMsg(`Dataset JSON de Puestos cargado con éxito (${parsed.length} registros).`);
        } else if (Array.isArray(parsed) && parsed[0]?.lider_id) {
          onUpdatePlanillas(parsed);
          setSuccessMsg(`Dataset JSON de Planillas cargado con éxito (${parsed.length} registros).`);
        } else {
          throw new Error("El JSON no coincide con la estructura de puestos ni planillas.");
        }
      } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || file.name.endsWith('.csv')) {
        const parsedPuestos = await parseExcelResults(file);
        onUpdateResults(parsedPuestos);
        setSuccessMsg(`Archivo Excel procesado correctamente! ${parsedPuestos.length} puestos de votación cargados en el mapa.`);
      } else {
        throw new Error("Formato no soportado. Por favor suba un archivo Excel (.xlsx), PDF (.pdf) o JSON (.json)");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || "Ocurrió un error al procesar el archivo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[2000] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl shadow-2xl p-6 relative animate-fadeIn">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-emerald-500/20">
            <Upload className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-white font-heading">
            Cargar Datos de Escrutinio (Excel / PDF / JSON)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Soporta planillas de Excel (.xlsx/.csv), documentos PDF (E-14/E-24) o JSON.
          </p>
        </div>

        {/* Status Messages */}
        {successMsg && (
          <div className="mb-4 p-3 bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs rounded-xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="mb-4 p-3 bg-rose-950/60 border border-rose-800 text-rose-300 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Upload Drop Zone */}
        <label className="border-2 border-dashed border-slate-700 hover:border-emerald-500/50 bg-slate-950/60 hover:bg-slate-950 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all group">
          <div className="flex items-center gap-3 mb-3">
            <FileSpreadsheet className="w-8 h-8 text-emerald-400 group-hover:scale-110 transition-transform" />
            <FileText className="w-8 h-8 text-rose-400 group-hover:scale-110 transition-transform" />
            <FileCode className="w-8 h-8 text-cyan-400 group-hover:scale-110 transition-transform" />
          </div>
          <span className="text-sm font-semibold text-slate-200 group-hover:text-emerald-300">
            {loading ? 'Procesando archivo...' : 'Haga clic o arrastre su archivo aquí'}
          </span>
          <span className="text-[11px] text-slate-400 mt-1">
            Formatos soportados: Excel (.xlsx, .csv), PDF (.pdf) o JSON (.json)
          </span>
          <input
            type="file"
            accept=".xlsx,.xls,.csv,.pdf,.json"
            onChange={handleFileUpload}
            disabled={loading}
            className="hidden"
          />
        </label>

        {/* Instructions */}
        <div className="mt-6 pt-4 border-t border-slate-800 text-[11px] text-slate-400 space-y-1">
          <div className="font-semibold text-slate-300">Formatos permitidos:</div>
          <ul className="list-disc list-inside space-y-0.5 text-[10px]">
            <li><strong>Excel (.xlsx / .csv)</strong>: Columnas `puesto_id`, `nombre_puesto`, `lat`, `lng`, `candidato`, `votos`.</li>
            <li><strong>PDF (.pdf)</strong>: Reportes de escrutinio E-14 o E-24 oficiales.</li>
          </ul>
        </div>

        {/* Footer Controls */}
        <div className="mt-6 flex items-center justify-between gap-3">
          <button
            onClick={() => {
              onResetDefaultData();
              setSuccessMsg('Datos restaurados a los 137 puestos oficiales de Cartagena.');
            }}
            className="py-2 px-3 text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Restaurar 137 Puestos Cartagena
          </button>

          <button
            onClick={onClose}
            className="py-2 px-5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-semibold rounded-xl transition-all"
          >
            Aceptar
          </button>
        </div>

      </div>
    </div>
  );
};
