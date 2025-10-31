--
-- PostgreSQL database dump
--

-- Dumped from database version 16.8
-- Dumped by pg_dump version 16.9

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: exumacion_metodosolicitud_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.exumacion_metodosolicitud_enum AS ENUM (
    'escrito',
    'verbal'
);


ALTER TYPE public.exumacion_metodosolicitud_enum OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Cementerio; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Cementerio" (
    id_cementerio uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    nombre character varying(100) NOT NULL,
    direccion character varying(100) NOT NULL,
    telefono character varying(100) NOT NULL,
    responsable character varying(100) NOT NULL,
    estado character varying(100) NOT NULL,
    fecha_creacion character varying(100) NOT NULL,
    fecha_modificacion character varying(100)
);


ALTER TABLE public."Cementerio" OWNER TO postgres;

--
-- Name: User; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."User" (
    id_user uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    cedula character varying(100) NOT NULL,
    email character varying(100) NOT NULL,
    nombre character varying(100) NOT NULL,
    apellido character varying(100) NOT NULL,
    password character varying(100) NOT NULL,
    rol character varying(100) NOT NULL,
    fecha_creacion character varying(100) NOT NULL,
    fecha_modificacion character varying(100),
    estado character varying(100) NOT NULL
);


ALTER TABLE public."User" OWNER TO postgres;

--
-- Name: exumacion; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.exumacion (
    id_exhumacion uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    codigo character varying NOT NULL,
    "metodoSolicitud" public.exumacion_metodosolicitud_enum NOT NULL,
    solicitante character varying NOT NULL,
    parentesco character varying NOT NULL,
    fallecido character varying NOT NULL,
    "nuevoLugar" character varying,
    "fechaExhumacion" date NOT NULL,
    "horaExhumacion" time without time zone NOT NULL,
    aprobado boolean DEFAULT false NOT NULL,
    "aprobadoPor" character varying,
    "fechaSolicitud" timestamp without time zone DEFAULT now() NOT NULL,
    id_inhumacion uuid,
    id_nicho uuid
);


ALTER TABLE public.exumacion OWNER TO postgres;

--
-- Name: huecos_nichos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.huecos_nichos (
    id_detalle_hueco uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    num_hueco integer NOT NULL,
    estado character varying(20) NOT NULL,
    fecha_creacion date DEFAULT now() NOT NULL,
    fecha_actualizacion date DEFAULT now(),
    id_nicho uuid,
    id_persona uuid
);


ALTER TABLE public.huecos_nichos OWNER TO postgres;

--
-- Name: inhumaciones; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.inhumaciones (
    id_inhumacion uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    fecha_inhumacion date NOT NULL,
    hora_inhumacion time without time zone NOT NULL,
    solicitante character varying NOT NULL,
    responsable_inhumacion character varying NOT NULL,
    observaciones text,
    estado character varying NOT NULL,
    codigo_inhumacion character varying NOT NULL,
    fecha_creacion date NOT NULL,
    fecha_actualizacion date,
    id_nicho uuid,
    id_fallecido uuid,
    id_requisitos_inhumacion uuid
);


ALTER TABLE public.inhumaciones OWNER TO postgres;

--
-- Name: nichos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.nichos (
    id_nicho uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    sector character varying(50) NOT NULL,
    fila character varying(10) NOT NULL,
    numero character varying(10) NOT NULL,
    tipo character varying(20) NOT NULL,
    estado character varying(20) NOT NULL,
    num_huecos integer NOT NULL,
    fecha_construccion character varying NOT NULL,
    observaciones text,
    fecha_creacion character varying DEFAULT now() NOT NULL,
    fecha_actualizacion character varying DEFAULT now(),
    id_cementerio uuid
);


ALTER TABLE public.nichos OWNER TO postgres;

--
-- Name: personas; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.personas (
    id_persona uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    cedula character varying(100) NOT NULL,
    nombres character varying(100) NOT NULL,
    apellidos character varying(100) NOT NULL,
    fecha_nacimiento date,
    fecha_defuncion date,
    fecha_inhumacion date,
    lugar_defuncion character varying(100),
    causa_defuncion character varying(100),
    direccion character varying(100),
    telefono character varying(100),
    correo character varying(100),
    nacionalidad character varying(100),
    fallecido boolean DEFAULT false NOT NULL,
    fecha_creacion timestamp without time zone NOT NULL,
    fecha_actualizacion timestamp without time zone
);


ALTER TABLE public.personas OWNER TO postgres;

--
-- Name: propietarios_nichos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.propietarios_nichos (
    id_propietario_nicho uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    fecha_adquisicion date NOT NULL,
    tipo_documento character varying(100) NOT NULL,
    numero_documento character varying(100) NOT NULL,
    activo boolean DEFAULT true NOT NULL,
    razon character varying(255) NOT NULL,
    fecha_creacion timestamp without time zone NOT NULL,
    fecha_actualizacion timestamp without time zone,
    tipo character varying(50) DEFAULT 'Dueño'::character varying NOT NULL,
    id_persona uuid,
    id_nicho uuid
);


ALTER TABLE public.propietarios_nichos OWNER TO postgres;

--
-- Name: requisitos_inhumacion; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.requisitos_inhumacion (
    "id_requsitoInhumacion" uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "pantoneroACargo" character varying NOT NULL,
    "metodoSolicitud" character varying DEFAULT 'Escrita'::character varying NOT NULL,
    "observacionSolicitante" character varying,
    "copiaCertificadoDefuncion" boolean DEFAULT false NOT NULL,
    "observacionCertificadoDefuncion" character varying,
    "informeEstadisticoINEC" boolean DEFAULT false NOT NULL,
    "observacionInformeEstadisticoINEC" character varying,
    "copiaCedula" boolean DEFAULT false NOT NULL,
    "observacionCopiaCedula" character varying,
    "pagoTasaInhumacion" boolean DEFAULT false NOT NULL,
    "observacionPagoTasaInhumacion" character varying,
    "copiaTituloPropiedadNicho" boolean DEFAULT false NOT NULL,
    "observacionCopiaTituloPropiedadNicho" character varying,
    "autorizacionDeMovilizacionDelCadaver" boolean DEFAULT false NOT NULL,
    "observacionAutorizacionMovilizacion" character varying,
    "OficioDeSolicitud" boolean DEFAULT false NOT NULL,
    "observacionOficioSolicitud" character varying,
    "fechaInhumacion" timestamp without time zone NOT NULL,
    "horaInhumacion" character varying NOT NULL,
    "nombreAdministradorNicho" character varying(100) NOT NULL,
    id_cementerio uuid,
    id_solicitante uuid,
    id_hueco_nicho uuid,
    id_fallecido uuid
);


ALTER TABLE public.requisitos_inhumacion OWNER TO postgres;

--
-- Data for Name: Cementerio; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Cementerio" (id_cementerio, nombre, direccion, telefono, responsable, estado, fecha_creacion, fecha_modificacion) FROM stdin;
c2e23b1c-7743-4d51-8f34-cbb08d49fe7e	Cementerio Antiguo	RFM4+MVX, Píllaro	0984198999	Maria Soledad	Activo	2025-06-27T15:56:27.572Z	\N
0017ccb3-4124-4aa6-abc4-7739ad126e5d	Cementerio Nuevo	Ciudad nueva	0984198999	Jenny Constante	Activo	2025-06-27T17:01:52.369Z	\N
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."User" (id_user, cedula, email, nombre, apellido, password, rol, fecha_creacion, fecha_modificacion, estado) FROM stdin;
11657f06-85d6-42bb-84f6-7e3ffe06965d	1850046317	pablo@gmail.com	Pablo	Villacrés	$2b$10$70o69EzghYif3TbxKNa7xeVCiQPmPATEneiijJCVf9LNDIMF8biPK	admin	2025-06-27T15:54:04.503Z	\N	Activo
\.


--
-- Data for Name: exumacion; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.exumacion (id_exhumacion, codigo, "metodoSolicitud", solicitante, parentesco, fallecido, "nuevoLugar", "fechaExhumacion", "horaExhumacion", aprobado, "aprobadoPor", "fechaSolicitud", id_inhumacion, id_nicho) FROM stdin;
\.


--
-- Data for Name: huecos_nichos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.huecos_nichos (id_detalle_hueco, num_hueco, estado, fecha_creacion, fecha_actualizacion, id_nicho, id_persona) FROM stdin;
9d7f1d12-efbd-46d9-9d03-d7041d853f6d	1	Ocupado	2025-06-27	2025-06-27	164f39b9-6555-4537-b3ec-1dca3bcac5de	f299dd3e-e634-4136-8a90-646b078d26d0
2bc80110-1417-4885-906b-949e25e1ec5f	1	Ocupado	2025-06-27	2025-06-27	55e93607-0df4-40f2-b5d1-1b73537c5e4b	7fc833fb-056e-410f-aa87-c8a17b79a41d
7fedd431-3128-4bb1-9bdd-4d0a54d6019c	2	Disponible	2025-06-27	2025-06-27	517992b2-6956-4f1d-86da-397d6be7974d	\N
3d4c5e92-f88b-4cbe-8f96-0521718ba98a	3	Disponible	2025-06-27	2025-06-27	517992b2-6956-4f1d-86da-397d6be7974d	\N
4cd79cfb-fc81-4e04-90d1-05a14298b3a2	4	Disponible	2025-06-27	2025-06-27	517992b2-6956-4f1d-86da-397d6be7974d	\N
bd59b9d3-3d77-4b55-8817-7766ec43b532	5	Disponible	2025-06-27	2025-06-27	517992b2-6956-4f1d-86da-397d6be7974d	\N
93d4e44d-4500-4540-b241-cd3c85c22bf2	6	Disponible	2025-06-27	2025-06-27	517992b2-6956-4f1d-86da-397d6be7974d	\N
6b3bc9f7-700e-4a55-9c7d-a1a7a72ad490	7	Disponible	2025-06-27	2025-06-27	517992b2-6956-4f1d-86da-397d6be7974d	\N
895d0168-0c7b-4f02-863e-354742fc0f38	8	Disponible	2025-06-27	2025-06-27	517992b2-6956-4f1d-86da-397d6be7974d	\N
59c6e907-0a6f-4bce-b87f-40aa058fdebc	1	Ocupado	2025-06-27	2025-06-27	517992b2-6956-4f1d-86da-397d6be7974d	6d3e0635-8b51-44d2-931d-38d682d1444f
bf69376e-6e65-4346-8009-7a7e6daa6453	1	Disponible	2025-09-01	2025-09-02	9b6c3094-aadd-4aa2-b56f-c64faa6210f0	\N
e90e905f-739b-478d-bf2d-cd1e4279041b	2	Disponible	2025-09-01	2025-09-02	9b6c3094-aadd-4aa2-b56f-c64faa6210f0	\N
e08c76e6-7041-4651-b891-f3ee0dc7d63d	4	Disponible	2025-09-01	2025-09-02	9b6c3094-aadd-4aa2-b56f-c64faa6210f0	\N
d2612fef-0d6b-499e-9983-8502b0dc1774	5	Disponible	2025-09-01	2025-09-02	9b6c3094-aadd-4aa2-b56f-c64faa6210f0	\N
727b0ed5-0fe9-432b-a7a8-cd243b98acf3	6	Disponible	2025-09-01	2025-09-02	9b6c3094-aadd-4aa2-b56f-c64faa6210f0	\N
0c122f36-25e9-4039-81ed-2a449c51c2c6	7	Disponible	2025-09-01	2025-09-02	9b6c3094-aadd-4aa2-b56f-c64faa6210f0	\N
5acd53d0-acaa-493c-8658-e1ec7e0e2f03	8	Disponible	2025-09-01	2025-09-02	9b6c3094-aadd-4aa2-b56f-c64faa6210f0	\N
48de7b9c-8f4e-4d34-bde8-72555f7e1271	9	Disponible	2025-09-01	2025-09-02	9b6c3094-aadd-4aa2-b56f-c64faa6210f0	\N
fd2807d3-fae7-4ed3-b341-6d24350d1f00	3	Ocupado	2025-09-01	2025-09-01	9b6c3094-aadd-4aa2-b56f-c64faa6210f0	1901b8a6-49a9-4ef4-b3ee-926d56165482
\.


--
-- Data for Name: inhumaciones; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.inhumaciones (id_inhumacion, fecha_inhumacion, hora_inhumacion, solicitante, responsable_inhumacion, observaciones, estado, codigo_inhumacion, fecha_creacion, fecha_actualizacion, id_nicho, id_fallecido, id_requisitos_inhumacion) FROM stdin;
4f5ac4eb-88ae-44d0-a35c-afdc1493f8c8	2020-12-05	16:30:00	Edgar Agustin Espin Haro	Alex Vargas		Realizada	001-2025	2025-06-27	\N	164f39b9-6555-4537-b3ec-1dca3bcac5de	f299dd3e-e634-4136-8a90-646b078d26d0	bcdfb0c0-5537-4148-981c-e2828c8032f6
8ca9d689-b806-4c53-a6ed-fe3d98e96b46	2025-06-18	11:40:00	Catalina Lorena Toapanta Andrango	Alex Vargas		Realizada	001-2025	2025-06-27	\N	55e93607-0df4-40f2-b5d1-1b73537c5e4b	7fc833fb-056e-410f-aa87-c8a17b79a41d	e329ac24-47ee-425b-9319-2600f7f85362
66ce0097-ec78-4fe8-8119-68d3a94dcf24	2025-06-25	14:14:00	Darwin Javier Sanipatin Chicaiza	Alex Vargas		Realizada	002-2025	2025-06-27	\N	517992b2-6956-4f1d-86da-397d6be7974d	6d3e0635-8b51-44d2-931d-38d682d1444f	d648922a-0a3d-43b0-8865-fe5b6393315b
3dc4798b-05c3-4838-94de-5fbc77a86ddd	2025-09-25	13:01:00	Darwin Javier Sanipatin Chicaiza	ALex Vargas		Realizada	003-2025	2025-09-02	\N	9b6c3094-aadd-4aa2-b56f-c64faa6210f0	1901b8a6-49a9-4ef4-b3ee-926d56165482	4338d8fc-1935-4494-9b4e-bf79f133f974
\.


--
-- Data for Name: nichos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.nichos (id_nicho, sector, fila, numero, tipo, estado, num_huecos, fecha_construccion, observaciones, fecha_creacion, fecha_actualizacion, id_cementerio) FROM stdin;
517992b2-6956-4f1d-86da-397d6be7974d	A	2	1	Mausoleo	Inactivo	9	2009-08-09	\N	2025-06-27T17:09:40.597Z	2025-07-10T19:56:24.767Z	0017ccb3-4124-4aa6-abc4-7739ad126e5d
55e93607-0df4-40f2-b5d1-1b73537c5e4b	B	2	1	Fosa	Inactivo	1	2025-06-27	\N	2025-06-27T16:36:50.577Z	2025-07-10T19:56:27.121Z	c2e23b1c-7743-4d51-8f34-cbb08d49fe7e
164f39b9-6555-4537-b3ec-1dca3bcac5de	A	2	1	Nicho	Inactivo	1	2010-06-14	\N	2025-06-27T16:15:31.357Z	2025-07-10T19:56:30.778Z	c2e23b1c-7743-4d51-8f34-cbb08d49fe7e
9b6c3094-aadd-4aa2-b56f-c64faa6210f0	B	2	123	Mausoleo	Activo	9	2025-09-18	\N	2025-09-02T03:56:57.907Z	2025-09-02T03:57:20.426Z	c2e23b1c-7743-4d51-8f34-cbb08d49fe7e
\.


--
-- Data for Name: personas; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.personas (id_persona, cedula, nombres, apellidos, fecha_nacimiento, fecha_defuncion, fecha_inhumacion, lugar_defuncion, causa_defuncion, direccion, telefono, correo, nacionalidad, fallecido, fecha_creacion, fecha_actualizacion) FROM stdin;
f299dd3e-e634-4136-8a90-646b078d26d0	1804465803	Elvia de los Angeles	Haro Sarabia	1970-06-09	2020-12-04	2020-12-05	Píllaro	Asfixia mecánica por ahorcamiento	\N	\N	\N	Ecuatioriana	t	2025-06-27 11:01:34.32	\N
43e33947-97ef-4b22-98fa-18836a42d6cd	1850046317	Edgar Agustin	Espin Haro	2003-01-01	\N	\N	\N	\N	Picaihua	0984198999	pablo@gmail.com	\N	f	2025-06-27 11:08:23.165	\N
5046b275-dad5-4bed-bd36-5db098c52745	1851047363	Catalina Lorena	Toapanta Andrango	2003-12-15	\N	\N	\N	\N	Quito - La Vicentina 2	0984198991	emi1213galarza@gmail.com	\N	f	2025-06-27 11:10:35.157	\N
97d1f8d2-4852-4076-a891-8343910443c6	2101031025	Darwin Javier	Sanipatin Chicaiza	2003-10-25	\N	\N	\N	\N	Quito	0984198999	darwin@gmail.com	\N	f	2025-06-27 11:13:02.552	\N
7fc833fb-056e-410f-aa87-c8a17b79a41d	1802774784	Abelardo	Telo Sandoval	1993-06-10	2020-12-06	2025-06-18	Píllaro	Obstrucciones intestinales	\N	\N	\N	Ecuatioriano	t	2025-06-27 11:04:27.292	2025-06-27 11:41:10.199
6607d019-e9e4-4eaf-b6c8-2264425a84f6	1802416121	Osavldo	Jerez	1994-11-09	\N	\N	\N	\N	Los traschilas	0984198999	stalin@example.com	\N	f	2025-06-27 12:04:48.361	\N
93a7cbd9-8747-4626-ada6-be0481dababf	1805206487	Segundo Manuel	Toapanta	1990-06-06	\N	\N	\N	\N	Los traschilas	0984198992	juan.perez@example.com	\N	f	2025-06-27 12:05:53.426	\N
6d3e0635-8b51-44d2-931d-38d682d1444f	1721554549	Diego	Chicaiza	1997-06-04	2002-06-18	2025-06-25	Píllaro	Paro cardiaco	\N	\N	\N	Ecuatioriano	t	2025-06-27 12:07:30.444	2025-06-27 12:15:31.301
1901b8a6-49a9-4ef4-b3ee-926d56165482	1801868231	Pedro	Qishpe	1975-06-10	2020-12-08	2025-09-25	Píllaro	Paro cardiorespiratorio	\N	\N	\N	Ecuatioriano	t	2025-06-27 11:06:23.772	2025-09-01 23:01:21.762
\.


--
-- Data for Name: propietarios_nichos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.propietarios_nichos (id_propietario_nicho, fecha_adquisicion, tipo_documento, numero_documento, activo, razon, fecha_creacion, fecha_actualizacion, tipo, id_persona, id_nicho) FROM stdin;
abe5ef9c-35c7-4165-b324-04bbf7871235	2010-06-13	Contrato	123	f	Compra directa	2025-06-27 11:19:05.856	2025-06-27 11:19:42.451	Dueño	43e33947-97ef-4b22-98fa-18836a42d6cd	164f39b9-6555-4537-b3ec-1dca3bcac5de
22189651-2327-4878-9a50-c46978d016c1	1992-06-03	Escritura	FA5	t	Fallecimiento propietario	2025-06-27 11:19:42.457	\N	Heredero	5046b275-dad5-4bed-bd36-5db098c52745	164f39b9-6555-4537-b3ec-1dca3bcac5de
14924450-813a-4a2e-a5ef-d7f47bd68d84	2025-06-09	Contrato	435436	t	Compra directa	2025-06-27 11:45:06.264	\N	Dueño	5046b275-dad5-4bed-bd36-5db098c52745	55e93607-0df4-40f2-b5d1-1b73537c5e4b
a4106189-4fc3-4ca0-b761-c548ef33ed9f	2025-06-25	Contrato	435436	f	Compra directa	2025-06-27 12:10:48.153	2025-06-27 12:11:28.401	Dueño	97d1f8d2-4852-4076-a891-8343910443c6	517992b2-6956-4f1d-86da-397d6be7974d
528eae08-a5bb-4b97-b047-e854697d21e6	2025-06-24	Factura	435431	t	Fallecimiento propietario	2025-06-27 12:11:28.444	\N	Heredero	93a7cbd9-8747-4626-ada6-be0481dababf	517992b2-6956-4f1d-86da-397d6be7974d
f904dc98-d7ad-4261-b6ac-64760657f27a	2025-09-16	Escritura	2412	f	Compra directa	2025-09-01 22:57:54.494	2025-09-01 22:58:15.223	Dueño	6607d019-e9e4-4eaf-b6c8-2264425a84f6	9b6c3094-aadd-4aa2-b56f-c64faa6210f0
533ce821-e84e-4222-b010-1669fa52dbd8	2025-09-24	Factura	1412	t	Fallecimiento propietario	2025-09-01 22:58:15.227	\N	Dueño	97d1f8d2-4852-4076-a891-8343910443c6	9b6c3094-aadd-4aa2-b56f-c64faa6210f0
\.


--
-- Data for Name: requisitos_inhumacion; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.requisitos_inhumacion ("id_requsitoInhumacion", "pantoneroACargo", "metodoSolicitud", "observacionSolicitante", "copiaCertificadoDefuncion", "observacionCertificadoDefuncion", "informeEstadisticoINEC", "observacionInformeEstadisticoINEC", "copiaCedula", "observacionCopiaCedula", "pagoTasaInhumacion", "observacionPagoTasaInhumacion", "copiaTituloPropiedadNicho", "observacionCopiaTituloPropiedadNicho", "autorizacionDeMovilizacionDelCadaver", "observacionAutorizacionMovilizacion", "OficioDeSolicitud", "observacionOficioSolicitud", "fechaInhumacion", "horaInhumacion", "nombreAdministradorNicho", id_cementerio, id_solicitante, id_hueco_nicho, id_fallecido) FROM stdin;
bcdfb0c0-5537-4148-981c-e2828c8032f6	Alex Vargas	Escrita		t		t	\N	t		t		t		f		t		2020-12-05 00:00:00	16:30	Jose Vargas	c2e23b1c-7743-4d51-8f34-cbb08d49fe7e	43e33947-97ef-4b22-98fa-18836a42d6cd	9d7f1d12-efbd-46d9-9d03-d7041d853f6d	f299dd3e-e634-4136-8a90-646b078d26d0
e329ac24-47ee-425b-9319-2600f7f85362	Alex Vargas	Escrita		t		t	\N	t		t		t		f		t		2025-06-18 00:00:00	11:40	Jose Vargas	c2e23b1c-7743-4d51-8f34-cbb08d49fe7e	5046b275-dad5-4bed-bd36-5db098c52745	2bc80110-1417-4885-906b-949e25e1ec5f	7fc833fb-056e-410f-aa87-c8a17b79a41d
d648922a-0a3d-43b0-8865-fe5b6393315b	Alex Vargas	Escrita		t	Observación 	t	\N	t		t		t		f		t		2025-06-25 00:00:00	14:14	Jose Vargas	0017ccb3-4124-4aa6-abc4-7739ad126e5d	97d1f8d2-4852-4076-a891-8343910443c6	59c6e907-0a6f-4bce-b87f-40aa058fdebc	6d3e0635-8b51-44d2-931d-38d682d1444f
4338d8fc-1935-4494-9b4e-bf79f133f974	ALex Vargas	Escrita		t		t	\N	t		t		t		t		t		2025-09-25 00:00:00	13:01	Jose Vargas	c2e23b1c-7743-4d51-8f34-cbb08d49fe7e	97d1f8d2-4852-4076-a891-8343910443c6	fd2807d3-fae7-4ed3-b341-6d24350d1f00	1901b8a6-49a9-4ef4-b3ee-926d56165482
\.


--
-- Name: inhumaciones PK_117140c0a2a9387c6042dada73e; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inhumaciones
    ADD CONSTRAINT "PK_117140c0a2a9387c6042dada73e" PRIMARY KEY (id_inhumacion);


--
-- Name: requisitos_inhumacion PK_31f0a47eabd3a65cc6890fda8a5; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.requisitos_inhumacion
    ADD CONSTRAINT "PK_31f0a47eabd3a65cc6890fda8a5" PRIMARY KEY ("id_requsitoInhumacion");


--
-- Name: nichos PK_3e641645750f8a5de5affebd825; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.nichos
    ADD CONSTRAINT "PK_3e641645750f8a5de5affebd825" PRIMARY KEY (id_nicho);


--
-- Name: propietarios_nichos PK_9740b00a81c759af08eee19f3cf; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.propietarios_nichos
    ADD CONSTRAINT "PK_9740b00a81c759af08eee19f3cf" PRIMARY KEY (id_propietario_nicho);


--
-- Name: personas PK_a8294b844f4e1849ccf15ae57d1; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.personas
    ADD CONSTRAINT "PK_a8294b844f4e1849ccf15ae57d1" PRIMARY KEY (id_persona);


--
-- Name: exumacion PK_b4e3dcd08d2c8fb72568a12c716; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.exumacion
    ADD CONSTRAINT "PK_b4e3dcd08d2c8fb72568a12c716" PRIMARY KEY (id_exhumacion);


--
-- Name: Cementerio PK_b66399bf3a99fb1f7b9832c6561; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Cementerio"
    ADD CONSTRAINT "PK_b66399bf3a99fb1f7b9832c6561" PRIMARY KEY (id_cementerio);


--
-- Name: User PK_bebd9cd89951aa946e8d21d149c; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "PK_bebd9cd89951aa946e8d21d149c" PRIMARY KEY (id_user);


--
-- Name: huecos_nichos PK_fdd1823ac11a485905662a412f7; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.huecos_nichos
    ADD CONSTRAINT "PK_fdd1823ac11a485905662a412f7" PRIMARY KEY (id_detalle_hueco);


--
-- Name: inhumaciones REL_6a8d710a51f6179759491d01bd; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inhumaciones
    ADD CONSTRAINT "REL_6a8d710a51f6179759491d01bd" UNIQUE (id_requisitos_inhumacion);


--
-- Name: User UQ_0433b1940674b8796d34ffe58d5; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "UQ_0433b1940674b8796d34ffe58d5" UNIQUE (cedula);


--
-- Name: exumacion UQ_21a1b6491553a15bbe873ec2b64; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.exumacion
    ADD CONSTRAINT "UQ_21a1b6491553a15bbe873ec2b64" UNIQUE (codigo);


--
-- Name: personas UQ_e397742915cffdfe1b9db0da50b; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.personas
    ADD CONSTRAINT "UQ_e397742915cffdfe1b9db0da50b" UNIQUE (cedula);


--
-- Name: nichos FK_3bcdc67070c63ab6887d8cc1d7d; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.nichos
    ADD CONSTRAINT "FK_3bcdc67070c63ab6887d8cc1d7d" FOREIGN KEY (id_cementerio) REFERENCES public."Cementerio"(id_cementerio);


--
-- Name: requisitos_inhumacion FK_4bf92e615b0347ca9ee55af82c8; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.requisitos_inhumacion
    ADD CONSTRAINT "FK_4bf92e615b0347ca9ee55af82c8" FOREIGN KEY (id_fallecido) REFERENCES public.personas(id_persona);


--
-- Name: inhumaciones FK_6a8d710a51f6179759491d01bdf; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inhumaciones
    ADD CONSTRAINT "FK_6a8d710a51f6179759491d01bdf" FOREIGN KEY (id_requisitos_inhumacion) REFERENCES public.requisitos_inhumacion("id_requsitoInhumacion");


--
-- Name: inhumaciones FK_7951337ace90d84fde3dee6e3ad; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inhumaciones
    ADD CONSTRAINT "FK_7951337ace90d84fde3dee6e3ad" FOREIGN KEY (id_fallecido) REFERENCES public.personas(id_persona);


--
-- Name: exumacion FK_7f1c3a09e07da260e3a271a6e91; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.exumacion
    ADD CONSTRAINT "FK_7f1c3a09e07da260e3a271a6e91" FOREIGN KEY (id_inhumacion) REFERENCES public.inhumaciones(id_inhumacion);


--
-- Name: inhumaciones FK_9dec9c942bec801949411d19ed8; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inhumaciones
    ADD CONSTRAINT "FK_9dec9c942bec801949411d19ed8" FOREIGN KEY (id_nicho) REFERENCES public.nichos(id_nicho);


--
-- Name: requisitos_inhumacion FK_ad2a5b0b264d66997ab27c4ad85; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.requisitos_inhumacion
    ADD CONSTRAINT "FK_ad2a5b0b264d66997ab27c4ad85" FOREIGN KEY (id_solicitante) REFERENCES public.personas(id_persona);


--
-- Name: propietarios_nichos FK_bd1940b547dc713a645fc58fabe; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.propietarios_nichos
    ADD CONSTRAINT "FK_bd1940b547dc713a645fc58fabe" FOREIGN KEY (id_nicho) REFERENCES public.nichos(id_nicho);


--
-- Name: huecos_nichos FK_c2492f87d7952f7b6a509d82337; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.huecos_nichos
    ADD CONSTRAINT "FK_c2492f87d7952f7b6a509d82337" FOREIGN KEY (id_persona) REFERENCES public.personas(id_persona);


--
-- Name: huecos_nichos FK_c8da26bb34c16a27a5eb7bb1d25; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.huecos_nichos
    ADD CONSTRAINT "FK_c8da26bb34c16a27a5eb7bb1d25" FOREIGN KEY (id_nicho) REFERENCES public.nichos(id_nicho);


--
-- Name: requisitos_inhumacion FK_d19bd8fa65678815eb2935ed2df; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.requisitos_inhumacion
    ADD CONSTRAINT "FK_d19bd8fa65678815eb2935ed2df" FOREIGN KEY (id_hueco_nicho) REFERENCES public.huecos_nichos(id_detalle_hueco);


--
-- Name: exumacion FK_ed7457cd1a7b9912b4859548a5d; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.exumacion
    ADD CONSTRAINT "FK_ed7457cd1a7b9912b4859548a5d" FOREIGN KEY (id_nicho) REFERENCES public.nichos(id_nicho);


--
-- Name: requisitos_inhumacion FK_f141ef146b3536f90f96dcde263; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.requisitos_inhumacion
    ADD CONSTRAINT "FK_f141ef146b3536f90f96dcde263" FOREIGN KEY (id_cementerio) REFERENCES public."Cementerio"(id_cementerio);


--
-- Name: propietarios_nichos FK_f796063dd94d70cd42bc814dc4a; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.propietarios_nichos
    ADD CONSTRAINT "FK_f796063dd94d70cd42bc814dc4a" FOREIGN KEY (id_persona) REFERENCES public.personas(id_persona);


--
-- PostgreSQL database dump complete
--

