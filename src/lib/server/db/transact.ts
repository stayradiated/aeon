import { setTimeout as nodeSetTimeout } from 'node:timers/promises'
import { styleText } from 'node:util'
import { errorBoundary } from '@stayradiated/error-boundary'
import type { MutexInterface } from 'async-mutex'
import { Mutex, withTimeout } from 'async-mutex'
import type { IsolationLevel } from 'kysely'

import type { ControlledTransaction, KyselyDb } from './types.js'

import { genId } from '#lib/utils/gen-id.js'
import { once } from '#lib/utils/once.js'

/*
 * Calculate exponential backoff with jitter.
 * See tests for examples
 */
type CalculateBackoffDelayOptions = {
  attempt: number
  initialDelay: number
  backoffFactor: number
  jitterFactor: number
  mathRandom?: () => number
}

const calculateBackoffDelay = (
  options: CalculateBackoffDelayOptions,
): number => {
  const {
    attempt,
    initialDelay,
    backoffFactor,
    jitterFactor,
    mathRandom = Math.random,
  } = options
  const baseDelay = initialDelay * backoffFactor ** (attempt - 1)
  const jitter = mathRandom() * baseDelay * jitterFactor
  const totalDelay = baseDelay + jitter
  return Math.round(totalDelay * 100) / 100
}

const isTransaction = (db: KyselyDb): db is ControlledTransaction => {
  return db.isTransaction
}

/*
 * recursive function to check if error is a thrown from a deadlock
 */
const isDeadlockError = (error: Error, maxDepth = 5): boolean => {
  if (
    'code' in error &&
    typeof error.code === 'string' &&
    (error.code === '40001' || error.code === '40P01')
  ) {
    return true
  }
  if (maxDepth > 1 && error.cause instanceof Error) {
    return isDeadlockError(error.cause, maxDepth - 1)
  }
  return false
}

type TransactOptions = {
  isolationLevel?: IsolationLevel
  maxAttempts?: number
  initialDelay?: number
  backoffFactor?: number
  jitterFactor?: number

  // disable console.error output
  silent?: boolean

  // allow setTimeout to be injected for testing
  setTimeout?: (ms: number) => Promise<void>
}

const startTopLevelTransaction = async <T>(
  debugName: string,
  db: KyselyDb,
  fn: (options: { db: ControlledTransaction }) => Promise<T | Error>,
  options: TransactOptions = {},
): Promise<T | Error> => {
  const {
    maxAttempts = 5,
    initialDelay = 10,
    backoffFactor = 3,
    jitterFactor = 0.5,

    /*
     * 0: no delay
     * 1: ~10ms
     * 2: ~30ms
     * 3: ~90ms
     * 4: ~270ms
     * 5: ~810ms
     */

    // default PostgreSQL isolation level
    isolationLevel = 'read committed',
    silent,
    setTimeout = nodeSetTimeout,
  } = options

  let attempt = 1

  while (attempt <= maxAttempts) {
    const trx = await errorBoundary(() =>
      db.startTransaction().setIsolationLevel(isolationLevel).execute(),
    )
    if (trx instanceof Error) {
      return new Error(
        `[transact] ${debugName}: Failed to start transaction: ${trx.message}`,
        {
          cause: trx,
        },
      )
    }

    const result = await errorBoundary(() => fn({ db: trx }))

    if (result instanceof Error) {
      const rollbackResult = await errorBoundary(() => trx.rollback().execute())
      if (rollbackResult instanceof Error) {
        return new Error(
          `[transact] ${debugName}: Failed to rollback transaction: ${rollbackResult.message}`,
          {
            cause: rollbackResult,
          },
        )
      }

      if (isDeadlockError(result)) {
        if (attempt === maxAttempts) {
          return new Error(`[DEADLOCK] Exhausted all ${maxAttempts} attempts`, {
            cause: result,
          })
        }
        const totalDelay = calculateBackoffDelay({
          attempt,
          initialDelay,
          backoffFactor,
          jitterFactor,
        })
        if (!silent) {
          console.error(
            styleText(
              'red',
              `[transact] ${debugName}: <${attempt}/${maxAttempts}> Failed due to lock or serialization issue, retrying in ${totalDelay}ms: ${result}.\nERROR: ${result.message}`,
            ),
          )
        }
        await setTimeout(totalDelay)
        attempt += 1
        // important: must continue back to the top of the loop to try again
        continue
      }

      // some other error occurred → fail
      return result
    }
    // Success! Commit the transaction.
    const commitResult = await errorBoundary(() => trx.commit().execute())
    if (commitResult instanceof Error) {
      return new Error(
        `[transact] ${debugName}: Failed to commit transaction: ${commitResult.message}`,
        {
          cause: commitResult,
        },
      )
    }
    return result
  }

  return new Error('Exceeded maximum attempts')
}

// NOTE: we use a WeakMap here to avoid leaking memory
const getMutexMap = once(
  () => new WeakMap<ControlledTransaction, MutexInterface>(),
)

const getMutexForTransaction = (db: ControlledTransaction): MutexInterface => {
  const mutexMap = getMutexMap()
  const existingMutex = mutexMap.get(db)
  if (existingMutex) {
    return existingMutex
  }
  const mutex = withTimeout(new Mutex(), 2000)
  mutexMap.set(db, mutex)
  return mutex
}

const startNestedTransaction = async <T>(
  debugName: string,
  db: ControlledTransaction,
  fn: (options: { db: ControlledTransaction }) => Promise<T | Error>,
  _options: TransactOptions,
): Promise<T | Error> => {
  const mutex = getMutexForTransaction(db)
  const release = await mutex.acquire()

  const savepointId = genId()

  const trx = await errorBoundary(() => db.savepoint(savepointId).execute())
  if (trx instanceof Error) {
    return new Error(
      `[transact] ${debugName}: Failed to start transaction: ${trx.message}`,
      {
        cause: trx,
      },
    )
  }

  const result = await errorBoundary(() =>
    fn({ db: trx as unknown as ControlledTransaction }),
  )

  if (result instanceof Error) {
    const rollbackResult = await errorBoundary(() =>
      trx.rollbackToSavepoint(savepointId).execute(),
    )

    release()

    if (rollbackResult instanceof Error) {
      return new Error(
        `[transact] ${debugName}: Failed to rollback transaction: ${rollbackResult.message}`,
        {
          cause: rollbackResult,
        },
      )
    }
    return result
  }

  const releaseResult = await errorBoundary(() =>
    trx.releaseSavepoint(savepointId).execute(),
  )

  release()

  if (releaseResult instanceof Error) {
    console.error(
      `[transact] ${debugName}: Failed to release savepoint: ${releaseResult.message}`,
    )
    return new Error(
      `[transact] ${debugName}: Failed to release savepoint: ${releaseResult.message}`,
      {
        cause: releaseResult,
      },
    )
  }

  return result
}

/*
 * transact
 * --------
 *
 * The most magical function in rough.
 *
 * This is a wrapper around `kysely.db.transaction()` that adds retry logic
 * and backoff delays.
 *
 * It also supports nesting `transact` calls, ensuring that changes are always
 * committed atomically.
 *
 * This is done using PostgreSQL's SAVEPOINT functionality.
 * The downside, is that only one nested transaction can be active at a time.
 * https://www.postgresql.org/docs/current/sql-savepoint.html
 *
 */

const transact = async <T>(
  debugName: string,
  db: KyselyDb,
  fn: (options: { db: ControlledTransaction }) => Promise<T | Error>,
  options: TransactOptions = {},
): Promise<T | Error> => {
  if (isTransaction(db)) {
    return startNestedTransaction(debugName, db, fn, options)
  }

  return startTopLevelTransaction(debugName, db, fn, options)
}

export { transact }
export type { TransactOptions }
