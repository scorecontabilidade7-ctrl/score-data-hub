-- Migração consolidada das atualizações de segurança e autenticação (27/06/2026)
-- Este script reflete as alterações feitas diretamente no Supabase em produção.

-- 1. Criação do tipo ENUM para perfis de usuário
DO $$ BEGIN
    CREATE TYPE public.datahub_user_role AS ENUM ('admin', 'gerente', 'usuario');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Criação da tabela de perfis (datahub_profiles)
CREATE TABLE IF NOT EXISTS public.datahub_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT NOT NULL,
    role public.datahub_user_role NOT NULL DEFAULT 'usuario',
    modules TEXT[] DEFAULT ARRAY[]::TEXT[],
    dashboards TEXT[] DEFAULT ARRAY[]::TEXT[],
    ai_api_key TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Habilitar RLS na tabela de perfis e criar políticas
ALTER TABLE public.datahub_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuários podem ler o próprio perfil" ON public.datahub_profiles;
CREATE POLICY "Usuários podem ler o próprio perfil"
ON public.datahub_profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

DROP POLICY IF EXISTS "Apenas admins podem gerenciar todos os perfis" ON public.datahub_profiles;
CREATE POLICY "Apenas admins podem gerenciar todos os perfis"
ON public.datahub_profiles FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.datahub_profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- 4. Função e Trigger para criar o perfil automaticamente quando um usuário for criado na auth.users
CREATE OR REPLACE FUNCTION public.datahub_handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  -- Cria o perfil apenas se o metadata 'system' indicar que é o nosso sistema 'datahub'
  IF NEW.raw_user_meta_data->>'system' = 'datahub' THEN
    INSERT INTO public.datahub_profiles (id, username, role, modules, dashboards, ai_api_key)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
      COALESCE(NEW.raw_user_meta_data->>'role', 'usuario')::public.datahub_user_role,
      ARRAY(SELECT jsonb_array_elements_text(COALESCE(NEW.raw_user_meta_data->'modules', '["financeiro"]'::jsonb))),
      ARRAY(SELECT jsonb_array_elements_text(COALESCE(NEW.raw_user_meta_data->'dashboards', '["visao-geral"]'::jsonb))),
      NEW.raw_user_meta_data->>'ai_api_key'
    );
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.datahub_handle_new_user();

-- 5. Aplicação de Políticas de RLS de Leitura para tabelas de sistema
-- (Apenas usuários autenticados com acesso ao Datahub devem ler essas tabelas, a escrita é feita via ETL em SERVICE_ROLE)

DO $$
DECLARE
    tabela TEXT;
    tabelas TEXT[] := ARRAY['fluxo_caixa', 'formas_pagamento', 'plano_contas', 'orcamento_previsto', 'rh_headcount_dept', 'rh_distribuicao_disc', 'rh_mapa_talentos', 'rh_kpis_rh'];
BEGIN
    FOREACH tabela IN ARRAY tabelas LOOP
        -- Verifica se a tabela existe no schema public (onde a maioria foi criada) ou score
        IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = tabela) THEN
            EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tabela);
            EXECUTE format('DROP POLICY IF EXISTS "Autenticados podem visualizar %I" ON public.%I', tabela, tabela);
            EXECUTE format('CREATE POLICY "Autenticados podem visualizar %I" ON public.%I FOR SELECT TO authenticated USING (true)', tabela, tabela);
        ELSIF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'score' AND tablename = tabela) THEN
            EXECUTE format('ALTER TABLE score.%I ENABLE ROW LEVEL SECURITY', tabela);
            EXECUTE format('DROP POLICY IF EXISTS "Autenticados podem visualizar %I" ON score.%I', tabela, tabela);
            EXECUTE format('CREATE POLICY "Autenticados podem visualizar %I" ON score.%I FOR SELECT TO authenticated USING (true)', tabela, tabela);
        END IF;
    END LOOP;
END $$;
