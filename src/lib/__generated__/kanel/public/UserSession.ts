import { userId, type UserId } from './User.ts';
import type { ColumnType, Selectable, Insertable, Updateable } from 'kysely';
import { z } from 'zod';

/** Identifier type for public.user_session */
export type UserSessionId = string & { __brand: 'public.user_session' };

/** Represents the table public.user_session */
export default interface UserSessionTable {
  id: ColumnType<UserSessionId, UserSessionId, UserSessionId>;

  userId: ColumnType<UserId, UserId, UserId>;

  expiresAt: ColumnType<number, number, number>;

  createdAt: ColumnType<number, number, number>;

  updatedAt: ColumnType<number, number, number>;
}

export type UserSession = Selectable<UserSessionTable>;

export type NewUserSession = Insertable<UserSessionTable>;

export type UserSessionUpdate = Updateable<UserSessionTable>;

export const userSessionId = z.string() as unknown as z.Schema<UserSessionId>;

export const userSession = z.object({
  id: userSessionId,
  userId: userId,
  expiresAt: z.number(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

export const userSessionInitializer = z.object({
  id: userSessionId,
  userId: userId,
  expiresAt: z.number(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

export const userSessionMutator = z.object({
  id: userSessionId.optional(),
  userId: userId.optional(),
  expiresAt: z.number().optional(),
  createdAt: z.number().optional(),
  updatedAt: z.number().optional(),
});