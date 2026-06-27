import { useQuery } from "@tanstack/react-query";
import { solidesSupabase } from "@/integrations/supabase/external-client";

export interface KpisRH {
  id: number;
  total_colaboradores: number;
  total_ativos: number;
  total_afastados: number;
  total_ferias: number;
  admissoes_mes_atual: number;
  perc_profiler_aplicado: number;
  perc_ativos: number;
  refreshed_at: string;
}

export interface HeadcountDept {
  id: number;
  departamento_id: string;
  departamento_nome: string;
  total_ativos: number;
  total_afastados: number;
  total_ferias: number;
  total_geral: number;
  refreshed_at: string;
}

export interface DistribuicaoDisc {
  id: number;
  departamento_nome: string;
  perfil_dominante: string;
  quantidade: number;
  percentual: number;
  refreshed_at: string;
}

export interface MapaTalentos {
  id: number;
  colaborador_id: string;
  colaborador_nome: string;
  cargo_nome: string;
  departamento_nome: string;
  perfil_dominante: string;
  nivel_energia: number;
  indice_satisfacao: number;
  tempo_empresa_meses: number;
  refreshed_at: string;
}

export interface RHData {
  kpis: KpisRH | null;
  headcountDept: HeadcountDept[];
  distribuicaoDisc: DistribuicaoDisc[];
  mapaTalentos: MapaTalentos[];
}

export function useRHData() {
  return useQuery<RHData>({
    queryKey: ["rh_data"],
    queryFn: async (): Promise<RHData> => {
      const [kpisRes, headcountRes, discRes, mapaRes] = await Promise.all([
        solidesSupabase.from("rh_kpis_rh").select("*").order("id", { ascending: false }).limit(1),
        solidesSupabase.from("rh_headcount_dept").select("*").order("total_geral", { ascending: false }),
        solidesSupabase.from("rh_distribuicao_disc").select("*"),
        solidesSupabase.from("rh_mapa_talentos").select("*"),
      ]);

      if (kpisRes.error) {
        console.warn("[useRHData] Erro:", kpisRes.error.message);
        return { kpis: null, headcountDept: [], distribuicaoDisc: [], mapaTalentos: [] };
      }

      console.log(`[useRHData] kpis: ${kpisRes.data?.length ?? 0} | headcount: ${headcountRes.data?.length ?? 0} | disc: ${discRes.data?.length ?? 0} | mapa: ${mapaRes.data?.length ?? 0}`);

      return {
        kpis: kpisRes.data?.[0] ?? null,
        headcountDept: headcountRes.data ?? [],
        distribuicaoDisc: discRes.data ?? [],
        mapaTalentos: mapaRes.data ?? [],
      };
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}
