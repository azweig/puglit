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
        "a": "QueueA es gratis.",
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
      "subheadline": "app de prueba para QueueA",
      "ctaSecondary": "Ver precios"
    },
    "finalCta": {
      "button": "Empezar gratis",
      "headline": "¿List@ para probar QueueA?"
    },
    "valueProps": [
      {
        "body": "Viene en QueueA desde el día uno — sin código pegamento.",
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
          "name": "status",
          "type": "enum",
          "required": true,
          "enumValues": [
            "pending",
            "in_progress",
            "completed",
            "failed"
          ]
        },
        {
          "name": "due_date",
          "type": "date",
          "required": false
        },
        {
          "name": "queue_id",
          "type": "int",
          "required": true
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
          "name": "password_hash",
          "type": "text",
          "required": true
        },
        {
          "name": "created_at",
          "type": "datetime",
          "required": true
        }
      ],
      "plural": "Users",
      "ownedByUser": true
    }
  ],
  "identity": {
    "name": "QueueA",
    "domain": "queuea.app",
    "logoSvg": "<svg viewBox=\"0 0 64 64\" xmlns=\"http://www.w3.org/2000/svg\">\n  <circle cx=\"32\" cy=\"32\" r=\"30\" fill=\"#7C3AED\"/>\n  <path d=\"M32 16a16 16 0 1 0 0 32 16 16 0 1 0 0-32zm0 4a12 12 0 1 1 0 24 12 12 0 1 1 0-24z\" fill=\"#FFFFFF\"/>\n  <circle cx=\"32\" cy=\"32\" r=\"6\" fill=\"#7C3AED\"/>\n</svg>",
    "palette": [
      {
        "hex": "#7C3AED",
        "label": "P"
      }
    ],
    "tagline": "app de prueba para QueueA",
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
