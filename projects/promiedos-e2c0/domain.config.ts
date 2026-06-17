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
    "socialProof": "Hecho para Hinchas argentinos que quieren ver de un vistazo los partidos del día y la tabla de posiciones.."
  },
  "modules": {
    "growth": true
  },
  "entities": [
    {
      "name": "Match",
      "fields": [
        {
          "name": "date",
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
          "name": "season",
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
      "ownedByUser": true
    }
  ],
  "identity": {
    "name": "Promiedos",
    "domain": "promiedos.app",
    "logoSvg": "<svg viewBox=\"0 0 64 64\" xmlns=\"http://www.w3.org/2000/svg\">\n  <circle cx=\"32\" cy=\"32\" r=\"30\" fill=\"#FF5733\"/>\n  <path d=\"M32 12l-6 10.39L18 24l6 10.39L18 44l14-4.61L46 44l-6-10.39L46 24l-8-1.61L32 12z\" fill=\"#900C3F\"/>\n  <circle cx=\"32\" cy=\"32\" r=\"6\" fill=\"#FF5733\"/>\n</svg>",
    "palette": [
      {
        "hex": "#FF5733",
        "label": "Primary"
      },
      {
        "hex": "#C70039",
        "label": "Secondary"
      },
      {
        "hex": "#900C3F",
        "label": "Accent"
      },
      {
        "hex": "#581845",
        "label": "Background"
      },
      {
        "hex": "#FFFFFF",
        "label": "Text"
      },
      {
        "hex": "#FFC300",
        "label": "Highlight"
      }
    ],
    "tagline": "Clon de Promiedos: fútbol argentino en vivo — partidos del día minuto a minuto, fixtures por fecha, tablas de posiciones por torneo, goleadores y resultados históricos. Datos scrapeados y actualizados por cron.",
    "languages": [
      "es"
    ],
    "brandColor": "#FF5733",
    "accentColor": "#900C3F",
    "logoConcept": "Un balón de fútbol estilizado con las letras PM en el centro, simbolizando el enfoque en el fútbol argentino.",
    "logoMonogram": "PM",
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
