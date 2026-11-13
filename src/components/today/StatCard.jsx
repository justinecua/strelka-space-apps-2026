// A card with a title, a small chart, and two big numbers at the bottom (left and right).

import BigStat from '../ui/BigStat.jsx'
import Card from '../ui/Card.jsx'

export default function StatCard({ title, tone, chart, left, right, onExpand }) {
  return (
    <Card title={title} tone={tone} onExpand={onExpand} className="flex flex-col">
      <div className="flex-1">{chart}</div>
      <div className="mt-4 flex items-end justify-between gap-4">
        <BigStat {...left} />
        <BigStat {...right} align="right" />
      </div>
    </Card>
  )
}
