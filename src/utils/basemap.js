// Basemaps CARTO (raster). La API key elimina la marca de agua "API key required".
// Se puede sobreescribir con la variable de entorno VITE_CARTO_KEY (p. ej. en Vercel).
// Nota: las keys de basemaps raster viajan en la URL de cada tile (son visibles en el navegador);
// restrínjala por dominio desde el dashboard de CARTO.
export const CARTO_KEY = import.meta.env.VITE_CARTO_KEY || 'cb1_3ugv_1_99a822b1f4e7bcfbb3344bee';

export const cartoTileUrl = (style = 'dark_all') =>
  `https://{s}.basemaps.cartocdn.com/${style}/{z}/{x}/{y}{r}.png${CARTO_KEY ? `?key=${CARTO_KEY}` : ''}`;

export const CARTO_DARK_URL = cartoTileUrl('dark_all');

export const CARTO_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>';
