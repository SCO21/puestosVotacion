# Cartagena Electoral — SPA de Inteligencia y Mapa de Calor Político

**Cartagena Electoral** es una Single Page Application (SPA) privada desarrollada con **React, Vite, Tailwind CSS, Leaflet y Recharts**, diseñada para el análisis cartográfico, la auditoría electoral y la inteligencia política en la ciudad de Cartagena de Indias.

---

## 🚀 Características Principales

1. **Protección de Acceso (Login Gate)**:
   - Pantalla de bienvenida con clave fija configurable (predeterminada: `CARTAGENA2026`).
2. **Mapa de Calor y Círculos Proporcionales (CartoDB Dark Matter)**:
   - Centrado dinámicamente en Cartagena de Indias (`[10.3997, -75.5144]`).
   - Marcadores circulares con radio proporcional a los `votos_totales_puesto`.
   - **Semáforo cromático automático** según la posición del **Candidato Objetivo** seleccionado:
     - 🟢 **Verde**: 1er Lugar (Ganador local en el puesto).
     - 🟡 **Amarillo**: 2do o 3er Lugar (Podio).
     - 🔴 **Rojo**: Fuera del Top 3 (Zona crítica/refuerzo).
   - **Popup Interactivo Didáctico**: Muestra nombre del puesto, dirección, ganador local, mini-ranking del Top 3 con porcentajes y líder de campaña asignado.
3. **Auditoría de Campaña y Activistas**:
   - Cruce optimizado en memoria (`useMemo`) entre planillas de líderes (`planillas_campana.json`) y resultados reales por puesto (`resultados_oficiales.json`).
   - Cálculo automático del ratio de conversión (Votos / Activista).
4. **Módulo de Carga Directa de Excel / CSV**:
   - Interfaz drag-and-drop para cargar archivos de Excel (`.xlsx`) sin necesidad de tocar el código fuente.

---

## 📁 Estructura del Proyecto

```
cartagena-electoral/
├── public/
│   └── favicon.svg
├── src/
│   ├── components/
│   │   ├── LoginGate.jsx          # Paso 1: Autenticación por contraseña
│   │   ├── Navbar.jsx             # Barra superior con selectores de candidato, filtros y búsqueda
│   │   ├── MapView.jsx            # Paso 2: Mapa Leaflet interactivo Dark Matter
│   │   ├── DashboardStats.jsx     # Tarjetas KPI de resumen electoral
│   │   ├── CandidateRanking.jsx   # Gráficos Recharts (Top Puestos y Distribución Global)
│   │   ├── CampaignAudit.jsx      # Auditoría de rendimiento de líderes vs activistas
│   │   ├── DataUploader.jsx       # Modal para cargar archivos de Excel (.xlsx) o JSON
│   │   └── DetailModal.jsx        # Detalle completo de escrutinio por puesto
│   ├── data/
│   │   ├── resultados_oficiales.json  # Dataset de prueba (Puestos de Cartagena con coordenadas)
│   │   └── planillas_campana.json     # Dataset de prueba (Líderes y activistas)
│   ├── utils/
│   │   ├── electionAnalytics.js   # Algoritmos de clasificación, semáforo y radios
│   │   └── excelParser.js         # Lector de archivos Excel (.xlsx/.csv) client-side
│   ├── App.jsx                    # Orquestador principal de estado
│   ├── main.jsx                   # Punto de entrada Vite
│   └── index.css                  # Estilos globales, Tailwind CSS y overrides de Leaflet Dark
├── index.html
├── package.json
├── vite.config.js
└── README.md
```

---

## 📊 Instrucciones para Cargar / Actualizar Datos Reales (Excel o JSON)

### Opción A: Carga desde la Interfaz (Recomendada para Usuarios Finales)
1. En la barra superior de la aplicación, haga clic en el botón **"Cargar Excel / JSON"**.
2. Arrastre o seleccione su archivo de Excel (`.xlsx` o `.csv`).
3. El archivo debe contener las siguientes columnas (las cabeceras pueden estar en mayúsculas o minúsculas):
   - `puesto_id`: Identificador único del puesto (ej: `PST-001`).
   - `nombre_puesto`: Nombre del puesto de votación (ej: `I.E. Fernández Baena`).
   - `direccion`: Dirección física en Cartagena.
   - `lat`: Coordenada de Latitud decimal (ej: `10.4140`).
   - `lng`: Coordenada de Longitud decimal (ej: `-75.5280`).
   - `cargo`: Cargo a evaluar (ej: `Alcaldía`, `Gobernación`, `Concejo`).
   - `candidato`: Nombre del candidato o lista.
   - `votos`: Cantidad de votos obtenidos.
   - `votos_totales_puesto` (opcional): Total de votos depositados en la mesa.

---

### Opción B: Reemplazo Directo de Archivos JSON en Código

Si prefiere dejar los datos reales grabados permanentemente en la aplicación:

1. **Resultados Oficiales**:
   Ubicación del archivo: [src/data/resultados_oficiales.json](file:///c:/Users/Richard/Desktop/repositorios/mateo%20mapa%20de%20calor/src/data/resultados_oficiales.json)
   Reemplace el contenido respetando el esquema:
   ```json
   [
     {
       "puesto_id": "PST-001",
       "nombre_puesto": "Nombre del Puesto Real",
       "direccion": "Direccion Exacta",
       "lat": 10.4140,
       "lng": -75.5280,
       "cargo": "Alcaldía",
       "votos_totales_puesto": 8450,
       "resultados": [
         { "candidato_o_lista": "CANDIDATO A", "votos": 3200 },
         { "candidato_o_lista": "CANDIDATO B", "votos": 2800 }
       ]
     }
   ]
   ```

2. **Planillas de Campaña (Líderes)**:
   Ubicación del archivo: [src/data/planillas_campana.json](file:///c:/Users/Richard/Desktop/repositorios/mateo%20mapa%20de%20calor/src/data/planillas_campana.json)
   Reemplace el contenido respetando el esquema:
   ```json
   [
     {
       "lider_id": "LID-001",
       "nombre_lider": "Nombre del Líder Politico",
       "puesto_asignado_id": "PST-001",
       "num_activistas": 120
     }
   ]
   ```

---

## 🔑 Cambiar la Contraseña de Acceso

Para modificar la clave de autenticación estática:
1. Abra el archivo: [src/components/LoginGate.jsx](file:///c:/Users/Richard/Desktop/repositorios/mateo%20mapa%20de%20calor/src/components/LoginGate.jsx#L8)
2. Modifique la constante `DEFAULT_SECRET_KEY`:
   ```javascript
   const DEFAULT_SECRET_KEY = "TU_NUEVA_CLAVE_AQUI";
   ```

---

## 🛠️ Instalación y Ejecución Local

1. Instalar dependencias del proyecto:
   ```bash
   npm install
   ```

2. Iniciar el servidor de desarrollo:
   ```bash
   npm run dev
   ```
   Abra [http://localhost:5173](http://localhost:5173) en su navegador.

3. Compilar para producción:
   ```bash
   npm run build
   ```

---

## 🌐 Despliegue en Vercel

Este proyecto está 100% optimizado para **Vercel** (Client-side Rendering exclusivo sin backend):
1. Suba este repositorio a GitHub.
2. Inicie sesión en [Vercel](https://vercel.com) e importe el proyecto.
3. Vercel detectará Vite automáticamente (`Framework Preset: Vite`).
4. Haga clic en **Deploy**.
