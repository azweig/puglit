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
            "new",
            "like_new",
            "used",
            "damaged"
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
          "name": "is_sender",
          "type": "bool",
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
    "logoSvg": "<svg viewBox=\"0 0 64 64\" xmlns=\"http://www.w3.org/2000/svg\">\n  <path d=\"M32 12c-4.418 0-8 3.582-8 8v12h-4c-1.104 0-2 .896-2 2s.896 2 2 2h12v4c0 1.104.896 2 2 2s2-.896 2-2v-4h12c1.104 0 2-.896 2-2s-.896-2-2-2h-4V20c0-4.418-3.582-8-8-8z\" fill=\"#FF6F61\"/>\n  <path d=\"M32 26c-1.104 0-2 .896-2 2v12c0 1.104.896 2 2 2s2-.896 2-2V28c0-1.104-.896-2-2-2zm-8 0c-1.104 0-2 .896-2 2v12c0 1.104.896 2 2 2s2-.896 2-2V28c0-1.104-.896-2-2-2zm16 0c-1.104 0-2 .896-2 2v12c0 1.104.896 2 2 2s2-.896 2-2V28c0-1.104-.896-2-2-2z\" fill=\"#50E3C2\"/>\n</svg>",
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
    "logoConcept": "Una T estilizada que representa el intercambio y la conexión entre usuarios.",
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
