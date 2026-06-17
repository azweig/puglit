# API de Truke

## Endpoint para Crear un Match

### POST /api/matches
- **Método**: POST
- **Ruta**: /api/matches
- **Autenticación**: Requerida (Token Bearer)
- **Gating**: El usuario debe estar autenticado

#### Cuerpo de la Solicitud
```json
{
  "itemId": number,
  "userId": number
}
```

#### Respuesta
- **Estado**: 201 Created
- **Cuerpo**: Match
```json
{
  "itemId": number,
  "userId": number,
  "matchedAt": string, // Formato ISO 8601
  "isActive": boolean
}
```

## Autenticación
- Todas las solicitudes a los endpoints protegidos requieren un token JWT válido.
- El token debe ser enviado en el encabezado de autorización como `Bearer <token>`.

## Gating
- Los usuarios deben estar autenticados para crear matches y enviar mensajes en el chat.