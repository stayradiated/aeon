import * as dateFns from 'date-fns'
import { toZonedTime } from 'date-fns-tz'

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

const formatTime = (timeZone: string, utc: number): string => {
  const time = toZonedTime(utc, timeZone)
  return dateFns.format(time, 'HH:mm')
}

const formatDuration = (ms: number): string => {
  return (
    dateFns.formatDuration(dateFns.intervalToDuration({ start: 0, end: ms }), {
      format: ['hours', 'minutes'],
      locale: durationLocale,
    }) || 'now'
  )
}

const formatDurationRough = (durationMs: number): string => {
  // Over 48 hours, show number of days to 1 decimal place
  // over 1 hour, show hours and minutes
  // over 1 minute, show minutes
  // otherwise, show "< 1 min"

  const days = durationMs / 1000 / 60 / 60 / 24
  if (days > 2) {
    const daysRounded = Math.round(days * 10) / 10
    return `${daysRounded}d`
  }

  const hours = Math.floor(durationMs / 1000 / 60 / 60)
  const minutes = Math.floor((durationMs / 1000 / 60) % 60)
  if (hours >= 1) {
    if (minutes === 0) {
      return `${hours}h`
    }

    return `${hours}h ${minutes}m`
  }

  if (minutes >= 1) {
    return `${minutes}m`
  }

  return '<1m'
}

export { formatTime, formatDuration, formatDurationRough }
