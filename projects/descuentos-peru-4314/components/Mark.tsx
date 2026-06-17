/**
 * Puglit Spine — Mark (Block-P / foundry).
 * The official mark, as a component so generated projects can recolor it via
 * `color` (the blocks use currentColor; the gem stays the bright accent).
 * Swap this file's geometry to rebrand without touching anything else.
 */
export function Mark({ size = 40, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" className={className} role="img" aria-label="logo">
      <g fill="currentColor">
        <rect x="22" y="18" width="20" height="20" rx="5" />
        <rect x="22" y="41" width="20" height="20" rx="5" />
        <rect x="22" y="64" width="20" height="20" rx="5" />
        <rect x="22" y="87" width="20" height="20" rx="5" />
        <rect x="45" y="18" width="20" height="20" rx="5" />
        <rect x="68" y="18" width="20" height="20" rx="5" />
        <rect x="68" y="41" width="20" height="20" rx="5" />
        <rect x="16" y="13" width="16" height="16" rx="4" transform="rotate(-20 24 21)" />
        <rect x="78" y="13" width="16" height="16" rx="4" transform="rotate(20 86 21)" />
      </g>
      <path d="M55 41 L64 50 L55 59 L46 50 Z" fill="var(--brand-bright)" />
    </svg>
  )
}
