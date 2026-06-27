# Solides People Pipeline

Pipeline de engenharia de dados com **Arquitetura Medallion** para integração com a API do Tangerino/Solides.

Extrai dados completos de RH e setor pessoal, transforma e persiste em **PostgreSQL (Supabase)** em três camadas: Bronze, Silver e Gold.

---

## Arquitetura Medallion

```
+-------------------------------------------------+
|           API Tangerino (employer)              |
|  employer.tangerino.com.br                      |
+-----------------------+-------------------------+
                        |
                        v  extractor.py
+-------------------------------------------------+
|  BRONZE  (schema: bronze)                       |
|  JSON bruto da API, sem transformacao           |
|  colaboradores · cargos · departamentos         |
|  ajuste_motivos · ajustes · feriados · pontos   |
+-----------------------+-------------------------+
                        |
                        v  transformer.py
+-------------------------------------------------+
|  SILVER  (schema: silver)                       |
|  Dados limpos, tipados e normalizados           |
|  colaboradores · cargos · departamentos         |
|  ajuste_motivos · ajustes · feriados · pontos   |
+-----------------------+-------------------------+
                        |
                        v  aggregator.py
+-------------------------------------------------+
|  GOLD  (schema: gold)                           |
|  Agregado e otimizado para o frontend           |
|  headcount_dept · distribuicao_disc             |
|  mapa_talentos · kpis_rh                        |
+-----------------------+-------------------------+
                        |
                        v
+-------------------------------------------------+
|  React Dashboard (Score Data Hub)               |
+-------------------------------------------------+
```

---

## Estrutura do Projeto

```
solides-people-pipeline/
|
+-- pipeline.py                     # Orquestrador principal (entry point)
+-- requirements.txt
+-- .env.example
|
+-- config/
|   +-- settings.py                 # Configuracoes via pydantic-settings
|   +-- database.py                 # Conexao SQLAlchemy + inicializacao
|
+-- layers/
|   +-- bronze/
|   |   +-- extractor.py            # Extracao da API Tangerino
|   +-- silver/
|   |   +-- transformer.py          # Limpeza e normalizacao
|   +-- gold/
|       +-- aggregator.py           # Agregacoes para o React
|
+-- models/
|   +-- bronze.py                   # SQLAlchemy models — camada Bronze
|   +-- silver.py                   # SQLAlchemy models — camada Silver
|   +-- gold.py                     # SQLAlchemy models — camada Gold
|
+-- utils/
    +-- logger.py                   # Logger estruturado
    +-- retry.py                    # Retry automatico com tenacity
```

---

## Instalacao

### 1. Pre-requisitos
- Python 3.11+
- Conta Supabase (ou PostgreSQL 14+)

### 2. Ambiente virtual
```bash
python -m venv venv

# Windows
venv\Scripts\activate

# Linux / Mac
source venv/bin/activate
```

### 3. Dependencias
```bash
pip install -r requirements.txt
```

### 4. Variaveis de ambiente
```bash
cp .env.example .env
```

Edite o `.env`:
```env
# API Tangerino
SOLIDES_TOKEN=seu_token_base64_aqui
SOLIDES_BASE_URL=https://employer.tangerino.com.br

# PostgreSQL / Supabase (usar connection pooler para IPv4)
DB_HOST=aws-0-<regiao>.pooler.supabase.com
DB_PORT=6543
DB_NAME=postgres
DB_USER=postgres.<project-ref>
DB_PASSWORD=sua_senha
```

> O token e obtido em: **Configuracoes -> Integracoes -> API** na plataforma Tangerino.
> O valor do token deve conter apenas o hash Base64, sem o prefixo "Basic ".

### 5. Banco de dados
O pipeline cria automaticamente os schemas `bronze`, `silver` e `gold` na primeira execucao. Nenhuma migracao manual e necessaria.

---

## Execucao

```bash
# Pipeline completo (Bronze -> Silver -> Gold)
python pipeline.py

# Rodar apenas uma camada
python pipeline.py --layer bronze
python pipeline.py --layer silver
python pipeline.py --layer gold
```

---

## Dados Extraidos

### Bronze e Silver — tabelas espelhadas

| Tabela | Endpoint API | Descricao |
|--------|-------------|-----------|
| `colaboradores` | `GET /employee/find-all` | Cadastro completo dos funcionarios |
| `cargos` | `GET /job-role/find-all` | Cargos/funcoes da empresa |
| `departamentos` | `GET /workplace/find-all` | Locais de trabalho / departamentos |
| `ajuste_motivos` | `GET /adjustment-reason/find-all` | Motivos de ajuste (ferias, atestado, etc.) |
| `ajustes` | `GET /adjustment/find-all` | Registros de ajuste de ponto e afastamentos |
| `feriados` | `GET /holiday-calendar/` | Calendario de feriados da empresa |
| `pontos` | `GET /external/api/v1/payssego/punches/{id}` | Batidas de ponto por colaborador |

### Gold — consumidas pelo React

| Tabela | Descricao |
|--------|-----------|
| `gold.kpis_rh` | KPIs gerais: total, ativos, afastados, admissoes do mes |
| `gold.headcount_dept` | Headcount por departamento e status |
| `gold.distribuicao_disc` | Distribuicao de perfis comportamentais por departamento |
| `gold.mapa_talentos` | Um registro por colaborador com cargo, departamento e tempo de empresa |

---

## Fluxo de dados

| Camada | Responsabilidade | Granularidade |
|--------|-----------------|---------------|
| **Bronze** | Persistir o JSON bruto da API intacto | 1 registro = 1 resposta da API |
| **Silver** | Tipagem, normalizacao, limpeza de nulos | 1 registro = 1 entidade de negocio |
| **Gold** | Agregacoes, KPIs, joins entre entidades | 1 registro = 1 metrica de negocio |

---

## Queries para o React

```sql
-- KPIs do dashboard
SELECT * FROM gold.kpis_rh ORDER BY refreshed_at DESC LIMIT 1;

-- Headcount por departamento
SELECT departamento_nome, total_ativos, total_afastados, total_ferias, total_geral
FROM gold.headcount_dept
ORDER BY total_geral DESC;

-- Colaboradores com dados completos
SELECT nome, cargo_nome, departamento_nome, status, data_admissao
FROM silver.colaboradores
WHERE status = 'ativo'
ORDER BY nome;

-- Ajustes/afastamentos por colaborador
SELECT a.colaborador_nome, a.data_inicio, a.data_fim, a.motivo_descricao, a.observacao
FROM silver.ajustes a
ORDER BY a.data_inicio DESC;

-- Batidas de ponto por dia
SELECT colaborador_id, data_trabalhada, hora_entrada, hora_saida, horas_trabalhadas, status
FROM silver.pontos
ORDER BY data_trabalhada DESC, colaborador_id;

-- Feriados do ano
SELECT descricao, data, calendario_nome
FROM silver.feriados
ORDER BY data;
```
