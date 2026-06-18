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
      "subheadline": "Resultados de fútbol en vivo de las grandes ligas — Argentina, Brasil, Inglaterra, España, Italia y la Copa Libertadores — minuto a minuto, con tablas y goleadores por torneo.",
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
    "socialProof": "Hecho para Hinchas argentinos que quieren ver de un vistazo qué se juega hoy y cómo va cada partido en vivo.."
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
          "name": "current_round",
          "type": "int",
          "required": false
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
      "ownedByUser": false
    }
  ],
  "identity": {
    "name": "Promiedos",
    "domain": "promiedos.app",
    "logoSvg": "<svg viewBox=\"0 0 64 64\" xmlns=\"http://www.w3.org/2000/svg\">\n  <circle cx=\"32\" cy=\"32\" r=\"30\" fill=\"#FF5733\"/>\n  <path d=\"M32 16 L38 32 L32 48 L26 32 Z\" fill=\"#900C3F\"/>\n  <path d=\"M20 24 L32 32 L20 40 Z\" fill=\"#FF5733\"/>\n  <path d=\"M44 24 L32 32 L44 40 Z\" fill=\"#FF5733\"/>\n</svg>",
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
      }
    ],
    "tagline": "Resultados de fútbol en vivo — Argentina, Brasil, Inglaterra, España, Italia y Copa Libertadores. Partidos minuto a minuto, fixtures, tablas de posiciones y goleadores por torneo, actualizados al instante.",
    "languages": [
      "es"
    ],
    "brandColor": "#FF5733",
    "accentColor": "#900C3F",
    "logoConcept": "Un balón de fútbol estilizado con las letras PM integradas, reflejando la pasión y dinamismo del fútbol argentino.",
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
