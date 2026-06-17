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
          "required": false
        },
        {
          "name": "image_url",
          "type": "url",
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
          "name": "matched_user_id",
          "type": "int",
          "required": true
        },
        {
          "name": "matched_at",
          "type": "datetime",
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
        }
      ],
      "plural": "Chats",
      "ownedByUser": true
    }
  ],
  "identity": {
    "name": "Truke",
    "domain": "truke.app",
    "logoSvg": "<svg viewBox=\"0 0 64 64\" xmlns=\"http://www.w3.org/2000/svg\">\n  <path d=\"M32 8 L40 8 L40 16 L48 16 L32 32 L16 16 L24 16 L24 8 Z\" fill=\"#FF5733\"/>\n  <path d=\"M24 48 L24 40 L16 40 L32 24 L48 40 L40 40 L40 48 Z\" fill=\"#900C3F\"/>\n</svg>",
    "palette": [
      {
        "hex": "#FF5733",
        "label": "primary"
      },
      {
        "hex": "#C70039",
        "label": "secondary"
      },
      {
        "hex": "#900C3F",
        "label": "accent"
      },
      {
        "hex": "#F5F5F5",
        "label": "background"
      },
      {
        "hex": "#333333",
        "label": "text"
      },
      {
        "hex": "#FFC300",
        "label": "highlight"
      }
    ],
    "tagline": "App tipo Tinder para intercambiar y regalar cosas usadas: deslizás fotos de objetos, publicás los tuyos, y si hay match mutuo chateás de forma anónima solo sobre los items que hicieron match.",
    "languages": [
      "es"
    ],
    "brandColor": "#FF5733",
    "accentColor": "#900C3F",
    "logoConcept": "Una letra T estilizada con flechas que simbolizan intercambio.",
    "logoMonogram": "T",
    "targetMarkets": [],
    "secondaryColor": "#C70039"
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
