-- Tabelas RH no projeto financeiro (yuddpeadtlfwtceoaqpm)
-- Execute UMA VEZ no SQL Editor do Supabase do projeto financeiro
-- Depois o ETL popula automaticamente via SDK

CREATE TABLE IF NOT EXISTS public.rh_kpis_rh (
    id                     SERIAL PRIMARY KEY,
    total_colaboradores    INTEGER DEFAULT 0,
    total_ativos           INTEGER DEFAULT 0,
    total_afastados        INTEGER DEFAULT 0,
    total_ferias           INTEGER DEFAULT 0,
    admissoes_mes_atual    INTEGER DEFAULT 0,
    perc_profiler_aplicado FLOAT,
    perc_ativos            FLOAT,
    refreshed_at           TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.rh_headcount_dept (
    id                SERIAL PRIMARY KEY,
    departamento_id   TEXT,
    departamento_nome TEXT,
    total_ativos      INTEGER DEFAULT 0,
    total_afastados   INTEGER DEFAULT 0,
    total_ferias      INTEGER DEFAULT 0,
    total_geral       INTEGER DEFAULT 0,
    refreshed_at      TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.rh_distribuicao_disc (
    id               SERIAL PRIMARY KEY,
    departamento_nome TEXT,
    perfil_dominante  TEXT,
    quantidade        INTEGER DEFAULT 0,
    percentual        FLOAT,
    refreshed_at      TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.rh_mapa_talentos (
    id                   SERIAL PRIMARY KEY,
    colaborador_id        TEXT,
    colaborador_nome      TEXT,
    cargo_nome            TEXT,
    departamento_nome     TEXT,
    perfil_dominante      TEXT,
    nivel_energia         FLOAT,
    indice_satisfacao     FLOAT,
    tempo_empresa_meses   INTEGER,
    refreshed_at          TIMESTAMPTZ
);
