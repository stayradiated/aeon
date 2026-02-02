const groupBy = <T>(
  list: readonly T[],
  getKey: (item: T) => string,
): Record<string, T[]> => {
  const record: Record<string, T[]> = {}

  for (const item of list) {
    const key = getKey(item)
    const existingList = record[key]
    if (existingList) {
      existingList.push(item)
    } else {
      record[key] = [item]
    }
  }

  return record
}

const groupByMultiple = <T>(
  list: readonly T[],
  getKeylist: (item: T) => readonly string[],
): Record<string, T[]> => {
  const record: Record<string, T[]> = {}

  for (const item of list) {
    const keyList = getKeylist(item)
    for (const key of keyList) {
      const existingList = record[key]
      if (existingList) {
        existingList.push(item)
      } else {
        record[key] = [item]
      }
    }
  }

  return record
}

export { groupBy, groupByMultiple }
