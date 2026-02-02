import type { Compilable } from 'kysely'

/*
Useful for debugging queries.
Logs the query and its parameters to the console.

example:
  const query = db.selectFrom('blockProblem').selectAll('')

  logQuery(query)

  query.executeTakeFirstOrThrow()
*/

const serializeValue = (value: unknown): string => {
  if (Array.isArray(value)) {
    return `array[${value.map(serializeValue).join(', ')}]`
  }
  if (typeof value === 'string') {
    return `'${value}'`
  }
  if (typeof value === 'number') {
    return `${value}`
  }
  if (typeof value === 'boolean') {
    return value ? 'true' : 'false'
  }
  return String(value)
}

const compileQuery = <T extends Compilable>(db: T): string => {
  const rawQuery = db.compile()
  const entries = Object.fromEntries(
    rawQuery.parameters.map((value, index) => [`$${index + 1}`, value]),
  )
  const query = rawQuery.sql.replace(/\$[0-9]+/g, (match) =>
    serializeValue(entries[match]),
  )
  return query
}

const logQuery = <T extends Compilable>(db: T): T => {
  console.info(compileQuery(db))
  return db
}

export { compileQuery, logQuery }
