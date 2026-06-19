/**
 * sprite-alias.ts — the genetic roster has 25 roles but only 21 base sprites exist.
 * Map the roles without their own PNG to the closest existing sprite so every agent
 * shows an icon. (Swap for unique generated sprites later if desired.)
 */
const ALIAS: Record<string, string> = {
  "answer-extractor": "researcher",
  "ci-fixer": "reliability-engineer",
  "completeness-critic": "reliability-engineer",
  "data-engineer": "data-architect",
  "design-qc": "art-director",
  "discovery-interviewer": "business-strategist",
  "domain-architect": "data-architect",
  "frontend-architect": "frontend-designer",
  "frontend-engineer": "frontend-designer",
  "master-spec-architect": "contracts-architect",
  "reference-studier": "researcher",
  "reliability-verifier": "reliability-engineer",
}

/** Filename (without extension) of the sprite to show for a given agent role. */
export function spriteFor(role: string): string {
  return ALIAS[role] || role
}
