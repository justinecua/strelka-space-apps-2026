// Two small buttons to switch the Today page between grid and list layout.

import Icon from '../ui/Icon.jsx'

const OPTIONS = [
  { id: 'grid', icon: 'grid', label: 'Grid layout' },
  { id: 'list', icon: 'list', label: 'List layout' },
]

export default function LayoutToggle({ layout, onChange }) {
  return (
    <div className="flex rounded-full bg-field p-1" role="group" aria-label="Layout">
      {OPTIONS.map((option) => (
        <button
          key={option.id}
          type="button"
          onClick={() => onChange(option.id)}
          aria-pressed={layout === option.id}
          aria-label={option.label}
          title={option.label}
          className={`grid h-10 w-10 place-items-center rounded-full transition ${
            layout === option.id ? 'bg-white shadow-sm' : 'text-muted hover:text-ink'
          }`}
        >
          <Icon name={option.icon} size={20} />
        </button>
      ))}
    </div>
  )
}
