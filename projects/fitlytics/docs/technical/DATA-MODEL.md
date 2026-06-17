# Modelo de Datos de Fitlytics

## Diagrama ER
```mermaid
erDiagram
  Member {
    text name
    varchar email
    date join_date
    text status
  }
  Report {
    text title
    timestamptz generated_date
    text data
  }
  Prediction {
    integer member_id
    date predicted_date
    double precision likelihood
  }
  Member ||--o{ Prediction : ""
  Member ||--o{ Report : ""
```

## Descripción de Entidades y Relaciones
- **Member**: Representa a un socio del gimnasio. Incluye su nombre, correo electrónico, fecha de ingreso y estado.
- **Report**: Contiene información sobre los reportes generados, incluyendo el título, fecha de generación y los datos en formato JSON.
- **Prediction**: Almacena predicciones sobre la probabilidad de baja de un miembro, vinculadas a través del `member_id`.
- **Relaciones**:
  - Un `Member` puede tener múltiples `Predictions` y `Reports` asociados.
