import { labelId, type LabelId } from './Label';
import { userId, type UserId } from './User';
import type { ColumnType, Selectable, Insertable, Updateable } from 'kysely';
import { z } from 'zod';

/** Represents the table public.label_parent */
export default interface LabelParentTable {
  labelId: ColumnType<LabelId, LabelId, LabelId>;

  parentLabelId: ColumnType<LabelId, LabelId, LabelId>;

  userId: ColumnType<UserId, UserId, UserId>;

  createdAt: ColumnType<number, number, number>;

  updatedAt: ColumnType<number, number, number>;
}

export type LabelParent = Selectable<LabelParentTable>;

export type NewLabelParent = Insertable<LabelParentTable>;

export type LabelParentUpdate = Updateable<LabelParentTable>;

export const labelParent = z.object({
  labelId: labelId,
  parentLabelId: labelId,
  userId: userId,
  createdAt: z.number(),
  updatedAt: z.number(),
});

export const labelParentInitializer = z.object({
  labelId: labelId,
  parentLabelId: labelId,
  userId: userId,
  createdAt: z.number(),
  updatedAt: z.number(),
});

export const labelParentMutator = z.object({
  labelId: labelId.optional(),
  parentLabelId: labelId.optional(),
  userId: userId.optional(),
  createdAt: z.number().optional(),
  updatedAt: z.number().optional(),
});