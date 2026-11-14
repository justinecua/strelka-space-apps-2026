export const SEVERITY = { none: 0, green: 1, yellow: 2, red: 3 }

export function worst(statusA, statusB) {
  return SEVERITY[statusB] > SEVERITY[statusA] ? statusB : statusA
}

export function isFlagged(status) {
  return status === 'yellow' || status === 'red'
}

function scoringValue(indicator, value) {
  // Sleep is stored in minutes but its thresholds are in hours.
  if (indicator.id === 'sleep' && indicator.inputType === 'duration') {
    return value / 60
  }

  // Exercise and other indicators keep their original units.
  return value
}

function scoringUnit(indicator) {
  // Sleep thresholds and baseline comparisons use hours.
  if (indicator.id === 'sleep' && indicator.inputType === 'duration') {
    return 'h'
  }

  return indicator.unit === '/5' ? '' : ` ${indicator.unit}`
}

function describe(indicator, value) {
  return `${Number(value).toFixed(indicator.decimals)}${scoringUnit(indicator)}`
}

export function statusOf(indicator, value, baselineValue) {
  const {
    redLow,
    redHigh,
    yellowLow,
    yellowHigh,
    tolerance,
    direction,
  } = indicator

  if (
    value === null ||
    value === undefined ||
    Number.isNaN(Number(value)) ||
    !Number.isFinite(Number(value))
  ) {
    return { status: 'none', dir: null, reason: 'No reading' }
  }

  // Convert stored values into the units used by their scoring thresholds.
  const measuredValue = scoringValue(indicator, Number(value))

  const measuredBaseline =
    baselineValue != null && Number.isFinite(Number(baselineValue))
      ? scoringValue(indicator, Number(baselineValue))
      : null

  // Check critical low values first.
  if (redLow != null && measuredValue <= redLow) {
    return {
      status: 'red',
      dir: 'low',
      reason: `${describe(indicator, measuredValue)} is very low`,
    }
  }

  // Check critical high values.
  if (redHigh != null && measuredValue >= redHigh) {
    return {
      status: 'red',
      dir: 'high',
      reason: `${describe(indicator, measuredValue)} is very high`,
    }
  }

  // Check unhealthy low values.
  if (yellowLow != null && measuredValue < yellowLow) {
    return {
      status: 'yellow',
      dir: 'low',
      reason: `${describe(indicator, measuredValue)} is lower than healthy`,
    }
  }

  // Check unhealthy high values.
  if (yellowHigh != null && measuredValue > yellowHigh) {
    return {
      status: 'yellow',
      dir: 'high',
      reason: `${describe(indicator, measuredValue)} is higher than healthy`,
    }
  }

  // Compare against the astronaut's personal baseline.
  if (measuredBaseline != null) {
    const change = measuredValue - measuredBaseline

    const droppedTooMuch =
      change < -tolerance && direction !== 'high'

    const roseTooMuch =
      change > tolerance && direction !== 'low'

    if (droppedTooMuch || roseTooMuch) {
      const amount = Math.abs(change).toFixed(indicator.decimals)
      const changeDirection = change > 0 ? 'above' : 'below'

      return {
        status: 'yellow',
        dir: roseTooMuch ? 'high' : 'low',
        reason: `${amount}${scoringUnit(indicator)} ${changeDirection} your normal (${measuredBaseline.toFixed(indicator.decimals)}${scoringUnit(indicator)})`,
      }
    }
  }

  const reason =
    measuredBaseline != null
      ? 'Within your normal range'
      : 'Within healthy limits'

  return {
    status: 'green',
    dir: null,
    reason,
  }
}
