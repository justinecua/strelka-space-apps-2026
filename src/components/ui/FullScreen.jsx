// A full-screen view that covers the page, for showing every detail of one card.
// Closes on the X button or the Escape key, and stops the page behind it from scrolling.

import { useEffect } from 'react'
import Icon from './Icon.jsx'

export default function FullScreen({ title, subtitle, onClose, children }) {
  useEffect(() => {
    function handleKey(event) {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  return (
    <div role="dialog" aria-modal="true" aria-label={title} className="fade-in fixed inset-0 z-40 overflow-y-auto bg-white text-left text-ink">
      <div className="mx-auto max-w-6xl px-5 py-8 sm:px-10 sm:py-12">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-4xl sm:text-5xl">{title}</h2>
            {subtitle && <p className="mt-2 text-muted">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close full screen"
            className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-field transition hover:scale-105"
          >
            <Icon name="close" size={22} />
          </button>
        </div>
        <div className="mt-8">{children}</div>
      </div>
    </div>
  )
}
