import { pointId, type PointId } from './Point';
import { labelId, type LabelId } from './Label';
import { streamId, type StreamId } from './Stream';
import type { ColumnType, Selectable, Insertable, Updateable } from 'kysely';
import { z } from 'zod';

/** Represents the table public.point_label */
export default interface PointLabelTable {
  pointId: ColumnType<PointId, PointId, PointId>;

  labelId: ColumnType<LabelId, LabelId, LabelId>;

  userId: ColumnType<string, string, string>;

  createdAt: ColumnType<number, number, number>;

  updatedAt: ColumnType<number, number, number>;

  streamId: ColumnType<StreamId, StreamId, StreamId>;
}

export type PointLabel = Selectable<PointLabelTable>;

export type NewPointLabel = Insertable<PointLabelTable>;

export type PointLabelUpdate = Updateable<PointLabelTable>;

export const pointLabel = z.object({
  pointId: pointId,
  labelId: labelId,
  userId: z.string(),
  createdAt: z.number(),
  updatedAt: z.number(),
  streamId: streamId,
});

export const pointLabelInitializer = z.object({
  pointId: pointId,
  labelId: labelId,
  userId: z.string(),
  createdAt: z.number(),
  updatedAt: z.number(),
  streamId: streamId,
});

export const pointLabelMutator = z.object({
  pointId: pointId.optional(),
  labelId: labelId.optional(),
  userId: z.string().optional(),
  createdAt: z.number().optional(),
  updatedAt: z.number().optional(),
  streamId: streamId.optional(),
});