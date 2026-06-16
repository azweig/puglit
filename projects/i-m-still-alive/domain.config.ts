export * from "./domain-types"
import type { DomainConfig } from "./domain-types"

const config: DomainConfig = {
  identity: {
    name: "I'm Still Alive",
    tagline: { es: "Tus últimas palabras, entregadas cuando ya no puedas.", en: "Your final words, delivered when you no longer can." },
    domain: "imstillalive.app",
    languages: ["es", "en"],
    brandColor: "#4F46E5",
    targetMarkets: ["US", "AR", "MX", "ES"],
  },
  modules: { emailLifecycle: true },
  entities: [
    {
      name: "Recipient",
      plural: "Recipients",
      ownedByUser: true,
      fields: [
        { name: "name", type: "text", required: true },
        { name: "channel", type: "enum", enumValues: ["email", "sms", "whatsapp"], required: true },
        { name: "contact", type: "text", required: true, note: "email address or phone number" },
        { name: "message", type: "longtext", required: true },
      ],
    },
  ],
  engine: {
    kind: "deterministic",
    description: "A dead man's switch: pings the user on a schedule; if they go silent past the threshold, each recipient's message is delivered on their channel.",
    deterministicNote: "now - last_check_in > silence_days -> deliver pending messages.",
  },
  monetization: { model: "free", providers: ["stripe"], plans: [{ id: "free", priceUsd: 0, features: [{ es: "Mensajes ilimitados", en: "Unlimited messages" }, { es: "Email, SMS y WhatsApp", en: "Email, SMS & WhatsApp" }] }] },
  landing: {
    hero: {
      headline: { es: "Si algo te pasa, ellos recibirán tu mensaje.", en: "If something happens to you, they'll get your message." },
      subheadline: { es: "Configurás cada cuánto te preguntamos si estás bien. Si dejás de responder, entregamos tus mensajes a quienes elijas — por email, SMS o WhatsApp.", en: "Set how often we check you're okay. If you stop answering, we deliver your messages to the people you chose — by email, SMS or WhatsApp." },
      ctaPrimary: { es: "Crear mi cuenta", en: "Create my account" },
      ctaSecondary: { es: "Cómo funciona", en: "How it works" },
    },
    socialProof: { es: "Tus palabras, cuando más importan.", en: "Your words, when they matter most." },
    valueProps: [
      { title: { es: "Vos elegís el canal", en: "You pick the channel" }, body: { es: "Email, SMS o WhatsApp — para vos y para cada destinatario.", en: "Email, SMS or WhatsApp — for you and each recipient." } },
      { title: { es: "Check-in a tu ritmo", en: "Check in on your schedule" }, body: { es: "Decidís cada cuánto y a qué hora te preguntamos si seguís ahí.", en: "Decide how often and at what time we ask if you're still there." } },
      { title: { es: "Un mensaje para cada persona", en: "A message for each person" }, body: { es: "Escribís algo único para cada ser querido.", en: "Write something unique for each loved one." } },
    ],
    finalCta: { headline: { es: "Dejá tus palabras listas hoy.", en: "Leave your words ready today." }, button: { es: "Empezar gratis", en: "Start free" } },
  },
  platforms: { web: true, admin: true },
  infra: { deploy: "fly", emailProvider: "resend" },
}

export default config
