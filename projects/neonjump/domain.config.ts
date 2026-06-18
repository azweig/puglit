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
      "headline": "Adictivo y rápido",
      "ctaPrimary": "Empezar gratis",
      "subheadline": "Un juego de plataformas tipo arcade: saltás entre plataformas que suben, esquivás enemigos y juntás monedas, con dificultad creciente",
      "ctaSecondary": "Ver precios"
    },
    "finalCta": {
      "button": "Empezar gratis",
      "headline": "¿List@ para probar NeonJump?"
    },
    "valueProps": [
      {
        "body": "Viene en NeonJump desde el día uno — sin código pegamento.",
        "title": "Adictivo y rápido"
      },
      {
        "body": "Funciona solo, para que te enfoques en tus usuarios.",
        "title": "Dificultad que sube"
      },
      {
        "body": "Confiable, seguro y listo para escalar.",
        "title": "Tabla de puntajes"
      }
    ]
  },
  "modules": {},
  "entities": [
    {
      "name": "Run",
      "fields": [
        {
          "name": "score",
          "type": "int",
          "required": true
        },
        {
          "name": "duration_seconds",
          "type": "int",
          "required": true
        },
        {
          "name": "coins_collected",
          "type": "int",
          "required": true
        },
        {
          "name": "ended_at",
          "type": "datetime",
          "required": true
        }
      ],
      "plural": "Runs",
      "ownedByUser": true
    },
    {
      "name": "LeaderboardEntry",
      "fields": [
        {
          "name": "player_name",
          "type": "text",
          "required": true
        },
        {
          "name": "score",
          "type": "int",
          "required": true
        },
        {
          "name": "rank",
          "type": "int",
          "required": true
        },
        {
          "name": "achieved_at",
          "type": "datetime",
          "required": true
        }
      ],
      "plural": "Leaderboard Entries",
      "ownedByUser": true
    },
    {
      "name": "Unlock",
      "fields": [
        {
          "name": "unlock_type",
          "type": "enum",
          "required": true,
          "enumValues": [
            "character",
            "theme",
            "effect"
          ]
        },
        {
          "name": "title",
          "type": "text",
          "required": true
        },
        {
          "name": "is_equipped",
          "type": "bool",
          "required": true
        },
        {
          "name": "unlocked_at",
          "type": "datetime",
          "required": true
        }
      ],
      "plural": "Unlocks",
      "ownedByUser": true
    }
  ],
  "identity": {
    "name": "NeonJump",
    "domain": "neonjump.app",
    "logoSvg": "<svg viewBox=\"0 0 64 64\" xmlns=\"http://www.w3.org/2000/svg\">\n  <circle cx=\"32\" cy=\"32\" r=\"30\" fill=\"none\" stroke=\"#7C3AED\" stroke-width=\"4\"/>\n  <path d=\"M16 48 L24 32 L32 48 L40 32 L48 48\" fill=\"none\" stroke=\"#7C3AED\" stroke-width=\"4\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>\n  <path d=\"M28 20 Q32 12 36 20\" fill=\"none\" stroke=\"#7C3AED\" stroke-width=\"4\" stroke-linecap=\"round\"/>\n</svg>",
    "tagline": "Un juego de plataformas tipo arcade: saltás entre plataformas que suben, esquivás enemigos y juntás monedas, con dificultad creciente",
    "languages": [
      "es"
    ],
    "brandColor": "#7C3AED",
    "targetMarkets": []
  },
  "platforms": {
    "web": true,
    "admin": true
  },
  "monetization": {
    "model": "freemium",
    "plans": [
      {
        "id": "free",
        "features": [
          "Funciones principales",
          "Soporte de la comunidad"
        ],
        "priceUsd": 0
      },
      {
        "id": "pro",
        "features": [
          "Adictivo y rápido",
          "Dificultad que sube",
          "Tabla de puntajes",
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
