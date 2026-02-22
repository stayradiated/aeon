--
-- PostgreSQL database dump
--

\restrict xxx


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: email_verification; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.email_verification (
    id text NOT NULL,
    email text NOT NULL,
    token_hash text NOT NULL,
    expires_at bigint NOT NULL,
    retry_count integer NOT NULL,
    created_at bigint NOT NULL,
    updated_at bigint NOT NULL,
    CONSTRAINT "email_verification:check(email)" CHECK ((email = lower(email))),
    CONSTRAINT "email_verification:check(retry_count)" CHECK ((retry_count >= 0))
);


--
-- Name: label; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.label (
    id text NOT NULL,
    user_id text NOT NULL,
    stream_id text NOT NULL,
    name text NOT NULL,
    icon text,
    color text,
    created_at bigint NOT NULL,
    updated_at bigint NOT NULL
);


--
-- Name: label_parent; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.label_parent (
    label_id text NOT NULL,
    parent_label_id text NOT NULL,
    user_id text NOT NULL,
    created_at bigint NOT NULL,
    updated_at bigint NOT NULL
);


--
-- Name: label_with_parent_list; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.label_with_parent_list AS
SELECT
    NULL::text AS id,
    NULL::text AS user_id,
    NULL::text AS stream_id,
    NULL::text AS name,
    NULL::text AS icon,
    NULL::text AS color,
    NULL::bigint AS created_at,
    NULL::bigint AS updated_at,
    NULL::text[] AS parent_label_id_list;


--
-- Name: point_with_label_list; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.point_with_label_list AS
SELECT
    NULL::text AS id,
    NULL::text AS user_id,
    NULL::text AS stream_id,
    NULL::text AS description,
    NULL::bigint AS started_at,
    NULL::bigint AS created_at,
    NULL::bigint AS updated_at,
    NULL::text[] AS label_id_list;


--
-- Name: line; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.line AS
 WITH point_with_stop AS (
         SELECT point.id,
            point.user_id,
            point.stream_id,
            point.description,
            point.started_at,
            lead(point.started_at) OVER (PARTITION BY point.stream_id ORDER BY point.started_at) AS stopped_at,
            point.label_id_list,
            point.created_at,
            point.updated_at
           FROM public.point_with_label_list point
        ), now_ms AS (
         SELECT ((EXTRACT(epoch FROM now()) * (1000)::numeric))::bigint AS now_ms
        )
 SELECT point_with_stop.id AS point_id,
    point_with_stop.user_id,
    point_with_stop.stream_id,
    point_with_stop.description,
    point_with_stop.started_at,
    point_with_stop.stopped_at,
    (COALESCE(point_with_stop.stopped_at, now_ms.now_ms) - point_with_stop.started_at) AS duration_ms,
    point_with_stop.label_id_list,
    point_with_stop.created_at,
    point_with_stop.updated_at
   FROM (point_with_stop
     CROSS JOIN now_ms);


--
-- Name: meta_task; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.meta_task (
    id text NOT NULL,
    user_id text NOT NULL,
    name text NOT NULL,
    status text NOT NULL,
    last_started_at bigint NOT NULL,
    last_finished_at bigint,
    created_at bigint NOT NULL,
    updated_at bigint NOT NULL,
    CONSTRAINT "meta_task:check(last_finished_at)" CHECK (((last_finished_at IS NULL) OR (last_finished_at > last_started_at)))
);


--
-- Name: point; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.point (
    id text NOT NULL,
    user_id text NOT NULL,
    stream_id text NOT NULL,
    description text NOT NULL,
    started_at bigint NOT NULL,
    created_at bigint NOT NULL,
    updated_at bigint NOT NULL
);


--
-- Name: point_label; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.point_label (
    point_id text NOT NULL,
    label_id text NOT NULL,
    user_id text NOT NULL,
    created_at bigint NOT NULL,
    updated_at bigint NOT NULL,
    stream_id text NOT NULL
);


--
-- Name: replicache_client; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.replicache_client (
    id text NOT NULL,
    replicache_client_group_id text NOT NULL,
    last_mutation_id integer NOT NULL,
    created_at bigint NOT NULL,
    updated_at bigint NOT NULL
);


--
-- Name: replicache_client_group; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.replicache_client_group (
    id text NOT NULL,
    user_id text NOT NULL,
    cvr_version integer NOT NULL,
    created_at bigint NOT NULL,
    updated_at bigint NOT NULL
);


--
-- Name: replicache_client_view; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.replicache_client_view (
    id text NOT NULL,
    record jsonb NOT NULL,
    created_at bigint NOT NULL,
    version text NOT NULL
);


--
-- Name: status; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.status (
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


--
-- Name: stream; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.stream (
    id text NOT NULL,
    user_id text NOT NULL,
    name text NOT NULL,
    parent_id text,
    sort_order integer NOT NULL,
    created_at bigint NOT NULL,
    updated_at bigint NOT NULL
);


--
-- Name: user; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."user" (
    id text NOT NULL,
    strava_client_id text,
    strava_client_secret text,
    strava_session jsonb,
    created_at bigint NOT NULL,
    updated_at bigint NOT NULL,
    email text NOT NULL,
    slack_token text,
    CONSTRAINT "user:check(email)" CHECK ((email = lower(email)))
);


--
-- Name: user_session; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_session (
    id text NOT NULL,
    user_id text NOT NULL,
    expires_at bigint NOT NULL,
    created_at bigint NOT NULL,
    updated_at bigint NOT NULL
);


--
-- Name: email_verification email_verification:primaryKey(id); Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_verification
    ADD CONSTRAINT "email_verification:primaryKey(id)" PRIMARY KEY (id);


--
-- Name: label label:primaryKey(id); Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.label
    ADD CONSTRAINT "label:primaryKey(id)" PRIMARY KEY (id);


--
-- Name: label label:unique(id,stream_id); Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.label
    ADD CONSTRAINT "label:unique(id,stream_id)" UNIQUE (id, stream_id);


--
-- Name: label label:unique(id,user_id); Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.label
    ADD CONSTRAINT "label:unique(id,user_id)" UNIQUE (id, user_id);


--
-- Name: label_parent label_parent:primaryKey(label_id,parent_label_id); Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.label_parent
    ADD CONSTRAINT "label_parent:primaryKey(label_id,parent_label_id)" PRIMARY KEY (label_id, parent_label_id);


--
-- Name: meta_task meta_task:primaryKey(id); Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.meta_task
    ADD CONSTRAINT "meta_task:primaryKey(id)" PRIMARY KEY (id);


--
-- Name: meta_task meta_task:unique(user_id,name); Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.meta_task
    ADD CONSTRAINT "meta_task:unique(user_id,name)" UNIQUE (user_id, name);


--
-- Name: point point:primaryKey(id); Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.point
    ADD CONSTRAINT "point:primaryKey(id)" PRIMARY KEY (id);


--
-- Name: point point:unique(id,stream_id); Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.point
    ADD CONSTRAINT "point:unique(id,stream_id)" UNIQUE (id, stream_id);


--
-- Name: point point:unique(stream_id,started_at); Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.point
    ADD CONSTRAINT "point:unique(stream_id,started_at)" UNIQUE (stream_id, started_at);


--
-- Name: point_label point_label:primaryKey(point_id,label_id); Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.point_label
    ADD CONSTRAINT "point_label:primaryKey(point_id,label_id)" PRIMARY KEY (point_id, label_id);


--
-- Name: point_label point_label:unique(point_id,label_id,user_id); Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.point_label
    ADD CONSTRAINT "point_label:unique(point_id,label_id,user_id)" UNIQUE (point_id, label_id, user_id);


--
-- Name: replicache_client replicache_client:primaryKey(id); Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.replicache_client
    ADD CONSTRAINT "replicache_client:primaryKey(id)" PRIMARY KEY (id);


--
-- Name: replicache_client_group replicache_client_group:primaryKey(id); Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.replicache_client_group
    ADD CONSTRAINT "replicache_client_group:primaryKey(id)" PRIMARY KEY (id);


--
-- Name: replicache_client_view replicache_client_view:primaryKey(id); Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.replicache_client_view
    ADD CONSTRAINT "replicache_client_view:primaryKey(id)" PRIMARY KEY (id);


--
-- Name: status status:primaryKey(user_id); Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.status
    ADD CONSTRAINT "status:primaryKey(user_id)" PRIMARY KEY (user_id);


--
-- Name: stream stream:primaryKey(id); Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stream
    ADD CONSTRAINT "stream:primaryKey(id)" PRIMARY KEY (id);


--
-- Name: stream stream:unique(id,user_id); Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stream
    ADD CONSTRAINT "stream:unique(id,user_id)" UNIQUE (id, user_id);


--
-- Name: user user:primaryKey(id); Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."user"
    ADD CONSTRAINT "user:primaryKey(id)" PRIMARY KEY (id);


--
-- Name: user user:unique(email); Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."user"
    ADD CONSTRAINT "user:unique(email)" UNIQUE (email);


--
-- Name: user_session user_session:primaryKey(id); Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_session
    ADD CONSTRAINT "user_session:primaryKey(id)" PRIMARY KEY (id);


--
-- Name: label_with_parent_list _RETURN; Type: RULE; Schema: public; Owner: -
--

CREATE OR REPLACE VIEW public.label_with_parent_list AS
 SELECT label.id,
    label.user_id,
    label.stream_id,
    label.name,
    label.icon,
    label.color,
    label.created_at,
    label.updated_at,
    COALESCE(array_agg(lp.parent_label_id ORDER BY lp.parent_label_id) FILTER (WHERE (lp.parent_label_id IS NOT NULL)), ARRAY[]::text[]) AS parent_label_id_list
   FROM (public.label
     LEFT JOIN public.label_parent lp ON ((label.id = lp.label_id)))
  GROUP BY label.id;


--
-- Name: point_with_label_list _RETURN; Type: RULE; Schema: public; Owner: -
--

CREATE OR REPLACE VIEW public.point_with_label_list AS
 SELECT p.id,
    p.user_id,
    p.stream_id,
    p.description,
    p.started_at,
    p.created_at,
    p.updated_at,
    COALESCE(array_agg(pl.label_id ORDER BY pl.label_id) FILTER (WHERE (pl.label_id IS NOT NULL)), ARRAY[]::text[]) AS label_id_list
   FROM (public.point p
     LEFT JOIN public.point_label pl ON ((p.id = pl.point_id)))
  GROUP BY p.id;


--
-- Name: label label:foreignKey(stream_id); Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.label
    ADD CONSTRAINT "label:foreignKey(stream_id)" FOREIGN KEY (stream_id, user_id) REFERENCES public.stream(id, user_id) ON UPDATE RESTRICT ON DELETE RESTRICT;


--
-- Name: label label:foreignKey(user_id); Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.label
    ADD CONSTRAINT "label:foreignKey(user_id)" FOREIGN KEY (user_id) REFERENCES public."user"(id) ON UPDATE RESTRICT ON DELETE RESTRICT;


--
-- Name: label_parent label_parent:foreignKey(label_id); Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.label_parent
    ADD CONSTRAINT "label_parent:foreignKey(label_id)" FOREIGN KEY (label_id, user_id) REFERENCES public.label(id, user_id) ON UPDATE RESTRICT ON DELETE RESTRICT;


--
-- Name: label_parent label_parent:foreignKey(parent_label_id); Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.label_parent
    ADD CONSTRAINT "label_parent:foreignKey(parent_label_id)" FOREIGN KEY (parent_label_id, user_id) REFERENCES public.label(id, user_id) ON UPDATE RESTRICT ON DELETE RESTRICT;


--
-- Name: label_parent label_parent:foreignKey(user_id); Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.label_parent
    ADD CONSTRAINT "label_parent:foreignKey(user_id)" FOREIGN KEY (user_id) REFERENCES public."user"(id) ON UPDATE RESTRICT ON DELETE RESTRICT;


--
-- Name: meta_task meta_task:foreignKey(user_id,user); Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.meta_task
    ADD CONSTRAINT "meta_task:foreignKey(user_id,user)" FOREIGN KEY (user_id) REFERENCES public."user"(id) ON UPDATE RESTRICT ON DELETE RESTRICT;


--
-- Name: point point:foreignKey(stream_id); Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.point
    ADD CONSTRAINT "point:foreignKey(stream_id)" FOREIGN KEY (stream_id, user_id) REFERENCES public.stream(id, user_id) ON UPDATE RESTRICT ON DELETE RESTRICT;


--
-- Name: point point:foreignKey(user_id); Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.point
    ADD CONSTRAINT "point:foreignKey(user_id)" FOREIGN KEY (user_id) REFERENCES public."user"(id) ON UPDATE RESTRICT ON DELETE RESTRICT;


--
-- Name: point_label point_label:foreignKey(label_id); Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.point_label
    ADD CONSTRAINT "point_label:foreignKey(label_id)" FOREIGN KEY (label_id, stream_id) REFERENCES public.label(id, stream_id) ON UPDATE RESTRICT ON DELETE RESTRICT;


--
-- Name: point_label point_label:foreignKey(point_id); Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.point_label
    ADD CONSTRAINT "point_label:foreignKey(point_id)" FOREIGN KEY (point_id, stream_id) REFERENCES public.point(id, stream_id) ON UPDATE RESTRICT ON DELETE RESTRICT;


--
-- Name: point_label point_label:foreignKey(stream_id); Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.point_label
    ADD CONSTRAINT "point_label:foreignKey(stream_id)" FOREIGN KEY (stream_id) REFERENCES public.stream(id) ON UPDATE RESTRICT ON DELETE RESTRICT;


--
-- Name: replicache_client replicache_client:foreignKey(replicache_client_group_id); Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.replicache_client
    ADD CONSTRAINT "replicache_client:foreignKey(replicache_client_group_id)" FOREIGN KEY (replicache_client_group_id) REFERENCES public.replicache_client_group(id) ON UPDATE RESTRICT ON DELETE RESTRICT;


--
-- Name: replicache_client_group replicache_client_group:foreignKey(user_id); Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.replicache_client_group
    ADD CONSTRAINT "replicache_client_group:foreignKey(user_id)" FOREIGN KEY (user_id) REFERENCES public."user"(id) ON UPDATE RESTRICT ON DELETE RESTRICT;


--
-- Name: status status:foreignKey(user_id,user); Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.status
    ADD CONSTRAINT "status:foreignKey(user_id,user)" FOREIGN KEY (user_id) REFERENCES public."user"(id) ON UPDATE RESTRICT ON DELETE RESTRICT;


--
-- Name: stream stream:foreignKey(parent_id); Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stream
    ADD CONSTRAINT "stream:foreignKey(parent_id)" FOREIGN KEY (parent_id, user_id) REFERENCES public.stream(id, user_id) ON UPDATE RESTRICT ON DELETE RESTRICT;


--
-- Name: stream stream:foreignKey(user_id); Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stream
    ADD CONSTRAINT "stream:foreignKey(user_id)" FOREIGN KEY (user_id) REFERENCES public."user"(id) ON UPDATE RESTRICT ON DELETE RESTRICT;


--
-- Name: user_session user_session:foreignKey(user_id,user); Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_session
    ADD CONSTRAINT "user_session:foreignKey(user_id,user)" FOREIGN KEY (user_id) REFERENCES public."user"(id) ON UPDATE RESTRICT ON DELETE RESTRICT;


--
-- PostgreSQL database dump complete
--

\unrestrict xxx

