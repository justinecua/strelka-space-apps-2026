// One small rounded square per day, colored by that day's result.

export default function DotGrid({ days }) {
  return (
    <div className="grid grid-cols-8 gap-x-3 gap-y-2.5 py-2">
      {days.map((item) => (
        <span
          key={item.day}
          title={`Mission day ${item.day}`}
          className="h-4 w-4 rounded-[5px] border-[3px]"
          style={{ borderColor: item.color }}
        />
      ))}
    </div>
  )
}
