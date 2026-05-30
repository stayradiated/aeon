import { userId, type UserId } from './User.ts';
import type { ColumnType, Selectable, Insertable, Updateable } from 'kysely';
import { z } from 'zod';

/** Identifier type for public.replicache_client_group */
export type ReplicacheClientGroupId = string & { __brand: 'public.replicache_client_group' };

/** Represents the table public.replicache_client_group */
export default interface ReplicacheClientGroupTable {
  id: ColumnType<ReplicacheClientGroupId, ReplicacheClientGroupId, ReplicacheClientGroupId>;

  userId: ColumnType<UserId, UserId, UserId>;

  cvrVersion: ColumnType<number, number, number>;

  createdAt: ColumnType<number, number, number>;

  updatedAt: ColumnType<number, number, number>;
}

export type ReplicacheClientGroup = Selectable<ReplicacheClientGroupTable>;

export type NewReplicacheClientGroup = Insertable<ReplicacheClientGroupTable>;

export type ReplicacheClientGroupUpdate = Updateable<ReplicacheClientGroupTable>;

export const replicacheClientGroupId = z.string() as unknown as z.Schema<ReplicacheClientGroupId>;

export const replicacheClientGroup = z.object({
  id: replicacheClientGroupId,
  userId: userId,
  cvrVersion: z.number(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

export const replicacheClientGroupInitializer = z.object({
  id: replicacheClientGroupId,
  userId: userId,
  cvrVersion: z.number(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

export const replicacheClientGroupMutator = z.object({
  id: replicacheClientGroupId.optional(),
  userId: userId.optional(),
  cvrVersion: z.number().optional(),
  createdAt: z.number().optional(),
  updatedAt: z.number().optional(),
});