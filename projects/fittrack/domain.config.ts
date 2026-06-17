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
      "headline": "Registrá tus series",
      "ctaPrimary": "Empezar gratis",
      "subheadline": "App para registrar entrenamientos y seguir tu progreso de fuerza",
      "ctaSecondary": "Ver precios"
    },
    "finalCta": {
      "button": "Empezar gratis",
      "headline": "¿List@ para probar FitTrack?"
    },
    "valueProps": [
      {
        "body": "Viene en FitTrack desde el día uno — sin código pegamento.",
        "title": "Registrá tus series"
      },
      {
        "body": "Funciona solo, para que te enfoques en tus usuarios.",
        "title": "Mirá tu progreso"
      },
      {
        "body": "Confiable, seguro y listo para escalar.",
        "title": "Rutinas guardadas"
      }
    ],
    "socialProof": "Hecho para gente que va al gym."
  },
  "modules": {},
  "entities": [
    {
      "name": "Workout",
      "fields": [
        {
          "name": "date",
          "type": "date",
          "required": true
        },
        {
          "name": "duration_minutes",
          "type": "int",
          "required": true
        },
        {
          "name": "notes",
          "type": "longtext",
          "required": false
        }
      ],
      "plural": "Workouts",
      "ownedByUser": true
    },
    {
      "name": "Exercise",
      "fields": [
        {
          "name": "name",
          "type": "text",
          "required": true
        },
        {
          "name": "category",
          "type": "enum",
          "required": true,
          "enumValues": [
            "Strength",
            "Cardio",
            "Flexibility",
            "Balance"
          ]
        },
        {
          "name": "description",
          "type": "longtext",
          "required": false
        }
      ],
      "plural": "Exercises",
      "ownedByUser": true
    },
    {
      "name": "Set",
      "fields": [
        {
          "name": "reps",
          "type": "int",
          "required": true
        },
        {
          "name": "weight",
          "type": "float",
          "required": true
        },
        {
          "name": "workout_id",
          "type": "int",
          "required": true
        }
      ],
      "plural": "Sets",
      "ownedByUser": true
    },
    {
      "name": "Routine",
      "fields": [
        {
          "name": "name",
          "type": "text",
          "required": true
        },
        {
          "name": "exercises",
          "type": "json",
          "required": true
        },
        {
          "name": "description",
          "type": "longtext",
          "required": false
        }
      ],
      "plural": "Routines",
      "ownedByUser": true
    }
  ],
  "identity": {
    "name": "FitTrack",
    "domain": "fittrack.app",
    "logoSvg": "<svg viewBox=\"0 0 64 64\" xmlns=\"http://www.w3.org/2000/svg\">\n  <rect x=\"16\" y=\"28\" width=\"32\" height=\"8\" fill=\"#10B981\"/>\n  <circle cx=\"12\" cy=\"32\" r=\"8\" fill=\"#F59E0B\"/>\n  <circle cx=\"52\" cy=\"32\" r=\"8\" fill=\"#F59E0B\"/>\n</svg>",
    "palette": [
      {
        "hex": "#10B981",
        "label": "Primary"
      },
      {
        "hex": "#064E3B",
        "label": "Secondary"
      },
      {
        "hex": "#F59E0B",
        "label": "Accent"
      },
      {
        "hex": "#FFFFFF",
        "label": "Bg"
      },
      {
        "hex": "#0F172A",
        "label": "Text"
      }
    ],
    "tagline": "App para registrar entrenamientos y seguir tu progreso de fuerza",
    "languages": [
      "es"
    ],
    "brandColor": "#10B981",
    "accentColor": "#F59E0B",
    "logoConcept": "una pesa estilizada",
    "targetMarkets": [],
    "secondaryColor": "#064E3B"
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
          "Registrá tus series",
          "Mirá tu progreso",
          "Rutinas guardadas",
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
