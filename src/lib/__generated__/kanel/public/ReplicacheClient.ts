import { replicacheClientGroupId, type ReplicacheClientGroupId } from './ReplicacheClientGroup.ts';
import type { ColumnType, Selectable, Insertable, Updateable } from 'kysely';
import { z } from 'zod';

/** Identifier type for public.replicache_client */
export type ReplicacheClientId = string & { __brand: 'public.replicache_client' };

/** Represents the table public.replicache_client */
export default interface ReplicacheClientTable {
  id: ColumnType<ReplicacheClientId, ReplicacheClientId, ReplicacheClientId>;

  replicacheClientGroupId: ColumnType<ReplicacheClientGroupId, ReplicacheClientGroupId, ReplicacheClientGroupId>;

  lastMutationId: ColumnType<number, number, number>;

  createdAt: ColumnType<number, number, number>;

  updatedAt: ColumnType<number, number, number>;
}

export type ReplicacheClient = Selectable<ReplicacheClientTable>;

export type NewReplicacheClient = Insertable<ReplicacheClientTable>;

export type ReplicacheClientUpdate = Updateable<ReplicacheClientTable>;

export const replicacheClientId = z.string() as unknown as z.Schema<ReplicacheClientId>;

export const replicacheClient = z.object({
  id: replicacheClientId,
  replicacheClientGroupId: replicacheClientGroupId,
  lastMutationId: z.number(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

export const replicacheClientInitializer = z.object({
  id: replicacheClientId,
  replicacheClientGroupId: replicacheClientGroupId,
  lastMutationId: z.number(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

export const replicacheClientMutator = z.object({
  id: replicacheClientId.optional(),
  replicacheClientGroupId: replicacheClientGroupId.optional(),
  lastMutationId: z.number().optional(),
  createdAt: z.number().optional(),
  updatedAt: z.number().optional(),
});