# Flujos de Datos

## Diagrama de Secuencia: Solicitud de Beneficios Cercanos

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Backend
    participant GeoModule
    participant EngineModule
    participant Database

    User->>Frontend: Solicitud de beneficios cercanos
    Frontend->>Backend: POST /api/v1/benefits/nearby
    Backend->>GeoModule: Calcular distancias
    GeoModule->>Database: Consultar ubicaciones
    Database-->>GeoModule: Ubicaciones cercanas
    GeoModule-->>Backend: Distancias calculadas
    Backend->>EngineModule: Procesar beneficios
    EngineModule->>Database: Consultar beneficios y billetera
    Database-->>EngineModule: Datos de beneficios y billetera
    EngineModule-->>Backend: Beneficios relevantes
    Backend-->>Frontend: Respuesta con beneficios
    Frontend-->>User: Mostrar beneficios
```

Este flujo describe cómo un usuario interactúa con la aplicación para obtener beneficios cercanos basados en su ubicación y "Mi Billetera".