import type { ColumnType, Selectable, Insertable, Updateable } from 'kysely';
import { z } from 'zod';

/** Identifier type for public.user */
export type UserId = string & { __brand: 'public.user' };

/** Represents the table public.user */
export default interface UserTable {
  id: ColumnType<UserId, UserId, UserId>;

  stravaClientId: ColumnType<string | null, string | null, string | null>;

  stravaClientSecret: ColumnType<string | null, string | null, string | null>;

  stravaSession: ColumnType<Record<string, unknown> | null, Record<string, unknown> | null, Record<string, unknown> | null>;

  createdAt: ColumnType<number, number, number>;

  updatedAt: ColumnType<number, number, number>;

  email: ColumnType<string, string, string>;

  slackToken: ColumnType<string | null, string | null, string | null>;

  apiTokenHash: ColumnType<Uint8Array | null, Uint8Array | null, Uint8Array | null>;
}

export type User = Selectable<UserTable>;

export type NewUser = Insertable<UserTable>;

export type UserUpdate = Updateable<UserTable>;

export const userId = z.string() as unknown as z.Schema<UserId>;

export const user = z.object({
  id: userId,
  stravaClientId: z.string().nullable(),
  stravaClientSecret: z.string().nullable(),
  stravaSession: z.record(z.string(), z.unknown()).nullable(),
  createdAt: z.number(),
  updatedAt: z.number(),
  email: z.string(),
  slackToken: z.string().nullable(),
  apiTokenHash: z.instanceof(Uint8Array).nullable(),
});

export const userInitializer = z.object({
  id: userId,
  stravaClientId: z.string().optional().nullable(),
  stravaClientSecret: z.string().optional().nullable(),
  stravaSession: z.record(z.string(), z.unknown()).optional().nullable(),
  createdAt: z.number(),
  updatedAt: z.number(),
  email: z.string(),
  slackToken: z.string().optional().nullable(),
  apiTokenHash: z.instanceof(Uint8Array).optional().nullable(),
});

export const userMutator = z.object({
  id: userId.optional(),
  stravaClientId: z.string().optional().nullable(),
  stravaClientSecret: z.string().optional().nullable(),
  stravaSession: z.record(z.string(), z.unknown()).optional().nullable(),
  createdAt: z.number().optional(),
  updatedAt: z.number().optional(),
  email: z.string().optional(),
  slackToken: z.string().optional().nullable(),
  apiTokenHash: z.instanceof(Uint8Array).optional().nullable(),
});