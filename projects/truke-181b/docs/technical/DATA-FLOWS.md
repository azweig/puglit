# Flujos de Datos de Truke

## Flujo de Creación de Match
```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Backend
    participant Database

    User->>Frontend: Desliza item
    Frontend->>Backend: POST /api/matches
    Backend->>Database: Insertar nuevo match
    Database-->>Backend: Confirmación de inserción
    Backend-->>Frontend: Respuesta 201 Created
    Frontend-->>User: Notificación de match creado
```

## Flujo de Chat
```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Backend
    participant Database

    User->>Frontend: Envía mensaje de chat
    Frontend->>Backend: POST /api/chats
    Backend->>Database: Guardar mensaje
    Database-->>Backend: Confirmación de inserción
    Backend-->>Frontend: Respuesta 201 Created
    Frontend-->>User: Mensaje enviado
```