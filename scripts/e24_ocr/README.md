# Extracción E-24 (Concejo Cartagena 2023) → base de datos

Pipeline que lee los formularios **E-24 CON** escaneados (carpeta `e24/`), extrae los
votos por candidato usando la columna **"Total Puesto"** y los cruza con los códigos
`zona-puesto` de `src/data/resultados_oficiales.json`.

## Cómo funciona
1. `e24parse.py` — parser por página: detecta la grilla con OpenCV, ubica la columna
   "Total Puesto" y las etiquetas Zona/Puesto (OCR con tesserocr), y lee candidato→votos.
   Maneja hojas que abarcan varios puestos (varias columnas de total).
2. `run_batch.py` — corre el parser sobre todos los PDFs con checkpoint reanudable
   (`e24_ckpt.json`). En este entorno se procesó en lotes; localmente corre de una sola vez.
3. `consolidate.py` — carry-forward de zona, agrega votos por candidato/puesto.
4. `build_db.py` — canonicaliza nombres (rapidfuzz), descarta valores OCR implausibles
   (>3000), cruza con la metadata de puestos y genera `resultados_e24.json`
   (mismo esquema que `resultados_oficiales.json`).

## Dependencias
`pip install pymupdf opencv-python-headless pillow tesserocr rapidfuzz`
más `tesseract-ocr` y `libtesseract-dev` del sistema.

## Notas de precisión
Los E-24 son escaneos a 300 dpi. Los valores de alta confianza son correctos
(validados p.ej. puesto 08-05: 41/51/48). Puede haber errores puntuales en celdas
tenues; conviene una revisión por muestreo antes de usos oficiales.
