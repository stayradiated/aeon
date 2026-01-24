--! Previous: sha1:2782857bd76fb0454f16b6954085e83cb39d43f9
--! Hash: sha1:af4fa9b2b3a9c3380f8f3d5480ecfdde3bca993f

--
-- add stream_id to point_label
-- and ensure that points can only have labels from the same stream
--

-- idempotent reset
ALTER TABLE ONLY public.point_label
  DROP CONSTRAINT IF EXISTS "point_label:foreignKey(stream_id)",
  DROP CONSTRAINT IF EXISTS "point_label:foreignKey(label_id)",
  DROP CONSTRAINT IF EXISTS "point_label:foreignKey(point_id)",
  DROP COLUMN IF EXISTS stream_id;
ALTER TABLE ONLY public.point
  DROP CONSTRAINT IF EXISTS "point:unique(id,stream_id)";
ALTER TABLE ONLY public.label
  DROP CONSTRAINT IF EXISTS "label:unique(id,stream_id)";

ALTER TABLE ONLY public.point_label
  ADD COLUMN stream_id TEXT;

-- backfill stream_id with the point.stream_id
UPDATE public.point_label
  SET stream_id = point.stream_id
  FROM public.point
  WHERE TRUE
    AND point.id = point_label.point_id
    AND point_label.stream_id IS NULL;

-- ensure that stream_id is not null
ALTER TABLE ONLY public.point_label
  ALTER COLUMN stream_id SET NOT NULL;

-- first, we need to setup unique indexes on point and label tables
ALTER TABLE ONLY public.point
  ADD CONSTRAINT "point:unique(id,stream_id)"
    UNIQUE (id, stream_id);
ALTER TABLE ONLY public.label
  ADD CONSTRAINT "label:unique(id,stream_id)"
    UNIQUE (id, stream_id);

-- now, we can add composite foreign keys
-- to ensure that points can only have labels from the same stream
ALTER TABLE ONLY public.point_label
  ADD CONSTRAINT "point_label:foreignKey(stream_id)"
    FOREIGN KEY (stream_id)
    REFERENCES public.stream (id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  ADD CONSTRAINT "point_label:foreignKey(label_id)"
    FOREIGN KEY (label_id, stream_id)
    REFERENCES public.label (id, stream_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  ADD CONSTRAINT "point_label:foreignKey(point_id)"
    FOREIGN KEY (point_id, stream_id)
    REFERENCES public.point (id, stream_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT;
