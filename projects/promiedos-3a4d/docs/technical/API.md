# API de Promiedos

## Endpoint: Obtener Datos de Fútbol en Vivo

### Método: GET

### Ruta: `/api/v1/live-football`

### Parámetros de Consulta:
- `date` (opcional): string (formato ISO 8601) - Filtrar partidos por fecha.
- `tournament` (opcional): string - Filtrar por nombre de torneo.

### Respuesta:
- **200 OK**: 
  ```json
  {
    "matches": [Match],
    "tournaments": [Tournament],
    "standings": [Standings],
    "topScorers": [Scorer]
  }
  ```
- **400 Bad Request**: 
  ```json
  { "error": "string" }
  ```
- **401 Unauthorized**: 
  ```json
  { "error": "string" }
  ```

### Autenticación:
- Requerida (Token Bearer)

### Limitación de Tasa:
- 100 solicitudes por hora por usuario.