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
        "a": "Truke es gratis.",
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
      "headline": "Deslizá y descubrí cosas usadas cerca",
      "ctaPrimary": "Empezar gratis",
      "subheadline": "App tipo Tinder para intercambiar y regalar cosas usadas: deslizás fotos de objetos, publicás los tuyos, y si hay match mutuo chateás de forma anónima solo sobre los items que hicieron match.",
      "ctaSecondary": "Ver precios"
    },
    "finalCta": {
      "button": "Empezar gratis",
      "headline": "¿List@ para probar Truke?"
    },
    "valueProps": [
      {
        "body": "Viene en Truke desde el día uno — sin código pegamento.",
        "title": "Deslizá y descubrí cosas usadas cerca"
      },
      {
        "body": "Funciona solo, para que te enfoques en tus usuarios.",
        "title": "Match mutuo para intercambiar"
      },
      {
        "body": "Confiable, seguro y listo para escalar.",
        "title": "Chat anónimo solo del match"
      }
    ],
    "socialProof": "Hecho para Gente que quiere dar una segunda vida a sus cosas: ropa, libros, muebles, electrónica.."
  },
  "modules": {
    "geo": true
  },
  "entities": [
    {
      "name": "Item",
      "fields": [
        {
          "name": "title",
          "type": "text",
          "required": true
        },
        {
          "name": "description",
          "type": "longtext",
          "required": true
        },
        {
          "name": "image_url",
          "type": "url",
          "required": true
        },
        {
          "name": "location",
          "type": "text",
          "required": true
        },
        {
          "name": "created_at",
          "type": "datetime",
          "required": true
        }
      ],
      "plural": "Items",
      "ownedByUser": true
    },
    {
      "name": "Match",
      "fields": [
        {
          "name": "item_id",
          "type": "int",
          "required": true
        },
        {
          "name": "user_id",
          "type": "int",
          "required": true
        },
        {
          "name": "matched_at",
          "type": "datetime",
          "required": true
        },
        {
          "name": "is_active",
          "type": "bool",
          "required": true
        }
      ],
      "plural": "Matches",
      "ownedByUser": true
    },
    {
      "name": "Chat",
      "fields": [
        {
          "name": "match_id",
          "type": "int",
          "required": true
        },
        {
          "name": "message",
          "type": "longtext",
          "required": true
        },
        {
          "name": "sent_at",
          "type": "datetime",
          "required": true
        },
        {
          "name": "is_read",
          "type": "bool",
          "required": true
        }
      ],
      "plural": "Chats",
      "ownedByUser": true
    },
    {
      "name": "User",
      "fields": [
        {
          "name": "username",
          "type": "text",
          "required": true
        },
        {
          "name": "email",
          "type": "email",
          "required": true
        },
        {
          "name": "created_at",
          "type": "datetime",
          "required": true
        },
        {
          "name": "profile_picture",
          "type": "url",
          "required": false
        }
      ],
      "plural": "Users",
      "ownedByUser": true
    }
  ],
  "identity": {
    "name": "Truke",
    "domain": "truke.app",
    "logoSvg": "<svg viewBox=\"0 0 64 64\" xmlns=\"http://www.w3.org/2000/svg\">\n  <path d=\"M32 12 L24 20 L32 28\" fill=\"none\" stroke=\"#FF6F61\" stroke-width=\"4\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>\n  <path d=\"M32 28 L40 20 L32 12\" fill=\"none\" stroke=\"#FF6F61\" stroke-width=\"4\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>\n  <circle cx=\"32\" cy=\"20\" r=\"16\" fill=\"none\" stroke=\"#F5A623\" stroke-width=\"4\"/>\n</svg>",
    "palette": [
      {
        "hex": "#FF6F61",
        "label": "Primary"
      },
      {
        "hex": "#4A90E2",
        "label": "Secondary"
      },
      {
        "hex": "#F5A623",
        "label": "Accent"
      },
      {
        "hex": "#FFFFFF",
        "label": "Background"
      },
      {
        "hex": "#333333",
        "label": "Text"
      },
      {
        "hex": "#FF6F61",
        "label": "Primary Shade"
      },
      {
        "hex": "#4A90E2",
        "label": "Secondary Shade"
      },
      {
        "hex": "#F5A623",
        "label": "Accent Shade"
      }
    ],
    "tagline": "App tipo Tinder para intercambiar y regalar cosas usadas: deslizás fotos de objetos, publicás los tuyos, y si hay match mutuo chateás de forma anónima solo sobre los items que hicieron match.",
    "languages": [
      "es"
    ],
    "brandColor": "#FF6F61",
    "accentColor": "#F5A623",
    "logoConcept": "Una letra T estilizada que simboliza intercambio y conexión.",
    "logoMonogram": "T",
    "targetMarkets": [],
    "secondaryColor": "#4A90E2"
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
