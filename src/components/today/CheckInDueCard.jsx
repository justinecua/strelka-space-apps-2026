// Shown at the top of Today when the astronaut hasn't checked in yet today.

import Button from '../ui/Button.jsx'
import Card from '../ui/Card.jsx'

export default function CheckInDueCard({ isFirst, name, onStart }) {
  return (
    <Card tone="mint" className="flex flex-wrap items-center justify-between gap-4">
      <div>
        {isFirst && <p className="text-muted">Step 3 of 3</p>}
        <h2 className="text-3xl">{isFirst ? `Welcome, ${name}. Do your first check-in.` : "Today's check-in is due"}</h2>
        <p className="text-muted">
          {isFirst ? 'It takes about 2 minutes. Your results will appear here.' : 'Below are the results of your last check-in.'}
        </p>
      </div>
      <Button icon="checkin" onClick={onStart}>
        Start check-in
      </Button>
    </Card>
  )
}
