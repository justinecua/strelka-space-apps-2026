// A rounded panel. "tone" picks the background, like the pastel cards in the design.
// Pass onExpand to show a full-screen button in the top-right corner.

import Icon from './Icon.jsx'

const TONES = {
  gray: 'bg-field',
  mint: 'bg-mint',
  cream: 'bg-cream',
  dark: 'bg-ink text-white',
  white: 'bg-white',
}

export default function Card({ title, action, onExpand, tone = 'gray', className = '', children }) {
  return (
    <section className={`rounded-[28px] p-6 ${TONES[tone]} ${className}`}>
      {(title || action || onExpand) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-xl">{title}</h2>
          <div className="flex items-center gap-2">
            {action}
            {onExpand && (
              <button
                type="button"
                onClick={onExpand}
                aria-label={`Open ${title} full screen`}
                title="Full screen"
                className="grid h-9 w-9 place-items-center rounded-full opacity-60 transition hover:bg-black/10 hover:opacity-100"
              >
                <Icon name="expand" size={18} />
              </button>
            )}
          </div>
        </div>
      )}
      {children}
    </section>
  )
}
