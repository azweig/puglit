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
      "headline": "Encuentra rápidamente qué descuento o beneficio aplica según tu ubicación actual",
      "ctaPrimary": "Empezar gratis",
      "subheadline": "Plataforma web sin registro para Perú que centraliza y geolocaliza descuentos y beneficios de tarjetas de crédito y compañías telefónicas, mostrando qué beneficio usar según la ubicación del usuario y su “Mi Billetera”.",
      "ctaSecondary": "Ver precios"
    },
    "finalCta": {
      "button": "Empezar gratis",
      "headline": "¿List@ para probar loyalty points peru?"
    },
    "valueProps": [
      {
        "body": "Viene en loyalty points peru desde el día uno — sin código pegamento.",
        "title": "Encuentra rápidamente qué descuento o beneficio aplica según tu ubicación actual"
      },
      {
        "body": "Funciona solo, para que te enfoques en tus usuarios.",
        "title": "Filtra solo los beneficios que realmente puedes usar con tus tarjetas y operador"
      },
      {
        "body": "Confiable, seguro y listo para escalar.",
        "title": "Evita perder tiempo revisando webs de bancos y telcos, con fichas claras y accio"
      }
    ],
    "socialProof": "Hecho para Usuarios en Perú que quieren ahorrar y aprovechar beneficios cotidianos de sus tarjetas y operadoras, especialmente en c."
  },
  "modules": {
    "geo": true,
    "engine": true,
    "profiling": true
  },
  "entities": [
    {
      "name": "Benefit",
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
          "name": "provider_type",
          "type": "enum",
          "required": true,
          "enumValues": [
            "credit_card",
            "telco"
          ]
        },
        {
          "name": "category",
          "type": "text",
          "required": true
        },
        {
          "name": "terms_url",
          "type": "url",
          "required": false
        }
      ],
      "plural": "Benefits",
      "ownedByUser": false
    },
    {
      "name": "Location",
      "fields": [
        {
          "name": "name",
          "type": "text",
          "required": true
        },
        {
          "name": "address",
          "type": "text",
          "required": true
        },
        {
          "name": "city",
          "type": "text",
          "required": true
        },
        {
          "name": "latitude",
          "type": "float",
          "required": true
        },
        {
          "name": "longitude",
          "type": "float",
          "required": true
        }
      ],
      "plural": "Locations",
      "ownedByUser": false
    },
    {
      "name": "WalletItem",
      "fields": [
        {
          "name": "provider_name",
          "type": "text",
          "required": true
        },
        {
          "name": "provider_type",
          "type": "enum",
          "required": true,
          "enumValues": [
            "credit_card",
            "telco"
          ]
        },
        {
          "name": "product_name",
          "type": "text",
          "required": true
        },
        {
          "name": "is_active",
          "type": "bool",
          "required": true
        }
      ],
      "plural": "WalletItems",
      "ownedByUser": true
    },
    {
      "name": "Merchant",
      "fields": [
        {
          "name": "name",
          "type": "text",
          "required": true
        },
        {
          "name": "category",
          "type": "text",
          "required": true
        },
        {
          "name": "website_url",
          "type": "url",
          "required": false
        },
        {
          "name": "is_featured",
          "type": "bool",
          "required": true
        }
      ],
      "plural": "Merchants",
      "ownedByUser": false
    }
  ],
  "identity": {
    "name": "loyalty points peru",
    "domain": "loyalty-points-peru.app",
    "logoSvg": "<svg viewBox=\"0 0 64 64\" xmlns=\"http://www.w3.org/2000/svg\">\n  <circle cx=\"32\" cy=\"32\" r=\"20\" fill=\"#00B8A9\"/>\n  <path d=\"M32 10c-12.15 0-22 8.85-22 22s22 32 22 32 22-19.85 22-32-9.85-22-22-22zm0 46.5c-6.075-7.65-18-23.4-18-24.5C14 18.925 22.925 10 32 10s18 8.925 18 18c0 1.1-11.925 16.85-18 24.5z\" fill=\"#6C3BFF\"/>\n  <circle cx=\"40\" cy=\"24\" r=\"4\" fill=\"#6C3BFF\"/>\n</svg>",
    "palette": [
      {
        "hex": "#00B8A9",
        "label": "Primary - turquesa confianza fresca"
      },
      {
        "hex": "#007C73",
        "label": "Primary dark - turquesa profundo para headers y estados activos"
      },
      {
        "hex": "#6C3BFF",
        "label": "Secondary - morado recompensa para filtros premium y billetera"
      },
      {
        "hex": "#FFB000",
        "label": "Accent - ámbar promo para porcentajes y llamadas de ahorro"
      },
      {
        "hex": "#FF5A5F",
        "label": "Alert - coral para campañas flash y avisos importantes"
      },
      {
        "hex": "#F7FFFD",
        "label": "Background - blanco verdoso limpio para lectura móvil"
      },
      {
        "hex": "#DDF7F3",
        "label": "Surface - turquesa muy claro para cards y chips"
      },
      {
        "hex": "#102A43",
        "label": "Text - azul petróleo oscuro para alta legibilidad"
      }
    ],
    "tagline": "Plataforma web sin registro para Perú que centraliza y geolocaliza descuentos y beneficios de tarjetas de crédito y compañías telefónicas, mostrando qué beneficio usar según la ubicación del usuario y su “Mi Billetera”.",
    "languages": [
      "es"
    ],
    "brandColor": "#00B8A9",
    "accentColor": "#6C3BFF",
    "logoConcept": "Monograma LP dentro de un pin de mapa con un pequeño símbolo de descuento, comunicando beneficios cercanos y ahorro inmediato.",
    "logoMonogram": "LP",
    "targetMarkets": [],
    "secondaryColor": "#007C73"
  },
  "platforms": {
    "web": true,
    "admin": true
  },
  "monetization": {
    "model": "subscription",
    "plans": [
      {
        "id": "pro",
        "features": [
          "Encuentra rápidamente qué descuento o beneficio aplica según tu ubicación actual",
          "Filtra solo los beneficios que realmente puedes usar con tus tarjetas y operador",
          "Evita perder tiempo revisando webs de bancos y telcos, con fichas claras y accio",
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
