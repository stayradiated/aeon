--! Previous: sha1:271334242019cc93e0d33944fb4e7da375fb9f81
--! Hash: sha1:034d015707f802649656cb5ab24ba6de59d69d21

--
-- create table to track label-label relationships
-- previously we just had label.parent_id
-- but this is not enough to represent the full tree
--

-- idempotent reset
DROP TABLE IF EXISTS label_parent;

CREATE TABLE label_parent (
    label_id text NOT NULL,
    parent_label_id text NOT NULL,
    user_id text NOT NULL,
    created_at bigint NOT NULL,
    updated_at bigint NOT NULL
);

ALTER TABLE label_parent
  ADD CONSTRAINT "label_parent:primaryKey(label_id,parent_label_id)"
    PRIMARY KEY (label_id, parent_label_id),
  ADD CONSTRAINT "label_parent:foreignKey(user_id)"
    FOREIGN KEY (user_id)
    REFERENCES public.user(id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  ADD CONSTRAINT "label_parent:foreignKey(label_id)"
    FOREIGN KEY (label_id, user_id)
    REFERENCES label(id, user_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  ADD CONSTRAINT "label_parent:foreignKey(parent_label_id)"
    FOREIGN KEY (parent_label_id, user_id)
    REFERENCES label(id, user_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT;

--
-- migrate data from label.parent_id to label_parent
--

INSERT INTO label_parent (
  label_id,
  parent_label_id,
  user_id,
  created_at,
  updated_at
)
  SELECT 
    id,
    parent_id,
    user_id,
    created_at,
    updated_at
  FROM label
  WHERE parent_id IS NOT NULL;
