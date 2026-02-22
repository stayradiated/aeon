--! Previous: sha1:5e855f3c73526adb55273d338d708ad1cf11304d
--! Hash: sha1:0f38d16022fbda9fc9c07a450c4d134e579f359b

--
-- add `slack_token` to the `user` table
--

-- idempotent reset
ALTER TABLE public."user"
  DROP COLUMN IF EXISTS slack_token;

ALTER TABLE public."user"
  ADD COLUMN IF NOT EXISTS slack_token text;
