import { createClient } from '@supabase/supabase-js';

const EXTERNAL_SUPABASE_URL = import.meta.env.VITE_FINANCIAL_SUPABASE_URL;
const EXTERNAL_SUPABASE_KEY = import.meta.env.VITE_FINANCIAL_SUPABASE_ANON_KEY;

export const externalSupabase = createClient(EXTERNAL_SUPABASE_URL, EXTERNAL_SUPABASE_KEY);

// Projeto Sólides — dados de RH (colaboradores, perfis DISC, mapa de talentos)
const SOLIDES_SUPABASE_URL = import.meta.env.VITE_SOLIDES_SUPABASE_URL;
const SOLIDES_SUPABASE_KEY = import.meta.env.VITE_SOLIDES_SUPABASE_ANON_KEY;

export const solidesSupabase = createClient(SOLIDES_SUPABASE_URL, SOLIDES_SUPABASE_KEY);
