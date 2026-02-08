import type { Signal } from 'signia'
import { computed } from 'signia'

import type { Stream } from '#lib/types.local.js'

import { createSelector } from '#lib/utils/selector.js'

const normalizeStreamName = (stream: Stream): string => {
  return stream.name.toLowerCase().trim()
}

const getDuplicateStreamList = createSelector(
  'getDuplicateStreamList',
  (store): Signal<Stream[][]> => {
    return computed('getDuplicateStreamList', () => {
      const streamList = store.stream.asList.value

      // we build a record storing the normalized name of each stream
      // mapping to the list of streams with that name
      const record: Record<string, Stream[]> = {}
      for (const stream of streamList) {
        const normalizedName = normalizeStreamName(stream)
        if (record[normalizedName]) {
          record[normalizedName].push(stream)
        } else {
          record[normalizedName] = [stream]
        }
      }

      const duplicateStreamGroupList: Stream[][] = []
      for (const streamList of Object.values(record)) {
        if (streamList.length > 1) {
          duplicateStreamGroupList.push(streamList)
        }
      }

      return duplicateStreamGroupList
    })
  },
)

export { getDuplicateStreamList }
