import type { LabelId, StreamId } from '#lib/ids.js'
import type { Label, Point, Stream } from '#lib/server/types.js'

type SerialisePointListOptions = {
  pointList: Pick<Point, 'streamId' | 'labelIdList' | 'description'>[]
  streamRecord: Record<StreamId, Stream>
  labelRecord: Record<LabelId, Label>
}

const serialisePointList = (options: SerialisePointListOptions): string => {
  const { pointList, streamRecord, labelRecord } = options

  if (pointList.length === 0) {
    return ''
  }

  return pointList
    .map((point) => {
      const { streamId, labelIdList } = point

      const streamName = streamRecord[streamId]?.name ?? 'Unknown:'

      const labelNameList = labelIdList
        .flatMap((labelId) => labelRecord[labelId]?.name ?? [])
        .join(', ')

      const description =
        point.description.length > 0 ? ` [${point.description}]` : ''

      return `
      - ${streamName}: ${labelNameList}${description}
    `.trim()
    })
    .join('\n')
}

export { serialisePointList }
