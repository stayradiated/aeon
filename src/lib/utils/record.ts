import { parallelMap } from '@stayradiated/hydro'

const inverseRecord = <Key extends string, Value extends string>(
  record: Record<Key, Value>,
): Record<Value, Key> => {
  return Object.fromEntries(
    Object.entries(record).map(([k, v]) => [v, k as Value]),
  )
}

const mapRecordValues = <Key extends string, InValue, OutValue>(
  record: Record<Key, InValue>,
  fn: (value: InValue, key: Key) => OutValue,
): Record<Key, OutValue> => {
  const result = {} as Record<Key, OutValue>
  for (const key in record) {
    result[key] = fn(record[key], key)
  }
  return result
}

const asyncMapRecordValues = async <Key extends string, InValue, OutValue>(
  record: Record<Key, InValue>,
  fn: (value: InValue, key: Key) => Promise<OutValue>,
  options?: { concurrency?: number },
): Promise<Record<Key, OutValue> | Error> => {
  const results = await parallelMap(
    Object.entries(record),
    async ([key, value]): Promise<[Key, OutValue]> => {
      const result = await fn(value as InValue, key as Key)
      return [key as Key, result] as const
    },
    options,
  )

  if (results instanceof Error) {
    return results
  }

  return Object.fromEntries(results) as Record<Key, OutValue>
}

export {
  /** @knipignore **/
  inverseRecord,
  mapRecordValues,
  asyncMapRecordValues,
}
