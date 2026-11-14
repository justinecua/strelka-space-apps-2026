// A centered pop-up card with a dark backdrop. Closes on the X button, a click outside, or the Escape key.

import { useEffect } from 'react'
import Icon from './Icon.jsx'

export default function Modal({ title, onClose, children }) {
  useEffect(() => {
    function handleKey(event) {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-black/50 p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="max-h-[90dvh] w-full max-w-lg overflow-hidden rounded-[28px] bg-white text-left text-ink"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="scrollbar-thin-custom max-h-[90dvh] overflow-y-auto px-8 py-8 pr-5">
          <div className="flex items-start justify-between gap-4">
            <h2 className="text-3xl">{title}</h2>
            <button type="button" onClick={onClose} aria-label="Close" className="rounded-full p-2 hover:bg-field">
              <Icon name="close" size={20} />
            </button>
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}
