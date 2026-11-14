// Shown at the top of Today when a daily check-in is due (variant "morning" or "evening"),
// for the very first check-in, or when today's check-in was saved without any readings (variant "empty").

import Button from '../ui/Button.jsx'
import Card from '../ui/Card.jsx'

function copyFor({ isFirst, variant, name }) {
  if (variant === 'empty') {
    return {
      title: 'Your check-in has no readings yet',
      text: 'Add a few readings, like heart rate, blood pressure or sleep, and your results will show up here.',
      button: 'Add readings',
    }
  }
  if (variant === 'morning') {
    return {
      title: 'Morning check-in is due',
      text: 'Log how you woke up: heart, blood pressure, oxygen, breathing, temperature and sleep.',
      button: 'Start morning check-in',
    }
  }
  if (variant === 'evening') {
    return {
      title: 'Before-sleep check-in is due',
      text: 'A quick look at how your day went before you sleep.',
      button: 'Start before-sleep check-in',
    }
  }
  if (isFirst) {
    return {
      step: 'Step 3 of 3',
      title: `Welcome, ${name}. Do your first check-in.`,
      text: 'It takes about 2 minutes. Your results will appear here.',
      button: 'Start check-in',
    }
  }
  return { title: "Today's check-in is due", text: 'Below are the results of your last check-in.', button: 'Start check-in' }
}

export default function CheckInDueCard({ isFirst, variant, name, onStart }) {
  const copy = copyFor({ isFirst, variant, name })

  return (
    <Card tone="mint" className="flex flex-wrap items-center justify-between gap-4">
      <div>
        {copy.step && <p className="text-muted">{copy.step}</p>}
        <h2 className="text-3xl">{copy.title}</h2>
        <p className="text-muted">{copy.text}</p>
      </div>
      <Button icon="checkin" onClick={onStart}>
        {copy.button}
      </Button>
    </Card>
  )
}
