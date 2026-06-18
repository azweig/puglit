# Core Contract — “Nearby Best Benefits for My Wallet”



## 1) Core Types (TypeScript)

```ts
type ProviderType = "credit_card" | "telco";

type Benefit = {
  id: string;
  title: string;
  description: string;
  provider_type: ProviderType;
  category: string;
  terms_url: string;
};

type Location = {
  id: string;
  name: string;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
};

type WalletItem = {
  provider_name: string;
  provider_type: ProviderType;
  product_name: string;
  is_active: boolean;
};

type Merchant = {
  id: string;
  name: string;
  category: string;
  website_url: string;
  is_featured: boolean;
};

type GeoPoint = {
  latitude: number;
  longitude: number;
};

type NearbyBenefitMatch = {
  benefit: Benefit;
  merchant: Merchant;
  location: Location;
  distance_meters: number;
  wallet_matches: WalletItem[];
  is_eligible: boolean;
  relevance_score: number; // higher = better recommendation
};

type GetNearbyBenefitsRequest = {
  user_location: GeoPoint;
  radius_meters?: number; // default: 5000, max: 50000
  city?: string; // optional fallback/filter
  wallet: WalletItem[];
  category?: string;
  provider_types?: ProviderType[];
  only_eligible?: boolean; // default: true
  limit?: number; // default: 20, max: 100
};

type GetNearbyBenefitsResponse = {
  results: NearbyBenefitMatch[];
  meta: {
    total: number;
    radius_meters: number;
    generated_at: string; // ISO datetime
  };
};
```

---

## 2) Core Endpoint

### `POST /api/v1/benefits/nearby`

Returns the best nearby discounts/benefits based on the user’s current location and **Mi Billetera**.

#### Auth
- **No authentication required**

#### Gating
- Public endpoint
- Rate limit recommended:
  - **60 requests/minute per IP**
- Geographic/product gating:
  - Results should be limited to **Peru**
  - Only active wallet items should influence eligibility/relevance
  - If `only_eligible=true`, return only benefits matching at least one active `WalletItem`

---

## 3) Request

```ts
type RequestBody = GetNearbyBenefitsRequest;
```

### Example
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

---

## 4) Response

```ts
type ResponseBody = GetNearbyBenefitsResponse;
```

### Example
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

---

## 5) Errors

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

Common statuses:
- `400` invalid payload
- `403` location outside Peru
- `429` rate limited

---

## 6) Why this is the core feature
This single endpoint powers the main user value: **“qué beneficio me conviene usar aquí y ahora según mi ubicación y mi billetera.”**