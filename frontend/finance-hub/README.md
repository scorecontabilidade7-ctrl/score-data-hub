# Frontend - Finance Hub

Interface de usuário moderna para o Score Data Hub, focada em análise financeira empresarial.

## 🎨 Funcionalidades

- **Dashboard Financeiro**: Visão geral de KPIs (Faturamento, Custos, Margem, Lucro).
- **DFC (Demonstrativo de Fluxo de Caixa)**: Visão detalhada por regime de caixa.
- **DRE (Demonstrativo de Resultados)**: Análise por regime de competência.
- **Extrato Bancário**: Listagem detalhada de todas as movimentações.
- **Filtros Dinâmicos**: Filtragem por período de datas e regime de visualização.

## 🛠️ Tecnologias

- **Vite + React + TypeScript**
- **Tailwind CSS**: Estilização moderna e responsiva.
- **Shadcn UI**: Componentes de UI de alta qualidade.
- **TanStack Query**: Gerenciamento de estado assíncrono e cache.
- **Recharts**: Visualização de dados com gráficos interativos.
- **Lucide React**: Biblioteca de ícones.

## 📂 Estrutura de Pastas

- `src/components/dashboard`: Componentes específicos do painel financeiro.
- `src/hooks`: Hooks personalizados para busca e manipulação de dados (`useFinanceData`).
- `src/integrations/supabase`: Clientes de integração com o banco de dados.
- `src/lib`: Utilitários e funções auxiliares.

## 🚀 Como Iniciar

1. Instale as dependências:
```bash
npm install
```

2. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

3. (Opcional) Gere o build de produção:
```bash
npm run build
```

## 🔐 Variáveis de Ambiente (.env)

O projeto requer as seguintes variáveis:
```env
VITE_SUPABASE_URL=seu_url_supabase
VITE_SUPABASE_PUBLISHABLE_KEY=sua_chave_publica
```
