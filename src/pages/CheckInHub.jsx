// The Check-in tab: four check-ins, with the one that fits the time of day opened automatically.
// Morning and before-sleep are required daily; post-exercise and symptom reports can be sent any time.
// Below the form is today's log, so the astronaut can see what was sent and when.

import { useEffect, useState } from 'react'
import { CHECKIN_TYPES, CHECKIN_TYPE_LIST } from '../data/checkinTypes.js'
import { todayDate } from '../lib/entries.js'
import { recordHighlights } from '../lib/records.js'
import { dailyStatus, formatTime, suggestedType } from '../lib/schedule.js'
import { useNow } from '../lib/useNow.js'
import CheckInForm from '../components/checkin/CheckInForm.jsx'
import StepHeader from '../components/setup/StepHeader.jsx'
import Icon from '../components/ui/Icon.jsx'

const GREETING = {
  morning: 'Good morning',
  afternoon: 'Good afternoon',
  evening: 'Good evening',
}

function tileStatus(type, status, suggestedId) {
  if (type.id === 'morning' || type.id === 'evening') {
    const daily = status[type.id]
    if (daily.done) return { text: daily.at ? `Done ${formatTime(daily.at)}` : 'Done today', tone: 'text-good-dark' }
    if (type.id === 'morning' && status.part === 'evening') return { text: 'Not done today', tone: 'text-muted' }
    if (daily.due) return { text: 'Due now', tone: 'text-watch-text' }
    return { text: 'This evening', tone: 'text-muted' }
  }
  return { text: type.id === suggestedId ? 'Suggested now' : '', tone: 'text-muted' }
}

function introLine(now, part, suggested, isFirst) {
  const time = now.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
  const name = CHECKIN_TYPES[suggested].title.toLowerCase()
  if (isFirst) return `It's ${time}, so we opened your ${name}. You can switch below.`
  return `${GREETING[part]}. It's ${time}, so we opened your ${name}.`
}

export default function CheckInHub({ state, onSubmit }) {
  const now = useNow()
  const records = state.records ?? []
  const status = dailyStatus(records, state.entries, now)
  const suggested = suggestedType(records, state.entries, now)
  const [typeId, setTypeId] = useState(suggested)
  const [chosenByHand, setChosenByHand] = useState(false)
  const type = CHECKIN_TYPES[typeId]
  const isFirst = state.entries.length === 0

  // Follow the clock until the astronaut picks a check-in themselves.
  useEffect(() => {
    if (!chosenByHand) setTypeId(suggested)
  }, [suggested, chosenByHand])

  // "morning check-in", "symptom report" and so on, by voice.
  useEffect(() => {
    function onType(event) {
      if (CHECKIN_TYPES[event.detail.type]) {
        setTypeId(event.detail.type)
        setChosenByHand(true)
      }
    }
    window.addEventListener('strelka:checkin-type', onType)
    return () => window.removeEventListener('strelka:checkin-type', onType)
  }, [])

  const todays = records.filter((record) => record.loggedOn === todayDate()).slice().reverse()

  function choose(id) {
    setTypeId(id)
    setChosenByHand(true)
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      {isFirst ? (
        <StepHeader step={3} title="Your first check-in" text={introLine(now, status.part, suggested, true)} />
      ) : (
        <div>
          <h1 className="text-5xl sm:text-6xl">Check-in</h1>
          <p className="mt-3 text-muted">{introLine(now, status.part, suggested, false)}</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4" role="tablist" aria-label="Choose a check-in">
        {CHECKIN_TYPE_LIST.map((item) => {
          const selected = item.id === typeId
          const tile = tileStatus(item, status, suggested)
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => choose(item.id)}
              className={`flex flex-col items-start gap-6 rounded-[24px] p-5 text-left transition ${
                selected ? 'bg-ink text-white' : 'bg-field hover:bg-white'
              }`}
            >
              <span className={`grid h-10 w-10 place-items-center rounded-full ${selected ? 'bg-white/15' : 'bg-white'}`}>
                <Icon name={item.icon} size={20} />
              </span>
              <span>
                <span className="block text-lg leading-tight">{item.short}</span>
                <span className={`block text-sm ${selected ? 'opacity-70' : 'text-muted'}`}>{item.when}</span>
                <span className={`mt-2 block min-h-5 text-sm ${selected ? 'opacity-90' : tile.tone}`}>
                  {item.required ? `Daily · ${tile.text}` : tile.text}
                </span>
              </span>
            </button>
          )
        })}
      </div>

      <div>
        <h2 className="text-3xl">{type.title}</h2>
        <p className="mt-2 text-muted">{type.purpose}</p>
      </div>

      <CheckInForm key={`${typeId}-${records.length}`} type={type} baseline={state.baseline} onSubmit={onSubmit} />

      {todays.length > 0 && (
        <section className="pt-4">
          <h2 className="mb-3 text-2xl">Sent today</h2>
          <ul className="divide-y divide-line overflow-hidden rounded-[24px] bg-field">
            {todays.map((record) => (
              <li key={record.id} className="flex items-center gap-4 px-5 py-4">
                <Icon name={CHECKIN_TYPES[record.type].icon} size={18} className="shrink-0 text-muted" />
                <span className="min-w-0 flex-1">
                  <span className="block">{CHECKIN_TYPES[record.type].title}</span>
                  <span className="block truncate text-sm text-muted">{recordHighlights(record)}</span>
                </span>
                <span className="shrink-0 text-sm tabular-nums text-muted">{formatTime(record.at)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
