const DAYS_MS = 24 * 60 * 60 * 1000

const subDays = (instant: number, days: number): number => {
  return instant - days * DAYS_MS
}

export { subDays }
