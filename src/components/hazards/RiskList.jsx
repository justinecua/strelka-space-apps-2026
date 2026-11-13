// NASA risks with what Strelka checks for each, or why a risk isn't covered.

import { checkedByText } from '../../lib/risks.js'
import Icon from '../ui/Icon.jsx'

export default function RiskList({ risks }) {
  return (
    <ul className="space-y-2">
      {risks.map((risk) => {
        const covered = risk.checkedBy.length > 0
        return (
          <li key={risk.id} className="flex gap-3 rounded-[20px] bg-field p-4">
            <span
              className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full ${covered ? 'bg-good text-white' : 'bg-white text-muted'}`}
            >
              {covered ? <Icon name="check" size={14} weight="bold" /> : '–'}
            </span>
            <span>
              <span className="block">{risk.name}</span>
              <span className="block text-sm text-muted">{risk.summary}</span>
              <span className="mt-1 block text-sm">
                {covered ? `Checked by: ${checkedByText(risk)}` : `Not covered. ${risk.note}`}
              </span>
            </span>
          </li>
        )
      })}
    </ul>
  )
}
