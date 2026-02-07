--! Previous: sha1:15720d4b65930b6cde91aac7b968cfcd19cae7d7
--! Hash: sha1:490057170d781492dd55c62979dafe789f17c36c

--
-- drop the user.time_zone column
--

ALTER TABLE public.user
  DROP COLUMN IF EXISTS time_zone;
