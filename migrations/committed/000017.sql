--! Previous: sha1:5740a59b91ec87912a045070e6205741e5807371
--! Hash: sha1:e83c97a03abecc1ca33e1645abcaac292a64f74b

--
-- add table to status to track what context was used.
--

-- idempotent reset
ALTER TABLE public.status
  DROP COLUMN IF EXISTS message_log;

-- add new column
ALTER TABLE public.status
  ADD COLUMN message_log jsonb;
