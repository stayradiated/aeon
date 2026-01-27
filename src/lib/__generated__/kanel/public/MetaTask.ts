import { userId, type UserId } from './User';
import type { ColumnType, Selectable, Insertable, Updateable } from 'kysely';
import { z } from 'zod';

/** Identifier type for public.meta_task */
export type MetaTaskId = string & { __brand: 'public.meta_task' };

/** Represents the table public.meta_task */
export default interface MetaTaskTable {
  id: ColumnType<MetaTaskId, MetaTaskId, MetaTaskId>;

  userId: ColumnType<UserId, UserId, UserId>;

  name: ColumnType<string, string, string>;

  status: ColumnType<string, string, string>;

  lastStartedAt: ColumnType<number, number, number>;

  lastFinishedAt: ColumnType<number | null, number | null, number | null>;

  createdAt: ColumnType<number, number, number>;

  updatedAt: ColumnType<number, number, number>;
}

export type MetaTask = Selectable<MetaTaskTable>;

export type NewMetaTask = Insertable<MetaTaskTable>;

export type MetaTaskUpdate = Updateable<MetaTaskTable>;

export const metaTaskId = z.string() as unknown as z.Schema<MetaTaskId>;

export const metaTask = z.object({
  id: metaTaskId,
  userId: userId,
  name: z.string(),
  status: z.string(),
  lastStartedAt: z.number(),
  lastFinishedAt: z.number().nullable().nullable(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

export const metaTaskInitializer = z.object({
  id: metaTaskId,
  userId: userId,
  name: z.string(),
  status: z.string(),
  lastStartedAt: z.number(),
  lastFinishedAt: z.number().nullable().optional().nullable(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

export const metaTaskMutator = z.object({
  id: metaTaskId.optional(),
  userId: userId.optional(),
  name: z.string().optional(),
  status: z.string().optional(),
  lastStartedAt: z.number().optional(),
  lastFinishedAt: z.number().nullable().optional().nullable(),
  createdAt: z.number().optional(),
  updatedAt: z.number().optional(),
});