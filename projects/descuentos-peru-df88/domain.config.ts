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
          "name": "name",
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
          "required": false
        },
        {
          "name": "is_active",
          "type": "bool",
          "required": true
        }
      ],
      "plural": "LoyaltyPrograms",
      "ownedByUser": true
    },
    {
      "name": "Discount",
      "fields": [
        {
          "name": "description",
          "type": "longtext",
          "required": true
        },
        {
          "name": "location",
          "type": "text",
          "required": true
        },
        {
          "name": "valid_until",
          "type": "date",
          "required": false
        },
        {
          "name": "loyalty_program_id",
          "type": "int",
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
        },
        {
          "name": "created_at",
          "type": "datetime",
          "required": true
        }
      ],
      "plural": "UserLocations",
      "ownedByUser": true
    }
  ],
  "identity": {
    "name": "Descuentos Perú",
    "domain": "descuentos-peru.app",
    "logoSvg": "<svg viewBox=\"0 0 64 64\" xmlns=\"http://www.w3.org/2000/svg\">\n  <circle cx=\"32\" cy=\"32\" r=\"30\" fill=\"#FF5733\"/>\n  <path d=\"M32 10c-10 0-18 8-18 18s8 18 18 18 18-8 18-18-8-18-18-18zm0 28c-5.52 0-10-4.48-10-10s4.48-10 10-10 10 4.48 10 10-4.48 10-10 10z\" fill=\"#900C3F\"/>\n  <path d=\"M32 22a6 6 0 1 0 0 12 6 6 0 0 0 0-12z\" fill=\"#FF5733\"/>\n</svg>",
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
        "hex": "#581845",
        "label": "Background"
      },
      {
        "hex": "#FFFFFF",
        "label": "Text"
      },
      {
        "hex": "#FFC300",
        "label": "Highlight"
      }
    ],
    "tagline": "Webapp que scrapea los programas de lealtad peruanos (BCP, Interbank, Movistar, Claro, CMR, Bonus, etc.) y según los que tenés y tu ubicación te muestra qué restaurantes y tiendas cercanas tienen descuento con tus tarjetas y membresías.",
    "languages": [
      "es"
    ],
    "brandColor": "#FF5733",
    "accentColor": "#900C3F",
    "logoConcept": "Un diseño moderno que incorpora un mapa estilizado con un marcador de ubicación y las letras 'DP'.",
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
