# Seguridad de Statura

## Modelo de Amenazas
- **Exposición de Datos Privados**: Asegurar que solo se muestren páginas públicas.
- **Ataques de Denegación de Servicio**: Mitigado mediante limitación de tasa.
- **Manipulación de Datos**: Protección de integridad de datos mediante controles de acceso adecuados.

## Matriz de Autorización
- **Páginas de Estado Públicas**: Acceso sin autenticación.
- **Datos Internos**: No expuestos en endpoints públicos.

## RLS (Row-Level Security)
- No se aplica directamente, ya que los datos públicos no requieren restricciones de fila.

## Limitación de Tasa
- Implementar una limitación de tasa de `60 req/min/IP` para proteger contra abusos.

## Manejo de Datos
- **Datos Sensibles**: No se almacenan ni se exponen en la API pública.
- **Logs**: Se deben anonimizar para proteger la privacidad del usuario.