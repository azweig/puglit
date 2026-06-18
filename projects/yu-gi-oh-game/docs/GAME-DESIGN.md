# Duel Tactics Academy — Game Design

**Género:** Canvas card-puzzle tactics trainer

A nostalgic, modern mini-duel trainer for returning duelists: solve compact board-break and lethal-line scenarios using original training cards, clear phase prompts, chain links, and a Master Duel-inspired arena rendered entirely with canvas shapes, gradients, and glyphs.

## Mecánicas
- Core loop: choose a lesson, inspect the opponent board and your hand, execute the best sequence of summons, activations, chain responses, and attacks, then earn a grade based on lethal, resources saved, and mistakes avoided.
- Scenario-based duels: every level starts from a fixed board state with Life Points, hand, graveyard, banished pile, Extra Deck options, and visible opponent interruptions.
- Simplified authentic duel flow: Draw Phase, Standby Phase, Main Phase 1, Battle Phase, Main Phase 2, End Phase, with most puzzles focused on Main Phase 1 and Battle Phase decisions.
- Five-zone board: Main Monster Zones, Extra Monster Zones, Spell & Trap Zones, Field Zone, Graveyard, Banished, Main Deck, Extra Deck, and Hand are shown as clickable canvas zones.
- Chain system: activating a card or effect opens a response window, creates numbered Chain Links, then resolves backward with animated pulses and a duel log.
- Training prompts: early levels highlight legal actions, target choices, attack lines, and chain timing; later levels remove hints and punish incorrect sequencing.
- Card inspection: selecting a card opens a zoom panel with name, card type, attribute, level/rank/link, ATK/DEF, legality, rarity, and concise effect text.
- Action validation: illegal plays shake the card and show a short message such as 'No valid target', 'Already Normal Summoned', or 'Chain timing missed'.
- Board-break puzzles: remove negates, bait interruptions, clear monsters, manage backrow, and sequence effects correctly before committing to lethal.
- Lethal-line puzzles: calculate damage, choose attack order, boost or reduce ATK, and avoid triggering defensive effects.
- Combo meter: correct consecutive actions increase a blue combo streak; misplays reduce final score but do not instantly fail unless they make victory impossible.
- Retry and replay: failed puzzles can be reset instantly; completed puzzles unlock a 'Show Optimal Line' ghost replay.

## Controles
- Teclado: Mouse to select cards and zones. Keyboard shortcuts: 1-6 select hand cards, Q/W/E/R/T/Y change phase, Space confirm action, Z undo last reversible choice, L open duel log, H request hint, Esc cancel/close panel.
- Táctil: Tap cards or zones to select, drag a card to a valid zone to play it, long-press to inspect, swipe left/right through hand or log, two-finger tap to cancel, tap highlighted prompts to confirm chain responses.

## Entidades
- Player: name, avatar glyph, Life Points, score, current phase, Normal Summon state, hint count, and combo streak.
- Opponent: scripted duel AI with visible threats, hidden response rules, Life Points, board, graveyard, banished pile, and reaction timing.
- Card: original training-card data object with name, frame color, rarity, finish, legality state, tags, effect text, once-per-turn flags, and valid actions.
- Monster Card: Normal, Effect, Ritual, Fusion, Synchro, Xyz, Pendulum, and Link variants with DARK, LIGHT, EARTH, WATER, FIRE, WIND, or DIVINE attributes; Type; Level/Rank/Link Rating; ATK/DEF or Link Arrows.
- Spell Card: Normal, Quick-Play, Continuous, Equip, Field, and Ritual variants with activation timing, targets, duration, and resolution script.
- Trap Card: Normal, Continuous, and Counter variants with set status, trigger windows, chain speed, and response conditions.
- Zone: Main Monster Zone, Extra Monster Zone, Spell & Trap Zone, Pendulum edge zone, Field Zone, Hand slot, Graveyard, Banished, Main Deck, and Extra Deck.
- Chain Link: numbered stack item containing source card, controller, target list, effect summary, and resolve/fizzle result.
- Duel Log Entry: timestamped text line for summons, activations, chain building, resolution, damage, destruction, and victory.
- Lesson Objective: win condition such as 'Deal lethal this turn', 'Break the board before Battle Phase', or 'Survive and clear all threats'.
- Hint Node: optional guidance step with escalating detail: concept hint, legal-action hint, then exact next play.
- Score Medal: Bronze, Silver, Gold, and Perfect ratings based on score thresholds.

## Dificultad y niveles
18 handcrafted mini-duel lessons in 3 chapters. Chapter 1, 'Return to the Field', teaches inspection, Normal Summon, Special Summon, targeting, combat math, and simple lethal lines. Chapter 2, 'Chain School', introduces Quick-Play Spells, Traps, negates, baiting responses, graveyard effects, and resolving chains backward. Chapter 3, 'Board Break Lab', combines Extra Deck summons, Link arrows, Xyz materials, Pendulum edge zones, protected bosses, backrow removal, and multi-step lethal. Each lesson has three variants: Fácil adds highlighted legal plays and generous score targets; Normal removes most highlights and adds one extra interruption; Difícil changes a card position or hidden response and requires the optimal or near-optimal line.

Dificultades: Fácil, Normal, Difícil

## Puntaje
Start each puzzle with 1000 points. Gain +500 for winning, +300 for lethal this turn, +100 per unused hint, +50 per card left in hand, +50 per 1000 Life Points remaining, and combo bonuses for correct sequencing. Lose -100 for illegal actions, -150 for wasted effects, -200 for avoidable card loss, and -300 for ending the turn without meeting the objective. Medals: Bronze 700+, Silver 1100+, Gold 1500+, Perfect 1900+ with no hints and no misplays.

## Victoria / derrota
Win by completing the lesson objective, usually reducing opponent Life Points to 0 during the required turn or clearing all required threats. Lose if your Life Points reach 0, you pass the required turn without completing the objective, you use all available actions and lethal is impossible, or a scripted opponent counterattack resolves after a failed board break. The player can surrender or retry at any time.

## Arte
No external assets. Canvas-only presentation using #1E3A8A as the primary brand blue for the arena frame, buttons, active phase marker, and chain highlights. Cards are rounded rectangles with gradient frames: orange monsters, green spells, purple traps, white synchro, black xyz, violet fusion, blue link, and gold pendulum accents. Foil rarity is simulated with animated diagonal shine bands and tiny star particles. Monster identity uses large emoji-like glyphs and geometric sigils instead of licensed artwork. The board uses neon zone outlines, glass panels, glowing chain rings, damage number bursts, screen shake for attacks, and a right-side card zoom/log panel.

## Highscores
Tabla `scores` + `GET/POST /api/scores` (leaderboard top-10 público).
