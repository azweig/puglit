/**
 * EXAMPLE — Lumi, personalized AI bedtime stories for kids.
 * Founder: a parent + ex-ML engineer. Freemium, Spanish-first + English.
 * Showcases: ai engine (story generator + AI cover), content-blog with STORYTELLER
 * personas (a public SEO library of free sample stories), payments, email lifecycle,
 * gamification (nightly reading streaks), and a kids-safety compliance posture.
 */
import type { DomainConfig } from "../domain.config"

const lumi: DomainConfig = {
  // Block 1 — Identity
  identity: {
    name: "Lumi",
    tagline: "Un cuento nuevo cada noche, hecho para tu peque",
    domain: "getlumi.app",
    languages: ["es", "en"],
    brandColor: "#6366F1", // soft dreamy indigo
    targetMarkets: ["MX", "AR", "CO", "ES", "PE", "CL", "US"],
  },

  // Block 5/9 — modules (WHY in each comment)
  modules: {
    aiLayer: true,         // story generator + cover image + guardian = the whole product
    engine: true,          // the nightly story generator is the unique compute slot
    payments: true,        // freemium → Stripe subs (and MercadoPago for LATAM cards)
    contentBlog: true,     // public library of free sample stories = the SEO/acquisition engine
    emailLifecycle: true,  // verify the parent, onboarding drip, weekly "stories you made" recap, reengagement
    gamification: true,    // nightly bedtime reading streaks keep the habit (and retention) alive
    profiling: true,       // learn each child's loved characters/themes to make the next story better
  },

  // Block 3 — Entities
  entities: [
    {
      // The child profile the parent sets up once; drives every story.
      name: "Child",
      plural: "Children",
      ownedByUser: true,
      fields: [
        { name: "name", type: "text", required: true, note: "child's first name, woven into the story" },
        { name: "age", type: "int", required: true, note: "drives vocabulary, length and themes" },
        { name: "favorite_characters", type: "json", note: "array of strings, e.g. [dinosaurs, astronauts]" },
        { name: "interests", type: "json", note: "array of strings: space, animals, soccer…" },
        { name: "language", type: "enum", enumValues: ["es", "en"], note: "narration + text language" },
        { name: "avatar_color", type: "text" },
      ],
    },
    {
      // A story generated for a specific child — private, lives in the parent's library.
      name: "Story",
      plural: "Stories",
      ownedByUser: true,
      searchable: true,
      fields: [
        { name: "childId", type: "ref", ref: "Child", required: true },
        { name: "title", type: "text", required: true, aiGenerated: true },
        { name: "theme", type: "text", required: true, note: "the lesson/value the parent asked for, e.g. sharing" },
        { name: "body", type: "longtext", aiGenerated: true, note: "the full illustrated bedtime story, family-safe" },
        { name: "coverUrl", type: "url", aiGenerated: true, note: "AI-generated cover illustration" },
        { name: "audioUrl", type: "url", aiGenerated: true, note: "TTS narration of the story (paid)" },
        { name: "minutes", type: "int", note: "estimated read-aloud time" },
        { name: "createdNight", type: "date", note: "the bedtime this story was made for" },
        { name: "favorite", type: "bool" },
      ],
    },
    {
      // The PUBLIC sample library — free stories with generic characters, the SEO surface.
      name: "SampleStory",
      plural: "SampleStories",
      public: true,
      searchable: true,
      fields: [
        { name: "title", type: "text", required: true },
        { name: "slug", type: "slug", unique: true },
        { name: "theme", type: "enum", enumValues: ["amistad", "valentia", "compartir", "honestidad", "perseverancia", "empatia", "dormir"] },
        { name: "ageBand", type: "enum", enumValues: ["2-4", "5-7", "8-10"] },
        { name: "body", type: "longtext", aiGenerated: true, note: "narrative in the storyteller's voice, family-safe" },
        { name: "coverUrl", type: "url", aiGenerated: true },
        { name: "authorId", type: "ref", ref: "Storyteller" },
        { name: "language", type: "enum", enumValues: ["es", "en"] },
      ],
    },
    {
      // The storyteller personas that "write" the public library.
      name: "Storyteller",
      plural: "Storytellers",
      public: true,
      fields: [
        { name: "name", type: "text", required: true },
        { name: "bio", type: "longtext" },
        { name: "avatarUrl", type: "url" },
      ],
    },
  ],

  // Block 2 — The engine (the unique compute)
  engine: {
    kind: "ai",
    description:
      "Writes a unique, age-appropriate, family-safe illustrated bedtime story each night using the child's name, age, favorite characters and a lesson/theme — then generates a cover illustration and (on paid) an audio narration.",
    inputs: ["child name", "child age", "favorite characters", "interests", "lesson/theme", "language"],
    output: "an illustrated bedtime story (title + body + cover image + optional audio narration), saved to the family library",
  },

  // Block 6 — Content / blog with author personas
  content: {
    contentType: "story",
    cadence: "daily",          // a fresh public sample story every day feeds SEO + retention
    autoPublishSocial: true,
    authors: [
      {
        name: "Abuela Estela",
        voice: "cálida y tierna, ritmo lento de hora de dormir, repeticiones suaves y un cierre que invita a soñar",
        expertise: "cuentos de buenas noches para 2-5 años, valores de cariño, calma y rutina",
      },
      {
        name: "Capitán Nova",
        voice: "aventurero pero amable, lleno de asombro, frases cortas y giros emocionantes sin miedo ni violencia",
        expertise: "aventuras espaciales y de fantasía para 5-10 años, valentía, curiosidad y trabajo en equipo",
      },
    ],
  },

  // Block 4 — Monetization (freemium)
  monetization: {
    model: "freemium",
    providers: ["stripe", "mercadopago"],
    plans: [
      {
        id: "free",
        name: { es: "Gratis", en: "Free" },
        priceUsd: 0,
        features: [
          { es: "2 cuentos personalizados al mes", en: "2 personalized stories per month" },
          { es: "1 perfil de peque", en: "1 child profile" },
          { es: "Portada ilustrada con IA", en: "AI-illustrated cover" },
          { es: "Biblioteca pública de cuentos gratis", en: "Public library of free stories" },
        ],
      },
      {
        id: "familia",
        name: { es: "Familia", en: "Family" },
        priceUsd: 7.99,
        interval: "month",
        highlight: true,
        features: [
          { es: "Cuentos ilimitados, uno nuevo cada noche", en: "Unlimited stories — a new one every night" },
          { es: "Hasta 4 perfiles de peques", en: "Up to 4 child profiles" },
          { es: "Narración con audio para escuchar y dormir", en: "Audio narration to listen and fall asleep" },
          { es: "Biblioteca privada con descarga en PDF", en: "Private library with PDF download" },
          { es: "Racha de lectura y recompensas", en: "Reading streaks and rewards" },
        ],
      },
      {
        id: "familia-anual",
        name: { es: "Familia anual", en: "Family yearly" },
        priceUsd: 69,
        interval: "year",
        features: [
          { es: "Todo lo de Familia", en: "Everything in Family" },
          { es: "Ahorra ~30% (2 meses gratis)", en: "Save ~30% (2 months free)" },
        ],
      },
    ],
  },

  // Block 1/8 — Landing
  landing: {
    hero: {
      headline: {
        es: "Cada noche, un cuento creado solo para tu peque.",
        en: "Every night, a story made just for your little one.",
      },
      subheadline: {
        es: "Decinos su nombre, su edad, sus personajes favoritos y la enseñanza de hoy. Lumi escribe e ilustra un cuento único para dormir — con narración en audio para acompañar el sueño.",
        en: "Tell us their name, age, favorite characters and tonight's lesson. Lumi writes and illustrates a unique bedtime story — with audio narration to drift off to.",
      },
      ctaPrimary: { es: "Crear su primer cuento gratis", en: "Create their first story free" },
      ctaSecondary: { es: "Leer cuentos de ejemplo", en: "Read sample stories" },
    },
    socialProof: {
      es: "Más de 40.000 noches felices a la hora de dormir",
      en: "Over 40,000 happy bedtimes and counting",
    },
    valueProps: [
      {
        title: { es: "Es el protagonista", en: "They're the hero" },
        body: {
          es: "Tu peque y sus personajes favoritos viven la aventura. Cada cuento es único y nunca se repite.",
          en: "Your child and their favorite characters live the adventure. Every story is one of a kind and never repeats.",
        },
      },
      {
        title: { es: "Enseña lo que querés", en: "Teaches what matters to you" },
        body: {
          es: "Elegí una enseñanza — compartir, valentía, honestidad — y Lumi la teje en la historia con dulzura.",
          en: "Pick a lesson — sharing, bravery, honesty — and Lumi weaves it gently into the story.",
        },
      },
      {
        title: { es: "Seguro para peques", en: "Safe for little ones" },
        body: {
          es: "Sin violencia ni sustos. Cada cuento pasa por un filtro de seguridad pensado para la infancia.",
          en: "No violence, no scares. Every story passes a safety filter built for childhood.",
        },
      },
    ],
    faq: [
      {
        q: { es: "¿Para qué edades sirve?", en: "What ages is it for?" },
        a: {
          es: "De 2 a 10 años. Lumi ajusta el vocabulario, la longitud y los temas según la edad de tu peque.",
          en: "Ages 2 to 10. Lumi adapts vocabulary, length and themes to your child's age.",
        },
      },
      {
        q: { es: "¿Los cuentos son seguros para niños?", en: "Are the stories safe for kids?" },
        a: {
          es: "Sí. Cada cuento se genera con reglas estrictas de contenido familiar y pasa por un filtro de seguridad antes de mostrarse: nada de violencia, miedo ni temas adultos.",
          en: "Yes. Every story is generated with strict family-safe rules and passes a safety filter before it's shown: no violence, fear or adult themes.",
        },
      },
      {
        q: { es: "¿Puedo escucharlos en audio?", en: "Can we listen in audio?" },
        a: {
          es: "Sí. El plan Familia incluye narración en audio cálida para que tu peque escuche el cuento y se quede dormido.",
          en: "Yes. The Family plan includes warm audio narration so your child can listen and fall asleep.",
        },
      },
    ],
    finalCta: {
      headline: {
        es: "La hora de dormir, convertida en su momento favorito del día.",
        en: "Bedtime, turned into their favorite moment of the day.",
      },
      button: { es: "Empezar gratis", en: "Start free" },
    },
  },

  // Block 10 — Compliance (kids product)
  compliance: {
    // The account holder must be an adult (parent/guardian); content is for children.
    ageGate: 18,
    notices: [
      "Lumi crea contenido apto para toda la familia; las cuentas son administradas por un adulto responsable.",
      "Las historias son generadas por IA y pueden contener imprecisiones; revisá el contenido con tu peque.",
      "No recopilamos datos sensibles de menores más allá del nombre y la edad que ingresás para personalizar el cuento.",
    ],
  },

  // Block 9 — Platforms + infra
  platforms: { web: true, mobile: true, admin: true },
  infra: { deploy: "fly", region: "gru", emailProvider: "resend" },
}

export default lumi
