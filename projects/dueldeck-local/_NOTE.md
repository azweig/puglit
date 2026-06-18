# DuelDeck — salida CRUDA de Puglit corriendo 100% local (Ollama + gemma2:2b)

Estos son los archivos **tal cual los generaron los agentes** sobre un modelo local pequeño
(`gemma2:2b`, único que entra en 8 GB RAM). NO están corregidos a mano — es la salida real,
para inspección honesta.

Proceso: entrevista (agente) → spec (agente) → swarm de generación → 3 supervisiones — todo en Ollama.
Resultado del engine: 16 archivos · 5 tablas · 9 rutas · 3 páginas.

## Calidad (honesta): el 2b entiende el dominio pero el código está roto
- `sql/app.sql`: capta YuGiOh (cards con atk/def/atributo/tipo/level), pero usa `ENUM(...)` inline
  (sintaxis MySQL, inválida en Postgres) y tiene una coma colgante → no corre.
- Rutas: sin `export async function GET()`, sin importar `NextResponse`, gatea con auth un catálogo público.
- Carpetas `:id` en vez de `[id]` (sintaxis de ruta dinámica de Next).
- `app/page.tsx`: hooks fuera del componente + `useEffect` sin importar → no compila.
- Las 3 supervisiones dieron 0 hallazgos (el 2b no pudo ni revisar).

**Conclusión:** el sistema corrió entero en local; el limitante es el tamaño del modelo, no la
arquitectura. Con un modelo más fuerte (gemma2:27b / llama3.3, o un `premium` cloud) el código sale bien.
