/**
 * EXAMPLE — Cancha, an amateur football (fútbol 5/7) league organizer SaaS.
 * Showcases: a DETERMINISTIC team-balancing ENGINE (skill-rating / modified Elo)
 * with an optional AI rationale layer, GEO (find courts near you), GAMIFICATION
 * (streaks, rankings, badges), freemium with a paid "League admin" tier.
 *
 * Engine choice — DETERMINISTIC, justified:
 *   The core value is splitting N players into two balanced teams by skill, and
 *   keeping an honest, auditable rating. That is a deterministic optimization +
 *   an Elo-style update — it must be reproducible, explainable and cheap (runs on
 *   every match, no API cost, no hallucination). MVP prediction is the same math
 *   (whoever the model gives the highest expected contribution to a win). We keep
 *   AI only as a thin "rationale/recap" layer over the deterministic output, NOT
 *   as the engine — honesty over hype.
 */
import type { DomainConfig } from "../domain.config"

const cancha: DomainConfig = {
  identity: {
    name: "Cancha",
    tagline: { es: "Organizá tu pichanga, equipos parejos en un toque", en: "Organize your pickup game, even teams in one tap" },
    domain: "cancha.club",
    languages: ["es", "en"],
    brandColor: "#16A34A", // vivid pitch green
    targetMarkets: ["PE", "AR", "MX", "CO", "CL", "ES"],
  },

  // Engine = the balancing/Elo core. Geo = find courts near you. Gamification =
  // streaks/rankings/badges (the retention loop for a weekend league). Payments =
  // freemium with a paid admin tier. emailLifecycle = match reminders + weekly
  // recap (a league lives or dies on attendance). growth = A/B + invite loops,
  // since growth is captain-invites-his-group. aiLayer = thin rationale/recap over
  // the deterministic engine, NOT the engine itself. No contentBlog/profiling for
  // launch — keep it lean.
  modules: {
    payments: true,
    emailLifecycle: true,
    engine: true,
    gamification: true,
    geo: true,
    growth: true,
    aiLayer: true,
  },

  entities: [
    {
      // A recurring or one-off match. Owned by the admin who created it, but a
      // match has a public shareable page (invite link) so players can RSVP.
      name: "Match",
      plural: "Matches",
      ownedByUser: true,
      public: true,
      searchable: true,
      fields: [
        { name: "title", type: "text", required: true, note: "e.g. 'Pichanga de los miércoles'" },
        { name: "slug", type: "slug", unique: true, note: "shareable invite URL" },
        { name: "format", type: "enum", enumValues: ["f5", "f7", "f8", "f11"], required: true },
        { name: "kickoff", type: "datetime", required: true },
        { name: "venueName", type: "text" },
        { name: "lat", type: "float", note: "court location for geo / find-near-me" },
        { name: "lng", type: "float" },
        { name: "status", type: "enum", enumValues: ["open", "balanced", "played", "cancelled"], required: true },
        { name: "teamA", type: "json", aiGenerated: false, note: "engine output: player ids on side A" },
        { name: "teamB", type: "json", aiGenerated: false, note: "engine output: player ids on side B" },
        { name: "predictedMvp", type: "ref", ref: "Player", note: "engine pick: most likely MVP" },
        { name: "recap", type: "longtext", aiGenerated: true, note: "AI writes a short recap over the deterministic result" },
      ],
    },
    {
      // A player profile. Owned by the user; the *rating* is engine-maintained.
      // Public so rankings/leaderboards work without auth.
      name: "Player",
      ownedByUser: true,
      public: true,
      searchable: true,
      fields: [
        { name: "displayName", type: "text", required: true },
        { name: "position", type: "enum", enumValues: ["arquero", "defensa", "medio", "delantero"] },
        { name: "rating", type: "float", required: true, note: "Elo-style skill rating, engine-maintained, default 1000" },
        { name: "matchesPlayed", type: "int" },
        { name: "wins", type: "int" },
        { name: "goals", type: "int" },
        { name: "mvpCount", type: "int" },
        { name: "streak", type: "int", note: "current attendance/win streak for gamification" },
        { name: "badges", type: "json", note: "earned badges (hat-trick, iron-man, etc.)" },
      ],
    },
    {
      // Per-match, per-player result row. Owned by user who logs it (the admin);
      // it's the input that feeds the rating update on the next engine run.
      name: "Result",
      plural: "Results",
      ownedByUser: true,
      fields: [
        { name: "matchId", type: "ref", ref: "Match", required: true },
        { name: "playerId", type: "ref", ref: "Player", required: true },
        { name: "team", type: "enum", enumValues: ["A", "B"], required: true },
        { name: "won", type: "bool", required: true },
        { name: "goals", type: "int" },
        { name: "assists", type: "int" },
        { name: "wasMvp", type: "bool", note: "voted MVP of the match" },
        { name: "ratingDelta", type: "float", note: "engine: rating change applied from this result" },
      ],
    },
    {
      // A league: the recurring container of matches + its standings. Public
      // standings page; owned by the admin (gated to the paid 'admin' plan to run >1).
      name: "League",
      plural: "Leagues",
      ownedByUser: true,
      public: true,
      searchable: true,
      fields: [
        { name: "name", type: "text", required: true },
        { name: "slug", type: "slug", unique: true },
        { name: "city", type: "text", note: "geo: drives find-leagues-near-me" },
        { name: "format", type: "enum", enumValues: ["f5", "f7", "f8", "f11"], required: true },
        { name: "season", type: "text", note: "e.g. 'Apertura 2026'" },
        { name: "standings", type: "json", note: "computed ranking table" },
      ],
    },
  ],

  engine: {
    kind: "deterministic",
    description:
      "Auto-balances players into two even teams by skill, maintains an Elo-style rating per player from match results, and from those ratings picks the most likely MVP and the favored side. Reproducible, auditable, zero API cost — it runs on every match.",
    inputs: [
      "the players who RSVP'd to a match",
      "each player's current rating, position and recent form",
      "the format (f5/f7/f8/f11)",
      "logged results (who won, goals, assists)",
    ],
    output:
      "two balanced rosters (minimizing the rating gap and respecting positions) + the most-likely-MVP pick + each player's rating delta after the match",
    deterministicNote:
      "Greedy snake-draft seeded by rating, then local swaps to minimize |sumRatingA - sumRatingB| under position constraints. Ratings updated via an Elo update with K scaled by margin of goals: R' = R + K*(actual - expected), expected = 1/(1+10^((Ropp-R)/400)). MVP = max(expected win contribution × form). All steps logged so any user can audit why a team/MVP was chosen.",
  },

  monetization: {
    model: "freemium",
    providers: ["stripe", "mercadopago"], // Stripe global + MercadoPago for LATAM
    plans: [
      {
        id: "free",
        name: { es: "Jugador", en: "Player" },
        priceUsd: 0,
        features: [
          { es: "Unite a partidos con tu link", en: "Join matches via invite link" },
          { es: "Tu rating y estadísticas", en: "Your rating and stats" },
          { es: "1 liga y equipos balanceados", en: "1 league with balanced teams" },
          { es: "Rankings y rachas", en: "Rankings and streaks" },
        ],
      },
      {
        id: "admin",
        name: { es: "Organizador", en: "League admin" },
        priceUsd: 9,
        interval: "month",
        highlight: true,
        features: [
          { es: "Ligas y partidos recurrentes ilimitados", en: "Unlimited recurring leagues and matches" },
          { es: "Balanceo automático en cada fecha", en: "Auto-balanced teams every matchday" },
          { es: "MVP probable y resumen con IA", en: "Likely MVP and AI match recap" },
          { es: "Recordatorios y confirmaciones por email", en: "Email reminders and RSVPs" },
          { es: "Tabla de posiciones e historial", en: "Standings table and full history" },
          { es: "Encontrá canchas cerca tuyo", en: "Find courts near you" },
        ],
      },
      {
        id: "admin_anual",
        name: { es: "Organizador anual", en: "League admin yearly" },
        priceUsd: 90,
        interval: "year",
        features: [
          { es: "Todo lo de Organizador", en: "Everything in League admin" },
          { es: "2 meses gratis", en: "2 months free" },
        ],
      },
    ],
  },

  landing: {
    hero: {
      headline: {
        es: "Equipos parejos. Sin discusiones.",
        en: "Even teams. Zero arguments.",
      },
      subheadline: {
        es: "Cancha organiza tu pichanga semanal: arma equipos balanceados por nivel en un toque, lleva el rating de cada jugador, predice el MVP y te arma la tabla. Vos solo poné el arco.",
        en: "Cancha runs your weekly pickup game: it builds skill-balanced teams in one tap, tracks every player's rating, predicts the MVP and keeps your standings. You just bring the ball.",
      },
      ctaPrimary: { es: "Armá tu partido gratis", en: "Set up your match free" },
      ctaSecondary: { es: "Ver cómo balancea", en: "See how it balances" },
    },
    socialProof: {
      es: "+3.500 partidos organizados y 0 peleas por elegir equipos",
      en: "+3,500 matches organized and 0 fights over picking teams",
    },
    valueProps: [
      {
        title: { es: "Equipos justos en un toque", en: "Fair teams in one tap" },
        body: {
          es: "El motor reparte a los que confirmaron en dos equipos parejos por nivel y posición. Se acabó el 'me toca con los malos'.",
          en: "The engine splits whoever showed up into two even teams by skill and position. No more 'why am I stuck with the rookies'.",
        },
      },
      {
        title: { es: "Rating y rachas reales", en: "Real ratings and streaks" },
        body: {
          es: "Cada resultado actualiza el rating Elo de cada jugador. Rankings, rachas y badges que tu grupo va a querer defender.",
          en: "Every result updates each player's Elo rating. Rankings, streaks and badges your crew will fight to keep.",
        },
      },
      {
        title: { es: "Tu liga, en piloto automático", en: "Your league on autopilot" },
        body: {
          es: "Partidos recurrentes, confirmaciones por email, MVP probable y tabla de posiciones — todo solo, fecha tras fecha.",
          en: "Recurring matches, email RSVPs, likely MVP and a live standings table — all automatic, matchday after matchday.",
        },
      },
    ],
    faq: [
      {
        q: { es: "¿Cómo sabe el nivel de cada jugador?", en: "How does it know each player's skill?" },
        a: {
          es: "Arranca con un nivel base y lo ajusta solo con cada resultado, estilo Elo. En 3 o 4 fechas el rating ya refleja cómo juega cada uno.",
          en: "It starts everyone at a base level and adjusts automatically with each result, Elo-style. After 3–4 matchdays the rating already reflects how everyone really plays.",
        },
      },
      {
        q: { es: "¿Sirve para fútbol 5, 7 u 11?", en: "Does it work for 5-, 7- or 11-a-side?" },
        a: {
          es: "Sí. Elegís el formato y Cancha balancea respetando arqueros y posiciones para ese número de jugadores.",
          en: "Yes. Pick the format and Cancha balances around goalkeepers and positions for that player count.",
        },
      },
      {
        q: { es: "¿Mis jugadores tienen que pagar?", en: "Do my players have to pay?" },
        a: {
          es: "No. Jugar, confirmar y ver tu rating es gratis para siempre. Solo el organizador paga si quiere ligas recurrentes ilimitadas y extras.",
          en: "No. Playing, RSVPing and seeing your rating is free forever. Only the organizer pays if they want unlimited recurring leagues and extras.",
        },
      },
    ],
    finalCta: {
      headline: { es: "La próxima pichanga, organizada sola.", en: "Your next pickup game, organized for you." },
      button: { es: "Empezar gratis", en: "Start free" },
    },
  },

  platforms: { web: true, mobile: false, admin: true },
  infra: { deploy: "fly", region: "gru", emailProvider: "resend" }, // gru = São Paulo, closest to LATAM
}

export default cancha
