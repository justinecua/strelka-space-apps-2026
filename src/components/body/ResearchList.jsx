// A collapsed list of NASA studies about one body region. Uses the built-in <details> element to open and close.

import { researchForRegion } from '../../data/research.js'

export default function ResearchList({ regionId }) {
  const studies = researchForRegion(regionId)
  if (studies.length === 0) return null

  return (
    <details className="rounded-[20px] bg-white p-4">
      <summary className="cursor-pointer">NASA research on this ({studies.length})</summary>
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
