-- Tabela de orçamento previsto para o módulo de Planejamento Orçamentário
-- Criada no schema public para ser exposta pela API do Supabase

-- Remove tabela antiga no schema score se existir
drop table if exists score.orcamento_previsto;

create table if not exists public.orcamento_previsto (
  id                   bigserial primary key,
  ano                  smallint      not null,
  mes                  smallint      not null check (mes between 1 and 12),
  dfc_mascara          text          not null,
  categoria_macro      text          not null,
  categoria_lancamento text          not null,
  valor_previsto       numeric(15,2) not null default 0,
  criado_em            timestamptz   not null default now(),
  atualizado_em        timestamptz   not null default now(),

  constraint orcamento_previsto_unique unique (ano, mes, dfc_mascara, categoria_macro, categoria_lancamento)
);

create index if not exists idx_orcamento_previsto_ano_mes
  on public.orcamento_previsto (ano, mes);

create or replace function public.set_orcamento_atualizado_em()
returns trigger language plpgsql as $$
begin
  new.atualizado_em = now();
  return new;
end;
$$;

drop trigger if exists trg_orcamento_previsto_atualizado_em on public.orcamento_previsto;

create trigger trg_orcamento_previsto_atualizado_em
  before update on public.orcamento_previsto
  for each row execute function public.set_orcamento_atualizado_em();

alter table public.orcamento_previsto enable row level security;

drop policy if exists "orcamento_previsto_select" on public.orcamento_previsto;
drop policy if exists "orcamento_previsto_upsert" on public.orcamento_previsto;
drop policy if exists "orcamento_previsto_update" on public.orcamento_previsto;

create policy "orcamento_previsto_select"
  on public.orcamento_previsto for select using (true);

create policy "orcamento_previsto_upsert"
  on public.orcamento_previsto for insert with check (true);

create policy "orcamento_previsto_update"
  on public.orcamento_previsto for update using (true);
