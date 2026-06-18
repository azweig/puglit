# Seguridad

## Modelo de Amenazas

- **Exposición de Datos**: Aunque no se requiere autenticación, se debe asegurar que los datos de beneficios y ubicaciones no sean expuestos indebidamente.
- **Abuso de API**: Implementar límites de tasa para prevenir el abuso del endpoint público.
- **Manipulación de Datos**: Asegurar que las solicitudes sean válidas y no permitan inyecciones SQL o manipulación de datos.

## Matriz de Autorización

| Recurso       | Acción | Requiere Autenticación |
|---------------|--------|------------------------|
| /benefits/nearby | POST   | No                     |

## Row-Level Security (RLS)

No se implementa RLS ya que no hay datos sensibles asociados a usuarios individuales.

## Limitación de Tasa

- **60 solicitudes/minuto por IP**: Para prevenir el abuso del endpoint.

## Manejo de Datos

- **Datos de Ubicación**: Solo se utilizan para calcular distancias y no se almacenan permanentemente.
- **Datos de Beneficios**: Se almacenan en PostgreSQL y se accede a ellos de manera segura a través de consultas parametrizadas.