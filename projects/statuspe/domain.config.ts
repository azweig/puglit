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
        "a": "StatusPe es gratis.",
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
      "headline": "¿List@ para probar StatusPe?"
    },
    "valueProps": [
      {
        "body": "Viene en StatusPe desde el día uno — sin código pegamento.",
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
      "name": "Endpoint",
      "fields": [
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
          "name": "check_interval_minutes",
          "type": "int",
          "required": true
        },
        {
          "name": "is_active",
          "type": "bool",
          "required": true
        }
      ],
      "plural": "Endpoints",
      "ownedByUser": true
    },
    {
      "name": "Incident",
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
        },
        {
          "name": "resolved_at",
          "type": "datetime",
          "required": false
        }
      ],
      "plural": "Incidents",
      "ownedByUser": true
    },
    {
      "name": "StatusCheck",
      "fields": [
        {
          "name": "checked_at",
          "type": "datetime",
          "required": true
        },
        {
          "name": "status",
          "type": "enum",
          "required": true,
          "enumValues": [
            "up",
            "down",
            "degraded"
          ]
        },
        {
          "name": "response_time_ms",
          "type": "int",
          "required": false
        },
        {
          "name": "status_code",
          "type": "int",
          "required": false
        }
      ],
      "plural": "StatusChecks",
      "ownedByUser": true
    },
    {
      "name": "StatusPage",
      "fields": [
        {
          "name": "name",
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
      "plural": "StatusPages",
      "ownedByUser": true
    }
  ],
  "identity": {
    "name": "StatusPe",
    "domain": "statuspe.app",
    "logoSvg": "<svg viewBox=\"0 0 64 64\" xmlns=\"http://www.w3.org/2000/svg\">\n  <circle cx=\"32\" cy=\"32\" r=\"30\" fill=\"none\" stroke=\"#2563EB\" stroke-width=\"4\"/>\n  <circle cx=\"32\" cy=\"32\" r=\"16\" fill=\"#2563EB\"/>\n  <path d=\"M22 32h20\" stroke=\"#2563EB\" stroke-width=\"4\" stroke-linecap=\"round\"/>\n  <path d=\"M32 22v20\" stroke=\"#2563EB\" stroke-width=\"4\" stroke-linecap=\"round\"/>\n</svg>",
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
