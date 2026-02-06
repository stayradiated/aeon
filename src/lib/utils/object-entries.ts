type Entry<T> = [keyof T, T[keyof T]]

const objectEntries = <T extends object>(obj: T): Entry<T>[] => {
  return Array.from(Object.entries(obj)) as Entry<T>[]
}

export { objectEntries }
