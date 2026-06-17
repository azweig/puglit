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
          "name": "membership_number",
          "type": "text",
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
        }
      ],
      "plural": "Discounts",
      "ownedByUser": false
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
    "logoSvg": "<svg viewBox=\"0 0 64 64\" xmlns=\"http://www.w3.org/2000/svg\">\n  <circle cx=\"32\" cy=\"32\" r=\"30\" fill=\"#FF5733\"/>\n  <path d=\"M32 16a8 8 0 0 0-8 8c0 5.5 8 16 8 16s8-10.5 8-16a8 8 0 0 0-8-8zm0 12a4 4 0 1 1 4-4 4 4 0 0 1-4 4z\" fill=\"#900C3F\"/>\n</svg>",
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
    "tagline": "Webapp que scrapea los programas de lealtad peruanos (BCP, Interbank, Movistar, Claro, CMR, Bonus, etc.) y según los que tenés y tu ubicación te muestra qué restaurantes y tiendas cercanas tienen descuento con tus tarjetas y membresías.",
    "languages": [
      "es"
    ],
    "brandColor": "#FF5733",
    "accentColor": "#900C3F",
    "logoConcept": "Un diseño estilizado de las letras 'DP' con un ícono de ubicación integrado.",
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
