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
        "a": "Empezás gratis y después $19/mes. Cancelás cuando quieras.",
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
      "headline": "Detecta caídas rápidamente con revisiones cada 5 minutos y confirmación por 2 fa",
      "ctaPrimary": "Empezar gratis",
      "subheadline": "Dashboard público sin login para monitorear la URL https://addi.meetgravity.io/sign-in, detectar caídas y enviar alertas por correo cuando no responda o devuelva error HTTP, además de mostrar estado y métricas básicas.",
      "ctaSecondary": "Ver precios"
    },
    "finalCta": {
      "button": "Empezar gratis",
      "headline": "¿List@ para probar Dashbaord de caidas sin login para https://addi.meetgravity.?"
    },
    "valueProps": [
      {
        "body": "Viene en Dashbaord de caidas sin login para https://addi.meetgravity. desde el día uno — sin código pegamento.",
        "title": "Detecta caídas rápidamente con revisiones cada 5 minutos y confirmación por 2 fa"
      },
      {
        "body": "Funciona solo, para que te enfoques en tus usuarios.",
        "title": "Envía alertas y recuperación por correo a alvarozweig@gmail.com, solo cuando hub"
      },
      {
        "body": "Confiable, seguro y listo para escalar.",
        "title": "Muestra estado, métricas e ისტორial de los últimos 7 días sin requerir login, en"
      }
    ],
    "socialProof": "Hecho para Una persona responsable de operación o soporte que necesita alertas rápidas y un dashboard público de disponibilidad.."
  },
  "modules": {
    "engine": true,
    "contentBlog": true,
    "emailLifecycle": true
  },
  "entities": [
    {
      "name": "MonitoredEndpoint",
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
      "plural": "MonitoredEndpoints",
      "ownedByUser": true
    },
    {
      "name": "HealthCheck",
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
            "down"
          ]
        },
        {
          "name": "http_status_code",
          "type": "int",
          "required": false
        },
        {
          "name": "response_time_ms",
          "type": "int",
          "required": false
        },
        {
          "name": "failure_reason",
          "type": "text",
          "required": false
        }
      ],
      "plural": "HealthChecks",
      "ownedByUser": true
    },
    {
      "name": "AlertEvent",
      "fields": [
        {
          "name": "event_type",
          "type": "enum",
          "required": true,
          "enumValues": [
            "downtime",
            "recovery"
          ]
        },
        {
          "name": "triggered_at",
          "type": "datetime",
          "required": true
        },
        {
          "name": "email_recipient",
          "type": "email",
          "required": true
        },
        {
          "name": "email_sent",
          "type": "bool",
          "required": true
        },
        {
          "name": "message",
          "type": "longtext",
          "required": false
        }
      ],
      "plural": "AlertEvents",
      "ownedByUser": true
    }
  ],
  "identity": {
    "name": "Dashbaord de caidas sin login para https://addi.meetgravity.",
    "domain": "dashbaord-de-caidas-sin-login-para-https.app",
    "logoSvg": "<svg viewBox=\"0 0 64 64\" xmlns=\"http://www.w3.org/2000/svg\" fill=\"none\">\n  <path d=\"M32 4c15.464 0 28 12.536 28 28S47.464 60 32 60 4 47.464 4 32 16.536 4 32 4z\" stroke=\"#2563EB\" stroke-width=\"4\"/>\n  <path d=\"M20 32l6 6 12-12\" stroke=\"#60A5FA\" stroke-width=\"4\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>\n  <path d=\"M38 32c0-2.21-1.79-4-4-4s-4 1.79-4 4 1.79 4 4 4 4-1.79 4-4z\" fill=\"#2563EB\"/>\n  <path d=\"M44 46l6-6\" stroke=\"#2563EB\" stroke-width=\"4\" stroke-linecap=\"round\"/>\n</svg>",
    "palette": [
      {
        "hex": "#2563EB",
        "label": "primary azul operativo"
      },
      {
        "hex": "#1E40AF",
        "label": "primary dark azul confianza"
      },
      {
        "hex": "#60A5FA",
        "label": "primary light azul información"
      },
      {
        "hex": "#16A34A",
        "label": "secondary verde operativo"
      },
      {
        "hex": "#F59E0B",
        "label": "accent ámbar verificación"
      },
      {
        "hex": "#DC2626",
        "label": "danger rojo caída"
      },
      {
        "hex": "#F8FAFC",
        "label": "background gris muy claro"
      },
      {
        "hex": "#0F172A",
        "label": "text azul noche"
      }
    ],
    "tagline": "Dashboard público sin login para monitorear la URL https://addi.meetgravity.io/sign-in, detectar caídas y enviar alertas por correo cuando no responda o devuelva error HTTP, además de mostrar estado y métricas básicas.",
    "languages": [
      "es"
    ],
    "brandColor": "#2563EB",
    "accentColor": "#60A5FA",
    "logoConcept": "Monograma DA dentro de un pulso de monitoreo, combinando un check azul para disponibilidad y una señal de alerta sobria para incidentes.",
    "logoMonogram": "DA",
    "targetMarkets": [],
    "secondaryColor": "#1E40AF"
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
          "Detecta caídas rápidamente con revisiones cada 5 minutos y confirmación por 2 fa",
          "Envía alertas y recuperación por correo a alvarozweig@gmail.com, solo cuando hub",
          "Muestra estado, métricas e ისტორial de los últimos 7 días sin requerir login, en",
          "Soporte prioritario"
        ],
        "interval": "month",
        "priceUsd": 19,
        "highlight": true
      },
      {
        "id": "anual",
        "features": [
          "Todo lo de Pro",
          "2 meses gratis"
        ],
        "interval": "year",
        "priceUsd": 190
      }
    ],
    "providers": [
      "stripe"
    ]
  }
}
export default config
