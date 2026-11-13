// The Strelka mark: a dog in profile rising out of a round helmet.
// Default is a white dog in a black circle; inverted gives a black dog in a white circle (for dark pages).

import { useId } from 'react'

const COLORS = {
  normal: { circle: '#111111', furFrom: '#ffffff', furTo: '#ececec', shade: '#d6d6d6', eye: '#111111', nose: '#111111' },
  inverted: { circle: '#ffffff', furFrom: '#111111', furTo: '#2a2a2a', shade: '#3d3d3d', eye: '#ffffff', nose: '#3d3d3d' },
}

export default function LogoMark({ className = 'h-12 w-12', inverted = false }) {
  const id = useId()
  const color = inverted ? COLORS.inverted : COLORS.normal

  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
      <defs>
        <clipPath id={`${id}helmet`}>
          <circle cx="50" cy="50" r="46" />
        </clipPath>
        <linearGradient id={`${id}fur`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={color.furFrom} />
          <stop offset="1" stopColor={color.furTo} />
        </linearGradient>
      </defs>

      {/* Helmet circle */}
      <circle cx="50" cy="50" r="46" fill={color.circle} />

      {/* Dog: head and neck, with soft shading on the chest and inner ear */}
      <g clipPath={`url(#${id}helmet)`}>
        <path
          d="M24 100 L29 46 Q30 30 34 16 L44 29 L50 19 L55 34 Q60 36 63 40 L78 42 Q84 43 83.5 48 Q83 54 77 56 L69 57.5 Q61 59 58 67 Q56 78 64 100 Z"
          fill={`url(#${id}fur)`}
        />
        <path d="M57 66 Q55 78 64 100 L54 100 Q48 82 57 66 Z" fill={color.shade} />
        <path d="M34 23 L41 31 L34 37 Z" fill={color.shade} />
      </g>

      {/* Eye and nose */}
      <circle cx="59" cy="44" r="3.4" fill={color.eye} />
      <ellipse cx="82" cy="45.5" rx="2.8" ry="2.4" fill={color.nose} />
    </svg>
  )
}
