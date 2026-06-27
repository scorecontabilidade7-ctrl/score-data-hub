# Módulo ETL - Score Data Hub

Este módulo é responsável pela ingestão de dados financeiros no Data Hub. Ele extrai informações do sistema eGestor, realiza a limpeza e transformação, e sincroniza os dados no banco de dados Supabase.

## 📋 Arquitetura de Dados

O pipeline segue as seguintes etapas:
1. **Extração**: Busca dados de recebimentos, pagamentos e plano de contas via API REST do eGestor.
2. **Transformação**: Processamento com Pandas para garantir tipos de dados corretos e tratamento de nulos.
3. **Carga**: Operações de UPSERT no banco de dados PostgreSQL (schema `score`).

## 📂 Estrutura de Pastas

```text
etl/
├── core/                # Lógica compartilhada (conexão Supabase, loaders)
│   └── loader.py
├── sources/             # Adaptadores para cada fonte de dados
│   └── egestor/         # Scripts específicos do eGestor
│       ├── auth_manager.py
│       ├── extractor.py
│       └── transformer.py
├── utils/               # Scripts de teste e depuração
│   ├── debug_api.py
│   └── teste_conexao.py
├── main.py              # Orquestrador principal do pipeline
└── requirements.txt     # Dependências do projeto
```

## ⚙️ Configuração

### Variáveis de Ambiente (.env)
O arquivo `.env` deve ser mantido dentro da pasta `etl/`.
```env
SUPABASE_URL=seu_url_supabase
SUPABASE_KEY=sua_chave_service_role
EGESTOR_BASE_URL=https://api.egestor.com.br/api
EGESTOR_CLIENT_ID=seu_client_id
EGESTOR_CLIENT_SECRET=seu_client_secret
```

## 🚀 Como Executar

1. Instale as dependências:
```bash
pip install -r requirements.txt
```

2. Execute o pipeline principal:
```bash
python main.py
```
