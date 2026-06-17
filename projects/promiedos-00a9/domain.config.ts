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
    "socialProof": "Hecho para Hinchas argentinos de fútbol."
  },
  "modules": {
    "growth": true
  },
  "entities": [
    {
      "name": "Match",
      "fields": [
        {
          "name": "match_date",
          "type": "datetime",
          "required": true
        },
        {
          "name": "home_team",
          "type": "text",
          "required": true
        },
        {
          "name": "away_team",
          "type": "text",
          "required": true
        },
        {
          "name": "score",
          "type": "text",
          "required": false
        }
      ],
      "plural": "Matches",
      "ownedByUser": false
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
          "name": "type",
          "type": "enum",
          "required": true,
          "enumValues": [
            "League",
            "Cup",
            "Friendly"
          ]
        }
      ],
      "plural": "Tournaments",
      "ownedByUser": false
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
      "ownedByUser": false
    },
    {
      "name": "GoalScorer",
      "fields": [
        {
          "name": "player_name",
          "type": "text",
          "required": true
        },
        {
          "name": "team_name",
          "type": "text",
          "required": true
        },
        {
          "name": "goals",
          "type": "int",
          "required": true
        },
        {
          "name": "tournament_id",
          "type": "int",
          "required": true
        }
      ],
      "plural": "GoalScorers",
      "ownedByUser": false
    }
  ],
  "identity": {
    "name": "Promiedos",
    "domain": "promiedos.app",
    "logoSvg": "<svg viewBox=\"0 0 64 64\" xmlns=\"http://www.w3.org/2000/svg\">\n  <circle cx=\"32\" cy=\"32\" r=\"30\" fill=\"#FF5733\"/>\n  <path d=\"M32 8a24 24 0 1 1-24 24 24 24 0 0 1 24-24z\" fill=\"#900C3F\"/>\n  <path d=\"M32 16a16 16 0 1 0 16 16 16 16 0 0 0-16-16zm0 4a12 12 0 0 1 0 24 12 12 0 0 1 0-24z\" fill=\"#FF5733\"/>\n  <circle cx=\"32\" cy=\"32\" r=\"4\" fill=\"#900C3F\"/>\n</svg>",
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
        "hex": "#581845",
        "label": "background"
      },
      {
        "hex": "#FFFFFF",
        "label": "text"
      },
      {
        "hex": "#FFC300",
        "label": "highlight"
      },
      {
        "hex": "#DAF7A6",
        "label": "success"
      },
      {
        "hex": "#FF5733",
        "label": "alert"
      }
    ],
    "tagline": "Clon de Promiedos: fútbol argentino en vivo — partidos del día minuto a minuto, fixtures por fecha, tablas de posiciones por torneo, goleadores y resultados históricos. Datos scrapeados y actualizados por cron.",
    "languages": [
      "es"
    ],
    "brandColor": "#FF5733",
    "accentColor": "#900C3F",
    "logoConcept": "Una letra P estilizada con un balón de fútbol integrado, representando la pasión por el fútbol argentino.",
    "logoMonogram": "P",
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
