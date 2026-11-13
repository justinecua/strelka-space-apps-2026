// Download or copy today's report so it can be shared with the crew medic.

import { useState } from 'react'
import { buildReport } from '../../lib/report.js'
import Button from '../ui/Button.jsx'
import IconTip from '../ui/IconTip.jsx'

export default function ReportButtons({ state, result, mission }) {
  const [message, setMessage] = useState('')

  function showMessage(text) {
    setMessage(text)
    setTimeout(() => setMessage(''), 2500)
  }

  function downloadReport() {
    const text = buildReport(state, result, mission)
    const file = new Blob([text], { type: 'text/plain' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(file)
    link.download = `health-report-MD${result.latest.day}.txt`
    link.click()
    URL.revokeObjectURL(link.href)
    showMessage('Report downloaded')
  }

  async function copyReport() {
    try {
      await navigator.clipboard.writeText(buildReport(state, result, mission))
      showMessage('Report copied')
    } catch {
      showMessage('Copy failed, use Download instead')
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button icon="download" onClick={downloadReport} className="whitespace-nowrap">
        Share report
      </Button>
      <IconTip icon="copy" title="Copy report" text="Paste it into a message to your crew medic." onClick={copyReport} align="right" className="border border-ink/30" />
      <span className="text-sm text-muted" role="status">
        {message}
      </span>
    </div>
  )
}
