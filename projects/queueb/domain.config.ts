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
        "a": "QueueB es gratis.",
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
      "headline": "a",
      "ctaPrimary": "Empezar gratis",
      "subheadline": "app de prueba para QueueB",
      "ctaSecondary": "Ver precios"
    },
    "finalCta": {
      "button": "Empezar gratis",
      "headline": "¿List@ para probar QueueB?"
    },
    "valueProps": [
      {
        "body": "Viene en QueueB desde el día uno — sin código pegamento.",
        "title": "a"
      },
      {
        "body": "Funciona solo, para que te enfoques en tus usuarios.",
        "title": "b"
      },
      {
        "body": "Confiable, seguro y listo para escalar.",
        "title": "c"
      }
    ],
    "socialProof": "Hecho para users."
  },
  "modules": {},
  "entities": [
    {
      "name": "Queue",
      "fields": [
        {
          "name": "name",
          "type": "text",
          "required": true
        },
        {
          "name": "description",
          "type": "longtext",
          "required": false
        },
        {
          "name": "created_at",
          "type": "datetime",
          "required": true
        },
        {
          "name": "is_active",
          "type": "bool",
          "required": true
        }
      ],
      "plural": "Queues",
      "ownedByUser": true
    },
    {
      "name": "Task",
      "fields": [
        {
          "name": "title",
          "type": "text",
          "required": true
        },
        {
          "name": "details",
          "type": "longtext",
          "required": false
        },
        {
          "name": "due_date",
          "type": "date",
          "required": false
        },
        {
          "name": "status",
          "type": "enum",
          "required": true,
          "enumValues": [
            "pending",
            "in_progress",
            "completed",
            "canceled"
          ]
        }
      ],
      "plural": "Tasks",
      "ownedByUser": true
    },
    {
      "name": "User",
      "fields": [
        {
          "name": "email",
          "type": "email",
          "required": true
        },
        {
          "name": "full_name",
          "type": "text",
          "required": true
        },
        {
          "name": "joined_at",
          "type": "datetime",
          "required": true
        }
      ],
      "plural": "Users",
      "ownedByUser": true
    }
  ],
  "identity": {
    "name": "QueueB",
    "domain": "queueb.app",
    "logoSvg": "<svg viewBox=\"0 0 64 64\" xmlns=\"http://www.w3.org/2000/svg\">\n  <circle cx=\"32\" cy=\"32\" r=\"30\" fill=\"none\" stroke=\"#7C3AED\" stroke-width=\"4\"/>\n  <path d=\"M32 8 L48 32 L32 56 L16 32 Z\" fill=\"#7C3AED\"/>\n</svg>",
    "palette": [
      {
        "hex": "#7C3AED",
        "label": "P"
      }
    ],
    "tagline": "app de prueba para QueueB",
    "languages": [
      "es"
    ],
    "brandColor": "#7C3AED",
    "targetMarkets": []
  },
  "platforms": {
    "web": true,
    "admin": true
  },
  "monetization": {
    "model": "free",
    "plans": [
      {
        "id": "free",
        "features": [
          "Funciones principales",
          "Soporte de la comunidad"
        ],
        "priceUsd": 0
      }
    ],
    "providers": [
      "stripe"
    ]
  }
}
export default config
