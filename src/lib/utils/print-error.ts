import { inspect } from 'node:util'

import type { JSONValue } from './json-value.js'

const OMISSION = null

type AnyToObjectOptions = {
  item: unknown
  omitting: string[]
}

const unknownToJSONValue = (options: AnyToObjectOptions): JSONValue => {
  const { item, omitting } = options

  switch (typeof item) {
    case 'undefined':
    case 'function': {
      return null
    }

    case 'symbol': {
      return String(item)
    }

    case 'number':
    case 'string':
    case 'boolean': {
      return item
    }

    case 'bigint': {
      return Number(item)
    }

    case 'object': {
      if (item === null) {
        return null
      }

      if (Array.isArray(item)) {
        return item.map((arrayItem) =>
          unknownToJSONValue({ item: arrayItem, omitting }),
        )
      }

      if (item instanceof AggregateError) {
        const keys = new Set([
          ...Object.keys(item),
          'message',
          'stack',
          'cause',
          'errors', // <-- include error list
        ])
        const errorObject: Record<string, JSONValue> = {}
        for (const key of keys) {
          if (omitting.includes(key)) {
            errorObject[key] = OMISSION
          } else {
            errorObject[key] = unknownToJSONValue({
              item: item[key as keyof typeof item],
              omitting,
            })
          }
        }
        return errorObject
      }

      if (item instanceof Error) {
        const keys = new Set([
          ...Object.keys(item),
          'message',
          'stack',
          'cause',
        ])
        const errorObject: Record<string, JSONValue> = {}
        for (const key of keys) {
          if (omitting.includes(key)) {
            errorObject[key] = OMISSION
          } else {
            errorObject[key] = unknownToJSONValue({
              item: item[key as keyof typeof item],
              omitting,
            })
          }
        }
        return errorObject
      }

      {
        const valueObject: Record<string, JSONValue> = {}
        for (const key of Object.keys(item)) {
          if (omitting.includes(key)) {
            valueObject[key] = OMISSION
          } else {
            valueObject[key] = unknownToJSONValue({
              item: item[key as keyof typeof item],
              omitting,
            })
          }
        }
        return valueObject
      }
    }

    default: {
      console.error(
        `formatErrorAsJSON: encountered unexpected type "${typeof item}".`,
      )
      return null
    }
  }
}

type ErrorToObjectOptions = {
  omitting?: string[]
}

type FormattedError = {
  name?: string
  message: string
  cause: JSONValue | null
  stack: string
}

const formatErrorAsJSON = (
  error: Error,
  options: ErrorToObjectOptions = {},
): FormattedError => {
  const { omitting = [] } = options
  return unknownToJSONValue({ item: error, omitting }) as FormattedError
}

const printError = (error: Error, options: ErrorToObjectOptions = {}): void => {
  console.error(
    inspect(formatErrorAsJSON(error, options), {
      depth: null,
      colors: true,
    }),
  )
}

export { printError }
