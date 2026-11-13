// Shared color classes. Class names are written out in full so Tailwind can find them.

export const TONES = {
  danger: 'bg-danger-soft text-danger',
  watch: 'bg-watch-soft text-watch-text',
  good: 'bg-good-soft text-good-dark',
  ink: 'bg-ink text-white',
  gray: 'bg-field text-muted',
}

export const STATUS = {
  green: { label: 'Normal', tone: 'good', text: 'text-good-dark', soft: 'bg-good-soft', bar: 'bg-good', hex: '#52c07c' },
  yellow: { label: 'Watch', tone: 'watch', text: 'text-watch-text', soft: 'bg-watch-soft', bar: 'bg-watch', hex: '#e4e06a' },
  red: { label: 'Critical', tone: 'danger', text: 'text-danger', soft: 'bg-danger-soft', bar: 'bg-danger', hex: '#e5674f' },
  none: { label: 'No data', tone: 'gray', text: 'text-muted', soft: 'bg-field', bar: 'bg-[#c9c9c9]', hex: '#c9c9c9' },
}

export function formatValue(indicator, value) {
  if (value === null || value === undefined) return '—'
  return Number(value).toFixed(indicator.decimals)
}
