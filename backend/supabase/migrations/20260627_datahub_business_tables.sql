-- Migração das tabelas de negócio (27/06/2026)
-- Extraídas a partir do schema atual em produção no projeto Supabase

CREATE TABLE IF NOT EXISTS public.datahub_formas_pagamento (
    codigo bigint NOT NULL,
    nome text,
    formaPgtoNFCe bigint,
    tipoCusto bigint,
    valorCusto numeric,
    codDisponivel bigint,
    PRIMARY KEY (codigo)
);

CREATE TABLE IF NOT EXISTS public.datahub_plano_contas (
    codigo bigint NOT NULL,
    nome text,
    codPai bigint,
    tipo bigint,
    creditar numeric,
    debitar numeric,
    registroPadrao boolean,
    PRIMARY KEY (codigo)
);

CREATE TABLE IF NOT EXISTS public.datahub_pagamentos (
    codigo bigint NOT NULL,
    numDoc text,
    descricao text,
    valor numeric,
    taxa numeric,
    data date,
    dtVenc date,
    dtPgto date,
    dtCad date,
    dtComp date,
    situacao text,
    codContato bigint,
    nomeContato text,
    origem text,
    codDisponivel bigint,
    codModulo bigint,
    obs text,
    tags text,
    codPlanoContas text,
    codFormaPgto bigint,
    codCaixa bigint,
    codRecibo bigint,
    PRIMARY KEY (codigo)
);

CREATE TABLE IF NOT EXISTS public.datahub_recebimentos (
    codigo bigint NOT NULL,
    numDoc text,
    descricao text,
    valor numeric,
    taxa numeric,
    data date,
    dtVenc date,
    dtPgto date,
    dtCad date,
    dtComp date,
    situacao text,
    codContato bigint,
    nomeContato text,
    origem text,
    codDisponivel bigint,
    codModulo bigint,
    obs text,
    tags text,
    codPlanoContas text,
    codFormaPgto bigint,
    codCaixa bigint,
    codRecibo bigint,
    PRIMARY KEY (codigo)
);

CREATE TABLE IF NOT EXISTS public.datahub_movimentacao_financeira (
    codigo bigint,
    data date,
    taxa numeric,
    valor numeric,
    descricao text,
    numDoc text,
    dfc_grupo text,
    dfc_mascara text,
    categoria_macro text,
    categoria_lancamento text,
    cliente_fornecedor text,
    valor_liquido numeric,
    data_competencia date,
    tipo_movimento text,
    data_pagamento date,
    data_emissao date,
    codRecibo bigint,
    codCaixa bigint,
    codFormaPgto bigint,
    codPlanoContas text,
    tags text,
    obs text,
    codModulo bigint,
    codDisponivel bigint,
    origem text,
    codContato bigint,
    nomeContato text,
    situacao text,
    dtComp date,
    dtCad date,
    dtPgto date,
    dtVenc date
);

-- Ativando o RLS nas tabelas, conforme fizemos na security migration
ALTER TABLE public.datahub_formas_pagamento ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.datahub_plano_contas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.datahub_pagamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.datahub_recebimentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.datahub_movimentacao_financeira ENABLE ROW LEVEL SECURITY;
