// A card with a title, a small chart, and two big numbers at the bottom (left and right).
// Pass emptyText to show a quiet placeholder instead of the chart when there is nothing to draw.
// Missing numbers are left out, and the number row is hidden when both are missing.

import BigStat, { isMissing } from '../ui/BigStat.jsx'
import Card from '../ui/Card.jsx'
import EmptyState from '../ui/EmptyState.jsx'

export default function StatCard({ title, tone, chart, emptyText, emptyShape, left, right, onExpand }) {
  const showStats = !isMissing(left.value) || !isMissing(right.value)

  return (
    <Card title={title} tone={tone} onExpand={onExpand} className="flex flex-col">
      <div className="flex-1">{emptyText ? <EmptyState text={emptyText} shape={emptyShape} /> : chart}</div>
      {showStats && (
        <div className={`flex items-end justify-between gap-4 ${emptyText ? 'mt-8' : 'mt-4'}`}>
          <BigStat {...left} />
          <BigStat {...right} align="right" />
        </div>
      )}
    </Card>
  )
}
