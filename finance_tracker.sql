--
-- PostgreSQL database dump
--

\restrict O9N397g1tKSDGkjjRZvZgWdegDzHK5ST7bwuD4fdWiOnvAVi7kBV4hqOT5L21C7

-- Dumped from database version 15.17 (Debian 15.17-1.pgdg13+1)
-- Dumped by pg_dump version 15.17 (Debian 15.17-1.pgdg13+1)

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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: accounts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.accounts (
    id bigint NOT NULL,
    created_at timestamp(6) with time zone NOT NULL,
    currency character varying(255) NOT NULL,
    current_balance numeric(38,2) NOT NULL,
    institution_name character varying(255),
    last_updated_at timestamp(6) with time zone NOT NULL,
    name character varying(255) NOT NULL,
    opening_balance numeric(38,2) NOT NULL,
    type character varying(255) NOT NULL,
    user_id bigint NOT NULL,
    CONSTRAINT accounts_type_check CHECK (((type)::text = ANY ((ARRAY['BANK_ACCOUNT'::character varying, 'CREDIT_CARD'::character varying, 'CASH_WALLET'::character varying, 'SAVINGS_ACCOUNT'::character varying])::text[])))
);


ALTER TABLE public.accounts OWNER TO postgres;

--
-- Name: accounts_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.accounts_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.accounts_id_seq OWNER TO postgres;

--
-- Name: accounts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.accounts_id_seq OWNED BY public.accounts.id;


--
-- Name: budgets; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.budgets (
    id bigint NOT NULL,
    limit_amount numeric(38,2) NOT NULL,
    period_end timestamp(6) with time zone NOT NULL,
    period_start timestamp(6) with time zone NOT NULL,
    spent numeric(38,2),
    category_id bigint,
    user_id bigint NOT NULL
);


ALTER TABLE public.budgets OWNER TO postgres;

--
-- Name: budgets_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.budgets_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.budgets_id_seq OWNER TO postgres;

--
-- Name: budgets_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.budgets_id_seq OWNED BY public.budgets.id;


--
-- Name: categories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.categories (
    id bigint NOT NULL,
    is_archived boolean NOT NULL,
    color character varying(255) NOT NULL,
    created_at timestamp(6) with time zone NOT NULL,
    icon character varying(255),
    name character varying(255) NOT NULL,
    type character varying(255) NOT NULL,
    updated_at timestamp(6) with time zone NOT NULL,
    user_id bigint NOT NULL,
    CONSTRAINT categories_type_check CHECK (((type)::text = ANY ((ARRAY['INCOME'::character varying, 'EXPENSE'::character varying])::text[])))
);


ALTER TABLE public.categories OWNER TO postgres;

--
-- Name: categories_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.categories_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.categories_id_seq OWNER TO postgres;

--
-- Name: categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.categories_id_seq OWNED BY public.categories.id;


--
-- Name: goals; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.goals (
    id bigint NOT NULL,
    current_amount numeric(38,2) NOT NULL,
    due_date timestamp(6) with time zone NOT NULL,
    name character varying(255) NOT NULL,
    status character varying(255) NOT NULL,
    target_amount numeric(38,2) NOT NULL,
    user_id bigint NOT NULL,
    CONSTRAINT goals_status_check CHECK (((status)::text = ANY ((ARRAY['IN_PROGRESS'::character varying, 'COMPLETED'::character varying, 'PAUSED'::character varying])::text[])))
);


ALTER TABLE public.goals OWNER TO postgres;

--
-- Name: goals_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.goals_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.goals_id_seq OWNER TO postgres;

--
-- Name: goals_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.goals_id_seq OWNED BY public.goals.id;


--
-- Name: recurring_transactions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.recurring_transactions (
    id bigint NOT NULL,
    active boolean NOT NULL,
    amount numeric(38,2) NOT NULL,
    description character varying(255) NOT NULL,
    frequency character varying(255) NOT NULL,
    next_run timestamp(6) with time zone NOT NULL,
    account_id bigint NOT NULL,
    category_id bigint,
    user_id bigint NOT NULL
);


ALTER TABLE public.recurring_transactions OWNER TO postgres;

--
-- Name: recurring_transactions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.recurring_transactions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.recurring_transactions_id_seq OWNER TO postgres;

--
-- Name: recurring_transactions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.recurring_transactions_id_seq OWNED BY public.recurring_transactions.id;


--
-- Name: refresh_tokens; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.refresh_tokens (
    id bigint NOT NULL,
    expires_at timestamp(6) with time zone NOT NULL,
    revoked boolean NOT NULL,
    token character varying(255) NOT NULL,
    user_id bigint NOT NULL
);


ALTER TABLE public.refresh_tokens OWNER TO postgres;

--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.refresh_tokens_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.refresh_tokens_id_seq OWNER TO postgres;

--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.refresh_tokens_id_seq OWNED BY public.refresh_tokens.id;


--
-- Name: transactions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.transactions (
    id bigint NOT NULL,
    amount numeric(38,2) NOT NULL,
    created_at timestamp(6) with time zone NOT NULL,
    description text NOT NULL,
    merchant character varying(255),
    payment_method character varying(255),
    recurring_transaction_id bigint,
    tags character varying(255),
    transaction_date timestamp(6) with time zone NOT NULL,
    type character varying(255) NOT NULL,
    updated_at timestamp(6) with time zone NOT NULL,
    account_id bigint NOT NULL,
    category_id bigint,
    transfer_account_id bigint,
    user_id bigint NOT NULL,
    CONSTRAINT transactions_type_check CHECK (((type)::text = ANY ((ARRAY['INCOME'::character varying, 'EXPENSE'::character varying, 'TRANSFER'::character varying])::text[])))
);


ALTER TABLE public.transactions OWNER TO postgres;

--
-- Name: transactions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.transactions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.transactions_id_seq OWNER TO postgres;

--
-- Name: transactions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.transactions_id_seq OWNED BY public.transactions.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id bigint NOT NULL,
    created_at timestamp(6) with time zone NOT NULL,
    display_name character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    password character varying(255) NOT NULL
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.users_id_seq OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: accounts id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.accounts ALTER COLUMN id SET DEFAULT nextval('public.accounts_id_seq'::regclass);


--
-- Name: budgets id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.budgets ALTER COLUMN id SET DEFAULT nextval('public.budgets_id_seq'::regclass);


--
-- Name: categories id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories ALTER COLUMN id SET DEFAULT nextval('public.categories_id_seq'::regclass);


--
-- Name: goals id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.goals ALTER COLUMN id SET DEFAULT nextval('public.goals_id_seq'::regclass);


--
-- Name: recurring_transactions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recurring_transactions ALTER COLUMN id SET DEFAULT nextval('public.recurring_transactions_id_seq'::regclass);


--
-- Name: refresh_tokens id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.refresh_tokens ALTER COLUMN id SET DEFAULT nextval('public.refresh_tokens_id_seq'::regclass);


--
-- Name: transactions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transactions ALTER COLUMN id SET DEFAULT nextval('public.transactions_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: accounts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.accounts (id, created_at, currency, current_balance, institution_name, last_updated_at, name, opening_balance, type, user_id) FROM stdin;
\.


--
-- Data for Name: budgets; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.budgets (id, limit_amount, period_end, period_start, spent, category_id, user_id) FROM stdin;
\.


--
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.categories (id, is_archived, color, created_at, icon, name, type, updated_at, user_id) FROM stdin;
\.


--
-- Data for Name: goals; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.goals (id, current_amount, due_date, name, status, target_amount, user_id) FROM stdin;
\.


--
-- Data for Name: recurring_transactions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.recurring_transactions (id, active, amount, description, frequency, next_run, account_id, category_id, user_id) FROM stdin;
\.


--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.refresh_tokens (id, expires_at, revoked, token, user_id) FROM stdin;
\.


--
-- Data for Name: transactions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.transactions (id, amount, created_at, description, merchant, payment_method, recurring_transaction_id, tags, transaction_date, type, updated_at, account_id, category_id, transfer_account_id, user_id) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, created_at, display_name, email, password) FROM stdin;
\.


--
-- Name: accounts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.accounts_id_seq', 1, false);


--
-- Name: budgets_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.budgets_id_seq', 1, false);


--
-- Name: categories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.categories_id_seq', 1, false);


--
-- Name: goals_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.goals_id_seq', 1, false);


--
-- Name: recurring_transactions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.recurring_transactions_id_seq', 1, false);


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.refresh_tokens_id_seq', 1, false);


--
-- Name: transactions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.transactions_id_seq', 1, false);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 1, false);


--
-- Name: accounts accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.accounts
    ADD CONSTRAINT accounts_pkey PRIMARY KEY (id);


--
-- Name: budgets budgets_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.budgets
    ADD CONSTRAINT budgets_pkey PRIMARY KEY (id);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: goals goals_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.goals
    ADD CONSTRAINT goals_pkey PRIMARY KEY (id);


--
-- Name: recurring_transactions recurring_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recurring_transactions
    ADD CONSTRAINT recurring_transactions_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id);


--
-- Name: transactions transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_pkey PRIMARY KEY (id);


--
-- Name: users uk_6dotkott2kjsp8vw4d0m25fb7; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT uk_6dotkott2kjsp8vw4d0m25fb7 UNIQUE (email);


--
-- Name: refresh_tokens uk_ghpmfn23vmxfu3spu3lfg4r2d; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT uk_ghpmfn23vmxfu3spu3lfg4r2d UNIQUE (token);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens fk1lih5y2npsf8u5o3vhdb9y0os; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT fk1lih5y2npsf8u5o3vhdb9y0os FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: transactions fk20w7wsg13u9srbq3bd7chfxdh; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT fk20w7wsg13u9srbq3bd7chfxdh FOREIGN KEY (account_id) REFERENCES public.accounts(id);


--
-- Name: transactions fk2ei6qi7dyvutrh5jdgxloot5f; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT fk2ei6qi7dyvutrh5jdgxloot5f FOREIGN KEY (transfer_account_id) REFERENCES public.accounts(id);


--
-- Name: recurring_transactions fk59dmexrjod697u8j37s0nhyhd; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recurring_transactions
    ADD CONSTRAINT fk59dmexrjod697u8j37s0nhyhd FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: goals fkb1mp6ulyqkpcw6bc1a2mr7v1g; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.goals
    ADD CONSTRAINT fkb1mp6ulyqkpcw6bc1a2mr7v1g FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: recurring_transactions fkf1byxnna01ws6w75pqc652kvj; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recurring_transactions
    ADD CONSTRAINT fkf1byxnna01ws6w75pqc652kvj FOREIGN KEY (category_id) REFERENCES public.categories(id);


--
-- Name: categories fkghuylkwuedgl2qahxjt8g41kb; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT fkghuylkwuedgl2qahxjt8g41kb FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: budgets fkln0tm5tgf3f9q3sp9sa5m8m7b; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.budgets
    ADD CONSTRAINT fkln0tm5tgf3f9q3sp9sa5m8m7b FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: budgets fkn7qib00712y8dwelmqfwis6ka; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.budgets
    ADD CONSTRAINT fkn7qib00712y8dwelmqfwis6ka FOREIGN KEY (category_id) REFERENCES public.categories(id);


--
-- Name: accounts fknjuop33mo69pd79ctplkck40n; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.accounts
    ADD CONSTRAINT fknjuop33mo69pd79ctplkck40n FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: transactions fkqwv7rmvc8va8rep7piikrojds; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT fkqwv7rmvc8va8rep7piikrojds FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: transactions fksqqi7sneo04kast0o138h19mv; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT fksqqi7sneo04kast0o138h19mv FOREIGN KEY (category_id) REFERENCES public.categories(id);


--
-- Name: recurring_transactions fkswli9j7o82qgc82kbigrrv579; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recurring_transactions
    ADD CONSTRAINT fkswli9j7o82qgc82kbigrrv579 FOREIGN KEY (account_id) REFERENCES public.accounts(id);


--
-- PostgreSQL database dump complete
--

\unrestrict O9N397g1tKSDGkjjRZvZgWdegDzHK5ST7bwuD4fdWiOnvAVi7kBV4hqOT5L21C7

