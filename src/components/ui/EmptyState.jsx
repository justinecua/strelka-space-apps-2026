// What a chart area shows before there is data: a short note, and a faint outline of the chart
// that will appear there (a line, bars or day squares). It uses the current text color, so it
// works on light and dark cards.

const BAR_HEIGHTS = [45, 70, 55, 85, 60, 75, 50]

function Ghost({ shape }) {
  if (shape === 'bars') {
    return (
      <div className="flex h-16 items-end gap-2" aria-hidden="true">
        {BAR_HEIGHTS.map((height, index) => (
          <span key={index} className="flex-1 rounded-full bg-current opacity-[0.07]" style={{ height: `${height}%` }} />
        ))}
      </div>
    )
  }

  if (shape === 'dots') {
    return (
      <div className="grid grid-cols-8 gap-x-3 gap-y-2.5" aria-hidden="true">
        {Array.from({ length: 16 }, (_, index) => (
          <span key={index} className="h-4 w-4 rounded-[5px] border-[3px] border-current opacity-[0.1]" />
        ))}
      </div>
    )
  }

  return (
    <svg viewBox="0 0 200 40" preserveAspectRatio="none" className="h-12 w-full opacity-20" aria-hidden="true">
      <path
        d="M0 28 C 25 28, 35 14, 60 16 S 95 30, 120 24 S 160 8, 200 14"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeDasharray="2 6"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}

export default function EmptyState({ text, hint, shape = 'line', height = 140 }) {
  return (
    <div className="flex flex-col justify-between gap-8 pt-1" style={{ minHeight: height }}>
      <div className="max-w-[34ch] space-y-2">
        <p className="leading-snug">{text}</p>
        {hint && <p className="text-sm leading-relaxed opacity-60">{hint}</p>}
      </div>
      {shape !== 'none' && <Ghost shape={shape} />}
    </div>
  )
}
