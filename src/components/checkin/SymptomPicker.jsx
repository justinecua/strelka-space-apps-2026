import { SYMPTOMS } from '../../data/indicators.js'

export default function SymptomPicker({ selectedIds, onToggle }) {
  return (
    <div className="flex flex-wrap gap-2">
      {SYMPTOMS.map((symptom) => {
        const isSelected = selectedIds.includes(symptom.id)
        return (
          <button
            key={symptom.id}
            type="button"
            aria-pressed={isSelected}
            onClick={() => onToggle(symptom.id)}
            className={`rounded-full border px-4 py-2 transition ${
              isSelected ? 'border-ink bg-ink text-white' : 'border-ink/30 bg-white hover:border-ink'
            }`}
          >
            {symptom.label}
          </button>
        )
      })}
    </div>
  )
}
