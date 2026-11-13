// A round icon button that shows a small info bubble on hover, keyboard focus or tap.
// Pass onClick to make the tap do something else (the bubble still shows on hover).

import { useState } from 'react'
import Icon from './Icon.jsx'

const SIZES = {
  sm: { box: 'h-9 w-9', icon: 18 },
  md: { box: 'h-12 w-12', icon: 22 },
  lg: { box: 'h-20 w-20', icon: 32 },
}

// align: where the bubble lines up with the icon. Use "right" near the right edge of the page.
const ALIGN = {
  center: 'left-1/2 -translate-x-1/2',
  left: 'left-0',
  right: 'right-0',
}

export default function IconTip({ icon, title, text, onClick, size = 'md', align = 'center', light = false, className = '' }) {
  const [open, setOpen] = useState(false)
  const bubbleTone = light ? 'bg-white text-ink' : 'bg-ink text-white'
  const subTone = light ? 'text-muted' : 'text-white/60'

  function handleClick() {
    if (onClick) onClick()
    else setOpen(!open)
  }

  return (
    <div className="group relative shrink-0" onMouseLeave={() => setOpen(false)}>
      <button
        type="button"
        onClick={handleClick}
        onBlur={() => setOpen(false)}
        aria-label={title}
        className={`grid place-items-center rounded-full transition hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-ink ${SIZES[size].box} ${className}`}
      >
        <Icon name={icon} size={SIZES[size].icon} />
      </button>

      <div
        role="tooltip"
        className={`pointer-events-none absolute bottom-full z-20 mb-3 w-60 rounded-[16px] px-4 py-3 text-left text-sm shadow-lg transition group-hover:opacity-100 group-focus-within:opacity-100 ${ALIGN[align]} ${bubbleTone} ${
          open ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <p>{title}</p>
        {text && <p className={`mt-0.5 ${subTone}`}>{text}</p>}
      </div>
    </div>
  )
}
