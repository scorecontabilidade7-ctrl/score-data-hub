# Score Data Hub

O **Score Data Hub** é uma plataforma de inteligência de dados projetada para consolidar, transformar e visualizar indicadores financeiros e operacionais. O sistema integra dados de fontes externas (como eGestor e Pluggy) em um Data Warehouse no Supabase e os apresenta em um dashboard moderno e intuitivo.

## 🏗️ Arquitetura do Projeto

O projeto está organizado em três módulos principais para facilitar a manutenção e escalabilidade:

### 1. [ETL (Extract, Transform, Load)](file:///c:/Users/User/Projetos/score_data_hub/etl)
Módulo em **Python** responsável por:
- Conectar às APIs do eGestor e Pluggy.
- Extrair dados financeiros (recebimentos, pagamentos, plano de contas).
- Transformar e limpar os dados usando Pandas.
- Fazer o carregamento (UPSERT) no schema `score` do Supabase.

### 2. [Backend](file:///c:/Users/User/Projetos/score_data_hub/backend)
Infraestrutura baseada no **Supabase**:
- Gerenciamento do banco de dados PostgreSQL.
- Configuração do CLI para migrações e Edge Functions.
- Autenticação e segurança de dados.

### 3. [Frontend (Finance Hub)](file:///c:/Users/User/Projetos/score_data_hub/frontend/finance-hub)
Interface de usuário moderna construída com:
- **React + TypeScript + Vite**.
- **Tailwind CSS + Shadcn UI** para design consistente.
- **TanStack Query** para gerenciamento de estado e cache de dados.
- Dashboards interativos (DFC, DRE, Indicadores e Extratos).

## 🚀 Como Iniciar

### Pré-requisitos
- Node.js (v20+)
- Python (v3.10+)
- Supabase CLI (opcional para desenvolvimento backend)

### Execução Rápida
Para rodar o dashboard localmente:
```bash
cd frontend/finance-hub
npm install
npm run dev
```

Para rodar a sincronização de dados:
```bash
cd etl
pip install -r requirements.txt
python main.py
```

## 🛠️ Tecnologias Principais
- **Frontend**: React, Tailwind, Lucide React, Recharts.
- **Backend/DB**: Supabase (PostgreSQL).
- **ETL**: Python, Pandas, Requests.

---
Desenvolvido por **Score Tecnologia**.