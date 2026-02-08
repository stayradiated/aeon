import { tz } from '@date-fns/tz'
import * as dateFns from 'date-fns'

const formatDistanceLocale: Record<string, string> = {
  xSeconds: '{{count}}s',
  xMinutes: '{{count}}m',
  xHours: '{{count}}h',
  xDays: '{{count}}d',
  xMonths: '{{count}}mo',
}

const durationLocale = {
  formatDistance(token: string, count: number) {
    return (
      formatDistanceLocale[token]?.replace('{{count}}', String(count)) ??
      `[[${token}=${count}]]`
    )
  },
}

const formatTime = (timeZone: string, instant: number): string => {
  return dateFns.format(instant, 'HH:mm', { in: tz(timeZone) })
}

const formatDuration = (ms: number): string => {
  return (
    dateFns.formatDuration(dateFns.intervalToDuration({ start: 0, end: ms }), {
      format: ['hours', 'minutes'],
      locale: durationLocale,
    }) || 'now'
  )
}

const formatDurationRough = (input: number): string => {
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
  const minutes = Math.floor((durationMs / 1000 / 60) % 60)
  // over 1 hour, show hours and minutes
  if (hours >= 1) {
    if (minutes === 0) {
      return `${prefix}${hours}h`
    }

    return `${prefix}${hours}h ${minutes}m`
  }

  // over 1 minute, show minutes
  if (minutes >= 1) {
    return `${prefix}${minutes}m`
  }

  // otherwise, show "<1m"
  return `<${prefix}1m`
}

export { formatTime, formatDuration, formatDurationRough }
