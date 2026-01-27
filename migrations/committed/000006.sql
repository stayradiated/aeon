--! Previous: sha1:54c93b8fa94f452d73ade53ac43855adbc0f8cf3
--! Hash: sha1:9231255bee46b498e2569fca4349b0f3534a530f

--
-- track cvr schema version
--

-- idempotent reset
ALTER TABLE replicache_client_view
  DROP COLUMN IF EXISTS version;

-- remove all exisitng cvr records
DELETE FROM replicache_client_view;

ALTER TABLE replicache_client_view
  ADD COLUMN version TEXT NOT NULL;
