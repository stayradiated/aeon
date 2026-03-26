import { userId, type UserId } from './User';
import type { ColumnType, Selectable, Insertable, Updateable } from 'kysely';
import { z } from 'zod';

/** Represents the table public.status */
export default interface StatusTable {
  userId: ColumnType<UserId, UserId, UserId>;

  enabledAt: ColumnType<number | null, number | null, number | null>;

  prompt: ColumnType<string, string, string>;

  streamIdList: ColumnType<string[], string[], string[]>;

  hash: ColumnType<string, string, string>;

  status: ColumnType<string, string, string>;

  emoji: ColumnType<string, string, string>;

  expiresAt: ColumnType<number | null, number | null, number | null>;

  createdAt: ColumnType<number, number, number>;

  updatedAt: ColumnType<number, number, number>;

  messageLog: ColumnType<Record<string, unknown> | null, Record<string, unknown> | null, Record<string, unknown> | null>;
}

export type Status = Selectable<StatusTable>;

export type NewStatus = Insertable<StatusTable>;

export type StatusUpdate = Updateable<StatusTable>;

export const status = z.object({
  userId: userId,
  enabledAt: z.number().nullable(),
  prompt: z.string(),
  streamIdList: z.string().array(),
  hash: z.string(),
  status: z.string(),
  emoji: z.string(),
  expiresAt: z.number().nullable(),
  createdAt: z.number(),
  updatedAt: z.number(),
  messageLog: z.record(z.string(), z.unknown()).nullable(),
});

export const statusInitializer = z.object({
  userId: userId,
  enabledAt: z.number().optional().nullable(),
  prompt: z.string(),
  streamIdList: z.string().array(),
  hash: z.string(),
  status: z.string(),
  emoji: z.string(),
  expiresAt: z.number().optional().nullable(),
  createdAt: z.number(),
  updatedAt: z.number(),
  messageLog: z.record(z.string(), z.unknown()).optional().nullable(),
});

export const statusMutator = z.object({
  userId: userId.optional(),
  enabledAt: z.number().optional().nullable(),
  prompt: z.string().optional(),
  streamIdList: z.string().array().optional(),
  hash: z.string().optional(),
  status: z.string().optional(),
  emoji: z.string().optional(),
  expiresAt: z.number().optional().nullable(),
  createdAt: z.number().optional(),
  updatedAt: z.number().optional(),
  messageLog: z.record(z.string(), z.unknown()).optional().nullable(),
});