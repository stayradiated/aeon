import { labelId, type LabelId } from './Label';
import { pointId, type PointId } from './Point.ts';
import { userId, type UserId } from './User.ts';
import { streamId, type StreamId } from './Stream.ts';
import type { ColumnType, Selectable } from 'kysely';
import { z } from 'zod';

/** Represents the view public.point_with_label_list */
export default interface PointWithLabelListTable {
  id: ColumnType<PointId, never, never>;

  userId: ColumnType<UserId, never, never>;

  streamId: ColumnType<StreamId, never, never>;

  description: ColumnType<string, never, never>;

  startedAt: ColumnType<number, never, never>;

  createdAt: ColumnType<number, never, never>;

  updatedAt: ColumnType<number, never, never>;

  labelIdList: ColumnType<LabelId[], never, never>;
}

export type PointWithLabelList = Selectable<PointWithLabelListTable>;

export const pointWithLabelList = z.object({
  id: pointId,
  userId: userId,
  streamId: streamId,
  description: z.string(),
  startedAt: z.number(),
  createdAt: z.number(),
  updatedAt: z.number(),
  labelIdList: labelId.array(),
});