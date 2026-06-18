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
        "a": "Start free, then $10/mo. Cancel anytime.",
        "q": "How much does it cost?"
      },
      {
        "a": "Yes — one click, no questions.",
        "q": "Can I cancel anytime?"
      },
      {
        "a": "Yes. Your data is yours and you can export it.",
        "q": "Do I own my data?"
      }
    ],
    "hero": {
      "headline": "Practice realistic duel decisions in guided mini-duel simulations",
      "ctaPrimary": "Get started",
      "subheadline": "A nostalgic-but-modern learning and training app for Yu-Gi-Oh! returning players, focused on guided mini-duel simulations that teach real duel decisions, especially breaking boards and finding lethal lines.",
      "ctaSecondary": "See pricing"
    },
    "finalCta": {
      "button": "Get started",
      "headline": "Ready to try Yu Gi Oh! Game?"
    },
    "valueProps": [
      {
        "body": "Built into Yu Gi Oh! Game from day one — no glue code.",
        "title": "Practice realistic duel decisions in guided mini-duel simulations"
      },
      {
        "body": "It just works, so you can focus on your users.",
        "title": "Learn how to break established boards and create lethal pressure"
      },
      {
        "body": "Reliable, secure and ready to scale.",
        "title": "Get coached, current-format training with seasonal licensed packs"
      }
    ],
    "socialProof": "Made for Returning casual Yu-Gi-Oh! players."
  },
  "modules": {
    "engine": true,
    "growth": true,
    "profiling": true,
    "contentBlog": true
  },
  "entities": [
    {
      "name": "Deck",
      "fields": [
        {
          "name": "name",
          "type": "text",
          "required": true
        },
        {
          "name": "archetype",
          "type": "text",
          "required": false
        },
        {
          "name": "format",
          "type": "text",
          "required": true
        },
        {
          "name": "is_active",
          "type": "bool",
          "required": true
        }
      ],
      "plural": "Decks",
      "ownedByUser": true
    },
    {
      "name": "Simulation",
      "fields": [
        {
          "name": "title",
          "type": "text",
          "required": true
        },
        {
          "name": "scenario_type",
          "type": "enum",
          "required": true,
          "enumValues": [
            "board_break",
            "lethal_line",
            "combo_practice"
          ]
        },
        {
          "name": "starting_state",
          "type": "json",
          "required": true
        },
        {
          "name": "difficulty",
          "type": "enum",
          "required": true,
          "enumValues": [
            "beginner",
            "intermediate",
            "advanced"
          ]
        }
      ],
      "plural": "Simulations",
      "ownedByUser": true
    },
    {
      "name": "Attempt",
      "fields": [
        {
          "name": "result",
          "type": "enum",
          "required": true,
          "enumValues": [
            "success",
            "failure",
            "partial"
          ]
        },
        {
          "name": "turns_taken",
          "type": "int",
          "required": true
        },
        {
          "name": "decision_log",
          "type": "longtext",
          "required": false
        },
        {
          "name": "completed_at",
          "type": "datetime",
          "required": true
        }
      ],
      "plural": "Attempts",
      "ownedByUser": true
    },
    {
      "name": "Pack",
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
          "name": "is_licensed",
          "type": "bool",
          "required": true
        },
        {
          "name": "release_date",
          "type": "date",
          "required": false
        }
      ],
      "plural": "Packs",
      "ownedByUser": true
    }
  ],
  "identity": {
    "name": "Yu Gi Oh! Game",
    "domain": "yu-gi-oh-game.app",
    "logoSvg": "<svg viewBox=\"0 0 64 64\" xmlns=\"http://www.w3.org/2000/svg\" fill=\"none\">\n  <rect x=\"8\" y=\"8\" width=\"48\" height=\"48\" rx=\"4\" fill=\"#1E3A8A\"/>\n  <path d=\"M32 16 L24 32 L32 48 L40 32 Z\" fill=\"#D99A1E\"/>\n  <path d=\"M32 16 A16 16 0 0 1 48 32\" stroke=\"#D99A1E\" stroke-width=\"4\" stroke-linecap=\"round\"/>\n</svg>",
    "palette": [
      {
        "hex": "#1E3A8A",
        "label": "Primary Midnight Blue"
      },
      {
        "hex": "#3B82F6",
        "label": "Secondary Duel Blue"
      },
      {
        "hex": "#D99A1E",
        "label": "Accent Pharaoh Gold"
      },
      {
        "hex": "#7C3AED",
        "label": "Arcane Violet"
      },
      {
        "hex": "#0F172A",
        "label": "Deep Arena Navy"
      },
      {
        "hex": "#F8FAFC",
        "label": "Card Surface White"
      },
      {
        "hex": "#CBD5E1",
        "label": "Border Slate"
      },
      {
        "hex": "#111827",
        "label": "Primary Text Charcoal"
      }
    ],
    "tagline": "A nostalgic-but-modern learning and training app for Yu-Gi-Oh! returning players, focused on guided mini-duel simulations that teach real duel decisions, especially breaking boards and finding lethal lines.",
    "languages": [
      "en"
    ],
    "brandColor": "#1E3A8A",
    "accentColor": "#D99A1E",
    "logoConcept": "A sharp YG monogram inside a midnight-blue card frame with a subtle gold turn-arrow motif suggesting guided comeback decisions.",
    "logoMonogram": "YG",
    "targetMarkets": [],
    "secondaryColor": "#3B82F6"
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
          "Practice realistic duel decisions in guided mini-duel simulations",
          "Learn how to break established boards and create lethal pressure",
          "Get coached, current-format training with seasonal licensed packs",
          "Priority support"
        ],
        "interval": "month",
        "priceUsd": 10,
        "highlight": true
      },
      {
        "id": "anual",
        "features": [
          "Everything in Pro",
          "2 months free"
        ],
        "interval": "year",
        "priceUsd": 100
      }
    ],
    "providers": [
      "stripe"
    ]
  }
}
export default config
