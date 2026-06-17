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
        "a": "Empezás gratis y después un plan mensual simple. Cancelás cuando quieras.",
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
      "headline": "Reservá online",
      "ctaPrimary": "Empezar gratis",
      "subheadline": "Reservá libros de tu biblioteca local y recibí avisos cuando estén disponibles",
      "ctaSecondary": "Ver precios"
    },
    "finalCta": {
      "button": "Empezar gratis",
      "headline": "¿List@ para probar BookNook?"
    },
    "valueProps": [
      {
        "body": "Viene en BookNook desde el día uno — sin código pegamento.",
        "title": "Reservá online"
      },
      {
        "body": "Funciona solo, para que te enfoques en tus usuarios.",
        "title": "Avisos de disponibilidad"
      },
      {
        "body": "Confiable, seguro y listo para escalar.",
        "title": "Historial de lectura"
      }
    ],
    "socialProof": "Hecho para lectores."
  },
  "modules": {},
  "entities": [
    {
      "name": "Book",
      "fields": [
        {
          "name": "title",
          "type": "text",
          "required": true
        },
        {
          "name": "author",
          "type": "text",
          "required": true
        },
        {
          "name": "isbn",
          "type": "text",
          "required": true
        },
        {
          "name": "available",
          "type": "bool",
          "required": true
        }
      ],
      "plural": "Books",
      "ownedByUser": true
    },
    {
      "name": "Reservation",
      "fields": [
        {
          "name": "book_id",
          "type": "int",
          "required": true
        },
        {
          "name": "user_id",
          "type": "int",
          "required": true
        },
        {
          "name": "reservation_date",
          "type": "datetime",
          "required": true
        },
        {
          "name": "status",
          "type": "enum",
          "required": true,
          "enumValues": [
            "pending",
            "available",
            "completed",
            "canceled"
          ]
        }
      ],
      "plural": "Reservations",
      "ownedByUser": true
    },
    {
      "name": "Notification",
      "fields": [
        {
          "name": "reservation_id",
          "type": "int",
          "required": true
        },
        {
          "name": "notification_date",
          "type": "datetime",
          "required": true
        },
        {
          "name": "message",
          "type": "longtext",
          "required": true
        },
        {
          "name": "is_read",
          "type": "bool",
          "required": true
        }
      ],
      "plural": "Notifications",
      "ownedByUser": true
    },
    {
      "name": "ReadingHistory",
      "fields": [
        {
          "name": "book_id",
          "type": "int",
          "required": true
        },
        {
          "name": "user_id",
          "type": "int",
          "required": true
        },
        {
          "name": "read_date",
          "type": "date",
          "required": true
        },
        {
          "name": "rating",
          "type": "int",
          "required": false
        }
      ],
      "plural": "ReadingHistories",
      "ownedByUser": true
    }
  ],
  "identity": {
    "name": "BookNook",
    "domain": "booknook.app",
    "logoSvg": "<svg viewBox=\"0 0 64 64\" xmlns=\"http://www.w3.org/2000/svg\" fill=\"none\">\n  <path d=\"M20 16c-4 0-8 2-8 6v20c0 4 4 6 8 6h24c4 0 8-2 8-6V22c0-4-4-6-8-6H20z\" fill=\"#7C3AED\"/>\n  <path d=\"M32 16c4 0 8 2 8 6v20c0 4-4 6-8 6\" fill=\"#F59E0B\"/>\n  <path d=\"M32 16c-4 0-8 2-8 6v20c0 4 4 6 8 6\" fill=\"#F59E0B\"/>\n</svg>",
    "palette": [
      {
        "hex": "#7C3AED",
        "label": "Primary"
      },
      {
        "hex": "#312E81",
        "label": "Secondary"
      },
      {
        "hex": "#F59E0B",
        "label": "Accent"
      },
      {
        "hex": "#FFFFFF",
        "label": "Bg"
      },
      {
        "hex": "#111827",
        "label": "Text"
      }
    ],
    "tagline": "Reservá libros de tu biblioteca local y recibí avisos cuando estén disponibles",
    "languages": [
      "es"
    ],
    "brandColor": "#7C3AED",
    "accentColor": "#F59E0B",
    "logoConcept": "un libro abierto",
    "targetMarkets": [],
    "secondaryColor": "#312E81"
  },
  "platforms": {
    "web": true,
    "admin": true
  },
  "monetization": {
    "model": "freemium",
    "plans": [
      {
        "id": "free",
        "features": [
          "Funciones principales",
          "Soporte de la comunidad"
        ],
        "priceUsd": 0
      },
      {
        "id": "pro",
        "features": [
          "Reservá online",
          "Avisos de disponibilidad",
          "Historial de lectura",
          "Soporte prioritario"
        ],
        "interval": "month",
        "priceUsd": 9,
        "highlight": true
      },
      {
        "id": "anual",
        "features": [
          "Todo lo de Pro",
          "2 meses gratis"
        ],
        "interval": "year",
        "priceUsd": 90
      }
    ],
    "providers": [
      "stripe"
    ]
  }
}
export default config
