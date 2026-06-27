# Backend - Supabase Infrastructure

Este módulo gerencia a infraestrutura de dados e autenticação do Score Data Hub.

O banco de dados é hospedado no Supabase, utilizando recursos de Autenticação, Row Level Security (RLS) e Edge Functions para centralizar o Data Hub de forma segura.

## 💾 Banco de Dados (PostgreSQL)

O sistema utiliza tabelas tanto no schema `public` quanto no schema `score` para armazenar as regras de negócio.

### Autenticação e Perfis:
- `datahub_profiles`: Tabela de perfis associada à tabela `auth.users` do Supabase. Armazena o Perfil de acesso (`admin`, `usuario`, `gerente`), os módulos liberados, os dashboards e a Chave de API de Inteligência Artificial. Alimentada automaticamente via Trigger.
- `datahub_user_role`: Tipo ENUM que define os papéis de acesso ao sistema.

### Tabelas de Negócio Principais:
- `fluxo_caixa`: Tabela central de movimentações (upsert via ETL).
- `plano_contas`: Hierarquia de categorias financeiras.
- `formas_pagamento`: Métodos de pagamento suportados.
- `orcamento_previsto`: Dados projetados de orçamento (Financeiro).
- `rh_headcount_dept`, `rh_distribuicao_disc`, `rh_mapa_talentos`, `rh_kpis_rh`: Tabelas consumidas pelo módulo de Recursos Humanos, geradas através do Pipeline ETL.
- `movimentacao_financeira`: View consolidada para consumo do Frontend.

## ⚡ Edge Functions

As funções serverless rodam sob demanda dentro da plataforma do Supabase, isoladas do front-end e do ETL Python.

### `datahub_create_user`
- Função exposta em `/functions/v1/datahub_create_user`.
- Utilizada pelo Painel Admin do Frontend para criar usuários no Supabase ignorando restrições de Signup público. 
- Valida o token JWT (apenas administradores podem invocar) e utiliza a `SERVICE_ROLE_KEY` internamente para se comunicar com a Admin Auth API e provisionar credenciais e metadata (incluindo Módulos, Dashboards e Chave IA).

## 🛠️ Gerenciamento (CLI)

O projeto utiliza o Supabase CLI para gerenciamento local e versionamento em Git. O arquivo `config.toml` vincula esta pasta ao projeto remoto.

### Comandos Comuns:
1. Iniciar localmente (apenas para testes locais isolados):
```bash
supabase start
```

2. Aplicar migrações ao banco conectado:
```bash
supabase db push
```

3. Realizar o Deploy da Edge Function:
```bash
supabase functions deploy datahub_create_user
```

## 🔒 Segurança

- Todo o acesso aos dados é protegido por políticas de **RLS (Row Level Security)** estritas. Somente usuários autenticados conseguem executar chamadas de leitura (`SELECT`) aos relatórios e gráficos.
- Os perfis de outros usuários na `datahub_profiles` só podem ser lidos por quem tiver a role de `admin`.
- O processo de ETL utiliza a `SERVICE_ROLE_KEY` para as operações massivas de escrita (`INSERT` / `UPSERT`), ignorando o RLS, para alimentar as bases de forma segura, pois o ETL roda num servidor protegido.
- O Frontend sempre utiliza a `ANON_KEY`, limitando severamente a manipulação de dados a favor da segurança.
