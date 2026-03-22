import { tz } from '@date-fns/tz'
import * as dateFns from 'date-fns'

import type { LabelId, StreamId } from '#lib/ids.js'
import type { Label, Line, Stream } from '#lib/server/types.js'

import { calcDuration } from '#lib/core/shape/calc-duration.js'

import { formatDuration } from '#lib/utils/format-duration.js'

type SerialiseLineListOptions = {
  activeLineList: Line[]
  recentLineList: Line[]
  streamRecord: Record<StreamId, Stream>
  labelRecord: Record<LabelId, Label>
  timeZone: string
  now: number
}

const serialiseLineList = (options: SerialiseLineListOptions): string => {
  const {
    activeLineList,
    recentLineList,
    streamRecord,
    labelRecord,
    timeZone,
    now,
  } = options

  const currentTime = dateFns.format(now, 'EEE HH:mm', { in: tz(timeZone) })

  const current = activeLineList
    .map((line) => {
      const { streamId, labelIdList } = line

      const streamName = streamRecord[streamId]?.name ?? 'Unknown:'

      const labelNameList = labelIdList
        .flatMap((labelId) => labelRecord[labelId]?.name ?? [])
        .join(', ')

      const description =
        line.description.length > 0 ? ` [${line.description}]` : ''

      const startedAt = dateFns.format(line.startedAt, 'HH:mm', {
        in: tz(timeZone),
      })

      const durationMs = calcDuration(
        {
          startedAt: line.startedAt,
          durationMs: line.durationMs ?? undefined,
        },
        now,
      )

      const duration = formatDuration(durationMs)

      return `
      - ${startedAt} +${duration} ${streamName}: ${labelNameList}${description}
    `.trim()
    })
    .join('\n')

  const history = recentLineList
    .toSorted((a, b) => b.startedAt - a.startedAt)
    .map((line) => {
      const { streamId, labelIdList } = line

      const streamName = streamRecord[streamId]?.name ?? 'Unknown:'

      const labelNameList = labelIdList
        .flatMap((labelId) => labelRecord[labelId]?.name ?? [])
        .join(', ')

      const startedAt = dateFns.format(line.startedAt, 'HH:mm', {
        in: tz(timeZone),
      })

      const durationMs = calcDuration(
        {
          startedAt: line.startedAt,
          durationMs: line.durationMs ?? undefined,
        },
        now,
      )

      const description =
        line.description.length > 0 ? ` [${line.description}]` : ''

      const duration = formatDuration(durationMs)

      return `
      - ${startedAt} +${duration} ${streamName}: ${labelNameList}${description}
    `.trim()
    })
    .join('\n')

  return `
# current status (${currentTime})
${current}

# history
${history}
  `.trim()
}

export { serialiseLineList }
