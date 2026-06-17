# Seguridad de Descuentos Perú

## Modelo de Amenazas

1. **Acceso No Autorizado**: Riesgo de que usuarios no autorizados accedan a datos sensibles.
2. **Exposición de Datos**: Riesgo de que datos personales o de ubicación sean expuestos.
3. **Manipulación de Datos**: Riesgo de que datos de descuentos o programas de lealtad sean alterados maliciosamente.

## Matriz de Autorización

| Recurso | Acción | Rol | Descripción |
|---------|--------|-----|-------------|
| Descuentos | Ver | Usuario Autenticado | Los usuarios autenticados pueden ver descuentos cercanos. |
| Programas de Lealtad | Ver | Usuario Autenticado | Los usuarios autenticados pueden ver sus programas de lealtad. |

## Seguridad de la Base de Datos

- **RLS (Row-Level Security)**: Implementado para asegurar que los usuarios solo puedan acceder a sus propios datos de programas de lealtad.
- **Encriptación**: Datos sensibles como tokens JWT son encriptados.

## Limitación de Tasa

- Implementación de límites de tasa para prevenir abusos de la API.

## Manejo de Datos

- **Datos Personales**: Se minimiza el almacenamiento de datos personales, y se utilizan identificadores anónimos donde sea posible.
- **Ubicación**: La ubicación del usuario se maneja con cuidado, asegurando que solo se use para el propósito de encontrar descuentos.
