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
    "description": "Acortador de URLs con analítica de clicks por enlace"
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
      "headline": "Acortá links",
      "ctaPrimary": "Empezar gratis",
      "subheadline": "Acortador de URLs con analítica de clicks por enlace",
      "ctaSecondary": "Ver precios"
    },
    "finalCta": {
      "button": "Empezar gratis",
      "headline": "¿List@ para probar Linkly?"
    },
    "valueProps": [
      {
        "body": "Viene en Linkly desde el día uno — sin código pegamento.",
        "title": "Acortá links"
      },
      {
        "body": "Funciona solo, para que te enfoques en tus usuarios.",
        "title": "Seguí clicks"
      },
      {
        "body": "Confiable, seguro y listo para escalar.",
        "title": "QR automático"
      }
    ],
    "socialProof": "Hecho para marketers."
  },
  "modules": {
    "aiLayer": true
  },
  "entities": [
    {
      "name": "Link",
      "fields": [
        {
          "name": "original_url",
          "type": "url",
          "required": true
        },
        {
          "name": "shortened_url",
          "type": "url",
          "required": true
        },
        {
          "name": "created_at",
          "type": "datetime",
          "required": true
        },
        {
          "name": "click_count",
          "type": "int",
          "required": false
        }
      ],
      "plural": "Links",
      "ownedByUser": true
    },
    {
      "name": "Click",
      "fields": [
        {
          "name": "link_id",
          "type": "int",
          "required": true
        },
        {
          "name": "clicked_at",
          "type": "datetime",
          "required": true
        },
        {
          "name": "referrer",
          "type": "text",
          "required": false
        },
        {
          "name": "user_agent",
          "type": "text",
          "required": false
        }
      ],
      "plural": "Clicks",
      "ownedByUser": true
    },
    {
      "name": "QRCode",
      "fields": [
        {
          "name": "link_id",
          "type": "int",
          "required": true
        },
        {
          "name": "generated_at",
          "type": "datetime",
          "required": true
        },
        {
          "name": "size",
          "type": "enum",
          "required": true,
          "enumValues": [
            "small",
            "medium",
            "large"
          ]
        }
      ],
      "plural": "QRCodes",
      "ownedByUser": true
    }
  ],
  "identity": {
    "name": "Linkly",
    "domain": "linkly.app",
    "logoSvg": "<svg viewBox=\"0 0 64 64\" xmlns=\"http://www.w3.org/2000/svg\">\n  <circle cx=\"21\" cy=\"32\" r=\"12\" fill=\"#0EA5E9\" />\n  <circle cx=\"43\" cy=\"32\" r=\"12\" fill=\"#F59E0B\" />\n  <rect x=\"21\" y=\"26\" width=\"22\" height=\"12\" fill=\"#0EA5E9\" />\n</svg>",
    "palette": [
      {
        "hex": "#0EA5E9",
        "label": "Primary"
      },
      {
        "hex": "#0C4A6E",
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
        "hex": "#0F172A",
        "label": "Text"
      }
    ],
    "tagline": "Acortador de URLs con analítica de clicks por enlace",
    "languages": [
      "es"
    ],
    "brandColor": "#0EA5E9",
    "accentColor": "#F59E0B",
    "logoConcept": "un eslabón de cadena",
    "targetMarkets": [],
    "secondaryColor": "#0C4A6E"
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
          "Acortá links",
          "Seguí clicks",
          "QR automático",
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
