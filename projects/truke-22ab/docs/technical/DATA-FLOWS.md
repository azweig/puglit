# Flujos de Datos de Truke

## Flujo de Creación de Match
```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Backend
    participant Database

    User->>Frontend: Solicita crear match
    Frontend->>Backend: POST /api/match
    Backend->>Database: Verifica mutuo deslizamiento
    Database-->>Backend: Confirmación
    Backend-->>Frontend: Match creado
    Frontend-->>User: Notificación de match
```

## Flujo de Chat
```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Backend
    participant Database

    User->>Frontend: Inicia chat
    Frontend->>Backend: Envía mensaje
    Backend->>Database: Guarda mensaje
    Database-->>Backend: Confirmación
    Backend-->>Frontend: Mensaje enviado
    Frontend-->>User: Mensaje entregado
```
