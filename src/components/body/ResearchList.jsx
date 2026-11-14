// A collapsed list of NASA studies about one body region. Uses the built-in <details> element to open and close.

import { researchForRegion } from '../../data/research.js'
import Icon from '../ui/Icon.jsx'

export default function ResearchList({ regionId }) {
  const studies = researchForRegion(regionId)
  if (studies.length === 0) return null

  return (
    <details className="border-t border-ink/10 pt-4">
      <summary className="flex cursor-pointer list-none items-center gap-2 text-sm text-muted hover:text-ink">
        <Icon name="book" size={18} />
        NASA research on this ({studies.length})
        <Icon name="chevron" size={14} className="ml-auto" />
      </summary>
      <ul className="mt-3 space-y-2 text-sm">
        {studies.map((study) => (
          <li key={study.id}>
            <span className="block">{study.name}</span>
            <span className="block text-muted">{study.summary}</span>
          </li>
        ))}
      </ul>
    </details>
  )
}
