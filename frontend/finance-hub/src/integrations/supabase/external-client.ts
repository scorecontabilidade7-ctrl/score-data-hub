import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// No nosso novo modelo consolidado, todas as tabelas (Datahub, Financeiro, Solides)
// estão no mesmo projeto do Supabase. Portanto, reaproveitamos as mesmas credenciais.
export const externalSupabase = createClient(SUPABASE_URL, SUPABASE_KEY);
export const solidesSupabase = createClient(SUPABASE_URL, SUPABASE_KEY);
