type KeyValue = {
  readonly name: string
  readonly idA: string
  readonly idB: string | undefined
}

type PlainString = string & { __brand?: never }

type Prefixes<T extends readonly unknown[]> = T extends readonly [
  infer H,
  ...infer R,
]
  ? [] | [H, ...Prefixes<R>]
  : []

type Key<Name extends string, Input extends unknown[], Output> = {
  readonly name: Name
  value: (...input: Input) => KeyValue

  trimPrefix: (serialized: PlainString) => string
  prefix: (...ids: Prefixes<Input>) => string

  encode: (...input: Input) => string
  decode: (serialized: PlainString) => Output
  decodeWithoutPrefix: (serialized: PlainString) => Output
}

/** Replicache key helper
 *
 * example:
 *  const blockKey = createKey('block')<BlockId>();
 */

const createKey = <Name extends string>(name: Name) => {
  const prefix = `${name}/`
  const prefixLength = prefix.length

  return <Id extends string>(): Key<Name, [Id], Id> => {
    return {
      name,
      value: (value) => ({ name, idA: value, idB: undefined }),

      trimPrefix: (serialized) => serialized.substring(prefixLength),
      prefix: (...ids) => {
        switch (ids.length) {
          case 0: {
            return prefix
          }
          case 1: {
            return `${prefix}${ids[0]}`
          }
          default: {
            throw new Error(`Unexpected number of ids: "${ids}"`)
          }
        }
      },

      encode: (value) => `${prefix}${value}`,
      decode: (serialized) => {
        if (!serialized.startsWith(prefix)) {
          throw new Error(
            `Expected serialized to start with prefix "${prefix}", received "${serialized}"`,
          )
        }
        return serialized.substring(prefixLength) as Id
      },
      decodeWithoutPrefix: (serialized) => serialized as Id,
    }
  }
}

/** Replicache composite-key helper
 *
 * example:
 *  const documentUserKey =
 *    createCompositeKey('documentUser')<DocumentId, UserId>();
 */
const createCompositeKey = <Name extends string>(name: Name) => {
  const prefix = `${name}/`
  const prefixLength = prefix.length

  return <IdA extends string, IdB extends string>(): Key<
    Name,
    [IdA, IdB],
    readonly [IdA, IdB]
  > => {
    return {
      name,
      value: (idA, idB) => ({ name, idA, idB }),

      trimPrefix: (serialized) => serialized.substring(prefixLength),
      prefix: (...ids) => {
        switch (ids.length) {
          case 0: {
            return prefix
          }
          case 1: {
            return `${prefix}${ids[0]}/`
          }
          case 2: {
            return `${prefix}${ids[0]}/${ids[1]}`
          }
          default: {
            throw new Error(`Unexpected number of ids: "${ids}"`)
          }
        }
      },

      encode: (idA, idB) => `${prefix}${idA}/${idB}`,
      decode: (serialized) => {
        if (!serialized.startsWith(prefix)) {
          throw new Error(
            `Expected serialized to start with prefix "${prefix}", received "${serialized}"`,
          )
        }
        return serialized.substring(prefixLength).split('/') as [IdA, IdB]
      },
      decodeWithoutPrefix: (serialized) => {
        return serialized.split('/') as [IdA, IdB]
      },
    }
  }
}

export {
  createKey,
  /** @knipignore **/
  createCompositeKey,
}
export type { Key, KeyValue }
