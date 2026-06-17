# API de Truke

## Endpoints

### Crear un Match
- **Método**: POST
- **Ruta**: /api/match
- **Request**: `CreateMatchRequest`
  ```json
  {
    "itemId": number,
    "matchedUserId": number
  }
  ```
- **Response**: `CreateMatchResponse`
  ```json
  {
    "matchId": number,
    "itemId": number,
    "matchedUserId": number,
    "matchDate": "Date"
  }
  ```
- **Autenticación**: Requerida (El usuario debe estar autenticado)
- **Gating**: Se requiere deslizamiento mutuo para la creación del match.

## Autenticación
La API utiliza JWT para la autenticación. Los usuarios deben proporcionar un token válido en el encabezado de autorización para acceder a los endpoints protegidos.

## Gating
La creación de un match está sujeta a que ambos usuarios hayan deslizado a la derecha en los objetos del otro, asegurando el interés mutuo antes de permitir la interacción.