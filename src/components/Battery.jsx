// La batterie : le remplissage ET la couleur portent l'information (jamais la couleur seule).
export const TONE = { good: '#1E9E6A', mid: '#E0A21A', low: '#D4442F' }

// hero = dessinée sur la grande carte : ses couleurs viennent de la carte (variables --bat-*).
export default function Battery({ pct, level = 'good', vertical = false, size = 40, hero = false }) {
  const p = Math.max(0, Math.min(100, pct))
  const line = hero ? 'var(--bat-out)' : 'var(--bat-line)'
  const body = hero ? 'none' : 'var(--card)'
  const fill = hero ? (level === 'good' ? 'var(--bat-fill)' : 'var(--bat-warn)') : TONE[level]
  if (vertical) {
    const h = Math.max(6, Math.round(0.72 * p))
    return (
      <svg aria-hidden="true" width={size * 0.62} height={size} viewBox="19 0 62 100">
        <rect x="38" y="3" width="24" height="9" rx="3" fill={line} />
        <rect x="22" y="11" width="56" height="86" rx="13" fill={body} stroke={line} strokeWidth="5" />
        <rect x="29" y={90 - h} width="42" height={h} rx="7" fill={hero ? 'var(--bat-fill)' : fill} />
      </svg>
    )
  }
  const w = Math.max(5, Math.round(0.66 * p))
  return (
    <svg aria-hidden="true" width={size} height={size * 0.52} viewBox="5 27 92 46">
      <rect x="8" y="30" width="76" height="40" rx="10" fill={body} stroke={line} strokeWidth="5" />
      <rect x="87" y="42" width="7" height="16" rx="3" fill={line} />
      <rect x="14" y="36" width={w} height="28" rx="5" fill={fill} />
    </svg>
  )
}
