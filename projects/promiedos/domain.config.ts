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
    "socialProof": "Hecho para Hinchas argentinos de fútbol que buscan información rápida y actualizada sobre partidos y torneos.."
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
          "required": true
        },
        {
          "name": "score_away",
          "type": "int",
          "required": true
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
      "name": "GoalScorer",
      "fields": [
        {
          "name": "match_id",
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
      "plural": "GoalScorers",
      "ownedByUser": true
    }
  ],
  "identity": {
    "name": "Promiedos",
    "domain": "promiedos.app",
    "logoSvg": "<svg viewBox=\"0 0 64 64\" xmlns=\"http://www.w3.org/2000/svg\">\n  <circle cx=\"32\" cy=\"32\" r=\"30\" fill=\"#FF0000\" stroke=\"#000000\" stroke-width=\"2\"/>\n  <path d=\"M32 12 L24 32 L32 52 L40 32 Z\" fill=\"#000000\"/>\n  <circle cx=\"32\" cy=\"32\" r=\"6\" fill=\"#FF0000\"/>\n</svg>",
    "palette": [
      {
        "hex": "#FF0000",
        "label": "Primary"
      },
      {
        "hex": "#FFFFFF",
        "label": "Background"
      },
      {
        "hex": "#000000",
        "label": "Text"
      },
      {
        "hex": "#FFCC00",
        "label": "Accent"
      },
      {
        "hex": "#333333",
        "label": "Secondary"
      }
    ],
    "tagline": "Clon de Promiedos: fútbol argentino en vivo — partidos del día minuto a minuto, fixtures por fecha, tablas de posiciones por torneo, goleadores y resultados históricos. Datos scrapeados y actualizados por cron.",
    "languages": [
      "es"
    ],
    "brandColor": "#FF0000",
    "accentColor": "#000000",
    "logoConcept": "Un balón de fútbol estilizado con las letras PM en el centro.",
    "logoMonogram": "PM",
    "targetMarkets": [],
    "secondaryColor": "#FFFFFF"
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
