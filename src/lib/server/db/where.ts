/*
 * i'm sorry i couldn't help myself
 */

import type {
  DeleteQueryBuilder,
  SelectQueryBuilder,
  SelectType,
  StringReference,
  UpdateQueryBuilder,
  WhereInterface,
} from 'kysely'
import { sql } from 'kysely'

const ANY_ID = Symbol('ANY_ID')

// above this threshold, we use the ANY() function
const IN_TO_ANY_THRESHOLD = 1000 as const

// this is a simplified version of the kysely type
// SelectType<ExtractTypeFromStringReference>
type ExtractTypeFromStringReference<
  DB,
  TB extends keyof DB,
  RE extends string,
> = TB extends string
  ? // "table.column"
    RE extends `${TB}.${infer C}`
    ? C extends keyof DB[TB]
      ? SelectType<DB[TB][C]>
      : never
    : // "column"
      RE extends `${infer C}`
      ? C extends keyof DB[TB]
        ? SelectType<DB[TB][C]>
        : never
      : never
  : never

type Id<T extends string> =
  | T
  | { eq: T }
  | { in: ReadonlyArray<T> }
  | { notIn: ReadonlyArray<T> }
  | typeof ANY_ID

type NullableId<T extends string | null> = null extends T
  ? [T] extends [string | null]
    ? Id<NonNullable<T>> | null
    : never
  : Id<Exclude<T, null>>

type Column<T extends Uint8Array> =
  | T
  | { in: ReadonlyArray<T> }
  | { notIn: ReadonlyArray<T> }

export type Numeric =
  | number
  | { lt: number }
  | { lte: number }
  | { gt: number }
  | { gte: number }

type NullableNumeric<T extends number | null> = null extends T
  ? [T] extends [number | null]
    ? Numeric | null
    : never
  : Numeric

// Wrapping in tuples prevents distributing over unions
export type NonNullableField<T> = [T] extends [StringBool<string>]
  ? T
  : [T] extends [string]
    ? Id<T>
    : T extends number
      ? Numeric
      : T extends Uint8Array
        ? Column<T>
        : never

export type Field<T> = null extends T
  ? NonNullableField<Exclude<T, null>> | null
  : NonNullableField<T>

export type StringBool<T extends string> =
  | `is-${T}`
  | `is-not-${T}`
  | `is-either`

export type Where<T extends object> = {
  [K in keyof T]: K extends 'userId' ? T[K] : Field<Exclude<T[K], undefined>>
}

type Only<T, P> = T extends P ? T : never

// biome-ignore lint/suspicious/noExplicitAny: types are hard :(
type QueryBuilder = WhereInterface<any, any>

const whereString = (
  query: QueryBuilder,
  column: string,
  value: Id<string> | null,
): QueryBuilder => {
  if (value === ANY_ID) {
    return query
  }
  if (value === null) {
    return query.where(column, 'is', null)
  }
  if (typeof value === 'string') {
    return query.where(column, '=', value)
  }
  if (typeof value === 'object') {
    if ('eq' in value) {
      return query.where(column, '=', value.eq)
    }
    if ('in' in value) {
      if (value.in.length === 0) {
        // special case: in([]) is always false
        return query.where(sql<boolean>`1 = 0`)
      }

      // switch to ANY() once it gets big
      if (value.in.length >= IN_TO_ANY_THRESHOLD) {
        return query.where((eb) =>
          eb(column, '=', eb.fn.any(sql.val(value.in))),
        )
      }

      return query.where(column, 'in', value.in)
    }
    if ('notIn' in value) {
      if (value.notIn.length === 0) {
        // special case: notIn([]) is always true
        return query
      }
      return query.where(column, 'not in', value.notIn)
    }
  }
  value satisfies never
  throw new Error(`Unexpected value for ${column}: ${value}`)
}

const whereEitherString = (
  query: QueryBuilder,
  columns: [string, string],
  value: Id<string> | null,
): QueryBuilder => {
  if (value === ANY_ID) {
    return query
  }
  if (typeof value === 'string') {
    return query.where((eb) =>
      eb.or([eb(columns[0], '=', value), eb(columns[1], '=', value)]),
    )
  }
  if (value === null) {
    return query.where((eb) =>
      eb.or([eb(columns[0], 'is', null), eb(columns[1], 'is', null)]),
    )
  }
  if (typeof value === 'object') {
    if ('eq' in value) {
      return query.where((eb) =>
        eb.or([eb(columns[0], '=', value.eq), eb(columns[1], '=', value.eq)]),
      )
    }
    if ('in' in value) {
      return query.where((eb) =>
        eb.or([eb(columns[0], 'in', value.in), eb(columns[1], 'in', value.in)]),
      )
    }
    if ('notIn' in value) {
      return query.where((eb) =>
        eb.or([
          eb(columns[0], 'not in', value.notIn),
          eb(columns[1], 'not in', value.notIn),
        ]),
      )
    }
  }
  value satisfies never
  throw new Error(`Unexpected value for ${columns}: ${value}`)
}

const whereUint8Array = (
  query: QueryBuilder,
  column: string,
  value: Column<Uint8Array>,
): QueryBuilder => {
  if (value instanceof Uint8Array) {
    return query.where(column, '=', value)
  }
  if (typeof value === 'object') {
    if ('in' in value) {
      return query.where(column, 'in', value.in)
    }
    if ('notIn' in value) {
      return query.where(column, 'not in', value.notIn)
    }
  }
  value satisfies never
  throw new Error(`Unexpected value for ${column}: ${value}`)
}

const whereNumber = (
  query: QueryBuilder,
  column: string,
  value: Numeric | null,
): QueryBuilder => {
  if (typeof value === 'number') {
    return query.where(column, '=', value)
  }
  if (value === null) {
    return query.where(column, 'is', null)
  }
  if (typeof value === 'object') {
    if ('lt' in value) {
      return query.where(column, '<', value.lt)
    }
    if ('lte' in value) {
      return query.where(column, '<=', value.lte)
    }
    if ('gt' in value) {
      return query.where(column, '>', value.gt)
    }
    if ('gte' in value) {
      return query.where(column, '>=', value.gte)
    }
  }
  value satisfies never
  throw new Error(`Unexpected value for ${column}: ${value}`)
}

type Builder<DB, T extends keyof DB, QB> = {
  string<
    C extends StringReference<DB, T>,
    IdV extends NullableId<
      Only<ExtractTypeFromStringReference<DB, T, C>, string | null>
    >,
  >(column: C, value: IdV | undefined): Builder<DB, T, QB>

  eitherString<
    C1 extends StringReference<DB, T>,
    C2 extends StringReference<DB, T>,
    IdV extends NullableId<
      Only<ExtractTypeFromStringReference<DB, T, C1 | C2>, string | null>
    >,
  >(column: [C1, C2], value: IdV | undefined): Builder<DB, T, QB>

  uint8Array<
    C extends StringReference<DB, T>,
    ColumnV extends Column<
      Only<ExtractTypeFromStringReference<DB, T, C>, Uint8Array>
    >,
  >(column: C, value: ColumnV | undefined): Builder<DB, T, QB>

  number<
    C extends StringReference<DB, T>,
    NumericV extends NullableNumeric<
      Only<ExtractTypeFromStringReference<DB, T, C>, number | null>
    >,
  >(column: C, value: NumericV | undefined): Builder<DB, T, QB>

  done(): QB
}

const createBuilder = <DB, T extends keyof DB, QB>(
  initialQuery: QB,
): Builder<DB, T, QB> => {
  let query = initialQuery
  const builder: Builder<DB, T, QB> = {
    string(column, value) {
      if (typeof value !== 'undefined') {
        query = whereString(query as QueryBuilder, column, value) as QB
      }
      return builder
    },

    eitherString(columns, value) {
      if (typeof value !== 'undefined') {
        query = whereEitherString(query as QueryBuilder, columns, value) as QB
      }
      return builder
    },

    uint8Array(column, value) {
      if (typeof value !== 'undefined') {
        query = whereUint8Array(query as QueryBuilder, column, value) as QB
      }
      return builder
    },

    number(column, value) {
      if (typeof value !== 'undefined') {
        query = whereNumber(query as QueryBuilder, column, value) as QB
      }
      return builder
    },

    done() {
      return query
    },
  }
  return builder
}

function extendWhere<DB, T extends keyof DB, O>(
  query: SelectQueryBuilder<DB, T, O>,
): Builder<DB, T, SelectQueryBuilder<DB, T, O>>
function extendWhere<DB, TB extends keyof DB, O>(
  query: DeleteQueryBuilder<DB, TB, O>,
): Builder<DB, TB, DeleteQueryBuilder<DB, TB, O>>
function extendWhere<DB, UT extends keyof DB, TB extends keyof DB, O>(
  query: UpdateQueryBuilder<DB, UT, TB, O>,
): Builder<DB, TB, UpdateQueryBuilder<DB, UT, TB, O>>
function extendWhere<DB, UT extends keyof DB, T extends keyof DB, O>(
  query:
    | SelectQueryBuilder<DB, T, O>
    | DeleteQueryBuilder<DB, T, O>
    | UpdateQueryBuilder<DB, UT, T, O>,
) {
  return createBuilder(query)
}

export { extendWhere, ANY_ID }
