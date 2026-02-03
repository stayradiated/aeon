--! Previous: sha1:034d015707f802649656cb5ab24ba6de59d69d21
--! Hash: sha1:53d26937c73bf7aa75ddd5a2461681c0b49d0d07

--
-- following on from previous migration…
-- let's drop the old label.parent_id column
-- and create a new view for label_with_parent_list
--

-- idempotent reset
DROP VIEW IF EXISTS public.label_with_parent_list;

-- drop the old label.parent_id column
ALTER TABLE public.label
  DROP COLUMN IF EXISTS parent_id;

CREATE VIEW public.label_with_parent_list AS
 SELECT
    label.id,
    label.user_id,
    label.stream_id,
    label.name,
    label.icon,
    label.color,
    label.created_at,
    label.updated_at,
    coalesce(
      array_agg(lp.parent_label_id order by lp.parent_label_id asc)
        filter (where (lp.parent_label_id is not null)),
      array[]::text[]
    ) as parent_label_id_list
  from (
    public.label
    left join public.label_parent lp on ((label.id = lp.label_id))
  )
  group by label.id;
