import { styleText } from 'node:util'
import { errorBoundary } from '@stayradiated/error-boundary'
import type { KyselyPlugin, UnknownRow } from 'kysely'
import {
  CamelCasePlugin,
  HandleEmptyInListsPlugin,
  Kysely,
  PostgresDialect,
  replaceWithNoncontingentExpression,
} from 'kysely'
import type { PoolClient } from 'pg'
import pg from 'pg'

import type { DB } from '#lib/server/db/types.js'

import { dev as isDev } from '$app/env'

import { getDatabaseUrl } from '#lib/server/env.js'

import { once } from '#lib/utils/once.js'

class MyCamelCasePlugin extends CamelCasePlugin {
  protected override mapRow(row: UnknownRow): UnknownRow {
    const passthroughRow: UnknownRow = {}
    const transformRow: UnknownRow = {}
    for (const key in row) {
      if (key.startsWith('__disable_camel_case__')) {
        passthroughRow[key] = row[key]
      } else {
        transformRow[key] = row[key]
      }
    }
    const output = {
      ...passthroughRow,
      ...super.mapRow(transformRow),
    }
    return output
  }
}

// bigint → number
pg.types.setTypeParser(20, (val) => {
  return Number.parseInt(val, 10)
})

// bytea → Uint8Array
pg.types.setTypeParser(17, (val) => {
  return new Uint8Array(Buffer.from(val.slice(2), 'hex'))
})

// xid → number
pg.types.setTypeParser(28, (val) => {
  return Number.parseInt(val, 10)
})

const registerTypes = async (client: PoolClient) => {
  // node-postgres doesn't properly handle enum arrays out of the box,
  // so we have to manually set them up here to parse as text arrays.
  //
  // https://github.com/brianc/node-pg-types/issues/56
  //
  // We also add support for parsing `email[]` arrays

  const { rows } = await client.query<{
    typname: string
    typtype: string
    typarray: number
  }>(`
SELECT typname, typtype, typarray
FROM pg_type
WHERE
     (typname = 'text')
  OR (typname = 'email')
  OR (typtype = 'e')
ORDER BY typtype ASC, typname ASC
 `)

  const [textArray, ...rest] = rows
  if (textArray) {
    if (textArray.typname !== 'text' || textArray.typtype !== 'b') {
      throw new Error(
        `Expected text array to be of type "text" and "b", but got "${textArray.typname}" and "${textArray.typtype}".`,
      )
    }

    const arrayTextParser = pg.types.getTypeParser(textArray.typarray)
    rest.forEach(({ typarray }) => {
      pg.types.setTypeParser(typarray, arrayTextParser)
    })
  }
}

const getPgPool = once(() => {
  const databaseUrl = getDatabaseUrl()
  const pool = new pg.Pool({
    connectionString: databaseUrl,
  })
  pool.on('error', (error) => {
    /*
     * This handler is required so that connection errors don't crash the (via
     * `unhandledError`).
     */
    console.error('PostgreSQL pool error', error)
  })
  pool.on('connect', async (client) => {
    const error = await errorBoundary(() => registerTypes(client))
    if (error instanceof Error) {
      console.error(
        styleText('red', `Failed to register types: ${error.message}`),
      )
    }
  })
  return pool
})

const getDb = once(() => {
  const pool = getPgPool()

  const plugins: KyselyPlugin[] = [new MyCamelCasePlugin()]

  /*
   * Without this plugin, trying to query in an empty list will result in
   * `in ()` which is invalid SQL.
   * This plugin will replace empty lists with a true or false expression.
   *
   * example:
   *
   *   .where('id', 'in', []) // => `where 1 = 1`
   *   .where('first_name', 'not in', []) // => `where 1 = 0`
   *
   * We disable this in dev mode to catch errors early.
   * And enable it in prod mode to prevent accidentally querying in an empty
   * list.
   */
  if (!isDev) {
    plugins.push(
      new HandleEmptyInListsPlugin({
        strategy: (node) => {
          return replaceWithNoncontingentExpression(node)
        },
      }),
    )
  }

  const db = new Kysely<DB>({
    dialect: new PostgresDialect({ pool }),
    plugins,

    // Enable query logging
    // log: ['query', 'error'],
  })

  return db
})

export { getDb }
