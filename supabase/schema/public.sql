--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6

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

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA public;


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS 'standard public schema';


--
-- Name: touch_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.touch_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
begin
  new.updated_at = now();
  return new;
end $$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: access_codes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.access_codes (
    id integer NOT NULL,
    request_id integer,
    email character varying(255) NOT NULL,
    code character varying(10) NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    used boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: access_codes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.access_codes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: access_codes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.access_codes_id_seq OWNED BY public.access_codes.id;


--
-- Name: access_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.access_requests (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    organization character varying(255),
    reason text,
    status character varying(20) DEFAULT 'pending'::character varying,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: access_requests_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.access_requests_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: access_requests_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.access_requests_id_seq OWNED BY public.access_requests.id;


--
-- Name: appointment_briefings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.appointment_briefings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    appointment_id uuid NOT NULL,
    generated_at timestamp with time zone DEFAULT now() NOT NULL,
    source text DEFAULT 'profile_only'::text NOT NULL,
    narrative_source text DEFAULT 'deterministic'::text NOT NULL,
    summary jsonb NOT NULL
);


--
-- Name: appointment_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.appointment_requests (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    patient_id uuid NOT NULL,
    provider_id uuid NOT NULL,
    status text DEFAULT 'requested'::text NOT NULL,
    requested_time timestamp with time zone,
    reason text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: audit_findings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audit_findings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    audit_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    npi text NOT NULL,
    provider_name text,
    address_checked text,
    confidence numeric,
    verdict text,
    signals jsonb,
    narrative text,
    CONSTRAINT audit_findings_confidence_chk CHECK (((confidence IS NULL) OR ((confidence >= (0)::numeric) AND (confidence <= (1)::numeric)))),
    CONSTRAINT audit_findings_verdict_chk CHECK (((verdict IS NULL) OR (verdict = ANY (ARRAY['likely_accurate'::text, 'likely_stale'::text, 'likely_inactive'::text, 'excluded'::text, 'unverifiable'::text]))))
);


--
-- Name: audit_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audit_log (
    id bigint NOT NULL,
    actor uuid,
    actor_role text,
    action text NOT NULL,
    target text,
    detail jsonb,
    ip text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: audit_log_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.audit_log ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.audit_log_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: cdc_places; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cdc_places (
    zip text NOT NULL,
    measureid text NOT NULL,
    categoryid text,
    short_text text,
    measure text,
    value numeric,
    low_confidence_limit numeric,
    high_confidence_limit numeric,
    data_year integer,
    pop_18plus integer,
    total_population integer,
    refreshed_at timestamp with time zone DEFAULT now() NOT NULL,
    lat numeric,
    lon numeric
);


--
-- Name: census_acs_zcta; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.census_acs_zcta (
    zip text NOT NULL,
    state text,
    acs_year integer NOT NULL,
    pop_total integer,
    households integer,
    median_hh_income integer,
    poverty_universe integer,
    poverty_below integer,
    income_bands jsonb NOT NULL,
    age_male jsonb NOT NULL,
    age_female jsonb NOT NULL,
    race jsonb NOT NULL,
    education jsonb NOT NULL,
    refreshed_at timestamp with time zone DEFAULT now() NOT NULL,
    ins_universe integer,
    ins_uninsured integer,
    ins_medicare integer,
    ins_medicaid integer,
    pop_prior integer,
    pop_prior_year integer,
    signals jsonb
);


--
-- Name: clinic_secondary_locations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.clinic_secondary_locations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    parent_npi text NOT NULL,
    entity_type text NOT NULL,
    name text,
    primary_taxonomy text,
    address text,
    address2 text,
    city text,
    state text,
    zip text,
    latitude double precision,
    longitude double precision,
    geocode_precision text,
    location_type text DEFAULT 'secondary'::text NOT NULL,
    source text DEFAULT 'nppes_bulk_march_2026'::text NOT NULL,
    refreshed_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT clinic_secondary_locations_entity_type_check CHECK ((entity_type = ANY (ARRAY['1'::text, '2'::text])))
);


--
-- Name: clinics; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.clinics (
    id integer NOT NULL,
    npi character varying(20),
    name character varying(255),
    address character varying(255),
    city character varying(100),
    state character varying(2),
    zip character varying(5),
    latitude numeric(10,8),
    longitude numeric(11,8),
    primary_taxonomy character varying(255),
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: clinics_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.clinics_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: clinics_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.clinics_id_seq OWNED BY public.clinics.id;


--
-- Name: cms_county_utilization; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cms_county_utilization (
    id integer NOT NULL,
    fips character varying(5),
    county_name character varying(100),
    year character varying(4),
    total_beneficiaries numeric,
    er_visits numeric,
    er_visits_per_1000 numeric,
    ip_stays numeric,
    ip_stays_per_1000 numeric,
    readmissions numeric,
    readmission_rate numeric,
    dialysis_users numeric,
    dialysis_visits_per_1000 numeric,
    snf_users numeric,
    home_health_users numeric,
    hospice_users numeric,
    chf_admits_lt65 numeric,
    chf_admits_65_74 numeric,
    chf_admits_75plus numeric,
    diabetes_admits_lt65 numeric,
    diabetes_admits_65_74 numeric,
    diabetes_admits_75plus numeric,
    copd_admits_lt65 numeric,
    copd_admits_65_74 numeric,
    copd_admits_75plus numeric,
    htn_admits_lt65 numeric,
    htn_admits_65_74 numeric,
    htn_admits_75plus numeric,
    pneumonia_admits_lt65 numeric,
    pneumonia_admits_65_74 numeric,
    pneumonia_admits_75plus numeric,
    uti_admits_lt65 numeric,
    uti_admits_65_74 numeric,
    uti_admits_75plus numeric,
    amputation_admits_lt65 numeric,
    amputation_admits_65_74 numeric,
    amputation_admits_75plus numeric,
    per_capita_payment numeric,
    per_capita_std_payment numeric,
    created_at timestamp without time zone DEFAULT now(),
    pqi_year character varying(4)
);


--
-- Name: cms_county_utilization_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.cms_county_utilization_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: cms_county_utilization_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.cms_county_utilization_id_seq OWNED BY public.cms_county_utilization.id;


--
-- Name: cms_procedures_full; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cms_procedures_full (
    id integer NOT NULL,
    npi character varying(10),
    provider_name text,
    first_name text,
    credentials text,
    entity_code character varying(2),
    address1 text,
    address2 text,
    city text,
    state character varying(2),
    zip character varying(5),
    fips character varying(2),
    ruca text,
    ruca_desc text,
    specialty text,
    medicare_participating character varying(1),
    hcpcs_cd character varying(10),
    hcpcs_desc text,
    hcpcs_drug_ind character varying(1),
    place_of_service character varying(1),
    tot_benes numeric,
    tot_srvcs numeric,
    tot_bene_day_srvcs numeric,
    avg_sbmtd_chrg numeric,
    avg_mdcr_alowd_amt numeric,
    avg_mdcr_pymt_amt numeric,
    avg_mdcr_stdzd_amt numeric,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: cms_procedures_full_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.cms_procedures_full_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: cms_procedures_full_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.cms_procedures_full_id_seq OWNED BY public.cms_procedures_full.id;


--
-- Name: cms_provider_cache; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cms_provider_cache (
    npi text NOT NULL,
    found boolean NOT NULL,
    first_name text,
    last_name text,
    credential text,
    gender text,
    primary_specialty text,
    secondary_specialties text[],
    medical_school text,
    graduation_year text,
    telehealth boolean,
    facility text,
    org_pac_id text,
    group_size text,
    address text,
    phone text,
    medicare_participant boolean,
    medicare_assignment text,
    fetched_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: cms_zip_procedures; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cms_zip_procedures (
    id integer NOT NULL,
    zip character varying(5),
    specialty character varying(100),
    rank integer,
    hcpcs_cd character varying(10),
    hcpcs_desc text,
    tot_benes integer,
    avg_mdcr_pymt numeric,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: cms_zip_procedures_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.cms_zip_procedures_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: cms_zip_procedures_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.cms_zip_procedures_id_seq OWNED BY public.cms_zip_procedures.id;


--
-- Name: demand_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.demand_log (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    zip text,
    taxonomies text[],
    payer text,
    source text,
    matched_count integer,
    CONSTRAINT demand_log_source_chk CHECK (((source IS NULL) OR (source = ANY (ARRAY['navigator'::text, 'specialty_browser'::text]))))
);


--
-- Name: demographics_raw; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.demographics_raw (
    id integer NOT NULL,
    zip character varying(5),
    state character varying(2),
    "Total Population" numeric,
    "Total: Under 6 years" numeric,
    "Total: 6 to 18 years" numeric,
    "Total: 19 to 25 years" numeric,
    "Total: 26 to 34 years" numeric,
    "Total: 35 to 44 years" numeric,
    "Total: 45 to 54 years" numeric,
    "Total: 55 to 64 years" numeric,
    "Total: 65 to 74 years" numeric,
    "Total: 75 years and older" numeric,
    "Total: Male" numeric,
    "Total: Female" numeric,
    "Total: White alone" numeric,
    "Total: Black or African American alone" numeric,
    "Total: American Indian and Alaska Native alone" numeric,
    "Total: Asian alone" numeric,
    "Total: Native Hawaiian and Other Pacific Islander alone" numeric,
    "Total: Some other race alone" numeric,
    "Total: Two or more races" numeric,
    "Total: Hispanic or Latino (of any race)" numeric,
    "Total: White alone, not Hispanic or Latino" numeric,
    "Total: Native born" numeric,
    "Total: Foreign born" numeric,
    "Total: Naturalized" numeric,
    "Total: Not a citizen" numeric,
    "Total: HH Income Pop" numeric,
    "Total: Under $25,000" numeric,
    "Total: $25,000 to $49,999" numeric,
    "Total: $50,000 to $74,999" numeric,
    "Total: $75,000 to $99,999" numeric,
    "Total: $100,000 and over" numeric,
    "Insured Population" numeric,
    "Insured: Under 6 years" numeric,
    "Insured: 6 to 18 years" numeric,
    "Insured: 19 to 25 years" numeric,
    "Insured: 26 to 34 years" numeric,
    "Insured: 35 to 44 years" numeric,
    "Insured: 45 to 54 years" numeric,
    "Insured: 55 to 64 years" numeric,
    "Insured: 65 to 74 years" numeric,
    "Insured: 75 years and older" numeric,
    "Insured: Male" numeric,
    "Insured: Female" numeric,
    "Insured: White alone" numeric,
    "Insured: Black or African American alone" numeric,
    "Insured: American Indian and Alaska Native alone" numeric,
    "Insured: Asian alone" numeric,
    "Insured: Native Hawaiian and Other Pacific Islander alone" numeric,
    "Insured: Some other race alone" numeric,
    "Insured: Two or more races" numeric,
    "Insured: Hispanic or Latino (of any race)" numeric,
    "Insured: White alone, not Hispanic or Latino" numeric,
    "Insured: Native born" numeric,
    "Insured: Foreign born" numeric,
    "Insured: Naturalized" numeric,
    "Insured: Not a citizen" numeric,
    "Insured: HH Income Pop" numeric,
    "Insured: Under $25,000" numeric,
    "Insured: $25,000 to $49,999" numeric,
    "Insured: $50,000 to $74,999" numeric,
    "Insured: $75,000 to $99,999" numeric,
    "Insured: $100,000 and over" numeric,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: demographics_raw_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.demographics_raw_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: demographics_raw_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.demographics_raw_id_seq OWNED BY public.demographics_raw.id;


--
-- Name: directory_audits; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.directory_audits (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    label text,
    state text,
    zip_prefixes text[],
    provider_count integer,
    summary jsonb,
    status text DEFAULT 'pending'::text NOT NULL,
    CONSTRAINT directory_audits_status_chk CHECK ((status = ANY (ARRAY['pending'::text, 'complete'::text, 'failed'::text])))
);


--
-- Name: hpsa_designations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hpsa_designations (
    id integer NOT NULL,
    discipline text,
    state text,
    county text,
    county_state text,
    hpsa_score numeric,
    hpsa_type text,
    hpsa_subtype text,
    rural_status text,
    designation_population numeric,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: hpsa_designations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.hpsa_designations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: hpsa_designations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.hpsa_designations_id_seq OWNED BY public.hpsa_designations.id;


--
-- Name: insurance_payers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.insurance_payers (
    id bigint NOT NULL,
    name text NOT NULL,
    state text,
    category text DEFAULT 'commercial'::text NOT NULL,
    sort_order integer DEFAULT 100 NOT NULL,
    active boolean DEFAULT true NOT NULL
);


--
-- Name: insurance_payers_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.insurance_payers ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.insurance_payers_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: leie_exclusions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.leie_exclusions (
    id bigint NOT NULL,
    npi text,
    last_name text,
    first_name text,
    mid_name text,
    business_name text,
    general text,
    specialty text,
    city text,
    state text,
    zip text,
    excl_type text,
    excl_date date,
    rein_date date
);


--
-- Name: leie_exclusions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.leie_exclusions ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.leie_exclusions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: market_benchmarks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.market_benchmarks (
    kind text NOT NULL,
    key text NOT NULL,
    data jsonb NOT NULL,
    refreshed_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT market_benchmarks_kind_check CHECK ((kind = ANY (ARRAY['measure'::text, 'specialty'::text, 'state_density'::text, 'demand_model'::text])))
);


--
-- Name: medicare_county_enrollment; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.medicare_county_enrollment (
    fips text NOT NULL,
    state text NOT NULL,
    county text NOT NULL,
    data_year integer NOT NULL,
    data_month text NOT NULL,
    total_benes integer,
    original_medicare_benes integer,
    ma_and_other_benes integer,
    aged_total_benes integer,
    disabled_total_benes integer,
    refreshed_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: npi_activity; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.npi_activity (
    npi text NOT NULL,
    last_medicare_activity_year integer,
    medicare_services_count integer,
    pecos_enrolled boolean,
    source text,
    refreshed_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: patient_profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.patient_profiles (
    id uuid NOT NULL,
    first_name text,
    last_name text,
    date_of_birth date,
    zip text,
    insurance_payer text,
    conditions text[] DEFAULT '{}'::text[] NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    concern_description text
);


--
-- Name: provider_individuals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.provider_individuals (
    npi text NOT NULL,
    name text,
    address text,
    city text,
    state text,
    zip text,
    primary_taxonomy text,
    phone text,
    latitude double precision,
    longitude double precision,
    enumeration_type text DEFAULT 'NPI-1'::text NOT NULL,
    source text DEFAULT 'nppes_zip_enrichment'::text NOT NULL,
    refreshed_at timestamp with time zone DEFAULT now() NOT NULL,
    affiliated_clinic_npi text
);


--
-- Name: provider_insurance; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.provider_insurance (
    id bigint NOT NULL,
    provider_id uuid NOT NULL,
    payer_name text NOT NULL,
    plan_type text DEFAULT ''::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: provider_insurance_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.provider_insurance ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.provider_insurance_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: provider_locations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.provider_locations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    provider_id uuid NOT NULL,
    npi text,
    label text,
    address_line text NOT NULL,
    city text,
    state text,
    zip text,
    latitude double precision,
    longitude double precision,
    geocoded boolean DEFAULT false NOT NULL,
    verified boolean DEFAULT false NOT NULL,
    phone text,
    accepting_new_patients boolean,
    telehealth boolean,
    office_hours jsonb,
    hours_note text,
    is_primary boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: provider_profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.provider_profiles (
    id uuid NOT NULL,
    npi character(10) NOT NULL,
    npi_verified boolean DEFAULT false NOT NULL,
    entity_type smallint,
    first_name text,
    last_name text,
    org_name text,
    phone text,
    address_line text,
    city text,
    state character(2),
    zip text,
    taxonomy_code text,
    taxonomy_desc text,
    accepting_new_patients boolean,
    telehealth boolean,
    bio text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    review_status text DEFAULT 'clear'::text NOT NULL,
    review_reason text,
    office_hours jsonb,
    appointment_minutes integer,
    booking_mode text DEFAULT 'phone'::text,
    booking_url text,
    hours_note text
);


--
-- Name: sahie_county; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sahie_county (
    fips text NOT NULL,
    county text,
    year integer NOT NULL,
    under65 integer,
    uninsured integer,
    uninsured_pct numeric,
    uninsured_pct_moe numeric,
    refreshed_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: zip_county_crosswalk; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.zip_county_crosswalk (
    id bigint NOT NULL,
    zip text NOT NULL,
    fips text NOT NULL,
    state text NOT NULL,
    res_ratio numeric NOT NULL,
    data_year text,
    data_quarter text,
    refreshed_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: zip_county_crosswalk_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.zip_county_crosswalk ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.zip_county_crosswalk_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: zip_enrichment_queue; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.zip_enrichment_queue (
    zip text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    requested_at timestamp with time zone DEFAULT now() NOT NULL,
    last_enriched_at timestamp with time zone,
    attempts integer DEFAULT 0 NOT NULL,
    last_error text,
    CONSTRAINT zip_enrichment_queue_status_chk CHECK ((status = ANY (ARRAY['pending'::text, 'processing'::text, 'done'::text, 'failed'::text])))
);


--
-- Name: access_codes id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.access_codes ALTER COLUMN id SET DEFAULT nextval('public.access_codes_id_seq'::regclass);


--
-- Name: access_requests id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.access_requests ALTER COLUMN id SET DEFAULT nextval('public.access_requests_id_seq'::regclass);


--
-- Name: clinics id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clinics ALTER COLUMN id SET DEFAULT nextval('public.clinics_id_seq'::regclass);


--
-- Name: cms_county_utilization id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cms_county_utilization ALTER COLUMN id SET DEFAULT nextval('public.cms_county_utilization_id_seq'::regclass);


--
-- Name: cms_procedures_full id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cms_procedures_full ALTER COLUMN id SET DEFAULT nextval('public.cms_procedures_full_id_seq'::regclass);


--
-- Name: cms_zip_procedures id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cms_zip_procedures ALTER COLUMN id SET DEFAULT nextval('public.cms_zip_procedures_id_seq'::regclass);


--
-- Name: demographics_raw id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.demographics_raw ALTER COLUMN id SET DEFAULT nextval('public.demographics_raw_id_seq'::regclass);


--
-- Name: hpsa_designations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hpsa_designations ALTER COLUMN id SET DEFAULT nextval('public.hpsa_designations_id_seq'::regclass);


--
-- Name: access_codes access_codes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.access_codes
    ADD CONSTRAINT access_codes_pkey PRIMARY KEY (id);


--
-- Name: access_requests access_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.access_requests
    ADD CONSTRAINT access_requests_pkey PRIMARY KEY (id);


--
-- Name: appointment_briefings appointment_briefings_appointment_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.appointment_briefings
    ADD CONSTRAINT appointment_briefings_appointment_id_key UNIQUE (appointment_id);


--
-- Name: appointment_briefings appointment_briefings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.appointment_briefings
    ADD CONSTRAINT appointment_briefings_pkey PRIMARY KEY (id);


--
-- Name: appointment_requests appointment_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.appointment_requests
    ADD CONSTRAINT appointment_requests_pkey PRIMARY KEY (id);


--
-- Name: audit_findings audit_findings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_findings
    ADD CONSTRAINT audit_findings_pkey PRIMARY KEY (id);


--
-- Name: audit_log audit_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_log
    ADD CONSTRAINT audit_log_pkey PRIMARY KEY (id);


--
-- Name: cdc_places cdc_places_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cdc_places
    ADD CONSTRAINT cdc_places_pkey PRIMARY KEY (zip, measureid);


--
-- Name: census_acs_zcta census_acs_zcta_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.census_acs_zcta
    ADD CONSTRAINT census_acs_zcta_pkey PRIMARY KEY (zip);


--
-- Name: clinic_secondary_locations clinic_secondary_locations_parent_npi_address_zip_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clinic_secondary_locations
    ADD CONSTRAINT clinic_secondary_locations_parent_npi_address_zip_key UNIQUE (parent_npi, address, zip);


--
-- Name: clinic_secondary_locations clinic_secondary_locations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clinic_secondary_locations
    ADD CONSTRAINT clinic_secondary_locations_pkey PRIMARY KEY (id);


--
-- Name: clinics clinics_npi_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clinics
    ADD CONSTRAINT clinics_npi_unique UNIQUE (npi);


--
-- Name: clinics clinics_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clinics
    ADD CONSTRAINT clinics_pkey PRIMARY KEY (id);


--
-- Name: cms_county_utilization cms_county_utilization_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cms_county_utilization
    ADD CONSTRAINT cms_county_utilization_pkey PRIMARY KEY (id);


--
-- Name: cms_procedures_full cms_procedures_full_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cms_procedures_full
    ADD CONSTRAINT cms_procedures_full_pkey PRIMARY KEY (id);


--
-- Name: cms_provider_cache cms_provider_cache_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cms_provider_cache
    ADD CONSTRAINT cms_provider_cache_pkey PRIMARY KEY (npi);


--
-- Name: cms_zip_procedures cms_zip_procedures_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cms_zip_procedures
    ADD CONSTRAINT cms_zip_procedures_pkey PRIMARY KEY (id);


--
-- Name: demand_log demand_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.demand_log
    ADD CONSTRAINT demand_log_pkey PRIMARY KEY (id);


--
-- Name: demographics_raw demographics_raw_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.demographics_raw
    ADD CONSTRAINT demographics_raw_pkey PRIMARY KEY (id);


--
-- Name: directory_audits directory_audits_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.directory_audits
    ADD CONSTRAINT directory_audits_pkey PRIMARY KEY (id);


--
-- Name: hpsa_designations hpsa_designations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hpsa_designations
    ADD CONSTRAINT hpsa_designations_pkey PRIMARY KEY (id);


--
-- Name: insurance_payers insurance_payers_name_state_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.insurance_payers
    ADD CONSTRAINT insurance_payers_name_state_key UNIQUE (name, state);


--
-- Name: insurance_payers insurance_payers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.insurance_payers
    ADD CONSTRAINT insurance_payers_pkey PRIMARY KEY (id);


--
-- Name: leie_exclusions leie_exclusions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leie_exclusions
    ADD CONSTRAINT leie_exclusions_pkey PRIMARY KEY (id);


--
-- Name: market_benchmarks market_benchmarks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.market_benchmarks
    ADD CONSTRAINT market_benchmarks_pkey PRIMARY KEY (kind, key);


--
-- Name: medicare_county_enrollment medicare_county_enrollment_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.medicare_county_enrollment
    ADD CONSTRAINT medicare_county_enrollment_pkey PRIMARY KEY (fips);


--
-- Name: npi_activity npi_activity_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.npi_activity
    ADD CONSTRAINT npi_activity_pkey PRIMARY KEY (npi);


--
-- Name: patient_profiles patient_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_profiles
    ADD CONSTRAINT patient_profiles_pkey PRIMARY KEY (id);


--
-- Name: provider_individuals provider_individuals_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.provider_individuals
    ADD CONSTRAINT provider_individuals_pkey PRIMARY KEY (npi);


--
-- Name: provider_insurance provider_insurance_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.provider_insurance
    ADD CONSTRAINT provider_insurance_pkey PRIMARY KEY (id);


--
-- Name: provider_insurance provider_insurance_provider_id_payer_name_plan_type_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.provider_insurance
    ADD CONSTRAINT provider_insurance_provider_id_payer_name_plan_type_key UNIQUE (provider_id, payer_name, plan_type);


--
-- Name: provider_locations provider_locations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.provider_locations
    ADD CONSTRAINT provider_locations_pkey PRIMARY KEY (id);


--
-- Name: provider_profiles provider_profiles_npi_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.provider_profiles
    ADD CONSTRAINT provider_profiles_npi_key UNIQUE (npi);


--
-- Name: provider_profiles provider_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.provider_profiles
    ADD CONSTRAINT provider_profiles_pkey PRIMARY KEY (id);


--
-- Name: sahie_county sahie_county_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sahie_county
    ADD CONSTRAINT sahie_county_pkey PRIMARY KEY (fips);


--
-- Name: zip_county_crosswalk zip_county_crosswalk_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.zip_county_crosswalk
    ADD CONSTRAINT zip_county_crosswalk_pkey PRIMARY KEY (id);


--
-- Name: zip_county_crosswalk zip_county_crosswalk_zip_fips_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.zip_county_crosswalk
    ADD CONSTRAINT zip_county_crosswalk_zip_fips_key UNIQUE (zip, fips);


--
-- Name: zip_enrichment_queue zip_enrichment_queue_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.zip_enrichment_queue
    ADD CONSTRAINT zip_enrichment_queue_pkey PRIMARY KEY (zip);


--
-- Name: appointment_briefings_appointment_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX appointment_briefings_appointment_idx ON public.appointment_briefings USING btree (appointment_id);


--
-- Name: appointment_requests_patient_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX appointment_requests_patient_idx ON public.appointment_requests USING btree (patient_id, created_at DESC);


--
-- Name: appointment_requests_provider_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX appointment_requests_provider_idx ON public.appointment_requests USING btree (provider_id, created_at DESC);


--
-- Name: audit_findings_audit_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX audit_findings_audit_idx ON public.audit_findings USING btree (audit_id, confidence);


--
-- Name: audit_findings_npi_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX audit_findings_npi_idx ON public.audit_findings USING btree (npi);


--
-- Name: cdc_places_latlon_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX cdc_places_latlon_idx ON public.cdc_places USING btree (lat, lon) WHERE ((lat IS NOT NULL) AND (lon IS NOT NULL));


--
-- Name: cdc_places_measure_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX cdc_places_measure_idx ON public.cdc_places USING btree (measureid, zip);


--
-- Name: census_acs_zcta_state_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX census_acs_zcta_state_idx ON public.census_acs_zcta USING btree (state);


--
-- Name: clinic_secondary_locations_geo_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX clinic_secondary_locations_geo_idx ON public.clinic_secondary_locations USING btree (latitude, longitude) WHERE ((latitude IS NOT NULL) AND (longitude IS NOT NULL));


--
-- Name: clinic_secondary_locations_parent_npi_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX clinic_secondary_locations_parent_npi_idx ON public.clinic_secondary_locations USING btree (parent_npi);


--
-- Name: clinic_secondary_locations_zip_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX clinic_secondary_locations_zip_idx ON public.clinic_secondary_locations USING btree (zip);


--
-- Name: cms_provider_cache_fetched_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX cms_provider_cache_fetched_at_idx ON public.cms_provider_cache USING btree (fetched_at);


--
-- Name: demand_log_taxonomies_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX demand_log_taxonomies_idx ON public.demand_log USING gin (taxonomies);


--
-- Name: demand_log_zip_created_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX demand_log_zip_created_idx ON public.demand_log USING btree (zip, created_at DESC);


--
-- Name: directory_audits_created_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX directory_audits_created_idx ON public.directory_audits USING btree (created_at DESC);


--
-- Name: idx_clinics_city; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_clinics_city ON public.clinics USING btree (city);


--
-- Name: idx_clinics_state; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_clinics_state ON public.clinics USING btree (state);


--
-- Name: idx_clinics_zip; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_clinics_zip ON public.clinics USING btree (zip);


--
-- Name: idx_cms_county_fips; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cms_county_fips ON public.cms_county_utilization USING btree (fips);


--
-- Name: idx_cpf_npi; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cpf_npi ON public.cms_procedures_full USING btree (npi);


--
-- Name: idx_cpf_specialty; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cpf_specialty ON public.cms_procedures_full USING btree (specialty);


--
-- Name: idx_cpf_zip; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cpf_zip ON public.cms_procedures_full USING btree (zip);


--
-- Name: idx_czp_zip; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_czp_zip ON public.cms_zip_procedures USING btree (zip);


--
-- Name: idx_demographics_raw_state; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_demographics_raw_state ON public.demographics_raw USING btree (state);


--
-- Name: idx_demographics_raw_zip; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_demographics_raw_zip ON public.demographics_raw USING btree (zip);


--
-- Name: idx_hpsa_county; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_hpsa_county ON public.hpsa_designations USING btree (county, state);


--
-- Name: insurance_payers_state_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX insurance_payers_state_idx ON public.insurance_payers USING btree (state) WHERE active;


--
-- Name: leie_name_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX leie_name_idx ON public.leie_exclusions USING btree (last_name, first_name);


--
-- Name: leie_npi_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX leie_npi_idx ON public.leie_exclusions USING btree (npi) WHERE (npi IS NOT NULL);


--
-- Name: medicare_county_enrollment_state_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX medicare_county_enrollment_state_idx ON public.medicare_county_enrollment USING btree (state);


--
-- Name: npi_activity_refreshed_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX npi_activity_refreshed_idx ON public.npi_activity USING btree (refreshed_at);


--
-- Name: provider_hours_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX provider_hours_idx ON public.provider_profiles USING btree (((office_hours IS NOT NULL))) WHERE (office_hours IS NOT NULL);


--
-- Name: provider_individuals_affiliated_clinic_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX provider_individuals_affiliated_clinic_idx ON public.provider_individuals USING btree (affiliated_clinic_npi) WHERE (affiliated_clinic_npi IS NOT NULL);


--
-- Name: provider_individuals_taxonomy_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX provider_individuals_taxonomy_idx ON public.provider_individuals USING btree (primary_taxonomy);


--
-- Name: provider_individuals_zip_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX provider_individuals_zip_idx ON public.provider_individuals USING btree (zip);


--
-- Name: provider_locations_geo_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX provider_locations_geo_idx ON public.provider_locations USING btree (latitude, longitude) WHERE ((latitude IS NOT NULL) AND (longitude IS NOT NULL));


--
-- Name: provider_locations_one_primary; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX provider_locations_one_primary ON public.provider_locations USING btree (provider_id) WHERE is_primary;


--
-- Name: provider_locations_provider_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX provider_locations_provider_idx ON public.provider_locations USING btree (provider_id);


--
-- Name: provider_locations_zip_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX provider_locations_zip_idx ON public.provider_locations USING btree (zip);


--
-- Name: provider_review_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX provider_review_idx ON public.provider_profiles USING btree (review_status) WHERE (review_status <> 'clear'::text);


--
-- Name: zip_county_crosswalk_fips_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX zip_county_crosswalk_fips_idx ON public.zip_county_crosswalk USING btree (fips);


--
-- Name: zip_county_crosswalk_zip_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX zip_county_crosswalk_zip_idx ON public.zip_county_crosswalk USING btree (zip);


--
-- Name: zip_enrichment_queue_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX zip_enrichment_queue_status_idx ON public.zip_enrichment_queue USING btree (status, requested_at);


--
-- Name: patient_profiles trg_patient_touch; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_patient_touch BEFORE UPDATE ON public.patient_profiles FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();


--
-- Name: provider_profiles trg_provider_touch; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_provider_touch BEFORE UPDATE ON public.provider_profiles FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();


--
-- Name: access_codes access_codes_request_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.access_codes
    ADD CONSTRAINT access_codes_request_id_fkey FOREIGN KEY (request_id) REFERENCES public.access_requests(id);


--
-- Name: appointment_briefings appointment_briefings_appointment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.appointment_briefings
    ADD CONSTRAINT appointment_briefings_appointment_id_fkey FOREIGN KEY (appointment_id) REFERENCES public.appointment_requests(id) ON DELETE CASCADE;


--
-- Name: appointment_requests appointment_requests_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.appointment_requests
    ADD CONSTRAINT appointment_requests_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: appointment_requests appointment_requests_provider_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.appointment_requests
    ADD CONSTRAINT appointment_requests_provider_id_fkey FOREIGN KEY (provider_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: audit_findings audit_findings_audit_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_findings
    ADD CONSTRAINT audit_findings_audit_id_fkey FOREIGN KEY (audit_id) REFERENCES public.directory_audits(id) ON DELETE CASCADE;


--
-- Name: patient_profiles patient_profiles_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_profiles
    ADD CONSTRAINT patient_profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: provider_insurance provider_insurance_provider_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.provider_insurance
    ADD CONSTRAINT provider_insurance_provider_id_fkey FOREIGN KEY (provider_id) REFERENCES public.provider_profiles(id) ON DELETE CASCADE;


--
-- Name: provider_locations provider_locations_provider_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.provider_locations
    ADD CONSTRAINT provider_locations_provider_id_fkey FOREIGN KEY (provider_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: provider_profiles provider_profiles_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.provider_profiles
    ADD CONSTRAINT provider_profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: access_codes Allow public read codes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public read codes" ON public.access_codes FOR SELECT USING (true);


--
-- Name: access_requests Allow public read requests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public read requests" ON public.access_requests FOR SELECT USING (true);


--
-- Name: clinics Allow public select on clinics; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public select on clinics" ON public.clinics FOR SELECT USING (true);


--
-- Name: demographics_raw Allow public select on demographics_raw; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public select on demographics_raw" ON public.demographics_raw FOR SELECT USING (true);


--
-- Name: access_requests Public can submit requests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public can submit requests" ON public.access_requests FOR INSERT TO anon WITH CHECK (true);


--
-- Name: cms_county_utilization Public read access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public read access" ON public.cms_county_utilization FOR SELECT TO authenticated, anon USING (true);


--
-- Name: cms_procedures_full Public read access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public read access" ON public.cms_procedures_full FOR SELECT TO authenticated, anon USING (true);


--
-- Name: cms_zip_procedures Public read access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public read access" ON public.cms_zip_procedures FOR SELECT TO authenticated, anon USING (true);


--
-- Name: hpsa_designations Public read access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public read access" ON public.hpsa_designations FOR SELECT TO authenticated, anon USING (true);


--
-- Name: clinics Public read clinics; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public read clinics" ON public.clinics FOR SELECT USING (true);


--
-- Name: access_codes Public read codes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public read codes" ON public.access_codes FOR SELECT USING (true);


--
-- Name: demographics_raw Public read demographics; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public read demographics" ON public.demographics_raw FOR SELECT USING (true);


--
-- Name: access_codes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.access_codes ENABLE ROW LEVEL SECURITY;

--
-- Name: access_requests; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.access_requests ENABLE ROW LEVEL SECURITY;

--
-- Name: appointment_requests appointment parties: insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "appointment parties: insert" ON public.appointment_requests FOR INSERT WITH CHECK ((auth.uid() = patient_id));


--
-- Name: appointment_requests appointment parties: select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "appointment parties: select" ON public.appointment_requests FOR SELECT USING (((auth.uid() = patient_id) OR (auth.uid() = provider_id)));


--
-- Name: appointment_briefings appointment parties: select briefing; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "appointment parties: select briefing" ON public.appointment_briefings FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.appointment_requests ar
  WHERE ((ar.id = appointment_briefings.appointment_id) AND ((ar.patient_id = auth.uid()) OR (ar.provider_id = auth.uid()))))));


--
-- Name: appointment_requests appointment parties: update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "appointment parties: update" ON public.appointment_requests FOR UPDATE USING (((auth.uid() = patient_id) OR (auth.uid() = provider_id))) WITH CHECK (((auth.uid() = patient_id) OR (auth.uid() = provider_id)));


--
-- Name: appointment_briefings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.appointment_briefings ENABLE ROW LEVEL SECURITY;

--
-- Name: appointment_requests; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.appointment_requests ENABLE ROW LEVEL SECURITY;

--
-- Name: audit_findings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.audit_findings ENABLE ROW LEVEL SECURITY;

--
-- Name: audit_log; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

--
-- Name: cdc_places; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.cdc_places ENABLE ROW LEVEL SECURITY;

--
-- Name: cdc_places cdc_places public read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "cdc_places public read" ON public.cdc_places FOR SELECT TO authenticated, anon USING (true);


--
-- Name: census_acs_zcta; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.census_acs_zcta ENABLE ROW LEVEL SECURITY;

--
-- Name: census_acs_zcta census_acs_zcta public read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "census_acs_zcta public read" ON public.census_acs_zcta FOR SELECT USING (true);


--
-- Name: clinic_secondary_locations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.clinic_secondary_locations ENABLE ROW LEVEL SECURITY;

--
-- Name: clinic_secondary_locations clinic_secondary_locations_public_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY clinic_secondary_locations_public_read ON public.clinic_secondary_locations FOR SELECT TO authenticated, anon USING (true);


--
-- Name: clinics; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.clinics ENABLE ROW LEVEL SECURITY;

--
-- Name: cms_county_utilization; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.cms_county_utilization ENABLE ROW LEVEL SECURITY;

--
-- Name: cms_procedures_full; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.cms_procedures_full ENABLE ROW LEVEL SECURITY;

--
-- Name: cms_provider_cache; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.cms_provider_cache ENABLE ROW LEVEL SECURITY;

--
-- Name: cms_provider_cache cms_provider_cache_public_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY cms_provider_cache_public_read ON public.cms_provider_cache FOR SELECT TO authenticated, anon USING (true);


--
-- Name: cms_zip_procedures; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.cms_zip_procedures ENABLE ROW LEVEL SECURITY;

--
-- Name: demand_log; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.demand_log ENABLE ROW LEVEL SECURITY;

--
-- Name: demographics_raw; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.demographics_raw ENABLE ROW LEVEL SECURITY;

--
-- Name: directory_audits; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.directory_audits ENABLE ROW LEVEL SECURITY;

--
-- Name: hpsa_designations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.hpsa_designations ENABLE ROW LEVEL SECURITY;

--
-- Name: insurance_payers; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.insurance_payers ENABLE ROW LEVEL SECURITY;

--
-- Name: provider_insurance insurance_self_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY insurance_self_delete ON public.provider_insurance FOR DELETE USING ((provider_id = auth.uid()));


--
-- Name: provider_insurance insurance_self_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY insurance_self_insert ON public.provider_insurance FOR INSERT WITH CHECK ((provider_id = auth.uid()));


--
-- Name: leie_exclusions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.leie_exclusions ENABLE ROW LEVEL SECURITY;

--
-- Name: market_benchmarks; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.market_benchmarks ENABLE ROW LEVEL SECURITY;

--
-- Name: market_benchmarks market_benchmarks public read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "market_benchmarks public read" ON public.market_benchmarks FOR SELECT USING (true);


--
-- Name: medicare_county_enrollment medicare enrollment is public; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "medicare enrollment is public" ON public.medicare_county_enrollment FOR SELECT USING (true);


--
-- Name: medicare_county_enrollment; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.medicare_county_enrollment ENABLE ROW LEVEL SECURITY;

--
-- Name: npi_activity; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.npi_activity ENABLE ROW LEVEL SECURITY;

--
-- Name: provider_insurance own insurance select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "own insurance select" ON public.provider_insurance FOR SELECT USING ((auth.uid() = provider_id));


--
-- Name: provider_locations own locations delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "own locations delete" ON public.provider_locations FOR DELETE USING ((auth.uid() = provider_id));


--
-- Name: provider_locations own locations insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "own locations insert" ON public.provider_locations FOR INSERT WITH CHECK ((auth.uid() = provider_id));


--
-- Name: provider_locations own locations select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "own locations select" ON public.provider_locations FOR SELECT USING ((auth.uid() = provider_id));


--
-- Name: provider_locations own locations update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "own locations update" ON public.provider_locations FOR UPDATE USING ((auth.uid() = provider_id)) WITH CHECK ((auth.uid() = provider_id));


--
-- Name: provider_profiles own profile select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "own profile select" ON public.provider_profiles FOR SELECT USING ((auth.uid() = id));


--
-- Name: patient_profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.patient_profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: patient_profiles patient_self_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY patient_self_read ON public.patient_profiles FOR SELECT USING ((id = auth.uid()));


--
-- Name: patient_profiles patient_self_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY patient_self_update ON public.patient_profiles FOR UPDATE USING ((id = auth.uid())) WITH CHECK ((id = auth.uid()));


--
-- Name: insurance_payers payers are public; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "payers are public" ON public.insurance_payers FOR SELECT USING (active);


--
-- Name: provider_individuals; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.provider_individuals ENABLE ROW LEVEL SECURITY;

--
-- Name: provider_individuals provider_individuals_public_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY provider_individuals_public_read ON public.provider_individuals FOR SELECT TO authenticated, anon USING (true);


--
-- Name: provider_insurance; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.provider_insurance ENABLE ROW LEVEL SECURITY;

--
-- Name: provider_locations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.provider_locations ENABLE ROW LEVEL SECURITY;

--
-- Name: provider_profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.provider_profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: provider_profiles provider_self_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY provider_self_update ON public.provider_profiles FOR UPDATE USING ((id = auth.uid())) WITH CHECK ((id = auth.uid()));


--
-- Name: sahie_county; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.sahie_county ENABLE ROW LEVEL SECURITY;

--
-- Name: sahie_county sahie_county public read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "sahie_county public read" ON public.sahie_county FOR SELECT USING (true);


--
-- Name: zip_county_crosswalk zip county crosswalk is public; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "zip county crosswalk is public" ON public.zip_county_crosswalk FOR SELECT USING (true);


--
-- Name: zip_county_crosswalk; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.zip_county_crosswalk ENABLE ROW LEVEL SECURITY;

--
-- Name: zip_enrichment_queue; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.zip_enrichment_queue ENABLE ROW LEVEL SECURITY;

--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: -
--

GRANT USAGE ON SCHEMA public TO postgres;
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;


--
-- Name: FUNCTION touch_updated_at(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.touch_updated_at() TO anon;
GRANT ALL ON FUNCTION public.touch_updated_at() TO authenticated;
GRANT ALL ON FUNCTION public.touch_updated_at() TO service_role;


--
-- Name: TABLE access_codes; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.access_codes TO anon;
GRANT ALL ON TABLE public.access_codes TO authenticated;
GRANT ALL ON TABLE public.access_codes TO service_role;


--
-- Name: SEQUENCE access_codes_id_seq; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON SEQUENCE public.access_codes_id_seq TO anon;
GRANT ALL ON SEQUENCE public.access_codes_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.access_codes_id_seq TO service_role;


--
-- Name: TABLE access_requests; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.access_requests TO anon;
GRANT ALL ON TABLE public.access_requests TO authenticated;
GRANT ALL ON TABLE public.access_requests TO service_role;


--
-- Name: SEQUENCE access_requests_id_seq; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON SEQUENCE public.access_requests_id_seq TO anon;
GRANT ALL ON SEQUENCE public.access_requests_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.access_requests_id_seq TO service_role;


--
-- Name: TABLE appointment_briefings; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.appointment_briefings TO anon;
GRANT ALL ON TABLE public.appointment_briefings TO authenticated;
GRANT ALL ON TABLE public.appointment_briefings TO service_role;


--
-- Name: TABLE appointment_requests; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.appointment_requests TO anon;
GRANT ALL ON TABLE public.appointment_requests TO authenticated;
GRANT ALL ON TABLE public.appointment_requests TO service_role;


--
-- Name: TABLE audit_findings; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.audit_findings TO anon;
GRANT ALL ON TABLE public.audit_findings TO authenticated;
GRANT ALL ON TABLE public.audit_findings TO service_role;


--
-- Name: TABLE audit_log; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.audit_log TO anon;
GRANT ALL ON TABLE public.audit_log TO authenticated;
GRANT ALL ON TABLE public.audit_log TO service_role;


--
-- Name: SEQUENCE audit_log_id_seq; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON SEQUENCE public.audit_log_id_seq TO anon;
GRANT ALL ON SEQUENCE public.audit_log_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.audit_log_id_seq TO service_role;


--
-- Name: TABLE cdc_places; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.cdc_places TO anon;
GRANT ALL ON TABLE public.cdc_places TO authenticated;
GRANT ALL ON TABLE public.cdc_places TO service_role;


--
-- Name: TABLE census_acs_zcta; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.census_acs_zcta TO anon;
GRANT ALL ON TABLE public.census_acs_zcta TO authenticated;
GRANT ALL ON TABLE public.census_acs_zcta TO service_role;


--
-- Name: TABLE clinic_secondary_locations; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.clinic_secondary_locations TO anon;
GRANT ALL ON TABLE public.clinic_secondary_locations TO authenticated;
GRANT ALL ON TABLE public.clinic_secondary_locations TO service_role;


--
-- Name: TABLE clinics; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.clinics TO anon;
GRANT ALL ON TABLE public.clinics TO authenticated;
GRANT ALL ON TABLE public.clinics TO service_role;


--
-- Name: SEQUENCE clinics_id_seq; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON SEQUENCE public.clinics_id_seq TO anon;
GRANT ALL ON SEQUENCE public.clinics_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.clinics_id_seq TO service_role;


--
-- Name: TABLE cms_county_utilization; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.cms_county_utilization TO anon;
GRANT ALL ON TABLE public.cms_county_utilization TO authenticated;
GRANT ALL ON TABLE public.cms_county_utilization TO service_role;


--
-- Name: SEQUENCE cms_county_utilization_id_seq; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON SEQUENCE public.cms_county_utilization_id_seq TO anon;
GRANT ALL ON SEQUENCE public.cms_county_utilization_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.cms_county_utilization_id_seq TO service_role;


--
-- Name: TABLE cms_procedures_full; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.cms_procedures_full TO anon;
GRANT ALL ON TABLE public.cms_procedures_full TO authenticated;
GRANT ALL ON TABLE public.cms_procedures_full TO service_role;


--
-- Name: SEQUENCE cms_procedures_full_id_seq; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON SEQUENCE public.cms_procedures_full_id_seq TO anon;
GRANT ALL ON SEQUENCE public.cms_procedures_full_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.cms_procedures_full_id_seq TO service_role;


--
-- Name: TABLE cms_provider_cache; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.cms_provider_cache TO anon;
GRANT ALL ON TABLE public.cms_provider_cache TO authenticated;
GRANT ALL ON TABLE public.cms_provider_cache TO service_role;


--
-- Name: TABLE cms_zip_procedures; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.cms_zip_procedures TO anon;
GRANT ALL ON TABLE public.cms_zip_procedures TO authenticated;
GRANT ALL ON TABLE public.cms_zip_procedures TO service_role;


--
-- Name: SEQUENCE cms_zip_procedures_id_seq; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON SEQUENCE public.cms_zip_procedures_id_seq TO anon;
GRANT ALL ON SEQUENCE public.cms_zip_procedures_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.cms_zip_procedures_id_seq TO service_role;


--
-- Name: TABLE demand_log; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.demand_log TO anon;
GRANT ALL ON TABLE public.demand_log TO authenticated;
GRANT ALL ON TABLE public.demand_log TO service_role;


--
-- Name: TABLE demographics_raw; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.demographics_raw TO anon;
GRANT ALL ON TABLE public.demographics_raw TO authenticated;
GRANT ALL ON TABLE public.demographics_raw TO service_role;


--
-- Name: SEQUENCE demographics_raw_id_seq; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON SEQUENCE public.demographics_raw_id_seq TO anon;
GRANT ALL ON SEQUENCE public.demographics_raw_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.demographics_raw_id_seq TO service_role;


--
-- Name: TABLE directory_audits; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.directory_audits TO anon;
GRANT ALL ON TABLE public.directory_audits TO authenticated;
GRANT ALL ON TABLE public.directory_audits TO service_role;


--
-- Name: TABLE hpsa_designations; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.hpsa_designations TO anon;
GRANT ALL ON TABLE public.hpsa_designations TO authenticated;
GRANT ALL ON TABLE public.hpsa_designations TO service_role;


--
-- Name: SEQUENCE hpsa_designations_id_seq; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON SEQUENCE public.hpsa_designations_id_seq TO anon;
GRANT ALL ON SEQUENCE public.hpsa_designations_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.hpsa_designations_id_seq TO service_role;


--
-- Name: TABLE insurance_payers; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.insurance_payers TO anon;
GRANT ALL ON TABLE public.insurance_payers TO authenticated;
GRANT ALL ON TABLE public.insurance_payers TO service_role;


--
-- Name: SEQUENCE insurance_payers_id_seq; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON SEQUENCE public.insurance_payers_id_seq TO anon;
GRANT ALL ON SEQUENCE public.insurance_payers_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.insurance_payers_id_seq TO service_role;


--
-- Name: TABLE leie_exclusions; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.leie_exclusions TO anon;
GRANT ALL ON TABLE public.leie_exclusions TO authenticated;
GRANT ALL ON TABLE public.leie_exclusions TO service_role;


--
-- Name: SEQUENCE leie_exclusions_id_seq; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON SEQUENCE public.leie_exclusions_id_seq TO anon;
GRANT ALL ON SEQUENCE public.leie_exclusions_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.leie_exclusions_id_seq TO service_role;


--
-- Name: TABLE market_benchmarks; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.market_benchmarks TO anon;
GRANT ALL ON TABLE public.market_benchmarks TO authenticated;
GRANT ALL ON TABLE public.market_benchmarks TO service_role;


--
-- Name: TABLE medicare_county_enrollment; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.medicare_county_enrollment TO anon;
GRANT ALL ON TABLE public.medicare_county_enrollment TO authenticated;
GRANT ALL ON TABLE public.medicare_county_enrollment TO service_role;


--
-- Name: TABLE npi_activity; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.npi_activity TO anon;
GRANT ALL ON TABLE public.npi_activity TO authenticated;
GRANT ALL ON TABLE public.npi_activity TO service_role;


--
-- Name: TABLE patient_profiles; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.patient_profiles TO anon;
GRANT ALL ON TABLE public.patient_profiles TO authenticated;
GRANT ALL ON TABLE public.patient_profiles TO service_role;


--
-- Name: TABLE provider_individuals; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.provider_individuals TO anon;
GRANT ALL ON TABLE public.provider_individuals TO authenticated;
GRANT ALL ON TABLE public.provider_individuals TO service_role;


--
-- Name: TABLE provider_insurance; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.provider_insurance TO anon;
GRANT ALL ON TABLE public.provider_insurance TO authenticated;
GRANT ALL ON TABLE public.provider_insurance TO service_role;


--
-- Name: SEQUENCE provider_insurance_id_seq; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON SEQUENCE public.provider_insurance_id_seq TO anon;
GRANT ALL ON SEQUENCE public.provider_insurance_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.provider_insurance_id_seq TO service_role;


--
-- Name: TABLE provider_locations; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.provider_locations TO anon;
GRANT ALL ON TABLE public.provider_locations TO authenticated;
GRANT ALL ON TABLE public.provider_locations TO service_role;


--
-- Name: TABLE provider_profiles; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.provider_profiles TO anon;
GRANT ALL ON TABLE public.provider_profiles TO authenticated;
GRANT ALL ON TABLE public.provider_profiles TO service_role;


--
-- Name: TABLE sahie_county; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.sahie_county TO anon;
GRANT ALL ON TABLE public.sahie_county TO authenticated;
GRANT ALL ON TABLE public.sahie_county TO service_role;


--
-- Name: TABLE zip_county_crosswalk; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.zip_county_crosswalk TO anon;
GRANT ALL ON TABLE public.zip_county_crosswalk TO authenticated;
GRANT ALL ON TABLE public.zip_county_crosswalk TO service_role;


--
-- Name: SEQUENCE zip_county_crosswalk_id_seq; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON SEQUENCE public.zip_county_crosswalk_id_seq TO anon;
GRANT ALL ON SEQUENCE public.zip_county_crosswalk_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.zip_county_crosswalk_id_seq TO service_role;


--
-- Name: TABLE zip_enrichment_queue; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.zip_enrichment_queue TO anon;
GRANT ALL ON TABLE public.zip_enrichment_queue TO authenticated;
GRANT ALL ON TABLE public.zip_enrichment_queue TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: -
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: -
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: -
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: -
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: -
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: -
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO service_role;


--
-- PostgreSQL database dump complete
--


