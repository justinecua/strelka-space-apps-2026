// Exports check-in reports as a PDF through the browser's print dialog ("Save as PDF").
// Works the same on the website and in the desktop app, with no extra library.

import { buildReport } from './report.js'
import { evaluate } from './triage.js'

// The report for one past day, judged as it was on that day.
export function reportForDay(state, mission, day) {
  const index = state.entries.findIndex((entry) => entry.day === day)
  if (index < 0) return null
  const result = evaluate(state.entries.slice(0, index + 1), state.baseline, mission)
  return buildReport(state, result, mission)
}

function escapeHtml(text) {
  return text.replace(/[&<>]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[char])
}

// Opens the print dialog with one page per report.
export function printReports(title, reports) {
  const pages = reports.map((text) => `<pre>${escapeHtml(text)}</pre>`).join('<div class="break"></div>')
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(title)}</title>
<style>
  body { font: 13px/1.55 ui-monospace, Menlo, Consolas, monospace; color: #111; margin: 32px; }
  pre { white-space: pre-wrap; margin: 0; }
  .break { page-break-after: always; }
</style></head><body>${pages}</body></html>`

  const frame = document.createElement('iframe')
  frame.setAttribute('aria-hidden', 'true')
  frame.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;'
  document.body.appendChild(frame)
  frame.contentDocument.open()
  frame.contentDocument.write(html)
  frame.contentDocument.close()
  frame.contentWindow.focus()
  frame.contentWindow.print()
  setTimeout(() => frame.remove(), 1000)
}
