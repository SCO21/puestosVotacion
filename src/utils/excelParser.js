import * as XLSX from 'xlsx';

/**
 * Parsea un archivo de Excel (.xlsx/.xls) o CSV cargado por el usuario
 * y lo convierte a la estructura esperada por resultados_oficiales.json.
 * 
 * Columnas soportadas en el Excel:
 * - puesto_id | id | codigo
 * - nombre_puesto | puesto | lugar
 * - direccion | ubicacion
 * - lat | latitud
 * - lng | longitud | lon
 * - cargo | corporacion
 * - candidato | candidato_o_lista
 * - votos | votos_candidato
 * - votos_totales_puesto | total_votos
 */
export const parseExcelResults = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawJson = XLSX.utils.sheet_to_json(worksheet);

        if (!rawJson || rawJson.length === 0) {
          throw new Error("El archivo no contiene filas de datos.");
        }

        // Agrupar por puesto si los candidatos vienen planos fila a fila
        const puestosMap = new Map();

        rawJson.forEach((row, idx) => {
          const puestoId = String(row.puesto_id || row.id || row.codigo || `PST-${idx + 1}`);
          const nombrePuesto = row.nombre_puesto || row.puesto || row.lugar || `Puesto ${puestoId}`;
          const direccion = row.direccion || row.ubicacion || 'Cartagena de Indias';
          const lat = parseFloat(row.lat || row.latitud || 10.3997);
          const lng = parseFloat(row.lng || row.longitud || row.lon || -75.5144);
          const cargo = row.cargo || row.corporacion || 'Alcaldía';
          const candidato = row.candidato || row.candidato_o_lista || 'CANDIDATO DE PRUEBA';
          const votos = parseInt(row.votos || row.votos_candidato || 0, 10);
          const votosTotalesExplicit = row.votos_totales_puesto || row.total_votos ? parseInt(row.votos_totales_puesto || row.total_votos, 10) : null;

          if (!puestosMap.has(puestoId)) {
            puestosMap.set(puestoId, {
              puesto_id: puestoId,
              nombre_puesto: nombrePuesto,
              direccion: direccion,
              lat: isNaN(lat) ? 10.3997 : lat,
              lng: isNaN(lng) ? -75.5144 : lng,
              cargo: cargo,
              votos_totales_puesto: votosTotalesExplicit || 0,
              resultadosMap: new Map()
            });
          }

          const currPuesto = puestosMap.get(puestoId);
          currPuesto.resultadosMap.set(candidato, (currPuesto.resultadosMap.get(candidato) || 0) + votos);
        });

        // Convertir Map a Array final
        const finalPuestos = Array.from(puestosMap.values()).map(p => {
          const resultados = Array.from(p.resultadosMap.entries()).map(([cand, vts]) => ({
            candidato_o_lista: cand,
            votos: vts
          }));

          const calculatedTotal = resultados.reduce((sum, item) => sum + item.votos, 0);

          return {
            puesto_id: p.puesto_id,
            nombre_puesto: p.nombre_puesto,
            direccion: p.direccion,
            lat: p.lat,
            lng: p.lng,
            cargo: p.cargo,
            votos_totales_puesto: p.votos_totales_puesto > 0 ? p.votos_totales_puesto : calculatedTotal,
            resultados
          };
        });

        resolve(finalPuestos);
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
};
