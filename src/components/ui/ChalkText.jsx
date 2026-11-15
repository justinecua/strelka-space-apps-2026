// A word drawn in Chalkduster (see data/chalkText.js). It sizes like text: 1em of font-size draws the
// letters exactly as big as the font would, and it takes the current text colour, so dark mode works.
// label: what screen readers hear; leave it out when the words are already read out nearby.

import { CHALK, LINE_HEIGHT } from '../../data/chalkText.js'

export default function ChalkText({ word, label, className = '', style }) {
  const shape = CHALK[word]
  const width = (LINE_HEIGHT * shape.width) / shape.height
  return (
    <svg
      viewBox={shape.viewBox}
      fill="currentColor"
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={className}
      style={{ height: `${LINE_HEIGHT}em`, width: `${width}em`, overflow: 'visible', ...style }}
    >
      <path d={shape.d} />
    </svg>
  )
}
