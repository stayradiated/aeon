import { userId, type UserId } from './User';
import { streamId, type StreamId } from './Stream';
import type { ColumnType, Selectable, Insertable, Updateable } from 'kysely';
import { z } from 'zod';

/** Identifier type for public.label */
export type LabelId = string & { __brand: 'public.label' };

/** Represents the table public.label */
export default interface LabelTable {
  id: ColumnType<LabelId, LabelId, LabelId>;

  userId: ColumnType<UserId, UserId, UserId>;

  streamId: ColumnType<StreamId, StreamId, StreamId>;

  name: ColumnType<string, string, string>;

  icon: ColumnType<string | null, string | null, string | null>;

  color: ColumnType<string | null, string | null, string | null>;

  createdAt: ColumnType<number, number, number>;

  updatedAt: ColumnType<number, number, number>;
}

export type Label = Selectable<LabelTable>;

export type NewLabel = Insertable<LabelTable>;

export type LabelUpdate = Updateable<LabelTable>;

export const labelId = z.string() as unknown as z.Schema<LabelId>;

export const label = z.object({
  id: labelId,
  userId: userId,
  streamId: streamId,
  name: z.string(),
  icon: z.string().nullable().nullable(),
  color: z.string().nullable().nullable(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

export const labelInitializer = z.object({
  id: labelId,
  userId: userId,
  streamId: streamId,
  name: z.string(),
  icon: z.string().nullable().optional().nullable(),
  color: z.string().nullable().optional().nullable(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

export const labelMutator = z.object({
  id: labelId.optional(),
  userId: userId.optional(),
  streamId: streamId.optional(),
  name: z.string().optional(),
  icon: z.string().nullable().optional().nullable(),
  color: z.string().nullable().optional().nullable(),
  createdAt: z.number().optional(),
  updatedAt: z.number().optional(),
});