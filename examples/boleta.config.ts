/**
 * EXAMPLE — Boleta, a dead-simple invoicing SaaS for LATAM freelancers & small businesses.
 * =============================================================================
 * THE NON-AI TEST CASE. Boleta deliberately has NO `engine` and NO `aiLayer`.
 * The product's value is *simplicity and getting paid faster* — not intelligence.
 * This proves the seam works for an ordinary, CRUD-heavy, money-handling SaaS:
 *   - payments        → it's a paid product (subscription), Stripe global + MercadoPago LATAM
 *   - emailLifecycle  → invoices/receipts/reminders are EMAILS; deliverability == cash
 *   - geo             → multi-currency + locale per country (the core "LATAM" promise)
 *   - growth          → A/B + conversion wizards on a cold paid-tool landing
 *
 * Intentionally OFF: aiLayer (no chat/gen — billing must be deterministic & trusted),
 * engine (nothing to "compute/predict"), contentBlog, profiling, gamification, mobile.
 * =============================================================================
 */
import type { DomainConfig } from "../domain.config"

const boleta: DomainConfig = {
  identity: {
    name: "Boleta",
    tagline: "Facturá en 30 segundos y cobrá más rápido",
    domain: "boleta.app",
    languages: ["es", "en"],
    brandColor: "#2563EB", // trustworthy blue — money product, trust is the brand
    targetMarkets: ["MX", "CO", "PE", "CL", "AR", "ES", "US"],
  },

  // No aiLayer, no engine. This is the whole point of the test case: a clean,
  // non-AI SaaS still gets a complete, sellable product out of the seam.
  modules: {
    payments: true,        // it's a paid tool — Stripe (global) + MercadoPago (LATAM)
    emailLifecycle: true,  // invoices, receipts and payment reminders ARE the product's email
    geo: true,             // multi-currency + per-country locale/format (LATAM promise)
    growth: true,          // A/B + conversion wizard to convert a cold "is this legit?" visitor
  },

  entities: [
    {
      name: "Client",
      plural: "Clients",
      ownedByUser: true,     // each freelancer only sees their own clients
      searchable: true,
      fields: [
        { name: "name", type: "text", required: true },
        { name: "email", type: "email", note: "where invoices get sent" },
        { name: "taxId", type: "text", note: "RFC/RUC/NIT/CUIT — optional, country-specific" },
        { name: "country", type: "text", note: "ISO-2; drives currency + locale defaults" },
        { name: "address", type: "longtext" },
        { name: "notes", type: "longtext" },
      ],
    },
    {
      name: "Invoice",
      plural: "Invoices",
      ownedByUser: true,     // private per freelancer + RLS
      searchable: true,
      fields: [
        { name: "number", type: "text", required: true, note: "sequential, per-user series e.g. 0001" },
        { name: "clientId", type: "ref", ref: "Client", required: true },
        { name: "status", type: "enum", required: true,
          enumValues: ["draft", "sent", "paid", "overdue", "void"] },
        { name: "kind", type: "enum", enumValues: ["invoice", "receipt"], note: "factura o boleta/recibo" },
        { name: "currency", type: "text", required: true, note: "ISO-4217 e.g. MXN, USD, PEN" },
        { name: "issueDate", type: "date", required: true },
        { name: "dueDate", type: "date" },
        { name: "subtotal", type: "money" },
        { name: "taxRate", type: "float", note: "e.g. 0.16 IVA / 0.18 IGV — user-set, not advice" },
        { name: "taxAmount", type: "money" },
        { name: "total", type: "money", required: true },
        { name: "notes", type: "longtext", note: "payment terms / thank-you note shown on PDF" },
        { name: "recurring", type: "bool", note: "if true, auto-reissues on a cadence" },
        { name: "recurEvery", type: "enum", enumValues: ["none", "weekly", "monthly", "yearly"] },
        { name: "publicToken", type: "slug", unique: true, note: "shareable pay/view link, not user-guessable" },
      ],
    },
    {
      name: "LineItem",
      plural: "LineItems",
      ownedByUser: true,     // lives under an invoice the user owns
      fields: [
        { name: "invoiceId", type: "ref", ref: "Invoice", required: true },
        { name: "description", type: "text", required: true },
        { name: "quantity", type: "float", required: true },
        { name: "unitPrice", type: "money", required: true },
        { name: "amount", type: "money", required: true, note: "quantity × unitPrice, computed" },
      ],
    },
    {
      name: "Payment",
      plural: "Payments",
      ownedByUser: true,
      fields: [
        { name: "invoiceId", type: "ref", ref: "Invoice", required: true },
        { name: "amount", type: "money", required: true },
        { name: "currency", type: "text", required: true },
        { name: "method", type: "enum", enumValues: ["cash", "transfer", "card", "mercadopago", "stripe", "other"] },
        { name: "paidAt", type: "datetime", required: true },
        { name: "reference", type: "text", note: "transfer/op number for reconciliation" },
      ],
    },
  ],

  // Subscription (not freemium-by-invoice-cap that frustrates billing): a generous
  // free tier so a freelancer can feel value (send a real invoice) before paying,
  // then a flat low monthly. Yearly = 2 months free. Prices in USD; geo localizes display.
  monetization: {
    model: "freemium",
    providers: ["stripe", "mercadopago"],
    plans: [
      {
        id: "free",
        name: { es: "Gratis", en: "Free" },
        priceUsd: 0,
        features: [
          { es: "Hasta 5 facturas por mes", en: "Up to 5 invoices per month" },
          { es: "1 cliente guardado ilimitado", en: "Unlimited saved clients" },
          { es: "PDF profesional con tu logo", en: "Professional PDF with your logo" },
          { es: "Marca de agua de Boleta", en: "Boleta watermark" },
        ],
      },
      {
        id: "pro",
        name: { es: "Pro", en: "Pro" },
        priceUsd: 8,
        interval: "month",
        highlight: true,
        features: [
          { es: "Facturas y recibos ilimitados", en: "Unlimited invoices & receipts" },
          { es: "Facturas recurrentes automáticas", en: "Automatic recurring invoices" },
          { es: "Recordatorios de pago automáticos", en: "Automatic payment reminders" },
          { es: "Multimoneda y multi-idioma", en: "Multi-currency & multi-language" },
          { es: "Resumen mensual para impuestos", en: "Monthly summary for taxes" },
          { es: "Sin marca de agua", en: "No watermark" },
        ],
      },
      {
        id: "anual",
        name: { es: "Pro anual", en: "Pro yearly" },
        priceUsd: 80,
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
      headline: {
        es: "Dejá de pelear con las facturas. Cobrá más rápido.",
        en: "Stop fighting with invoices. Get paid faster.",
      },
      subheadline: {
        es: "Boleta crea facturas y recibos profesionales en 30 segundos, te dice quién ya pagó y quién no, y manda los recordatorios por vos — en tu moneda y tu idioma.",
        en: "Boleta creates professional invoices and receipts in 30 seconds, tells you who has paid and who hasn't, and chases late payers for you — in your currency and your language.",
      },
      ctaPrimary: { es: "Creá tu primera factura gratis", en: "Create your first invoice free" },
      ctaSecondary: { es: "Ver un ejemplo", en: "See a sample" },
    },
    socialProof: {
      es: "Más de USD 4M en facturas emitidas por freelancers de toda LATAM",
      en: "Over USD 4M in invoices issued by freelancers across LATAM",
    },
    valueProps: [
      {
        title: { es: "Listo en 30 segundos", en: "Done in 30 seconds" },
        body: {
          es: "Elegí un cliente, sumá los ítems y enviá. Sin plantillas de Word, sin Excel, sin volver a calcular el IVA a mano.",
          en: "Pick a client, add the items, send. No Word templates, no spreadsheets, no recalculating tax by hand.",
        },
      },
      {
        title: { es: "Sabé quién te debe", en: "Know who owes you" },
        body: {
          es: "Cada factura muestra si está pagada, enviada o vencida. Boleta manda los recordatorios automáticos para que no tengas que escribir el mensaje incómodo.",
          en: "Every invoice shows paid, sent or overdue at a glance. Boleta sends the reminders automatically so you never have to write the awkward message.",
        },
      },
      {
        title: { es: "Pensado para LATAM", en: "Built for LATAM" },
        body: {
          es: "Multimoneda (MXN, COP, PEN, CLP, ARS, USD…), formatos locales y campos de RFC/RUC/NIT. Más un resumen mensual listo para tu contador.",
          en: "Multi-currency (MXN, COP, PEN, CLP, ARS, USD…), local formats and tax-ID fields. Plus a monthly summary ready for your accountant.",
        },
      },
    ],
    faq: [
      {
        q: { es: "¿Boleta emite facturas con validez fiscal ante el SAT/SUNAT/DIAN?", en: "Does Boleta issue legally-stamped tax invoices (SAT/SUNAT/DIAN)?" },
        a: {
          es: "Boleta genera documentos profesionales claros para vos y tus clientes y un resumen mensual para tus impuestos. No reemplaza la facturación electrónica oficial ni el consejo de un contador.",
          en: "Boleta generates clean professional documents for you and your clients plus a monthly summary for your taxes. It does not replace official e-invoicing or advice from an accountant.",
        },
      },
      {
        q: { es: "¿Puedo cobrar dentro de la factura?", en: "Can my clients pay from the invoice?" },
        a: {
          es: "Sí. Cada factura tiene un link compartible con botón de pago vía Stripe o MercadoPago, y Boleta la marca como pagada automáticamente.",
          en: "Yes. Every invoice gets a shareable link with a pay button via Stripe or MercadoPago, and Boleta marks it paid automatically.",
        },
      },
      {
        q: { es: "¿Puedo cancelar cuando quiera?", en: "Can I cancel anytime?" },
        a: {
          es: "Sí, en un clic. El plan gratis nunca caduca y tus facturas y datos siguen siendo tuyos: los podés exportar cuando quieras.",
          en: "Yes, in one click. The free plan never expires and your invoices and data stay yours — export them whenever you want.",
        },
      },
    ],
    finalCta: {
      headline: { es: "Tu próxima factura, enviada antes de tu próximo café.", en: "Your next invoice, sent before your next coffee." },
      button: { es: "Empezar gratis", en: "Start free" },
    },
  },

  compliance: {
    notices: [
      "Boleta genera documentos para tu gestión y no sustituye la facturación electrónica oficial de tu país (SAT, SUNAT, DIAN, SII, AFIP, etc.).",
      "Las facturas, montos e impuestos son ingresados por el usuario; Boleta no calcula obligaciones tributarias ni brinda asesoría fiscal o contable.",
      "Boleta is a billing tool, not a substitute for formal tax, legal or accounting advice — consult a professional for your obligations.",
    ],
  },

  platforms: { web: true, admin: true },
  infra: { deploy: "fly", region: "gru", emailProvider: "resend" },
}

export default boleta
