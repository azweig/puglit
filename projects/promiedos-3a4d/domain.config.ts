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
    "socialProof": "Hecho para Hinchas argentinos de fútbol que quieren información rápida y clara sobre los partidos y torneos.."
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
          "name": "current_stage",
          "type": "text",
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
        },
        {
          "name": "goal_difference",
          "type": "int",
          "required": false
        }
      ],
      "plural": "Standings",
      "ownedByUser": true
    },
    {
      "name": "Scorer",
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
      "plural": "Scorers",
      "ownedByUser": true
    }
  ],
  "identity": {
    "name": "Promiedos",
    "domain": "promiedos.app",
    "logoSvg": "<svg viewBox=\"0 0 64 64\" xmlns=\"http://www.w3.org/2000/svg\">\n  <circle cx=\"32\" cy=\"32\" r=\"30\" fill=\"#FF4500\" />\n  <path d=\"M32 12l8 14h-16l8-14zm0 40l-8-14h16l-8 14z\" fill=\"#000000\" />\n  <polygon points=\"32,24 24,32 32,40 40,32\" fill=\"#000000\"/>\n</svg>",
    "palette": [
      {
        "hex": "#FF4500",
        "label": "primary"
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
        "hex": "#FFD700",
        "label": "accent"
      },
      {
        "hex": "#808080",
        "label": "secondary"
      },
      {
        "hex": "#FF6347",
        "label": "shade1"
      },
      {
        "hex": "#FF7F50",
        "label": "shade2"
      }
    ],
    "tagline": "Clon de Promiedos: fútbol argentino en vivo — partidos del día minuto a minuto, fixtures por fecha, tablas de posiciones por torneo, goleadores y resultados históricos. Datos scrapeados y actualizados por cron.",
    "languages": [
      "es"
    ],
    "brandColor": "#FF4500",
    "accentColor": "#000000",
    "logoConcept": "Un balón de fútbol estilizado con las letras PM en el centro, evocando dinamismo y pasión por el fútbol.",
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
