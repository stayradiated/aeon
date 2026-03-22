--! Previous: sha1:efea0d5cd80103ae19a7643636bc186d5458881f
--! Hash: sha1:5740a59b91ec87912a045070e6205741e5807371

--
-- update view
-- return duration_ms as null instead of calculating against now()
--

CREATE OR REPLACE VIEW public.line AS WITH
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
  -- <change>
  point_with_stop.stopped_at - point_with_stop.started_at AS duration_ms,
  -- </change>
  point_with_stop.label_id_list,
  point_with_stop.created_at,
  point_with_stop.updated_at
FROM point_with_stop
CROSS JOIN now_ms;
