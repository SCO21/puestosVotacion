import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

/**
 * Extrae texto y estructuras de voto desde un archivo PDF (Formatos E-14, E-24 o reportes de escrutinio).
 * @param {File} file 
 * @returns {Promise<Array>} Puestos actualizados o datos extraídos del PDF
 */
export const parsePdfResults = async (file) => {
  return new Promise(async (resolve, reject) => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      let fullText = '';
      const pagesText = [];

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageItems = textContent.items.map(item => item.str).join(' ');
        pagesText.push(pageItems);
        fullText += pageItems + '\n';
      }

      console.log(`PDF Procesado: ${pdf.numPages} páginas leídas.`);

      // Intentar identificar nombres de puestos, candidatos y números de votos en el texto extraído
      const lines = fullText.split('\n');
      const votesMap = new Map();
      let currentPuestoName = null;

      // Expresiones regulares comunes en reportes de escrutinio (E-14/E-24)
      const candidateRegex = /(CAMILA|JULIANA|ALONSO|MARIA PAULA|MIGUEL|ANDRES|SILVIO|MAYRA|DAIRO|JOSE|YOLANDA|ABELARDO|CEPEDA|CENTRO DEMOCRATICO|PACTO HISTORICO|VOTOS EN BLANCO)\s*[:=\-]?\s*(\d+)/gi;

      lines.forEach(line => {
        // Buscar encabezados de puesto
        if (line.toLowerCase().includes('puesto') || line.toLowerCase().includes('colegio') || line.toLowerCase().includes('i.e.')) {
          currentPuestoName = line.trim();
        }

        let match;
        while ((match = candidateRegex.exec(line)) !== null) {
          const candName = match[1].toUpperCase();
          const votes = parseInt(match[2], 10);

          if (!votesMap.has(candName)) {
            votesMap.set(candName, 0);
          }
          votesMap.set(candName, votesMap.get(candName) + votes);
        }
      });

      // Crear estructura procesada
      const resultsArray = Array.from(votesMap.entries()).map(([candidato_o_lista, votos]) => ({
        candidato_o_lista,
        votos
      }));

      resolve({
        numPages: pdf.numPages,
        rawText: fullText,
        extractedVotes: resultsArray
      });

    } catch (err) {
      console.error('Error al procesar archivo PDF:', err);
      reject(new Error('No se pudo leer el archivo PDF. Verifique que el archivo sea un reporte electoral válido.'));
    }
  });
};
