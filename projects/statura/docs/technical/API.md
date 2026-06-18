# API de Statura

## Endpoints

### `GET /api/public/status-pages/:slug`

#### Descripción
Obtiene la página de estado pública completa por slug para visitantes no autenticados.

#### Solicitud
- **Método**: `GET`
- **Parámetros de Ruta**:
  ```ts
  type GetPublicStatusPageParams = {
    slug: Slug;
  };
  ```
- **Parámetros de Consulta**:
  ```ts
  type GetPublicStatusPageQuery = {
    checks_limit?: number; // default 20, max 100
    incident_limit?: number; // default 10, max 50
  };
  ```
- **Encabezados**:
  ```ts
  type GetPublicStatusPageHeaders = {
    host?: string; // used to resolve custom_domain if applicable
  };
  ```

#### Respuesta
- **`200 OK`**
  ```ts
  type GetPublicStatusPageResponse = PublicStatusPageResponse;
  ```
- **`404 Not Found`**
  ```ts
  type ErrorResponse = {
    error: {
      code: "STATUS_PAGE_NOT_FOUND" | "STATUS_PAGE_NOT_PUBLIC";
      message: string;
    };
  };
  ```

#### Autenticación
- **Ninguna.** Endpoint público.

#### Reglas de Acceso
- Solo devuelve páginas donde `is_public === true`.
- Resuelve la página por:
  1. `custom_domain` coincidente con el host de la solicitud, de lo contrario
  2. `slug` de la ruta.
- Solo incluye endpoints pertenecientes al `status_page_id` resuelto.
- Solo incluye incidentes pertenecientes al `status_page_id` resuelto.
- Solo incluye verificaciones de tiempo de actividad pertenecientes a los endpoints devueltos.
- La respuesta pública **no** debe exponer páginas internas/privadas, configuración de monitoreo o datos de propiedad/cuenta.
- Límite de tasa opcional: `60 req/min/IP`.