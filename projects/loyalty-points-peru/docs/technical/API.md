# API

## Endpoint Principal

### `POST /api/v1/benefits/nearby`

Este endpoint devuelve los mejores descuentos/beneficios cercanos basados en la ubicación actual del usuario y "Mi Billetera".

#### Autenticación
- **No se requiere autenticación**

#### Gating
- Endpoint público
- Límite de tasa recomendado:
  - **60 solicitudes/minuto por IP**
- Limitación geográfica/producto:
  - Los resultados deben limitarse a **Perú**
  - Solo los elementos activos de la billetera deben influir en la elegibilidad/relevancia
  - Si `only_eligible=true`, devolver solo beneficios que coincidan con al menos un `WalletItem` activo

## Solicitud

```ts
type RequestBody = GetNearbyBenefitsRequest;
```

### Ejemplo
```json
{
  "user_location": {
    "latitude": -12.0464,
    "longitude": -77.0428
  },
  "radius_meters": 3000,
  "city": "Lima",
  "wallet": [
    {
      "provider_name": "BBVA",
      "provider_type": "credit_card",
      "product_name": "Visa Gold",
      "is_active": true
    },
    {
      "provider_name": "Movistar",
      "provider_type": "telco",
      "product_name": "Postpago",
      "is_active": true
    }
  ],
  "category": "restaurantes",
  "provider_types": ["credit_card", "telco"],
  "only_eligible": true,
  "limit": 20
}
```

## Respuesta

```ts
type ResponseBody = GetNearbyBenefitsResponse;
```

### Ejemplo
```json
{
  "results": [
    {
      "benefit": {
        "id": "ben_123",
        "title": "20% dscto. en consumo",
        "description": "Válido pagando con Visa Gold los fines de semana.",
        "provider_type": "credit_card",
        "category": "restaurantes",
        "terms_url": "https://example.com/terminos"
      },
      "merchant": {
        "id": "mer_456",
        "name": "La Trattoria",
        "category": "restaurantes",
        "website_url": "https://latrattoria.pe",
        "is_featured": true
      },
      "location": {
        "id": "loc_789",
        "name": "La Trattoria Miraflores",
        "address": "Av. Larco 123, Miraflores",
        "city": "Lima",
        "latitude": -12.1211,
        "longitude": -77.0297
      },
      "distance_meters": 850,
      "wallet_matches": [
        {
          "provider_name": "BBVA",
          "provider_type": "credit_card",
          "product_name": "Visa Gold",
          "is_active": true
        }
      ],
      "is_eligible": true,
      "relevance_score": 0.94
    }
  ],
  "meta": {
    "total": 1,
    "radius_meters": 3000,
    "generated_at": "2026-06-18T12:00:00Z"
  }
}
```

## Errores

```ts
type ErrorResponse = {
  error: {
    code:
      | "INVALID_REQUEST"
      | "OUTSIDE_PERU"
      | "RATE_LIMITED";
    message: string;
  };
};
```

Estados comunes:
- `400` payload inválido
- `403` ubicación fuera de Perú
- `429` límite de tasa alcanzado

## Importancia del Endpoint
Este único endpoint potencia el valor principal para el usuario: **“qué beneficio me conviene usar aquí y ahora según mi ubicación y mi billetera.”**