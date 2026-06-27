-- ============================================================
-- Sólides People Pipeline — DDL completo
-- Arquitetura Medallion: Bronze | Silver | Gold
-- Executado automaticamente pelo pipeline.py via SQLAlchemy
-- ============================================================

-- Schemas
CREATE SCHEMA IF NOT EXISTS bronze;
CREATE SCHEMA IF NOT EXISTS silver;
CREATE SCHEMA IF NOT EXISTS gold;

-- ──────────────────────────────────────────
-- BRONZE — dados brutos
-- ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS bronze.colaboradores (
    id          SERIAL PRIMARY KEY,
    solides_id  VARCHAR(100) NOT NULL,
    raw_json    JSONB        NOT NULL,
    ingested_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ           DEFAULT NOW(),
    source      VARCHAR(50)           DEFAULT 'solides_dp',
    CONSTRAINT uq_bronze_colab_solides_id UNIQUE (solides_id)
);

CREATE TABLE IF NOT EXISTS bronze.cargos (
    id          SERIAL PRIMARY KEY,
    solides_id  VARCHAR(100) NOT NULL,
    raw_json    JSONB        NOT NULL,
    ingested_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ           DEFAULT NOW(),
    CONSTRAINT uq_bronze_cargo_solides_id UNIQUE (solides_id)
);

CREATE TABLE IF NOT EXISTS bronze.departamentos (
    id          SERIAL PRIMARY KEY,
    solides_id  VARCHAR(100) NOT NULL,
    raw_json    JSONB        NOT NULL,
    ingested_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ           DEFAULT NOW(),
    CONSTRAINT uq_bronze_depto_solides_id UNIQUE (solides_id)
);

CREATE TABLE IF NOT EXISTS bronze.perfis (
    id              SERIAL PRIMARY KEY,
    colaborador_id  VARCHAR(100) NOT NULL,
    raw_json        JSONB        NOT NULL,
    ingested_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ           DEFAULT NOW(),
    source          VARCHAR(50)           DEFAULT 'solides_gestao',
    CONSTRAINT uq_bronze_perfil_colab_id UNIQUE (colaborador_id)
);

-- ──────────────────────────────────────────
-- SILVER — dados limpos e normalizados
-- ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS silver.colaboradores (
    id                  SERIAL PRIMARY KEY,
    solides_id          VARCHAR(100) NOT NULL,
    nome                VARCHAR(200),
    email               VARCHAR(200),
    cpf                 VARCHAR(20),
    data_nascimento     DATE,
    data_admissao       DATE,
    data_demissao       DATE,
    status              VARCHAR(50),
    genero              VARCHAR(30),
    cargo_id            VARCHAR(100),
    cargo_nome          VARCHAR(200),
    departamento_id     VARCHAR(100),
    departamento_nome   VARCHAR(200),
    salario             NUMERIC(12,2),
    tipo_contrato       VARCHAR(50),
    processed_at        TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_silver_colab_solides_id UNIQUE (solides_id)
);

CREATE TABLE IF NOT EXISTS silver.cargos (
    id           SERIAL PRIMARY KEY,
    solides_id   VARCHAR(100) NOT NULL,
    nome         VARCHAR(200),
    nivel        VARCHAR(100),
    area         VARCHAR(200),
    ativo        VARCHAR(10) DEFAULT 'true',
    processed_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_silver_cargo_solides_id UNIQUE (solides_id)
);

CREATE TABLE IF NOT EXISTS silver.departamentos (
    id           SERIAL PRIMARY KEY,
    solides_id   VARCHAR(100) NOT NULL,
    nome         VARCHAR(200),
    responsavel  VARCHAR(200),
    ativo        VARCHAR(10) DEFAULT 'true',
    processed_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_silver_depto_solides_id UNIQUE (solides_id)
);

CREATE TABLE IF NOT EXISTS silver.perfis (
    id                  SERIAL PRIMARY KEY,
    colaborador_id      VARCHAR(100) NOT NULL,
    perfil_dominante    VARCHAR(50),
    score_executor      NUMERIC(5,2),
    score_comunicador   NUMERIC(5,2),
    score_planejador    NUMERIC(5,2),
    score_analista      NUMERIC(5,2),
    nivel_energia       NUMERIC(5,2),
    indice_satisfacao   NUMERIC(5,2),
    data_aplicacao      DATE,
    processed_at        TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_silver_perfil_colab_id UNIQUE (colaborador_id)
);

-- ──────────────────────────────────────────
-- GOLD — pronto para o React
-- ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS gold.headcount_dept (
    id                  SERIAL PRIMARY KEY,
    departamento_id     VARCHAR(100),
    departamento_nome   VARCHAR(200),
    total_ativos        INTEGER DEFAULT 0,
    total_afastados     INTEGER DEFAULT 0,
    total_ferias        INTEGER DEFAULT 0,
    total_geral         INTEGER DEFAULT 0,
    refreshed_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS gold.distribuicao_disc (
    id                  SERIAL PRIMARY KEY,
    departamento_nome   VARCHAR(200),
    perfil_dominante    VARCHAR(50),
    quantidade          INTEGER DEFAULT 0,
    percentual          NUMERIC(5,2),
    refreshed_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS gold.mapa_talentos (
    id                  SERIAL PRIMARY KEY,
    colaborador_id      VARCHAR(100),
    colaborador_nome    VARCHAR(200),
    cargo_nome          VARCHAR(200),
    departamento_nome   VARCHAR(200),
    perfil_dominante    VARCHAR(50),
    nivel_energia       NUMERIC(5,2),
    indice_satisfacao   NUMERIC(5,2),
    tempo_empresa_meses INTEGER,
    refreshed_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS gold.kpis_rh (
    id                      SERIAL PRIMARY KEY,
    total_colaboradores     INTEGER DEFAULT 0,
    total_ativos            INTEGER DEFAULT 0,
    total_afastados         INTEGER DEFAULT 0,
    total_ferias            INTEGER DEFAULT 0,
    admissoes_mes_atual     INTEGER DEFAULT 0,
    perc_profiler_aplicado  NUMERIC(5,2),
    perc_ativos             NUMERIC(5,2),
    refreshed_at            TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_bronze_colab_ingested  ON bronze.colaboradores (ingested_at);
CREATE INDEX IF NOT EXISTS idx_silver_colab_status    ON silver.colaboradores  (status);
CREATE INDEX IF NOT EXISTS idx_silver_colab_depto     ON silver.colaboradores  (departamento_id);
CREATE INDEX IF NOT EXISTS idx_silver_perfil_dominante ON silver.perfis        (perfil_dominante);
CREATE INDEX IF NOT EXISTS idx_gold_headcount_depto   ON gold.headcount_dept   (departamento_nome);
CREATE INDEX IF NOT EXISTS idx_gold_disc_depto        ON gold.distribuicao_disc (departamento_nome);
