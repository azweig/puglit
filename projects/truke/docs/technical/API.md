# API de Truke

## Endpoint: Creación de Match

### POST /api/matches
- **Método**: POST
- **Ruta**: /api/matches
- **Autenticación**: Requerida (Token Bearer)

### Solicitud
```json
{
  "itemId": number,
  "userId": number
}
```

### Respuesta
- **Estado**: 201 Created
```json
{
  "matchId": number,
  "itemId": number,
  "userId1": number,
  "userId2": number,
  "matchDate": "Date"
}
```

### Reglas de Acceso
- El usuario debe estar autenticado.
- El item debe estar disponible.
- El usuario no puede hacer match con su propio item.