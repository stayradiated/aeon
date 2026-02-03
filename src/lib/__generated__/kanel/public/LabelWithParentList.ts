import { labelId, type LabelId } from './Label';
import { userId, type UserId } from './User';
import { streamId, type StreamId } from './Stream';
import type { ColumnType, Selectable } from 'kysely';
import { z } from 'zod';

/** Represents the view public.label_with_parent_list */
export default interface LabelWithParentListTable {
  id: ColumnType<LabelId, never, never>;

  userId: ColumnType<UserId, never, never>;

  streamId: ColumnType<StreamId, never, never>;

  name: ColumnType<string, never, never>;

  icon: ColumnType<string | null, never, never>;

  color: ColumnType<string | null, never, never>;

  createdAt: ColumnType<number, never, never>;

  updatedAt: ColumnType<number, never, never>;

  parentLabelIdList: ColumnType<LabelId[], never, never>;
}

export type LabelWithParentList = Selectable<LabelWithParentListTable>;

export const labelWithParentList = z.object({
  id: labelId,
  userId: userId,
  streamId: streamId,
  name: z.string(),
  icon: z.string().nullable().nullable(),
  color: z.string().nullable().nullable(),
  createdAt: z.number(),
  updatedAt: z.number(),
  parentLabelIdList: labelId.array(),
});