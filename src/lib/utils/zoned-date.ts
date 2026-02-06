import { startOfDay } from 'date-fns'
import { fromZonedTime, toZonedTime } from 'date-fns-tz'

type WithTimeZoneOptions = {
  timeZone: string
  instant: number
}

const startOfDayWithTimeZone = (options: WithTimeZoneOptions): Date => {
  const { timeZone, instant } = options
  const instantZoned = toZonedTime(instant, timeZone)
  const dayStartZoned = startOfDay(instantZoned)
  const dayStart = fromZonedTime(dayStartZoned, timeZone)
  return dayStart
}

export { startOfDayWithTimeZone }
