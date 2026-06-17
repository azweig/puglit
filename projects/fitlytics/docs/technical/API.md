# API de Fitlytics

## Endpoints

### GET /api/v1/members/:id/predictions
- **Descripción**: Recupera predicciones para un miembro específico del gimnasio.
- **Método**: GET
- **Ruta**: /api/v1/members/:id/predictions

#### Solicitud
- **Parámetros de Ruta**:
  - `id`: número (ID del miembro)

#### Respuesta
- **Estado**: 200 OK
- **Cuerpo**: Array de objetos `Prediction`

#### Autenticación
- **Requerida**: Sí (Token Bearer)

#### Gating
- **Permiso Necesario**: `view_predictions`

### Ejemplo de Respuesta
```json
[
  {
    "id": 1,
    "member_id": 123,
    "predicted_date": "2023-10-01",
    "likelihood": 0.85
  },
  {
    "id": 2,
    "member_id": 123,
    "predicted_date": "2023-11-01",
    "likelihood": 0.75
  }
]
```
