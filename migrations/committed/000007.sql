--! Previous: sha1:9231255bee46b498e2569fca4349b0f3534a530f
--! Hash: sha1:271334242019cc93e0d33944fb4e7da375fb9f81

--
-- create a new table for tracking async tasks
--

-- idempotent reset
DROP TABLE IF EXISTS meta_task;

CREATE TABLE meta_task (
  id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  status TEXT NOT NULL,
  last_started_at BIGINT NOT NULL,
  last_finished_at BIGINT,
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL
);

ALTER TABLE meta_task
  ADD CONSTRAINT "meta_task:primaryKey(id)"
    PRIMARY KEY (id),
  ADD CONSTRAINT "meta_task:unique(user_id,name)"
    UNIQUE (user_id, name),
  ADD CONSTRAINT "meta_task:foreignKey(user_id,user)"
    FOREIGN KEY (user_id)
    REFERENCES public.user (id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  ADD CONSTRAINT "meta_task:check(last_finished_at)"
    CHECK (last_finished_at IS NULL OR last_finished_at > last_started_at);
