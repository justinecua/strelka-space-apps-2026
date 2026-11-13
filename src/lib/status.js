// Decides if one reading is normal (green), worth watching (yellow) or critical (red).
// It checks health limits first, then how far the reading moved from the astronaut's baseline.

export const SEVERITY = { none: 0, green: 1, yellow: 2, red: 3 }

export function worst(statusA, statusB) {
  return SEVERITY[statusB] > SEVERITY[statusA] ? statusB : statusA
}

export function isFlagged(status) {
  return status === 'yellow' || status === 'red'
}

function unitText(indicator) {
  return indicator.unit === '/5' ? '/5' : ` ${indicator.unit}`
}

function describe(indicator, value) {
  return `${Number(value).toFixed(indicator.decimals)}${unitText(indicator)}`
}

export function statusOf(indicator, value, baselineValue) {
  const { redLow, redHigh, yellowLow, yellowHigh, tolerance, direction } = indicator

  if (value === null || value === undefined || Number.isNaN(value)) {
    return { status: 'none', dir: null, reason: 'No reading' }
  }

  if (redLow != null && value <= redLow) {
    return { status: 'red', dir: 'low', reason: `${describe(indicator, value)} is very low` }
  }
  if (redHigh != null && value >= redHigh) {
    return { status: 'red', dir: 'high', reason: `${describe(indicator, value)} is very high` }
  }
  if (yellowLow != null && value < yellowLow) {
    return { status: 'yellow', dir: 'low', reason: `${describe(indicator, value)} is lower than healthy` }
  }
  if (yellowHigh != null && value > yellowHigh) {
    return { status: 'yellow', dir: 'high', reason: `${describe(indicator, value)} is higher than healthy` }
  }

  if (baselineValue != null) {
    const change = value - baselineValue
    const droppedTooMuch = change < -tolerance && direction !== 'high'
    const roseTooMuch = change > tolerance && direction !== 'low'

    if (droppedTooMuch || roseTooMuch) {
      const amount = Math.abs(change).toFixed(indicator.decimals)
      const unit = indicator.unit === '/5' ? '' : ` ${indicator.unit}`
      const direction = change > 0 ? 'above' : 'below'
      return {
        status: 'yellow',
        dir: roseTooMuch ? 'high' : 'low',
        reason: `${amount}${unit} ${direction} your normal (${baselineValue.toFixed(indicator.decimals)})`,
      }
    }
  }

  const reason = baselineValue != null ? 'Within your normal range' : 'Within healthy limits'
  return { status: 'green', dir: null, reason }
}
