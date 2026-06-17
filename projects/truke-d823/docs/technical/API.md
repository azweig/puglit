# Documentación de la API

## Endpoints

### Crear Match
**POST /api/matches**

- **Descripción**: Crea un nuevo match entre dos usuarios basado en el interés mutuo en ítems.
- **Cuerpo de la Solicitud**:
  - `item_id`: número (ID del ítem de interés)
  - `matched_user_id`: número (ID del usuario propietario del ítem)
- **Respuesta**:
  - `201 Created`
    - `match`: Match (El objeto match recién creado)
- **Autenticación**: Requerida (Token Bearer)
- **Gating**: Los usuarios solo pueden crear matches si están autenticados y no han hecho match previamente en el mismo ítem con el mismo usuario.