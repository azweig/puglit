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
      "headline": "Intercambio de objetos usados",
      "ctaPrimary": "Empezar gratis",
      "subheadline": "App tipo Tinder para intercambiar cosas usadas: ves fotos de objetos usados de otros y publicás los tuyos; si hay match, las dos personas chatean de forma anónima solo sobre ese ítem.",
      "ctaSecondary": "Ver precios"
    },
    "finalCta": {
      "button": "Empezar gratis",
      "headline": "¿List@ para probar Truke?"
    },
    "valueProps": [
      {
        "body": "Viene en Truke desde el día uno — sin código pegamento.",
        "title": "Intercambio de objetos usados"
      },
      {
        "body": "Funciona solo, para que te enfoques en tus usuarios.",
        "title": "Regalo de objetos"
      },
      {
        "body": "Confiable, seguro y listo para escalar.",
        "title": "Descubrimiento de artículos en su ciudad"
      }
    ],
    "socialProof": "Hecho para Personas que quieren intercambiar o regalar cosas usadas en su ciudad."
  },
  "modules": {
    "engine": true,
    "profiling": true,
    "gamification": true
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
          "name": "is_available",
          "type": "bool",
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
          "name": "user_id_1",
          "type": "int",
          "required": true
        },
        {
          "name": "user_id_2",
          "type": "int",
          "required": true
        },
        {
          "name": "match_date",
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
          "name": "sender_id",
          "type": "int",
          "required": true
        },
        {
          "name": "message",
          "type": "longtext",
          "required": true
        },
        {
          "name": "timestamp",
          "type": "datetime",
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
          "name": "profile_picture",
          "type": "url",
          "required": false
        },
        {
          "name": "city",
          "type": "text",
          "required": true
        }
      ],
      "plural": "Users",
      "ownedByUser": true
    }
  ],
  "identity": {
    "name": "Truke",
    "domain": "truke.app",
    "logoSvg": "<svg viewBox=\"0 0 64 64\" xmlns=\"http://www.w3.org/2000/svg\">\n  <path d=\"M32 6c-5.5 0-10 4.5-10 10v8H16c-5.5 0-10 4.5-10 10s4.5 10 10 10h6v8c0 5.5 4.5 10 10 10s10-4.5 10-10v-8h6c5.5 0 10-4.5 10-10s-4.5-10-10-10h-6v-8c0-5.5-4.5-10-10-10z\" fill=\"#4CAF50\"/>\n  <circle cx=\"32\" cy=\"32\" r=\"12\" fill=\"#FF9800\"/>\n</svg>",
    "palette": [
      {
        "hex": "#4CAF50",
        "label": "Verde renovador"
      },
      {
        "hex": "#2196F3",
        "label": "Azul confiable"
      },
      {
        "hex": "#FF9800",
        "label": "Naranja vibrante"
      },
      {
        "hex": "#9E9E9E",
        "label": "Gris neutro"
      },
      {
        "hex": "#FFEB3B",
        "label": "Amarillo optimista"
      }
    ],
    "tagline": "App tipo Tinder para intercambiar cosas usadas: ves fotos de objetos usados de otros y publicás los tuyos; si hay match, las dos personas chatean de forma anónima solo sobre ese ítem.",
    "languages": [
      "es"
    ],
    "brandColor": "#4CAF50",
    "accentColor": "#FF9800",
    "logoConcept": "Una T estilizada que evoca conexión y sostenibilidad.",
    "logoMonogram": "T",
    "targetMarkets": [],
    "secondaryColor": "#2196F3"
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
