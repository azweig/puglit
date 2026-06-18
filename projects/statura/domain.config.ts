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
        "a": "Statura es gratis.",
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
      "headline": "Estado en vivo",
      "ctaPrimary": "Empezar gratis",
      "subheadline": "Status page publico SIN login que monitorea endpoints HTTPS y muestra estado actual, historial de uptime e incidentes, estilo status.claude.com",
      "ctaSecondary": "Ver precios"
    },
    "finalCta": {
      "button": "Empezar gratis",
      "headline": "¿List@ para probar Statura?"
    },
    "valueProps": [
      {
        "body": "Viene en Statura desde el día uno — sin código pegamento.",
        "title": "Estado en vivo"
      },
      {
        "body": "Funciona solo, para que te enfoques en tus usuarios.",
        "title": "Historial de uptime"
      },
      {
        "body": "Confiable, seguro y listo para escalar.",
        "title": "Incidentes"
      }
    ],
    "socialProof": "Hecho para Usuarios que quieren ver si un servicio esta caido."
  },
  "modules": {
    "engine": true
  },
  "entities": [
    {
      "name": "StatusPage",
      "fields": [
        {
          "name": "title",
          "type": "text",
          "required": true
        },
        {
          "name": "slug",
          "type": "text",
          "required": true
        },
        {
          "name": "custom_domain",
          "type": "url",
          "required": false
        },
        {
          "name": "is_public",
          "type": "bool",
          "required": true
        }
      ],
      "plural": "Status Pages",
      "ownedByUser": true
    },
    {
      "name": "Endpoint",
      "fields": [
        {
          "name": "status_page_id",
          "type": "text",
          "required": true
        },
        {
          "name": "name",
          "type": "text",
          "required": true
        },
        {
          "name": "url",
          "type": "url",
          "required": true
        },
        {
          "name": "current_status",
          "type": "enum",
          "required": true,
          "enumValues": [
            "operational",
            "degraded",
            "down"
          ]
        }
      ],
      "plural": "Endpoints",
      "ownedByUser": true
    },
    {
      "name": "Incident",
      "fields": [
        {
          "name": "status_page_id",
          "type": "text",
          "required": true
        },
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
          "name": "status",
          "type": "enum",
          "required": true,
          "enumValues": [
            "investigating",
            "identified",
            "monitoring",
            "resolved"
          ]
        },
        {
          "name": "started_at",
          "type": "datetime",
          "required": true
        }
      ],
      "plural": "Incidents",
      "ownedByUser": true
    },
    {
      "name": "UptimeCheck",
      "fields": [
        {
          "name": "endpoint_id",
          "type": "text",
          "required": true
        },
        {
          "name": "checked_at",
          "type": "datetime",
          "required": true
        },
        {
          "name": "is_up",
          "type": "bool",
          "required": true
        },
        {
          "name": "response_time_ms",
          "type": "int",
          "required": false
        }
      ],
      "plural": "Uptime Checks",
      "ownedByUser": true
    }
  ],
  "identity": {
    "name": "Statura",
    "domain": "statura.app",
    "logoSvg": "<svg viewBox=\"0 0 64 64\" xmlns=\"http://www.w3.org/2000/svg\">\n  <circle cx=\"32\" cy=\"32\" r=\"30\" fill=\"none\" stroke=\"#2563EB\" stroke-width=\"4\"/>\n  <rect x=\"20\" y=\"20\" width=\"8\" height=\"24\" fill=\"#2563EB\"/>\n  <rect x=\"36\" y=\"12\" width=\"8\" height=\"32\" fill=\"#2563EB\"/>\n</svg>",
    "tagline": "Status page publico SIN login que monitorea endpoints HTTPS y muestra estado actual, historial de uptime e incidentes, estilo status.claude.com",
    "languages": [
      "es"
    ],
    "brandColor": "#2563EB",
    "targetMarkets": []
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
