// check if two sets are equal
const isSetEqual = <T>(a: readonly T[], b: readonly T[]): boolean => {
  if (a.length !== b.length) {
    return false
  }
  for (const item of a) {
    if (!b.includes(item)) {
      return false
    }
  }
  return true
}

export { isSetEqual }
