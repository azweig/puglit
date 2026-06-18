# Flujos de Datos en Mesa

## Diagrama de Secuencia: Creación de Reserva
```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Backend
    participant Database
    participant Stripe
    participant Resend

    User->>Frontend: Solicitud de reserva
    Frontend->>Backend: POST /v1/restaurants/{restaurantId}/reservations
    Backend->>Database: Verificar disponibilidad
    alt Disponibilidad confirmada
        Backend->>Database: Crear reserva
        Backend->>Stripe: Procesar pago (si aplica)
        Backend->>Resend: Enviar correo de confirmación
        Backend-->>Frontend: 201 Created (Reserva confirmada)
        Frontend-->>User: Mostrar confirmación
    else Sin disponibilidad
        Backend-->>Frontend: 409 Conflict
        Frontend-->>User: Mostrar error de disponibilidad
    end
```

Este diagrama describe el flujo de datos desde que un usuario intenta realizar una reserva hasta que recibe una confirmación o un mensaje de error.