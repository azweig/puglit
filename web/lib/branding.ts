/** Applies the diagnosis branding (primary color + palette + logo) onto a config. */
import type { DomainConfig } from "@/lib/domain-types"

const isHex = (s: unknown) => typeof s === "string" && /^#[0-9a-fA-F]{6}$/.test(s)

export function applyBranding(config: DomainConfig, branding: any): DomainConfig {
  if (!branding || typeof branding !== "object") return config
  if (isHex(branding.primaryColor)) config.identity.brandColor = branding.primaryColor
  if (typeof branding.logoSvg === "string" && branding.logoSvg.includes("<svg")) config.identity.logoSvg = branding.logoSvg
  if (branding.logo?.monogram) config.identity.logoMonogram = String(branding.logo.monogram).slice(0, 3)
  if (branding.logo?.concept) config.identity.logoConcept = String(branding.logo.concept).slice(0, 160)
  if (Array.isArray(branding.palette)) {
    const pal = branding.palette.filter((c: any) => isHex(c?.hex)).slice(0, 8)
    config.identity.palette = pal
    if (isHex(pal[1]?.hex)) config.identity.secondaryColor = pal[1].hex
    if (isHex(pal[2]?.hex)) config.identity.accentColor = pal[2].hex
  }
  return config
}
