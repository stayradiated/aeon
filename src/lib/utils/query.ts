/**
 * Reactive query system for Svelte 5 components using Signia signals.
 *
 * The `query` function bridges Signia's reactive state management with Svelte 5's
 * fine-grained reactivity system. It enables components to reactively consume
 * data from the Replicache-powered store while maintaining optimal performance
 * through lazy subscription and automatic cleanup.
 *
 * ## Architecture
 *
 * ```
 * Replicache Data → Store Tables → Signia Signals → query() → Svelte $derived
 * ```
 *
 * ## Key Features
 *
 * - **Lazy Subscription**: Only subscribes to signals when their values are accessed
 * - **Automatic Cleanup**: Leverages Svelte's reactivity system for subscription management
 * - **Type Safety**: Full TypeScript inference for query results
 * - **Performance**: Minimal re-renders through fine-grained reactivity
 * - **Proxy-based**: Uses Proxy to activate subscriptions on property access
 *
 * ## Usage Patterns
 *
 * ### Object Pattern (Recommended for most cases)
 * ```typescript
 * const local = $derived(
 *   query({
 *     document: store.document.get(documentId),
 *     owner: getDocumentOwner(store, documentId),
 *     permissions: getDocumentPermissions(store, documentId),
 *   })
 * )
 *
 * // Access reactive data
 * {local.document?.title}
 * {local.owner?.name}
 * ```
 *
 * ### Computed Signal Pattern (For complex derivations)
 * ```typescript
 * const local = $derived(
 *   query(
 *     computed('ComponentName', () => {
 *       const document = store.document.get(documentId).value
 *       const sessionPerson = getPersonByUserId(store, store.sessionUserId).value
 *       const isOwner = document?.ownedByPersonId === sessionPerson?.id
 *
 *       return {
 *         document,
 *         sessionPerson,
 *         isOwner,
 *       }
 *     })
 *   )
 * )
 * ```
 *
 * ## When to Use Each Pattern
 *
 * **Object Pattern**: Use for straightforward data fetching where each piece
 * of data is independent. This covers ~90% of use cases.
 *
 * **Computed Pattern**: Use for complex derivations involving multiple store
 * values, conditional logic, or when you need fine-grained control over
 * what triggers re-computation.
 *
 * ## Performance Characteristics
 *
 * - **Lazy evaluation**: Signals are only subscribed when properties are accessed
 * - **Incremental updates**: Only re-renders when accessed data actually changes
 * - **Memory efficient**: Automatic subscription cleanup when components unmount
 * - **Memoized**: Store helper functions are memoized for optimal performance
 *
 * @example
 * ```typescript
 * // Simple document query
 * const local = $derived(
 *   query({
 *     document: store.document.get(documentId),
 *   })
 * )
 *
 * // Complex multi-entity query
 * const local = $derived(
 *   query({
 *     document: store.document.get(documentId),
 *     canEdit: getCanUpdateDocument(store, documentId),
 *     owner: getDocumentOwner(store, documentId),
 *     commentCount: getDocumentCommentCount(store, documentId),
 *   })
 * )
 *
 * // Advanced computed pattern
 * const local = $derived(
 *   query(
 *     computed('DocumentList', () => {
 *       const workspace = store.workspace.get(workspaceId).value
 *       const documents = store.document.filter((doc) =>
 *         doc.workspaceId === workspaceId && !doc.archivedAt
 *       ).value
 *
 *       return {
 *         workspace,
 *         documents: documents.sort((a, b) => b.lastModifiedAt - a.lastModifiedAt),
 *         isEmpty: documents.length === 0,
 *       }
 *     })
 *   )
 * )
 * ```
 */

import type { Signal } from 'signia'
import { computed, react } from 'signia'
import { createSubscriber } from 'svelte/reactivity'

import { objectEntries } from '#lib/utils/object-entries.js'

type Ref<Value> = {
  current: Value
}

/**
 * Function type for the query utility with two overloaded signatures.
 *
 * @template T - Either a Signal containing a record, or a record of Signals
 */
type QueryFn = {
  /**
   * Computed Signal Pattern - for complex derivations.
   * Takes a function that returns an object of signals.
   */
  <
    T extends {
      [key: string]: unknown
    },
  >(
    input: () => T,
  ): {
    [K in keyof T]: T[K]
  }
  /**
   * Object Pattern - for straightforward data fetching.
   * Takes an object where each value is a Signal.
   */
  <T extends Record<string, Signal<unknown>>>(
    input: T,
  ): {
    [K in keyof T]: T[K]['value']
  }
}

/**
 * Handles the Computed Signal Pattern - creates reactive state from a single computed signal.
 *
 * This function takes a computed signal that returns an object and creates individual
 * signals for each property, allowing fine-grained reactivity at the property level.
 *
 * @param signalRecord - A computed signal containing an object
 * @returns Proxy object that activates subscriptions on property access
 */
const queryFromSignal = <T extends Record<string, unknown>>(
  signalRecord: Signal<T>,
): T => {
  // Initialize state with current signal values
  const stateRecord = { ...signalRecord.value } as T
  const keys = Object.keys(signalRecord.value) as (keyof T)[]

  // Create individual computed signals for each property to enable fine-grained reactivity
  const signalMap = new Map<keyof T, Signal<T[keyof T]>>(
    keys.map((key): [keyof T, Signal<T[keyof T]>] => [
      key,
      computed(`key:${String(key)}`, () => signalRecord.value[key]),
    ]),
  )

  // Create Svelte subscribers for each property signal
  const subscriberRecord = Object.fromEntries(
    Array.from(signalMap.entries()).map(([key, signal]) => {
      const subscribeFn = createSubscriber((onUpdate) => {
        const unsubscribe = react(
          `queryFromComputedValue:${signal.name}`,
          () => {
            const prevValue = stateRecord[key]
            if (prevValue !== signal.value) {
              stateRecord[key] = signal.value
              onUpdate() // Trigger Svelte re-render
            }
          },
        )
        return unsubscribe
      })
      return [key, subscribeFn]
    }),
  ) as { [K in keyof T]: () => void }

  // Return a proxy that activates subscriptions lazily when properties are accessed
  return new Proxy(stateRecord, {
    get(target, prop) {
      // Ensure we're subscribed when properties are accessed
      const subscribeFn = subscriberRecord[prop as keyof T]
      subscribeFn?.()
      return target[prop as keyof T]
    },
  })
}

/**
 * Handles the Object Pattern - creates reactive state from an object of signals.
 *
 * This is the most common pattern, used in ~90% of components. Takes an object
 * where each property is a signal and creates a reactive object where each
 * property contains the current value of its corresponding signal.
 *
 * @param input - Object where each property is a Signal
 * @returns Object with current values that updates when signals change
 */
const queryFromObject = <T extends Record<string, Signal<unknown>>>(
  input: T,
): {
  [K in keyof T]: T[K]['value']
} => {
  // Track state as a computed object
  const $state = computed(
    'queryFromObject',
    () =>
      Object.fromEntries(
        objectEntries(input).map(([key, signal]) => [key, signal.value]),
      ) as { [K in keyof T]: T[K]['value'] },
  )

  // Update svelte when any state changes
  const subscribe = createSubscriber((onUpdate) => {
    const stop = react('queryFromObject', () => {
      $state.value
      onUpdate()
    })
    return stop
  })
  subscribe()

  return $state.value
}

/**
 * Main query function that bridges Signia signals with Svelte 5 reactivity.
 *
 * This function automatically detects whether you're using the Object Pattern
 * or the Computed Signal Pattern and routes to the appropriate implementation.
 *
 * @param input - Either an object of signals or a single computed signal
 * @returns Reactive object with current values that updates when signals change
 */
const query: QueryFn = (
  input: Record<string, Signal<unknown>> | (() => Record<string, unknown>),
) => {
  if (typeof input === 'function') {
    return queryFromSignal(computed('query', input))
  }
  return queryFromObject(input)
}

export { query }
export type { Ref }
