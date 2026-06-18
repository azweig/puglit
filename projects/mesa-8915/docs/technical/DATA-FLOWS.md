# Flujos de Datos

## Diagrama de Secuencia: Creación de Reserva

```mermaid
sequenceDiagram
    participant User as Comensal
    participant UI as Interfaz de Usuario
    participant API as Backend API
    participant DB as Base de Datos
    participant Email as Servicio de Correo

    User->>UI: Selecciona restaurante y turno
    UI->>API: Solicitud POST /public/restaurants/:restaurantId/reservations
    API->>DB: Validar disponibilidad de turno y mesa
    alt Disponibilidad
        DB-->>API: Confirmación de disponibilidad
        API->>DB: Crear reserva
        DB-->>API: Reserva creada
        API->>Email: Enviar correo de confirmación
        Email-->>User: Correo de confirmación recibido
    else Sin disponibilidad
        DB-->>API: Conflicto
        API-->>UI: Error 409 Conflicto
    end
```

Este diagrama muestra el flujo de datos desde que un comensal intenta realizar una reserva hasta que recibe una confirmación por correo electrónico.