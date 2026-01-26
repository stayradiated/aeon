import type { Point } from '#lib/types.local.js'
import type { Line } from './types.js'

type BuildLineOptions<PointLike extends Point> = {
  points: [PointLike, PointLike | undefined]
  now?: number
}

const buildLine = <PointLike extends Point>(
  options: BuildLineOptions<PointLike>,
): Line => {
  const { points, now = Date.now() } = options
  const [startPoint, stopPoint] = points
  if (stopPoint) {
    if (startPoint.streamId !== stopPoint.streamId) {
      throw new Error('Stream IDs must match')
    }
    if (stopPoint.startedAt < startPoint.startedAt) {
      throw new Error('Stop Point must be after Start Point')
    }
  }

  const startedAt = startPoint.startedAt
  const stoppedAt = stopPoint ? stopPoint.startedAt : undefined
  const durationMs = stoppedAt ? stoppedAt - startedAt : now - startedAt

  const line: Line = {
    id: startPoint.id,
    streamId: startPoint.streamId,
    description: startPoint.description,
    labelIdList: startPoint.labelIdList,
    startedAt,
    stoppedAt,
    durationMs,
    createdAt: Math.max(startPoint.createdAt, stopPoint?.createdAt ?? 0),
    updatedAt: Math.max(startPoint.updatedAt, stopPoint?.updatedAt ?? 0),
  }

  return line
}

export { buildLine }
