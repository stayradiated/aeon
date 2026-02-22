--! Previous: sha1:95d750a81be5a4000aed2232fc3f20117c5331f2
--! Hash: sha1:5e855f3c73526adb55273d338d708ad1cf11304d

--
-- track status for each user
--

-- idempotent reset
DROP TABLE IF EXISTS status;

CREATE TABLE IF NOT EXISTS status (
  user_id text NOT NULL,

  enabled_at bigint,

  prompt text NOT NULL,
  stream_id_list text[] NOT NULL,

  hash text NOT NULL,
  status text NOT NULL,
  emoji text NOT NULL,
  expires_at bigint,

  created_at bigint NOT NULL,
  updated_at bigint NOT NULL
);

ALTER TABLE status
  ADD CONSTRAINT "status:primaryKey(user_id)"
    PRIMARY KEY (user_id),
  ADD CONSTRAINT "status:foreignKey(user_id,user)"
    FOREIGN KEY (user_id)
    REFERENCES public."user"(id)
    ON UPDATE RESTRICT
    ON DELETE RESTRICT;
