export * from "./domain-types"
import type { DomainConfig } from "./domain-types"
const config: DomainConfig = {
  "infra": {
    "deploy": "fly",
    "emailProvider": "resend"
  },
  "engine": {
    "kind": "ai",
    "output": "the product's core result",
    "description": "App de notas con recordatorios y etiquetas"
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
      "headline": "Notas rápidas",
      "ctaPrimary": "Empezar gratis",
      "subheadline": "App de notas con recordatorios y etiquetas",
      "ctaSecondary": "Ver precios"
    },
    "finalCta": {
      "button": "Empezar gratis",
      "headline": "¿List@ para probar Notely?"
    },
    "valueProps": [
      {
        "body": "Viene en Notely desde el día uno — sin código pegamento.",
        "title": "Notas rápidas"
      },
      {
        "body": "Funciona solo, para que te enfoques en tus usuarios.",
        "title": "Recordatorios"
      },
      {
        "body": "Confiable, seguro y listo para escalar.",
        "title": "Etiquetas"
      }
    ],
    "socialProof": "Hecho para gente organizada."
  },
  "modules": {
    "aiLayer": true
  },
  "entities": [
    {
      "name": "Note",
      "fields": [
        {
          "name": "title",
          "type": "text",
          "required": true
        },
        {
          "name": "body",
          "type": "longtext",
          "required": true
        },
        {
          "name": "created_at",
          "type": "datetime",
          "required": true
        },
        {
          "name": "updated_at",
          "type": "datetime",
          "required": false
        }
      ],
      "plural": "Notes",
      "ownedByUser": true
    },
    {
      "name": "Reminder",
      "fields": [
        {
          "name": "note_id",
          "type": "int",
          "required": true
        },
        {
          "name": "reminder_time",
          "type": "datetime",
          "required": true
        },
        {
          "name": "is_completed",
          "type": "bool",
          "required": true
        }
      ],
      "plural": "Reminders",
      "ownedByUser": true
    },
    {
      "name": "Tag",
      "fields": [
        {
          "name": "name",
          "type": "text",
          "required": true
        },
        {
          "name": "color",
          "type": "text",
          "required": false
        }
      ],
      "plural": "Tags",
      "ownedByUser": true
    }
  ],
  "identity": {
    "name": "Notely",
    "domain": "notely.app",
    "logoSvg": "<svg viewBox=\"0 0 64 64\" xmlns=\"http://www.w3.org/2000/svg\">\n  <path d=\"M16 8h32v48H16z\" fill=\"#8B5CF6\"/>\n  <path d=\"M48 8l-16 16h16z\" fill=\"#F59E0B\"/>\n</svg>",
    "palette": [
      {
        "hex": "#8B5CF6",
        "label": "P"
      },
      {
        "hex": "#1E1B4B",
        "label": "S"
      },
      {
        "hex": "#F59E0B",
        "label": "A"
      },
      {
        "hex": "#FFFFFF",
        "label": "B"
      },
      {
        "hex": "#111827",
        "label": "T"
      }
    ],
    "tagline": "App de notas con recordatorios y etiquetas",
    "languages": [
      "es"
    ],
    "brandColor": "#8B5CF6",
    "accentColor": "#F59E0B",
    "logoConcept": "una nota doblada",
    "targetMarkets": [],
    "secondaryColor": "#1E1B4B"
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
          "Notas rápidas",
          "Recordatorios",
          "Etiquetas",
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
