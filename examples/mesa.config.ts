/**
 * Example — "Mesa", an AI meal-planning SaaS (the default showcase config).
 * This is the source of truth for the demo at puglit-spine.vercel.app.
 */
import type { DomainConfig } from "../domain.config"

const mesa: DomainConfig = {
  identity: {
    name: "Mesa",
    tagline: "Planificá tus comidas con IA",
    domain: "mesa.app",
    languages: ["es", "en"],
    brandColor: "#10B981",
    targetMarkets: ["AR", "MX", "ES"],
  },
  modules: { payments: true, aiLayer: true, contentBlog: true, emailLifecycle: true },
  entities: [
    {
      name: "MealPlan",
      ownedByUser: true,
      fields: [
        { name: "week_of", type: "date", required: true },
        { name: "servings", type: "int", required: true },
        { name: "plan", type: "json", aiGenerated: true, note: "7 days × meals" },
      ],
    },
    {
      name: "Recipe",
      public: true,
      searchable: true,
      fields: [
        { name: "title", type: "text", required: true },
        { name: "slug", type: "slug", unique: true },
        { name: "body", type: "longtext", aiGenerated: true },
        { name: "minutes", type: "int" },
      ],
    },
  ],
  engine: {
    kind: "ai",
    description: "Builds a weekly meal plan from tastes, budget, restrictions and pantry.",
    inputs: ["servings", "dietary restrictions", "budget", "pantry items"],
    output: "a 7-day plan + an aisle-ordered shopping list",
  },
  monetization: {
    model: "freemium",
    providers: ["stripe"],
    plans: [
      {
        id: "free",
        priceUsd: 0,
        features: [
          { es: "1 plan por semana", en: "1 plan per week" },
          { es: "Recetas con pasos claros", en: "Recipes with clear steps" },
          { es: "Lista de compras", en: "Shopping list" },
        ],
      },
      {
        id: "pro",
        name: { es: "Pro", en: "Pro" },
        priceUsd: 6,
        interval: "month",
        highlight: true,
        features: [
          { es: "Planes ilimitados", en: "Unlimited plans" },
          { es: "IA que aprende tus gustos", en: "AI that learns your tastes" },
          { es: "Usa lo que ya tenés en casa", en: "Uses what's already in your kitchen" },
          { es: "Soporte prioritario", en: "Priority support" },
        ],
      },
      {
        id: "anual",
        name: { es: "Pro anual", en: "Pro yearly" },
        priceUsd: 49,
        interval: "year",
        features: [
          { es: "Todo lo de Pro", en: "Everything in Pro" },
          { es: "2 meses gratis", en: "2 months free" },
        ],
      },
    ],
  },
  landing: {
    hero: {
      headline: { es: "Comé bien sin pensarlo.", en: "Eat well without thinking." },
      subheadline: {
        es: "Mesa arma tu plan semanal de comidas con IA según tus gustos, tu presupuesto y lo que ya tenés en casa — con la lista de compras lista para usar.",
        en: "Mesa builds your weekly meal plan with AI around your tastes, budget and what's already in your kitchen — shopping list included.",
      },
      ctaPrimary: { es: "Armá tu plan gratis", en: "Build your free plan" },
      ctaSecondary: { es: "Ver cómo funciona", en: "See how it works" },
    },
    socialProof: { es: "+12.000 planes generados esta semana", en: "+12,000 plans generated this week" },
    valueProps: [
      {
        title: { es: "Personalizado de verdad", en: "Truly personal" },
        body: { es: "Aprende qué te gusta y qué descartás. Cada semana afina un poco más.", en: "It learns what you love and what you skip. Sharper every single week." },
      },
      {
        title: { es: "Listo en 30 segundos", en: "Ready in 30 seconds" },
        body: { es: "Decí cuántos son y qué evitás. Mesa hace el resto al instante.", en: "Say who's eating and what to avoid. Mesa does the rest instantly." },
      },
      {
        title: { es: "Cero desperdicio", en: "Zero waste" },
        body: { es: "Tu plan se convierte en una lista ordenada por góndola y usa lo que ya tenés.", en: "Your plan becomes an aisle-ordered list and uses what you already have." },
      },
    ],
    faq: [
      {
        q: { es: "¿Necesito saber cocinar?", en: "Do I need to know how to cook?" },
        a: { es: "No. Cada receta trae pasos claros y tiempos reales, pensados para días ocupados.", en: "No. Every recipe has clear steps and realistic timings, made for busy days." },
      },
      {
        q: { es: "¿Funciona si soy vegetariano o celíaco?", en: "Does it work if I'm vegetarian or celiac?" },
        a: { es: "Sí. Configurás tus restricciones una vez y Mesa nunca las rompe.", en: "Yes. Set your restrictions once and Mesa never breaks them." },
      },
      {
        q: { es: "¿Puedo cancelar cuando quiera?", en: "Can I cancel anytime?" },
        a: { es: "Sí, en un clic y sin preguntas. El plan gratis no caduca.", en: "Yes, one click, no questions. The free plan never expires." },
      },
    ],
    finalCta: {
      headline: { es: "Tu próxima semana de comidas, resuelta.", en: "Next week's meals, sorted." },
      button: { es: "Empezar gratis", en: "Start free" },
    },
  },
  platforms: { web: true, admin: true },
  infra: { deploy: "fly", emailProvider: "resend" },
}

export default mesa
