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
          "name": "condition",
          "type": "enum",
          "required": true,
          "enumValues": [
            "New",
            "Like New",
            "Used",
            "Damaged"
          ]
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
    "logoSvg": "<svg viewBox=\"0 0 64 64\" xmlns=\"http://www.w3.org/2000/svg\">\n  <path d=\"M32 12 L32 40 M22 24 L42 24 M28 20 L28 28 M36 20 L36 28\" stroke=\"#FF6F61\" stroke-width=\"4\" stroke-linecap=\"round\"/>\n  <circle cx=\"32\" cy=\"44\" r=\"8\" fill=\"#50E3C2\"/>\n</svg>",
    "palette": [
      {
        "hex": "#FF6F61",
        "label": "primary"
      },
      {
        "hex": "#4A90E2",
        "label": "secondary"
      },
      {
        "hex": "#50E3C2",
        "label": "accent"
      },
      {
        "hex": "#F5F7FA",
        "label": "background"
      },
      {
        "hex": "#4A4A4A",
        "label": "text"
      },
      {
        "hex": "#D0021B",
        "label": "error"
      },
      {
        "hex": "#F8E71C",
        "label": "warning"
      }
    ],
    "tagline": "App tipo Tinder para intercambiar y regalar cosas usadas: deslizás fotos de objetos, publicás los tuyos, y si hay match mutuo chateás de forma anónima solo sobre los items que hicieron match.",
    "languages": [
      "es"
    ],
    "brandColor": "#FF6F61",
    "accentColor": "#50E3C2",
    "logoConcept": "Una letra 'T' estilizada que simboliza intercambio y conexión.",
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
