// The top of Today: the verdict as the page title, with small icons that reveal who acts, the comm delay and what to do.
// The report button stays labelled; copy and "why your normal" are icon buttons with bubbles.

import { useState } from 'react'
import { STATUS } from '../../lib/ui.js'
import IconTip from '../ui/IconTip.jsx'
import LayoutToggle from './LayoutToggle.jsx'
import ReportButtons from './ReportButtons.jsx'
import WhyBaselineDialog from './WhyBaselineDialog.jsx'

export default function TodayHeader({ state, result, mission, layout, onLayoutChange }) {
  const [showWhy, setShowWhy] = useState(false)
  const { tier, commNote, latest } = result

  return (
    <div className="flex flex-wrap items-end justify-between gap-6 pt-6 pb-4 sm:pt-10 sm:pb-6">
      <div>
        <p className="text-muted">
          Day {latest.day} · {mission.name}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-4">
          <h1 className="flex items-center gap-4 text-5xl sm:text-6xl">
            <span className={`h-12 w-2 rounded-full ${STATUS[tier.color].bar}`} />
            {tier.label}
          </h1>
          <div className="flex gap-2">
            <IconTip icon="info" size="sm" title="What to do" text={tier.text} align="left" className="bg-field" />
            <IconTip icon="crew" size="sm" title="Who to tell" text={tier.who} align="left" className="bg-field" />
            {commNote && <IconTip icon="earth" size="sm" title="Distance from Earth" text={commNote} align="left" className="bg-field" />}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <LayoutToggle layout={layout} onChange={onLayoutChange} />
        <ReportButtons state={state} result={result} mission={mission} />
        <IconTip icon="question" title="Why compare with your normal?" text="Tap to see why Strelka compares you with yourself, not a textbook." onClick={() => setShowWhy(true)} align="right" className="border border-ink/30" />
      </div>

      {showWhy && <WhyBaselineDialog onClose={() => setShowWhy(false)} />}
    </div>
  )
}
