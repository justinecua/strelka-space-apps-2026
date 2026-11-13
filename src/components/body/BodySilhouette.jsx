// Simple human figure drawn with basic SVG shapes on a 200 × 420 canvas.

export default function BodySilhouette() {
  return (
    <g style={{ fill: 'var(--color-white)', stroke: 'var(--color-ink)' }} strokeWidth="1.5">
      <rect x="36" y="95" width="20" height="150" rx="10" transform="rotate(8 46 95)" />
      <rect x="144" y="95" width="20" height="150" rx="10" transform="rotate(-8 154 95)" />
      <rect x="62" y="215" width="32" height="190" rx="15" />
      <rect x="106" y="215" width="32" height="190" rx="15" />
      <path d="M60 92 Q100 78 140 92 L146 192 Q144 232 100 236 Q56 232 54 192 Z" />
      <rect x="89" y="68" width="22" height="22" rx="6" />
      <ellipse cx="100" cy="46" rx="25" ry="29" />
    </g>
  )
}
