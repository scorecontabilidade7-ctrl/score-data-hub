import { useQuery } from "@tanstack/react-query";
import { externalSupabase } from "@/integrations/supabase/external-client";

export type RegimeType = "caixa" | "competencia";
export type DateField = "data_pagamento" | "data_competencia" | "data_emissao";

export function getDateField(regime: RegimeType): DateField {
  return regime === "caixa" ? "data_pagamento" : "data_competencia";
}

export interface MovimentacaoFinanceira {
  tipo_movimento: string;
  data_pagamento: string | null;
  data_emissao: string | null;
  data_competencia: string | null;
  valor_liquido: number;
  categoria_lancamento: string;
  dfc_mascara: string;
  dfc_grupo: string;
  [key: string]: unknown;
}

export function useFinanceData() {
  return useQuery<MovimentacaoFinanceira[]>({
    queryKey: ["movimentacao_financeira"],
    queryFn: async () => {
      let allData: MovimentacaoFinanceira[] = [];
      let from = 0;
      const PAGE_SIZE = 1000;
      
      while (true) {
        const { data: page, error } = await externalSupabase
          .from("datahub_movimentacao_financeira")
          .select("*")
          .range(from, from + PAGE_SIZE - 1);

        if (error) throw error;
        if (!page || page.length === 0) break;
        allData = allData.concat(page as MovimentacaoFinanceira[]);
        if (page.length < PAGE_SIZE) break;
        from += PAGE_SIZE;
      }

      console.log(`[useFinanceData] Total rows fetched: ${allData.length}`);
      return allData;
    },
  });
}
