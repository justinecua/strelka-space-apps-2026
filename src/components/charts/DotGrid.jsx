// One small rounded square per day, colored by that day's result.
// Pass onSelect to make the squares clickable; selectedDay gets a ring.

export default function DotGrid({ days, onSelect, selectedDay }) {
  return (
    <div className="grid grid-cols-8 gap-x-3 gap-y-2.5 py-2">
      {days.map((item, index) => {
        const square = (
          <span className="pop-in block h-4 w-4 rounded-[5px] border-[3px]" style={{ borderColor: item.color, '--i': index }} />
        )
        if (!onSelect) {
          return (
            <span key={item.day} title={`Mission day ${item.day}`} className="block h-4 w-4">
              {square}
            </span>
          )
        }
        const isSelected = item.day === selectedDay
        return (
          <button
            key={item.day}
            type="button"
            title={`Mission day ${item.day}`}
            aria-label={`Mission day ${item.day}`}
            aria-pressed={isSelected}
            onClick={() => onSelect(item.day)}
            className={`-m-1 grid place-items-center rounded-lg p-1 transition hover:bg-current/10 ${
              isSelected ? 'ring-2 ring-current' : ''
            }`}
          >
            {square}
          </button>
        )
      })}
    </div>
  )
}
