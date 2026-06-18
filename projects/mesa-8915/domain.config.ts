export * from "./domain-types"
import type { DomainConfig } from "./domain-types"
const config: DomainConfig = {
  "infra": {
    "deploy": "fly",
    "emailProvider": "resend"
  },
  "landing": {
    "faq": [
      {
        "a": "Empezás gratis y después $29/mes. Cancelás cuando quieras.",
        "q": "¿Cuánto cuesta?"
      },
      {
        "a": "Sí — en un clic, sin preguntas.",
        "q": "¿Puedo cancelar cuando quiera?"
      },
      {
        "a": "Sí. Tus datos son tuyos y los podés exportar.",
        "q": "¿Mis datos son míos?"
      }
    ],
    "hero": {
      "headline": "Reservas online 24/7",
      "ctaPrimary": "Empezar gratis",
      "subheadline": "Una webapp de reservas para restaurantes: el comensal reserva online y el local gestiona su salón y turnos.",
      "ctaSecondary": "Ver precios"
    },
    "finalCta": {
      "button": "Empezar gratis",
      "headline": "¿List@ para probar Mesa?"
    },
    "valueProps": [
      {
        "body": "Viene en Mesa desde el día uno — sin código pegamento.",
        "title": "Reservas online 24/7"
      },
      {
        "body": "Funciona solo, para que te enfoques en tus usuarios.",
        "title": "Menos no-shows con recordatorios"
      },
      {
        "body": "Confiable, seguro y listo para escalar.",
        "title": "Panel de salón en tiempo real"
      }
    ],
    "socialProof": "Hecho para Dueños de restaurantes y sus comensales.."
  },
  "modules": {
    "payments": true,
    "profiling": true,
    "emailLifecycle": true
  },
  "entities": [
    {
      "name": "Restaurant",
      "fields": [
        {
          "name": "name",
          "type": "text",
          "required": true
        },
        {
          "name": "phone",
          "type": "text",
          "required": false
        },
        {
          "name": "address",
          "type": "text",
          "required": false
        },
        {
          "name": "opening_hours",
          "type": "json",
          "required": false
        }
      ],
      "plural": "Restaurants",
      "ownedByUser": true
    },
    {
      "name": "Table",
      "fields": [
        {
          "name": "restaurant_id",
          "type": "text",
          "required": true
        },
        {
          "name": "name",
          "type": "text",
          "required": true
        },
        {
          "name": "capacity",
          "type": "int",
          "required": true
        },
        {
          "name": "zone",
          "type": "text",
          "required": false
        }
      ],
      "plural": "Tables",
      "ownedByUser": true
    },
    {
      "name": "Reservation",
      "fields": [
        {
          "name": "restaurant_id",
          "type": "text",
          "required": true
        },
        {
          "name": "guest_name",
          "type": "text",
          "required": true
        },
        {
          "name": "guest_phone",
          "type": "text",
          "required": false
        },
        {
          "name": "guest_email",
          "type": "email",
          "required": false
        },
        {
          "name": "reservation_at",
          "type": "datetime",
          "required": true
        }
      ],
      "plural": "Reservations",
      "ownedByUser": true
    },
    {
      "name": "Shift",
      "fields": [
        {
          "name": "restaurant_id",
          "type": "text",
          "required": true
        },
        {
          "name": "name",
          "type": "text",
          "required": true
        },
        {
          "name": "start_time",
          "type": "datetime",
          "required": true
        },
        {
          "name": "end_time",
          "type": "datetime",
          "required": true
        },
        {
          "name": "status",
          "type": "enum",
          "required": true,
          "enumValues": [
            "active",
            "inactive"
          ]
        }
      ],
      "plural": "Shifts",
      "ownedByUser": true
    }
  ],
  "identity": {
    "name": "Mesa",
    "domain": "mesa.app",
    "logoSvg": "<svg viewBox=\"0 0 64 64\" xmlns=\"http://www.w3.org/2000/svg\">\n  <rect x=\"8\" y=\"16\" width=\"20\" height=\"32\" fill=\"#E11D48\"/>\n  <rect x=\"36\" y=\"16\" width=\"20\" height=\"32\" fill=\"#E11D48\"/>\n  <rect x=\"30\" y=\"16\" width=\"4\" height=\"32\" fill=\"#FB7185\"/>\n</svg>",
    "palette": [
      {
        "hex": "#E11D48",
        "label": "primary - rosa intenso para acciones principales y marca"
      },
      {
        "hex": "#9F1239",
        "label": "primaryDark - énfasis, hover y navegación activa"
      },
      {
        "hex": "#FB7185",
        "label": "primaryLight - fondos suaves, badges y estados destacados"
      },
      {
        "hex": "#0F766E",
        "label": "secondary - confianza operativa para estados confirmados"
      },
      {
        "hex": "#F59E0B",
        "label": "accent - alertas, próximos turnos y llamados de atención"
      },
      {
        "hex": "#FFF7ED",
        "label": "background - fondo cálido inspirado en hospitalidad"
      },
      {
        "hex": "#FFFFFF",
        "label": "surface - tarjetas, modales y paneles del dashboard"
      },
      {
        "hex": "#1F2937",
        "label": "text - texto principal de alta legibilidad"
      }
    ],
    "tagline": "Una webapp de reservas para restaurantes: el comensal reserva online y el local gestiona su salón y turnos.",
    "languages": [
      "es"
    ],
    "brandColor": "#E11D48",
    "accentColor": "#FB7185",
    "logoConcept": "Una M formada por dos mesas vistas desde arriba y una línea central que sugiere el pasillo del salón.",
    "logoMonogram": "M",
    "targetMarkets": [],
    "secondaryColor": "#9F1239"
  },
  "platforms": {
    "web": true,
    "admin": true
  },
  "monetization": {
    "model": "subscription",
    "plans": [
      {
        "id": "pro",
        "features": [
          "Reservas online 24/7",
          "Menos no-shows con recordatorios",
          "Panel de salón en tiempo real",
          "Soporte prioritario"
        ],
        "interval": "month",
        "priceUsd": 29,
        "highlight": true
      },
      {
        "id": "anual",
        "features": [
          "Todo lo de Pro",
          "2 meses gratis"
        ],
        "interval": "year",
        "priceUsd": 290
      }
    ],
    "providers": [
      "stripe"
    ]
  }
}
export default config
