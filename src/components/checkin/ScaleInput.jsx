// A 1–5 rating, shown as round buttons with the meaning of the chosen value underneath.

export default function ScaleInput({ indicator, value, onChange }) {
  const scores = [1, 2, 3, 4, 5]

  return (
    <div className="text-center">
      <div className="flex gap-1.5" role="radiogroup" aria-label={indicator.label}>
        {scores.map((score) => {
          const isSelected = value === score
          return (
            <button
              key={score}
              type="button"
              role="radio"
              aria-checked={isSelected}
              aria-label={indicator.scaleLabels[score - 1]}
              onClick={() => onChange(score)}
              className={`h-10 w-10 rounded-full transition ${isSelected ? 'bg-ink text-white' : 'bg-field text-muted hover:text-ink'}`}
            >
              {score}
            </button>
          )
        })}
      </div>
      <p className="mt-1 text-xs text-muted">{value ? indicator.scaleLabels[value - 1] : 'Not set'}</p>
    </div>
  )
}
