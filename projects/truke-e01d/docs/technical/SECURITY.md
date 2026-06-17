# Seguridad de Truke

## Modelo de Amenazas
1. **Acceso no autorizado**: Uso indebido de tokens JWT para acceder a recursos protegidos.
2. **Inyección SQL**: Intentos de manipular consultas SQL a través de entradas de usuario.
3. **Fuga de datos**: Exposición de información sensible a través de endpoints no seguros.

## Matriz de Autorización
| Recurso | Acción | Rol Requerido |
|---------|--------|---------------|
| Ítem    | Crear  | Usuario       |
| Match   | Crear  | Usuario       |
| Chat    | Enviar | Usuario       |

## RLS (Row-Level Security)
- Implementado en PostgreSQL para asegurar que los usuarios solo puedan acceder a sus propios datos.

## Limitación de Tasa
- Implementación de limitación de tasa para proteger contra ataques de fuerza bruta en los endpoints de autenticación.

## Manejo de Datos
- Los datos sensibles como contraseñas se almacenan de forma segura utilizando algoritmos de hash.
- Los tokens JWT se generan con claves secretas seguras y tienen un tiempo de expiración limitado.