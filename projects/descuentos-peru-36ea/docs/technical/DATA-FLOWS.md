# Data Flows

## Key User/Data Flows

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Backend
    participant Database

    User->>Frontend: Inicia sesión
    Frontend->>Backend: Solicitud de autenticación
    Backend->>Frontend: JWT
    Frontend->>User: Usuario autenticado

    User->>Frontend: Solicita descuentos
    Frontend->>Backend: POST /api/v1/user-discounts
    Backend->>Database: Consulta programas de lealtad y ubicación
    Database-->>Backend: Resultados de descuentos
    Backend->>Frontend: Lista de descuentos
    Frontend->>User: Muestra descuentos
```

Este diagrama describe el flujo de datos desde que un usuario inicia sesión hasta que recibe una lista de descuentos basada en sus programas de lealtad y ubicación actual.