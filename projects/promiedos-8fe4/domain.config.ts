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
        "a": "Promiedos es gratis.",
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
      "headline": "Partidos de hoy y en vivo por torneo",
      "ctaPrimary": "Empezar gratis",
      "subheadline": "Clon de Promiedos: fútbol argentino en vivo — partidos del día minuto a minuto, fixtures por fecha, tablas de posiciones por torneo, goleadores y resultados históricos. Datos scrapeados y actualizados por cron.",
      "ctaSecondary": "Ver precios"
    },
    "finalCta": {
      "button": "Empezar gratis",
      "headline": "¿List@ para probar Promiedos?"
    },
    "valueProps": [
      {
        "body": "Viene en Promiedos desde el día uno — sin código pegamento.",
        "title": "Partidos de hoy y en vivo por torneo"
      },
      {
        "body": "Funciona solo, para que te enfoques en tus usuarios.",
        "title": "Tabla de posiciones de cada torneo"
      },
      {
        "body": "Confiable, seguro y listo para escalar.",
        "title": "Fixtures y goleadores actualizados"
      }
    ],
    "socialProof": "Hecho para Hinchas argentinos de fútbol que buscan información rápida y clara sobre partidos y torneos.."
  },
  "modules": {
    "growth": true
  },
  "entities": [
    {
      "name": "Match",
      "fields": [
        {
          "name": "date_time",
          "type": "datetime",
          "required": true
        },
        {
          "name": "team_home",
          "type": "text",
          "required": true
        },
        {
          "name": "team_away",
          "type": "text",
          "required": true
        },
        {
          "name": "score_home",
          "type": "int",
          "required": false
        },
        {
          "name": "score_away",
          "type": "int",
          "required": false
        }
      ],
      "plural": "Matches",
      "ownedByUser": true
    },
    {
      "name": "Tournament",
      "fields": [
        {
          "name": "name",
          "type": "text",
          "required": true
        },
        {
          "name": "start_date",
          "type": "date",
          "required": true
        },
        {
          "name": "end_date",
          "type": "date",
          "required": true
        },
        {
          "name": "current_round",
          "type": "int",
          "required": false
        }
      ],
      "plural": "Tournaments",
      "ownedByUser": true
    },
    {
      "name": "Standings",
      "fields": [
        {
          "name": "tournament_id",
          "type": "int",
          "required": true
        },
        {
          "name": "team_name",
          "type": "text",
          "required": true
        },
        {
          "name": "points",
          "type": "int",
          "required": true
        },
        {
          "name": "matches_played",
          "type": "int",
          "required": true
        }
      ],
      "plural": "Standings",
      "ownedByUser": true
    },
    {
      "name": "Scorer",
      "fields": [
        {
          "name": "tournament_id",
          "type": "int",
          "required": true
        },
        {
          "name": "player_name",
          "type": "text",
          "required": true
        },
        {
          "name": "goals",
          "type": "int",
          "required": true
        }
      ],
      "plural": "Scorers",
      "ownedByUser": true
    }
  ],
  "identity": {
    "name": "Promiedos",
    "domain": "promiedos.app",
    "logoSvg": "<svg viewBox=\"0 0 64 64\" xmlns=\"http://www.w3.org/2000/svg\">\n  <circle cx=\"32\" cy=\"32\" r=\"16\" fill=\"#1E90FF\"/>\n  <path d=\"M32 16a16 16 0 0 0 0 32\" fill=\"none\" stroke=\"#FF4500\" stroke-width=\"8\"/>\n  <circle cx=\"32\" cy=\"32\" r=\"6\" fill=\"#FF4500\"/>\n  <path d=\"M32 26l-2 4 2 4 2-4z\" fill=\"#1E90FF\"/>\n  <path d=\"M26 32l4 2 4-2-4-2z\" fill=\"#1E90FF\"/>\n</svg>",
    "palette": [
      {
        "hex": "#1E90FF",
        "label": "primary"
      },
      {
        "hex": "#FFD700",
        "label": "secondary"
      },
      {
        "hex": "#FF4500",
        "label": "accent"
      },
      {
        "hex": "#FFFFFF",
        "label": "background"
      },
      {
        "hex": "#000000",
        "label": "text"
      },
      {
        "hex": "#F0F0F0",
        "label": "light shade"
      },
      {
        "hex": "#C0C0C0",
        "label": "medium shade"
      },
      {
        "hex": "#808080",
        "label": "dark shade"
      }
    ],
    "tagline": "Clon de Promiedos: fútbol argentino en vivo — partidos del día minuto a minuto, fixtures por fecha, tablas de posiciones por torneo, goleadores y resultados históricos. Datos scrapeados y actualizados por cron.",
    "languages": [
      "es"
    ],
    "brandColor": "#1E90FF",
    "accentColor": "#FF4500",
    "logoConcept": "Una letra 'P' estilizada con un balón de fútbol integrado en el diseño.",
    "logoMonogram": "P",
    "targetMarkets": [],
    "secondaryColor": "#FFD700"
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
