--! Previous: sha1:0f38d16022fbda9fc9c07a450c4d134e579f359b
--! Hash: sha1:efea0d5cd80103ae19a7643636bc186d5458881f

--
-- Add api_token_hash column to user table
--

ALTER TABLE public.user
  DROP COLUMN IF EXISTS api_token_hash;

ALTER TABLE public.user
  ADD COLUMN api_token_hash BYTEA; /* nullable */
