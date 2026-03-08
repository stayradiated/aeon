const formatDuration = (input: number): string => {
  if (input === 0) {
    return '0m'
  }

  const prefix = input < 0 ? '-' : ''
  const durationMs = Math.abs(input)

  // Over 48 hours, show number of days to 1 decimal place
  const days = durationMs / 1000 / 60 / 60 / 24
  if (days > 2) {
    const daysRounded = Math.round(days * 10) / 10
    return `${prefix}${daysRounded}d`
  }

  const hours = Math.floor(durationMs / 1000 / 60 / 60)
  const hasHours = hours > 0

  const minutes = Math.floor((durationMs / 1000 / 60) % 60)
  const hasMinutes = minutes > 0

  const seconds = Math.floor(durationMs / 1000) % 60
  const hasSeconds = seconds > 0

  const parts = [
    hasHours ? `${hours}h` : [],
    hasMinutes ? `${minutes}m` : [],
    hasSeconds ? `${seconds}s` : [],
  ].flat()

  if (parts.length > 0) {
    return `${prefix}${parts.join(' ')}`
  }

  return 'now'
}

export { formatDuration }
