--! Previous: sha1:af4fa9b2b3a9c3380f8f3d5480ecfdde3bca993f
--! Hash: sha1:54c93b8fa94f452d73ade53ac43855adbc0f8cf3

-- idempotent reset
ALTER TABLE ONLY public.label
  DROP CONSTRAINT IF EXISTS "label:foreignKey(parent_id)",
  DROP CONSTRAINT IF EXISTS "label:foreignKey(stream_id)",
  DROP CONSTRAINT IF EXISTS "label:foreignKey(user_id)";
ALTER TABLE ONLY public.point
  DROP CONSTRAINT IF EXISTS "point:foreignKey(stream_id)",
  DROP CONSTRAINT IF EXISTS "point:foreignKey(user_id)";
ALTER TABLE ONLY public.replicache_client
  DROP CONSTRAINT IF EXISTS "replicache_client:foreignKey(replicache_client_group_id)";
ALTER TABLE ONLY public.replicache_client_group
  DROP CONSTRAINT IF EXISTS "replicache_client_group:foreignKey(user_id)";
ALTER TABLE ONLY public.stream
  DROP CONSTRAINT IF EXISTS "stream:foreignKey(parent_id)",
  DROP CONSTRAINT IF EXISTS "stream:foreignKey(user_id)";
ALTER TABLE ONLY public.user_session
  DROP CONSTRAINT IF EXISTS "user_session:foreignKey(user_id,user)";

-- update all existing foreign keys to be on update/delete restrict
ALTER TABLE ONLY public.label
  ADD CONSTRAINT "label:foreignKey(parent_id)"
    FOREIGN KEY (parent_id, user_id)
    REFERENCES public.label(id, user_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  ADD CONSTRAINT "label:foreignKey(stream_id)"
    FOREIGN KEY (stream_id, user_id)
    REFERENCES public.stream(id, user_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  ADD CONSTRAINT "label:foreignKey(user_id)"
    FOREIGN KEY (user_id)
    REFERENCES public."user"(id)
    ON UPDATE RESTRICT ON DELETE RESTRICT;

ALTER TABLE ONLY public.point
  ADD CONSTRAINT "point:foreignKey(stream_id)"
    FOREIGN KEY (stream_id, user_id)
    REFERENCES public.stream(id, user_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  ADD CONSTRAINT "point:foreignKey(user_id)"
    FOREIGN KEY (user_id)
    REFERENCES public."user"(id)
    ON UPDATE RESTRICT ON DELETE RESTRICT;

ALTER TABLE ONLY public.replicache_client
  ADD CONSTRAINT "replicache_client:foreignKey(replicache_client_group_id)"
    FOREIGN KEY (replicache_client_group_id)
    REFERENCES public.replicache_client_group(id)
    ON UPDATE RESTRICT ON DELETE RESTRICT;

ALTER TABLE ONLY public.replicache_client_group
  ADD CONSTRAINT "replicache_client_group:foreignKey(user_id)"
    FOREIGN KEY (user_id) 
    REFERENCES public."user"(id)
    ON UPDATE RESTRICT ON DELETE RESTRICT;

ALTER TABLE ONLY public.stream
  ADD CONSTRAINT "stream:foreignKey(parent_id)"
    FOREIGN KEY (parent_id, user_id)
    REFERENCES public.stream(id, user_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  ADD CONSTRAINT "stream:foreignKey(user_id)"
    FOREIGN KEY (user_id)
    REFERENCES public."user"(id)
    ON UPDATE RESTRICT ON DELETE RESTRICT;

ALTER TABLE ONLY public.user_session
  ADD CONSTRAINT "user_session:foreignKey(user_id,user)"
    FOREIGN KEY (user_id)
    REFERENCES public."user"(id)
    ON UPDATE RESTRICT ON DELETE RESTRICT;
