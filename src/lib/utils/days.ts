const DAYS_MS = 24 * 60 * 60 * 1000

const daysToMs = (days: number): number => {
  return days * DAYS_MS
}

const subDays = (instant: number, days: number): number => {
  return instant - days * DAYS_MS
}

export { daysToMs, subDays }
