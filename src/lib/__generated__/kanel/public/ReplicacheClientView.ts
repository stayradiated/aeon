import type { ColumnType, Selectable, Insertable, Updateable } from 'kysely';
import { z } from 'zod';

/** Identifier type for public.replicache_client_view */
export type ReplicacheClientViewId = string & { __brand: 'public.replicache_client_view' };

/** Represents the table public.replicache_client_view */
export default interface ReplicacheClientViewTable {
  id: ColumnType<ReplicacheClientViewId, ReplicacheClientViewId, ReplicacheClientViewId>;

  record: ColumnType<Record<string, unknown>, Record<string, unknown>, Record<string, unknown>>;

  createdAt: ColumnType<number, number, number>;

  version: ColumnType<string, string, string>;
}

export type ReplicacheClientView = Selectable<ReplicacheClientViewTable>;

export type NewReplicacheClientView = Insertable<ReplicacheClientViewTable>;

export type ReplicacheClientViewUpdate = Updateable<ReplicacheClientViewTable>;

export const replicacheClientViewId = z.string() as unknown as z.Schema<ReplicacheClientViewId>;

export const replicacheClientView = z.object({
  id: replicacheClientViewId,
  record: z.record(z.string(), z.unknown()),
  createdAt: z.number(),
  version: z.string(),
});

export const replicacheClientViewInitializer = z.object({
  id: replicacheClientViewId,
  record: z.record(z.string(), z.unknown()),
  createdAt: z.number(),
  version: z.string(),
});

export const replicacheClientViewMutator = z.object({
  id: replicacheClientViewId.optional(),
  record: z.record(z.string(), z.unknown()).optional(),
  createdAt: z.number().optional(),
  version: z.string().optional(),
});