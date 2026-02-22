--! Previous: sha1:490057170d781492dd55c62979dafe789f17c36c
--! Hash: sha1:95d750a81be5a4000aed2232fc3f20117c5331f2

--
-- create a view for `line` (points + duration)
--

-- idempotent reset
DROP VIEW IF EXISTS public.line;

CREATE VIEW public.line AS WITH
point_with_stop AS (
  SELECT
    point.id,
    point.user_id,
    point.stream_id,
    point.description,
    point.started_at,
    lead(point.started_at) over (
      partition by point.stream_id order by point.started_at
    ) AS stopped_at,
    point.label_id_list,
    point.created_at,
    point.updated_at
  FROM public.point_with_label_list point
),
now_ms AS (
  SELECT (extract(epoch from now()) * 1000)::bigint AS now_ms
)
SELECT
  point_with_stop.id as point_id,
  point_with_stop.user_id,
  point_with_stop.stream_id,
  point_with_stop.description,
  point_with_stop.started_at,
  point_with_stop.stopped_at,
  coalesce(point_with_stop.stopped_at, now_ms.now_ms) - point_with_stop.started_at AS duration_ms,
  point_with_stop.label_id_list,
  point_with_stop.created_at,
  point_with_stop.updated_at
FROM point_with_stop
CROSS JOIN now_ms;
