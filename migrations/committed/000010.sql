--! Previous: sha1:53d26937c73bf7aa75ddd5a2461681c0b49d0d07
--! Hash: sha1:15720d4b65930b6cde91aac7b968cfcd19cae7d7

--
-- drop point_label.sort_order column
-- it's not useful and gets in the way
--

CREATE OR REPLACE VIEW public.point_with_label_list AS
 SELECT p.id,
    p.user_id,
    p.stream_id,
    p.description,
    p.started_at,
    p.created_at,
    p.updated_at,
    COALESCE(array_agg(pl.label_id ORDER BY pl.label_id) FILTER (WHERE (pl.label_id IS NOT NULL)), ARRAY[]::text[]) AS label_id_list
   FROM (public.point p
     LEFT JOIN public.point_label pl ON ((p.id = pl.point_id)))
  GROUP BY p.id;

ALTER TABLE point_label
  DROP COLUMN IF EXISTS sort_order;
