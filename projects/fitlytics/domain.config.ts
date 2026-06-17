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
    "description": "Plataforma SaaS de analítica para gimnasios: retención de socios, predicción de bajas y reportes"
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
      "headline": "Predice bajas",
      "ctaPrimary": "Empezar gratis",
      "subheadline": "Plataforma SaaS de analítica para gimnasios: retención de socios, predicción de bajas y reportes",
      "ctaSecondary": "Ver precios"
    },
    "finalCta": {
      "button": "Empezar gratis",
      "headline": "¿List@ para probar Fitlytics?"
    },
    "valueProps": [
      {
        "body": "Viene en Fitlytics desde el día uno — sin código pegamento.",
        "title": "Predice bajas"
      },
      {
        "body": "Funciona solo, para que te enfoques en tus usuarios.",
        "title": "Reportes automáticos"
      },
      {
        "body": "Confiable, seguro y listo para escalar.",
        "title": "Retención"
      }
    ],
    "socialProof": "Hecho para dueños de gimnasios."
  },
  "modules": {
    "aiLayer": true,
    "payments": true
  },
  "entities": [
    {
      "name": "Member",
      "fields": [
        {
          "name": "name",
          "type": "text",
          "required": true
        },
        {
          "name": "email",
          "type": "email",
          "required": true
        },
        {
          "name": "join_date",
          "type": "date",
          "required": true
        },
        {
          "name": "status",
          "type": "enum",
          "required": true,
          "enumValues": [
            "active",
            "inactive",
            "pending"
          ]
        }
      ],
      "plural": "Members",
      "ownedByUser": true
    },
    {
      "name": "Report",
      "fields": [
        {
          "name": "title",
          "type": "text",
          "required": true
        },
        {
          "name": "generated_date",
          "type": "datetime",
          "required": true
        },
        {
          "name": "data",
          "type": "longtext",
          "required": true
        }
      ],
      "plural": "Reports",
      "ownedByUser": true
    },
    {
      "name": "Prediction",
      "fields": [
        {
          "name": "member_id",
          "type": "int",
          "required": true
        },
        {
          "name": "predicted_date",
          "type": "date",
          "required": true
        },
        {
          "name": "likelihood",
          "type": "float",
          "required": true
        }
      ],
      "plural": "Predictions",
      "ownedByUser": true
    }
  ],
  "identity": {
    "name": "Fitlytics",
    "domain": "fitlytics.app",
    "logoSvg": "<svg viewBox=\"0 0 64 64\" xmlns=\"http://www.w3.org/2000/svg\">\n  <rect x=\"12\" y=\"36\" width=\"8\" height=\"16\" fill=\"#16A34A\"/>\n  <rect x=\"28\" y=\"28\" width=\"8\" height=\"24\" fill=\"#16A34A\"/>\n  <rect x=\"44\" y=\"16\" width=\"8\" height=\"36\" fill=\"#16A34A\"/>\n  <path d=\"M12 44 L28 36 L44 20\" stroke=\"#F59E0B\" stroke-width=\"4\" fill=\"none\"/>\n</svg>",
    "palette": [
      {
        "hex": "#16A34A",
        "label": "P"
      },
      {
        "hex": "#064E3B",
        "label": "S"
      },
      {
        "hex": "#F59E0B",
        "label": "A"
      },
      {
        "hex": "#FFFFFF",
        "label": "B"
      },
      {
        "hex": "#0F172A",
        "label": "T"
      }
    ],
    "tagline": "Plataforma SaaS de analítica para gimnasios: retención de socios, predicción de bajas y reportes",
    "languages": [
      "es"
    ],
    "brandColor": "#16A34A",
    "accentColor": "#F59E0B",
    "logoConcept": "un gráfico ascendente",
    "targetMarkets": [],
    "secondaryColor": "#064E3B"
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
          "Predice bajas",
          "Reportes automáticos",
          "Retención",
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
