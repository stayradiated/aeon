import { labelId, type LabelId } from './Label';
import { pointId, type PointId } from './Point';
import { userId, type UserId } from './User';
import { streamId, type StreamId } from './Stream';
import type { ColumnType, Selectable } from 'kysely';
import { z } from 'zod';

/** Represents the view public.line */
export default interface LineTable {
  pointId: ColumnType<PointId, never, never>;

  userId: ColumnType<UserId, never, never>;

  streamId: ColumnType<StreamId, never, never>;

  description: ColumnType<string, never, never>;

  startedAt: ColumnType<number, never, never>;

  stoppedAt: ColumnType<number | null, never, never>;

  durationMs: ColumnType<number | null, never, never>;

  labelIdList: ColumnType<LabelId[], never, never>;

  createdAt: ColumnType<number, never, never>;

  updatedAt: ColumnType<number, never, never>;
}

export type Line = Selectable<LineTable>;

export const line = z.object({
  pointId: pointId,
  userId: userId,
  streamId: streamId,
  description: z.string(),
  startedAt: z.number(),
  stoppedAt: z.number().nullable(),
  durationMs: z.number().nullable(),
  labelIdList: labelId.array(),
  createdAt: z.number(),
  updatedAt: z.number(),
});