/**
 * Puglit — domain.config.ts (root pointer)
 * =============================================================================
 * THE SEAM lives with the app code at ./spine/domain.config.ts (a generated
 * project is flat — domain.config.ts sits next to app/). This root re-export
 * keeps the seam discoverable from the repo root and lets ./examples import the
 * DomainConfig type without reaching into spine. Edit spine/domain.config.ts.
 * =============================================================================
 */
export * from "./spine/domain.config"
export { default } from "./spine/domain.config"
