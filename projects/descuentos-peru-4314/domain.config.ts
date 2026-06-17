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
        "a": "Descuentos Perú es gratis.",
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
      "headline": "Elegí los programas de lealtad que tenés",
      "ctaPrimary": "Empezar gratis",
      "subheadline": "Webapp que scrapea los programas de lealtad peruanos (BCP, Interbank, Movistar, Claro, CMR, Bonus, etc.) y según los que tenés y tu ubicación te muestra qué restaurantes y tiendas cercanas tienen descuento con tus tarjetas y membresías.",
      "ctaSecondary": "Ver precios"
    },
    "finalCta": {
      "button": "Empezar gratis",
      "headline": "¿List@ para probar Descuentos Perú?"
    },
    "valueProps": [
      {
        "body": "Viene en Descuentos Perú desde el día uno — sin código pegamento.",
        "title": "Elegí los programas de lealtad que tenés"
      },
      {
        "body": "Funciona solo, para que te enfoques en tus usuarios.",
        "title": "Descuentos cerca tuyo según tu ubicación"
      },
      {
        "body": "Confiable, seguro y listo para escalar.",
        "title": "Catálogo scrapeado y siempre actualizado"
      }
    ],
    "socialProof": "Hecho para Peruanos con tarjetas de banco y membresías de telco/retail.."
  },
  "modules": {
    "geo": true,
    "growth": true
  },
  "entities": [
    {
      "name": "LoyaltyProgram",
      "fields": [
        {
          "name": "program_name",
          "type": "text",
          "required": true
        },
        {
          "name": "provider",
          "type": "text",
          "required": true
        },
        {
          "name": "membership_id",
          "type": "text",
          "required": true
        },
        {
          "name": "expiration_date",
          "type": "date",
          "required": false
        }
      ],
      "plural": "LoyaltyPrograms",
      "ownedByUser": true
    },
    {
      "name": "Discount",
      "fields": [
        {
          "name": "store_name",
          "type": "text",
          "required": true
        },
        {
          "name": "discount_percentage",
          "type": "float",
          "required": true
        },
        {
          "name": "valid_until",
          "type": "date",
          "required": false
        },
        {
          "name": "location",
          "type": "json",
          "required": true
        }
      ],
      "plural": "Discounts",
      "ownedByUser": true
    },
    {
      "name": "UserLocation",
      "fields": [
        {
          "name": "latitude",
          "type": "float",
          "required": true
        },
        {
          "name": "longitude",
          "type": "float",
          "required": true
        },
        {
          "name": "address",
          "type": "text",
          "required": false
        }
      ],
      "plural": "UserLocations",
      "ownedByUser": true
    }
  ],
  "identity": {
    "name": "Descuentos Perú",
    "domain": "descuentos-peru.app",
    "logoSvg": "<svg viewBox=\"0 0 64 64\" xmlns=\"http://www.w3.org/2000/svg\">\n  <path d=\"M32 2a30 30 0 100 60 30 30 0 000-60z\" fill=\"#FF5733\"/>\n  <path d=\"M32 12c11.046 0 20 8.954 20 20s-8.954 20-20 20-20-8.954-20-20 8.954-20 20-20zm-4 6c-1.657 0-3 1.343-3 3s1.343 3 3 3 3 1.343 3 3-1.343 3-3 3c-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3 1.343-3 3-3 3-1.343 3-3-1.343-3-3-3-3-1.343-3-3 1.343-3 3-3 3-1.343 3-3-1.343-3-3-3z\" fill=\"#900C3F\"/>\n</svg>",
    "palette": [
      {
        "hex": "#FF5733",
        "label": "Primary"
      },
      {
        "hex": "#C70039",
        "label": "Secondary"
      },
      {
        "hex": "#900C3F",
        "label": "Accent"
      },
      {
        "hex": "#F5F5F5",
        "label": "Background"
      },
      {
        "hex": "#333333",
        "label": "Text"
      },
      {
        "hex": "#FFC300",
        "label": "Highlight"
      },
      {
        "hex": "#DAF7A6",
        "label": "Success"
      },
      {
        "hex": "#FF5733",
        "label": "Warning"
      }
    ],
    "tagline": "Webapp que scrapea los programas de lealtad peruanos (BCP, Interbank, Movistar, Claro, CMR, Bonus, etc.) y según los que tenés y tu ubicación te muestra qué restaurantes y tiendas cercanas tienen descuento con tus tarjetas y membresías.",
    "languages": [
      "es"
    ],
    "brandColor": "#FF5733",
    "accentColor": "#900C3F",
    "logoConcept": "Una letra 'D' estilizada con un mapa de Perú en su interior, simbolizando descuentos locales.",
    "logoMonogram": "DP",
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
